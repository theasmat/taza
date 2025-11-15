import { FastifyInstance } from 'fastify';
import { pg } from '../database';
import { redis } from '../cache';
import { kafkaProducer } from '../messaging';
import { 
  RegisterUserDTO, 
  LoginDTO, 
  User, 
  JWTPayload, 
  generateId, 
  hashPassword, 
  verifyPassword, 
  sanitizeEmail,
  generateTokens,
  verifyRefreshToken,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  EVENT_TOPICS
} from '@qcom/shared';

export const authService = {
  async register(dto: RegisterUserDTO) {
    const client = await pg.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [sanitizeEmail(dto.email)]
      );
      
      if (existingUser.rows.length > 0) {
        throw new ConflictError('User with this email already exists');
      }
      
      // Hash password
      const hashedPassword = await hashPassword(dto.password);
      
      // Create user
      const userId = generateId();
      const userResult = await client.query(
        `INSERT INTO users (id, email, phone, name, password_hash, roles, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, email, phone, name, roles, created_at, updated_at`,
        [
          userId,
          sanitizeEmail(dto.email),
          dto.phone ? sanitizePhone(dto.phone) : null,
          dto.name,
          hashedPassword,
          dto.roles
        ]
      );
      
      const user = userResult.rows[0];
      
      // Create user profile based on roles
      for (const role of dto.roles) {
        await client.query(
          `INSERT INTO user_profiles (user_id, type, created_at, updated_at)
           VALUES ($1, $2, NOW(), NOW())`,
          [userId, role]
        );
      }
      
      await client.query('COMMIT');
      
      // Publish user created event
      await kafkaProducer.send({
        topic: EVENT_TOPICS.USER_CREATED,
        messages: [{
          key: userId,
          value: JSON.stringify({
            eventId: generateId(),
            eventType: EVENT_TOPICS.USER_CREATED,
            aggregateId: userId,
            timestamp: new Date().toISOString(),
            source: 'auth-service',
            payload: {
              userId,
              email: user.email,
              name: user.name,
              roles: user.roles
            }
          })
        }]
      });
      
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles
        },
        message: 'User registered successfully'
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async login(dto: LoginDTO) {
    const client = await pg.connect();
    
    try {
      // Find user by email
      const userResult = await client.query(
        'SELECT id, email, name, password_hash, roles FROM users WHERE email = $1 AND active = true',
        [sanitizeEmail(dto.email)]
      );
      
      if (userResult.rows.length === 0) {
        throw new UnauthorizedError('Invalid email or password');
      }
      
      const user = userResult.rows[0];
      
      // Verify password
      const isValidPassword = await verifyPassword(dto.password, user.password_hash);
      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid email or password');
      }
      
      // Generate tokens
      const { accessToken, refreshToken } = generateTokens({
        sub: user.id,
        email: user.email,
        roles: user.roles
      });
      
      // Store refresh token in Redis
      await redis.setex(
        `refresh_token:${user.id}`,
        7 * 24 * 60 * 60, // 7 days
        refreshToken
      );
      
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles
        },
        accessToken,
        refreshToken
      };
      
    } finally {
      client.release();
    }
  },

  async refreshToken(refreshToken: string) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      
      // Verify refresh token exists in Redis
      const storedToken = await redis.get(`refresh_token:${decoded.sub}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      
      // Get user details
      const client = await pg.connect();
      try {
        const userResult = await client.query(
          'SELECT id, email, name, roles FROM users WHERE id = $1 AND active = true',
          [decoded.sub]
        );
        
        if (userResult.rows.length === 0) {
          throw new UnauthorizedError('User not found');
        }
        
        const user = userResult.rows[0];
        
        // Generate new tokens
        const newTokens = generateTokens({
          sub: user.id,
          email: user.email,
          roles: user.roles
        });
        
        // Update refresh token in Redis
        await redis.setex(
          `refresh_token:${user.id}`,
          7 * 24 * 60 * 60, // 7 days
          newTokens.refreshToken
        );
        
        return newTokens;
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  },

  async getUserProfile(userId: string) {
    const client = await pg.connect();
    
    try {
      const userResult = await client.query(
        'SELECT id, email, phone, name, roles, created_at, updated_at FROM users WHERE id = $1 AND active = true',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new NotFoundError('User not found');
      }
      
      const user = userResult.rows[0];
      
      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        roles: user.roles,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
      
    } finally {
      client.release();
    }
  },

  async updateUserProfile(userId: string, updates: { name?: string; phone?: string }) {
    const client = await pg.connect();
    
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;
      
      if (updates.name) {
        setClause.push(`name = $${paramCount}`);
        values.push(updates.name);
        paramCount++;
      }
      
      if (updates.phone) {
        setClause.push(`phone = $${paramCount}`);
        values.push(sanitizePhone(updates.phone));
        paramCount++;
      }
      
      if (setClause.length === 0) {
        throw new ValidationError('No valid fields to update', new ZodError([]));
      }
      
      setClause.push(`updated_at = NOW()`);
      values.push(userId);
      
      const userResult = await client.query(
        `UPDATE users SET ${setClause.join(', ')} WHERE id = $${paramCount} AND active = true
         RETURNING id, email, phone, name, roles, updated_at`,
        values
      );
      
      if (userResult.rows.length === 0) {
        throw new NotFoundError('User not found');
      }
      
      const user = userResult.rows[0];
      
      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        roles: user.roles,
        updatedAt: user.updated_at
      };
      
    } finally {
      client.release();
    }
  },

  async logout(userId: string) {
    // Remove refresh token from Redis
    await redis.del(`refresh_token:${userId}`);
    
    return true;
  },

  async getUsers(query: { page?: number; limit?: number; search?: string; role?: string }) {
    const client = await pg.connect();
    
    try {
      const page = Math.max(1, query.page || 1);
      const limit = Math.min(100, Math.max(1, query.limit || 20));
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE active = true';
      const values = [];
      let paramCount = 1;
      
      if (query.search) {
        whereClause += ` AND (email ILIKE $${paramCount} OR name ILIKE $${paramCount})`;
        values.push(`%${query.search}%`);
        paramCount++;
      }
      
      if (query.role) {
        whereClause += ` AND $${paramCount} = ANY(roles)`;
        values.push(query.role);
        paramCount++;
      }
      
      // Get total count
      const countResult = await client.query(
        `SELECT COUNT(*) FROM users ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count, 10);
      
      // Get users
      values.push(limit, offset);
      const usersResult = await client.query(
        `SELECT id, email, phone, name, roles, created_at, updated_at
         FROM users ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        values
      );
      
      const users = usersResult.rows.map(user => ({
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        roles: user.roles,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }));
      
      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
      
    } finally {
      client.release();
    }
  },

  async getUserById(userId: string) {
    const client = await pg.connect();
    
    try {
      const userResult = await client.query(
        'SELECT id, email, phone, name, roles, active, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new NotFoundError('User not found');
      }
      
      const user = userResult.rows[0];
      
      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        roles: user.roles,
        active: user.active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
      
    } finally {
      client.release();
    }
  },

  async updateUserRoles(userId: string, roles: string[]) {
    const client = await pg.connect();
    
    try {
      const userResult = await client.query(
        'UPDATE users SET roles = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name, roles, updated_at',
        [roles, userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new NotFoundError('User not found');
      }
      
      const user = userResult.rows[0];
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        updatedAt: user.updated_at
      };
      
    } finally {
      client.release();
    }
  }
};

import { sanitizePhone, ValidationError, ZodError } from '@qcom/shared';