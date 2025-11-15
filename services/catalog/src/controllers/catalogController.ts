import { FastifyRequest, FastifyReply } from 'fastify';
import { catalogService } from '../services/catalogService';
import { 
  CreateProductDTO, 
  CreateSKUDTO, 
  UpdatePriceDTO, 
  validateDTO 
} from '@qcom/shared';

export const catalogController = {
  async getProducts(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as any;
    const result = await catalogService.getProducts(query);
    reply.send(result);
  },

  async getProductById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const result = await catalogService.getProductById(id);
    reply.send(result);
  },

  async createProduct(request: FastifyRequest, reply: FastifyReply) {
    const dto = validateDTO(CreateProductDTOSchema, request.body);
    const result = await catalogService.createProduct(dto);
    reply.status(201).send(result);
  },

  async updateProduct(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const updates = request.body as any;
    const result = await catalogService.updateProduct(id, updates);
    reply.send(result);
  },

  async deleteProduct(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    await catalogService.deleteProduct(id);
    reply.status(204).send();
  },

  async createSKU(request: FastifyRequest, reply: FastifyReply) {
    const { productId } = request.params as any;
    const dto = validateDTO(CreateSKUDTOSchema, request.body);
    const result = await catalogService.createSKU(productId, dto);
    reply.status(201).send(result);
  },

  async getSKUById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const result = await catalogService.getSKUById(id);
    reply.send(result);
  },

  async updatePrice(request: FastifyRequest, reply: FastifyReply) {
    const { skuId } = request.params as any;
    const dto = validateDTO(UpdatePriceDTOSchema, request.body);
    const result = await catalogService.updatePrice(skuId, dto);
    reply.status(201).send(result);
  },

  async getCategories(request: FastifyRequest, reply: FastifyReply) {
    const result = await catalogService.getCategories();
    reply.send(result);
  },

  async searchProducts(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as any;
    const result = await catalogService.searchProducts(query);
    reply.send(result);
  }
};

import { CreateProductDTOSchema, CreateSKUDTOSchema, UpdatePriceDTOSchema } from '@qcom/shared';