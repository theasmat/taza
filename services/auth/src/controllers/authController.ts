import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/authService';
import { RegisterUserDTO, LoginDTO, RefreshTokenDTO, validateDTO } from '@qcom/shared';

export const authController = {
  async register(request: FastifyRequest, reply: FastifyReply) {
    const dto = validateDTO(RegisterUserDTOSchema, request.body);
    const result = await authService.register(dto);
    
    reply.status(201).send(result);
  },

  async login(request: FastifyRequest, reply: FastifyReply) {
    const dto = validateDTO(LoginDTOSchema, request.body);
    const result = await authService.login(dto);
    
    reply.send(result);
  },

  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    const dto = validateDTO(RefreshTokenDTOSchema, request.body);
    const result = await authService.refreshToken(dto.refreshToken);
    
    reply.send(result);
  },

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const result = await authService.getUserProfile(userId);
    
    reply.send(result);
  },

  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const updates = request.body as any;
    const result = await authService.updateUserProfile(userId, updates);
    
    reply.send(result);
  },

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    await authService.logout(userId);
    
    reply.send({ message: 'Logged out successfully' });
  },

  async getUsers(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as any;
    const result = await authService.getUsers(query);
    
    reply.send(result);
  },

  async getUserById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const result = await authService.getUserById(id);
    
    reply.send(result);
  },

  async updateUserRoles(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const { roles } = request.body as any;
    const result = await authService.updateUserRoles(id, roles);
    
    reply.send(result);
  }
};

import { RegisterUserDTOSchema, LoginDTOSchema, RefreshTokenDTOSchema } from '@qcom/shared';