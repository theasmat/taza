import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JWTPayload, UserRole } from '@qcom/shared';
import { UnauthorizedError, ForbiddenError } from '@qcom/shared';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: JWTPayload;
}

export function authenticate(request: AuthenticatedRequest, reply: FastifyReply, done: () => void) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    
    // Verify issuer and audience
    if (decoded.iss !== config.JWT_ISSUER || decoded.aud !== config.JWT_AUDIENCE) {
      throw new UnauthorizedError('Invalid token issuer or audience');
    }

    request.user = decoded;
    done();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      reply.status(401).send({ error: 'Unauthorized', message: 'Token expired' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      reply.status(401).send({ error: 'Unauthorized', message: 'Invalid token' });
    } else {
      reply.status(401).send({ error: 'Unauthorized', message: 'Authentication failed' });
    }
  }
}

export function requireRole(roles: UserRole[]) {
  return (request: AuthenticatedRequest, reply: FastifyReply, done: () => void) => {
    if (!request.user) {
      reply.status(401).send({ error: 'Unauthorized', message: 'User not authenticated' });
      return;
    }

    const hasRole = request.user.roles.some(role => roles.includes(role));
    if (!hasRole) {
      reply.status(403).send({ error: 'Forbidden', message: 'Insufficient permissions' });
      return;
    }

    done();
  };
}

export function requireWarehouseAccess(request: AuthenticatedRequest, reply: FastifyReply, done: () => void) {
  if (!request.user) {
    reply.status(401).send({ error: 'Unauthorized', message: 'User not authenticated' });
    return;
  }

  const warehouseId = request.params?.warehouseId || request.body?.warehouseId;
  
  if (warehouseId && request.user.warehouseId && request.user.warehouseId !== warehouseId) {
    reply.status(403).send({ error: 'Forbidden', message: 'Warehouse access denied' });
    return;
  }

  done();
}

export function generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>) {
  const accessToken = jwt.sign(
    {
      ...payload,
      iss: config.JWT_ISSUER,
      aud: config.JWT_AUDIENCE
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_ACCESS_EXPIRY }
  );

  const refreshToken = jwt.sign(
    {
      sub: payload.sub,
      iss: config.JWT_ISSUER
    },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRY }
  );

  return { accessToken, refreshToken };
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as { sub: string };
}

export function extractTokenFromRequest(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}