import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError } from '@qcom/shared';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log error for debugging
  request.log.error(error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  // Handle custom application errors
  if (error instanceof ValidationError) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      details: error.errors.errors
    });
  }

  if (error instanceof NotFoundError) {
    return reply.status(404).send({
      error: 'Not Found',
      message: error.message
    });
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: error.message
    });
  }

  if (error instanceof ForbiddenError) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: error.message
    });
  }

  if (error instanceof ConflictError) {
    return reply.status(409).send({
      error: 'Conflict',
      message: error.message
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token expired'
    });
  }

  // Handle database errors
  if (error.message.includes('duplicate key')) {
    return reply.status(409).send({
      error: 'Conflict',
      message: 'Resource already exists'
    });
  }

  if (error.message.includes('foreign key')) {
    return reply.status(400).send({
      error: 'Bad Request',
      message: 'Invalid reference to related resource'
    });
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : error.message;

  return reply.status(statusCode).send({
    error: statusCode === 500 ? 'Internal Server Error' : 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}