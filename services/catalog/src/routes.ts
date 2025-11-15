import { FastifyInstance } from 'fastify';
import { catalogController } from './controllers/catalogController';
import { CreateProductDTOSchema, CreateSKUDTOSchema, UpdatePriceDTOSchema } from '@qcom/shared';

export async function catalogRoutes(fastify: FastifyInstance) {
  // Product routes
  fastify.get('/products', {
    schema: {
      description: 'Get products with filtering and pagination',
      tags: ['catalog'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          category: { type: 'string' },
          subcategory: { type: 'string' },
          vendorId: { type: 'string' },
          search: { type: 'string' },
          lat: { type: 'number' },
          lng: { type: 'number' },
          radius: { type: 'number', default: 10 }
        }
      },
      response: {
        200: {
          description: 'Products list',
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  subcategory: { type: 'string' },
                  brand: { type: 'string' },
                  images: { type: 'array', items: { type: 'string' } },
                  attributes: { type: 'object' },
                  skus: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        price: { type: 'number' },
                        attributes: { type: 'object' }
                      }
                    }
                  }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                pages: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, catalogController.getProducts);

  fastify.get('/products/:id', {
    schema: {
      description: 'Get product by ID',
      tags: ['catalog'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Product details',
          type: 'object',
          properties: {
            id: { type: 'string' },
            vendorId: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            subcategory: { type: 'string' },
            brand: { type: 'string' },
            images: { type: 'array', items: { type: 'string' } },
            attributes: { type: 'object' },
            skus: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  attributes: { type: 'object' },
                  barcode: { type: 'string' },
                  weight: { type: 'number' },
                  dimensions: { type: 'object' },
                  price: { type: 'number' },
                  mrp: { type: 'number' }
                }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        404: {
          description: 'Product not found',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, catalogController.getProductById);

  fastify.post('/products', {
    schema: {
      description: 'Create a new product',
      tags: ['catalog'],
      security: [{ BearerAuth: [] }],
      body: CreateProductDTOSchema,
      response: {
        201: {
          description: 'Product created successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            vendorId: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            subcategory: { type: 'string' },
            brand: { type: 'string' },
            images: { type: 'array', items: { type: 'string' } },
            attributes: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        400: {
          description: 'Invalid input',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, catalogController.createProduct);

  fastify.put('/products/:id', {
    schema: {
      description: 'Update product',
      tags: ['catalog'],
      security: [{ BearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          subcategory: { type: 'string' },
          brand: { type: 'string' },
          attributes: { type: 'object' }
        }
      },
      response: {
        200: {
          description: 'Product updated successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            subcategory: { type: 'string' },
            brand: { type: 'string' },
            attributes: { type: 'object' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, catalogController.updateProduct);

  fastify.delete('/products/:id', {
    schema: {
      description: 'Delete product (soft delete)',
      tags: ['catalog'],
      security: [{ BearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        204: {
          description: 'Product deleted successfully'
        }
      }
    }
  }, catalogController.deleteProduct);

  // SKU routes
  fastify.post('/products/:productId/skus', {
    schema: {
      description: 'Create SKU for product',
      tags: ['catalog'],
      security: [{ BearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          productId: { type: 'string' }
        }
      },
      body: CreateSKUDTOSchema,
      response: {
        201: {
          description: 'SKU created successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            name: { type: 'string' },
            attributes: { type: 'object' },
            barcode: { type: 'string' },
            weight: { type: 'number' },
            dimensions: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, catalogController.createSKU);

  fastify.get('/skus/:id', {
    schema: {
      description: 'Get SKU by ID',
      tags: ['catalog'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'SKU details',
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            name: { type: 'string' },
            attributes: { type: 'object' },
            barcode: { type: 'string' },
            weight: { type: 'number' },
            dimensions: { type: 'object' },
            price: { type: 'number' },
            mrp: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, catalogController.getSKUById);

  // Price routes
  fastify.post('/skus/:skuId/prices', {
    schema: {
      description: 'Update SKU price',
      tags: ['catalog'],
      security: [{ BearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          skuId: { type: 'string' }
        }
      },
      body: UpdatePriceDTOSchema,
      response: {
        201: {
          description: 'Price updated successfully',
          type: 'object',
          properties: {
            skuId: { type: 'string' },
            mrp: { type: 'number' },
            salePrice: { type: 'number' },
            taxIncluded: { type: 'boolean' },
            effectiveFrom: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, catalogController.updatePrice);

  // Category routes
  fastify.get('/categories', {
    schema: {
      description: 'Get all categories',
      tags: ['catalog'],
      response: {
        200: {
          description: 'Categories list',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              subcategories: {
                type: 'array',
                items: { type: 'string' }
              },
              productCount: { type: 'number' }
            }
          }
        }
      }
    }
  }, catalogController.getCategories);

  // Search routes
  fastify.get('/search', {
    schema: {
      description: 'Search products',
      tags: ['catalog'],
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string' },
          category: { type: 'string' },
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 }
        }
      },
      response: {
        200: {
          description: 'Search results',
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  price: { type: 'number' },
                  images: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' }
          }
        }
      }
    }
  }, catalogController.searchProducts);
}