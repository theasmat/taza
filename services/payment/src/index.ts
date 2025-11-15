import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { paymentRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';
import { initializeDatabase } from './database';
import { initializeMessaging } from './messaging';
import { initializePaymentGateways } from './services/paymentGateway';

const fastify = Fastify({
  logger: {
    level: config.NODE_ENV === 'development' ? 'debug' : 'info',
    transport: config.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    } : undefined
  }
});

async function start() {
  try {
    // Initialize dependencies
    await initializeDatabase();
    await initializeMessaging();
    await initializePaymentGateways();

    // Register plugins
    await fastify.register(cors, {
      origin: config.CORS_ORIGINS,
      credentials: true
    });

    await fastify.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    });

    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
      allowList: ['127.0.0.1']
    });

    await fastify.register(swagger, {
      swagger: {
        info: {
          title: 'QCom Payment Service API',
          description: 'Payment gateway integration service supporting Stripe and Razorpay',
          version: '1.0.0'
        },
        host: config.HOST,
        schemes: ['http', 'https'],
        consumes: ['application/json'],
        produces: ['application/json']
      }
    });

    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false
      }
    });

    // Register error handler
    fastify.setErrorHandler(errorHandler);

    // Register routes
    await fastify.register(paymentRoutes, { prefix: '/api/v1' });

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    const address = await fastify.listen({
      port: config.PORT,
      host: config.HOST
    });

    fastify.log.info(`Payment service running at ${address}`);
    fastify.log.info(`API documentation available at ${address}/docs`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

start();