import { pg } from '../database';
import { redis } from '../cache';
import { kafkaProducer } from '../messaging';
import { 
  CheckoutDTO, 
  AddToCartDTO, 
  Order, 
  OrderItem, 
  generateId, 
  validateDTO,
  NotFoundError,
  ConflictError,
  InsufficientStockError,
  ReservationExpiredError,
  EVENT_TOPICS,
  PaymentGateway,
  PaymentMethod,
  PaymentStatus,
  selectOptimalWarehouse,
  createStockReservation,
  confirmStockReservation,
  releaseStockReservation
} from '@qcom/shared';

export const orderService = {
  async addToCart(dto: AddToCartDTO) {
    const client = await pg.connect();
    
    try {
      // Get or create cart for user
      let cart = await this.getUserCart(dto.userId);
      
      if (!cart) {
        cart = await this.createCart(dto.userId);
      }

      // Check if SKU exists and get product info
      const skuResult = await client.query(
        `SELECT s.id, s.product_id, s.name, p.vendor_id, p.name as product_name
         FROM skus s 
         JOIN products p ON p.id = s.product_id 
         WHERE s.id = $1 AND s.active = true AND p.active = true`,
        [dto.skuId]
      );

      if (skuResult.rows.length === 0) {
        throw new NotFoundError('SKU not found');
      }

      const sku = skuResult.rows[0];

      // Get current price
      const priceResult = await client.query(
        `SELECT sale_price, mrp FROM prices 
         WHERE sku_id = $1 
         AND effective_from <= NOW() 
         AND (effective_to IS NULL OR effective_to > NOW())
         ORDER BY effective_from DESC 
         LIMIT 1`,
        [dto.skuId]
      );

      if (priceResult.rows.length === 0) {
        throw new NotFoundError('Price not found for SKU');
      }

      const price = priceResult.rows[0];

      // Check if item already exists in cart
      const existingItemResult = await client.query(
        'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND sku_id = $2',
        [cart.id, dto.skuId]
      );

      if (existingItemResult.rows.length > 0) {
        // Update existing item quantity
        const existingItem = existingItemResult.rows[0];
        const newQuantity = existingItem.quantity + dto.quantity;
        
        await client.query(
          'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2',
          [newQuantity, existingItem.id]
        );
      } else {
        // Add new item to cart
        await client.query(
          `INSERT INTO cart_items (id, cart_id, sku_id, product_id, quantity, price, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [generateId(), cart.id, dto.skuId, sku.product_id, dto.quantity, price.sale_price]
        );
      }

      return await this.getCart(dto.userId);
      
    } finally {
      client.release();
    }
  },

  async removeFromCart(userId: string, skuId: string) {
    const cart = await this.getUserCart(userId);
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    const client = await pg.connect();
    
    try {
      await client.query(
        'DELETE FROM cart_items WHERE cart_id = $1 AND sku_id = $2',
        [cart.id, skuId]
      );

      return await this.getCart(userId);
      
    } finally {
      client.release();
    }
  },

  async updateCartItemQuantity(userId: string, skuId: string, quantity: number) {
    const cart = await this.getUserCart(userId);
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    if (quantity <= 0) {
      return await this.removeFromCart(userId, skuId);
    }

    const client = await pg.connect();
    
    try {
      await client.query(
        'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE cart_id = $2 AND sku_id = $3',
        [quantity, cart.id, skuId]
      );

      return await this.getCart(userId);
      
    } finally {
      client.release();
    }
  },

  async getCart(userId: string) {
    const cart = await this.getUserCart(userId);
    if (!cart) {
      return { items: [], total: 0, itemCount: 0 };
    }

    const client = await pg.connect();
    
    try {
      const itemsResult = await client.query(
        `SELECT 
          ci.id, ci.sku_id, ci.product_id, ci.quantity, ci.price,
          s.name as sku_name, s.attributes,
          p.name as product_name, p.images,
          pr.sale_price, pr.mrp
         FROM cart_items ci
         JOIN skus s ON s.id = ci.sku_id
         JOIN products p ON p.id = ci.product_id
         LEFT JOIN LATERAL (
           SELECT sale_price, mrp 
           FROM prices 
           WHERE sku_id = ci.sku_id 
           AND effective_from <= NOW() 
           AND (effective_to IS NULL OR effective_to > NOW())
           ORDER BY effective_from DESC 
           LIMIT 1
         ) pr ON true
         WHERE ci.cart_id = $1 AND s.active = true AND p.active = true`,
        [cart.id]
      );

      const items = itemsResult.rows.map(row => ({
        id: row.id,
        skuId: row.sku_id,
        productId: row.product_id,
        productName: row.product_name,
        skuName: row.sku_name,
        quantity: row.quantity,
        price: row.sale_price || row.price,
        mrp: row.mrp,
        attributes: row.attributes,
        images: row.images || [],
        total: row.quantity * (row.sale_price || row.price)
      }));

      const total = items.reduce((sum, item) => sum + item.total, 0);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items,
        total,
        itemCount,
        cartId: cart.id
      };
      
    } finally {
      client.release();
    }
  },

  async checkout(dto: CheckoutDTO) {
    const client = await pg.connect();
    
    try {
      await client.query('BEGIN');

      // Check for idempotency
      if (dto.idempotencyKey) {
        const existingOrder = await client.query(
          'SELECT id FROM orders WHERE idempotency_key = $1',
          [dto.idempotencyKey]
        );
        
        if (existingOrder.rows.length > 0) {
          // Return existing order
          return await this.getOrderById(existingOrder.rows[0].id);
        }
      }

      // Get user's cart
      const cart = await this.getCart(dto.userId);
      if (!cart || cart.items.length === 0) {
        throw new NotFoundError('Cart is empty');
      }

      // Get user delivery policy
      const userPolicy = await this.getUserDeliveryPolicy(dto.userId);
      
      // Select optimal warehouse
      const warehouseSelection = await selectOptimalWarehouse(
        cart.items.map(item => ({ skuId: item.skuId, quantity: item.quantity })),
        dto.shippingAddress.location,
        userPolicy,
        await this.getActiveWarehouses(),
        async (warehouseId, skuId) => {
          const stockResult = await client.query(
            'SELECT * FROM stock WHERE warehouse_id = $1 AND sku_id = $2',
            [warehouseId, skuId]
          );
          return stockResult.rows.length > 0 ? stockResult.rows[0] : null;
        }
      );

      if (!warehouseSelection) {
        throw new InsufficientStockError('No warehouse has all items in stock');
      }

      // Calculate totals
      const subtotal = cart.total;
      const deliveryFee = warehouseSelection.deliveryFee;
      const sellerDeliveryCost = warehouseSelection.sellerDeliveryCost;
      const tax = Math.round(subtotal * 0.05); // 5% tax
      const total = subtotal + deliveryFee + tax;

      // Create stock reservation
      const reservation = await createStockReservation(
        cart.items.map(item => ({ skuId: item.skuId, quantity: item.quantity })),
        warehouseSelection.warehouseId,
        undefined, // orderId will be set after order creation
        15, // 15 minutes TTL
        async (warehouseId, skuId, quantity) => {
          // Reserve stock
          await client.query(
            'UPDATE stock SET reserved = reserved + $1 WHERE warehouse_id = $2 AND sku_id = $3',
            [quantity, warehouseId, skuId]
          );
        },
        async (reservationData) => {
          // Create reservation record
          const reservationResult = await client.query(
            `INSERT INTO reservations (id, warehouse_id, sku_id, quantity, status, expires_at, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
             RETURNING id`,
            [
              reservationData.id,
              reservationData.warehouseId,
              reservationData.items[0].skuId, // Simplified for single SKU
              reservationData.items[0].quantity,
              'PENDING',
              reservationData.expiresAt
            ]
          );
          return reservationResult.rows[0].id;
        }
      );

      // Create order
      const orderId = generateId();
      const orderResult = await client.query(
        `INSERT INTO orders (
          id, user_id, warehouse_id, status, subtotal, tax, delivery_fee, 
          total, payment_method, payment_status, payment_gateway,
          shipping_address, billing_address, idempotency_key,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
        RETURNING *`,
        [
          orderId,
          dto.userId,
          warehouseSelection.warehouseId,
          'PLACED',
          subtotal,
          tax,
          deliveryFee,
          total,
          dto.paymentMethod,
          'PENDING',
          dto.paymentGateway || 'cod',
          JSON.stringify(dto.shippingAddress),
          JSON.stringify(dto.billingAddress || dto.shippingAddress),
          dto.idempotencyKey
        ]
      );

      const order = orderResult.rows[0];

      // Create order items
      for (const item of cart.items) {
        await client.query(
          `INSERT INTO order_items (id, order_id, sku_id, product_id, quantity, price, tax, total, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [
            generateId(),
            orderId,
            item.skuId,
            item.productId,
            item.quantity,
            item.price,
            Math.round(item.total * 0.05),
            item.total + Math.round(item.total * 0.05)
          ]
        );
      }

      // Update reservation with order ID
      await client.query(
        'UPDATE reservations SET order_id = $1 WHERE id = $2',
        [orderId, reservation.reservationId]
      );

      // Clear cart
      await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.cartId]);

      await client.query('COMMIT');

      // Publish order placed event
      await kafkaProducer.send({
        topic: EVENT_TOPICS.ORDER_PLACED,
        messages: [{
          key: orderId,
          value: JSON.stringify({
            eventId: generateId(),
            eventType: EVENT_TOPICS.ORDER_PLACED,
            aggregateId: orderId,
            timestamp: new Date().toISOString(),
            source: 'orders-service',
            payload: {
              orderId,
              userId: dto.userId,
              warehouseId: warehouseSelection.warehouseId,
              items: cart.items,
              subtotal,
              deliveryFee,
              total,
              paymentMethod: dto.paymentMethod,
              paymentGateway: dto.paymentGateway || 'cod'
            }
          })
        }]
      });

      // If payment method is not COD, create payment intent
      if (dto.paymentMethod !== 'COD' && dto.paymentGateway) {
        await this.createPaymentIntent(orderId, total, 'INR', dto.paymentGateway);
      }

      return await this.getOrderById(orderId);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async createPaymentIntent(
    orderId: string,
    amount: number,
    currency: string,
    gateway: PaymentGateway
  ) {
    // This would call the payment service to create payment intent
    // For now, we'll just update the order status
    const client = await pg.connect();
    
    try {
      await client.query(
        'UPDATE orders SET payment_status = $1, updated_at = NOW() WHERE id = $2',
        [PaymentStatus.PENDING, orderId]
      );
      
      // Publish payment intent created event
      await kafkaProducer.send({
        topic: EVENT_TOPICS.PAYMENT_INTENT_CREATED,
        messages: [{
          key: orderId,
          value: JSON.stringify({
            eventId: generateId(),
            eventType: EVENT_TOPICS.PAYMENT_INTENT_CREATED,
            aggregateId: orderId,
            timestamp: new Date().toISOString(),
            source: 'orders-service',
            payload: {
              orderId,
              amount,
              currency,
              gateway
            }
          })
        }]
      });
      
    } finally {
      client.release();
    }
  },

  async confirmPayment(orderId: string, gatewayTransactionId: string) {
    const client = await pg.connect();
    
    try {
      await client.query('BEGIN');

      // Update order payment status
      await client.query(
        'UPDATE orders SET payment_status = $1, updated_at = NOW() WHERE id = $2',
        [PaymentStatus.CONFIRMED, orderId]
      );

      // Get order details
      const orderResult = await client.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );
      const order = orderResult.rows[0];

      // Get order items
      const itemsResult = await client.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [orderId]
      );
      const items = itemsResult.rows;

      // Confirm stock reservation
      const reservationsResult = await client.query(
        'SELECT * FROM reservations WHERE order_id = $1 AND status = $2',
        [orderId, 'PENDING']
      );

      if (reservationsResult.rows.length > 0) {
        await confirmStockReservation(
          reservationsResult.rows[0].id,
          order.warehouse_id,
          items.map(item => ({ skuId: item.sku_id, quantity: item.quantity })),
          async (warehouseId, skuId, reservedDelta, onHandDelta) => {
            await client.query(
              'UPDATE stock SET reserved = reserved + $1, on_hand = on_hand + $2 WHERE warehouse_id = $3 AND sku_id = $4',
              [reservedDelta, onHandDelta, warehouseId, skuId]
            );
          },
          async (reservationId, status) => {
            await client.query(
              'UPDATE reservations SET status = $1 WHERE id = $2',
              [status, reservationId]
            );
          }
        );
      }

      // Update order status to confirmed
      await client.query(
        'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
        ['CONFIRMED', orderId]
      );

      await client.query('COMMIT');

      // Publish payment succeeded event
      await kafkaProducer.send({
        topic: EVENT_TOPICS.PAYMENT_SUCCEEDED,
        messages: [{
          key: orderId,
          value: JSON.stringify({
            eventId: generateId(),
            eventType: EVENT_TOPICS.PAYMENT_SUCCEEDED,
            aggregateId: orderId,
            timestamp: new Date().toISOString(),
            source: 'orders-service',
            payload: {
              orderId,
              gatewayTransactionId,
              amount: order.total
            }
          })
        }]
      });

      // Publish order confirmed event
      await kafkaProducer.send({
        topic: EVENT_TOPICS.ORDER_CONFIRMED,
        messages: [{
          key: orderId,
          value: JSON.stringify({
            eventId: generateId(),
            eventType: EVENT_TOPICS.ORDER_CONFIRMED,
            aggregateId: orderId,
            timestamp: new Date().toISOString(),
            source: 'orders-service',
            payload: {
              orderId,
              userId: order.user_id,
              warehouseId: order.warehouse_id
            }
          })
        }]
      });

      return await this.getOrderById(orderId);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async cancelOrder(orderId: string, reason?: string) {
    const client = await pg.connect();
    
    try {
      await client.query('BEGIN');

      // Get order details
      const orderResult = await client.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );
      
      if (orderResult.rows.length === 0) {
        throw new NotFoundError('Order not found');
      }

      const order = orderResult.rows[0];

      // Check if order can be cancelled
      if (!['PLACED', 'CONFIRMED'].includes(order.status)) {
        throw new ConflictError('Order cannot be cancelled in current status');
      }

      // Update order status
      await client.query(
        'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
        ['CANCELLED', orderId]
      );

      // Release stock reservations
      const reservationsResult = await client.query(
        'SELECT * FROM reservations WHERE order_id = $1 AND status = $2',
        [orderId, 'CONFIRMED']
      );

      for (const reservation of reservationsResult.rows) {
        await releaseStockReservation(
          reservation.warehouse_id,
          reservation.sku_id,
          reservation.quantity,
          async (warehouseId, skuId, quantity) => {
            await client.query(
              'UPDATE stock SET reserved = reserved - $1 WHERE warehouse_id = $2 AND sku_id = $3',
              [quantity, warehouseId, skuId]
            );
          }
        );

        await client.query(
          'UPDATE reservations SET status = $1 WHERE id = $2',
          ['RELEASED', reservation.id]
        );
      }

      await client.query('COMMIT');

      // Publish order cancelled event
      await kafkaProducer.send({
        topic: EVENT_TOPICS.ORDER_CANCELLED,
        messages: [{
          key: orderId,
          value: JSON.stringify({
            eventId: generateId(),
            eventType: EVENT_TOPICS.ORDER_CANCELLED,
            aggregateId: orderId,
            timestamp: new Date().toISOString(),
            source: 'orders-service',
            payload: {
              orderId,
              userId: order.user_id,
              reason
            }
          })
        }]
      });

      return await this.getOrderById(orderId);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getOrderById(orderId: string) {
    const client = await pg.connect();
    
    try {
      const orderResult = await client.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        throw new NotFoundError('Order not found');
      }

      const order = orderResult.rows[0];

      const itemsResult = await client.query(
        `SELECT 
          oi.*,
          s.name as sku_name, s.attributes,
          p.name as product_name, p.images
         FROM order_items oi
         JOIN skus s ON s.id = oi.sku_id
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = $1`,
        [orderId]
      );

      const items = itemsResult.rows.map(row => ({
        id: row.id,
        skuId: row.sku_id,
        productId: row.product_id,
        productName: row.product_name,
        skuName: row.sku_name,
        quantity: row.quantity,
        price: row.price,
        tax: row.tax,
        total: row.total,
        attributes: row.attributes,
        images: row.images || []
      }));

      return {
        id: order.id,
        userId: order.user_id,
        warehouseId: order.warehouse_id,
        status: order.status,
        items,
        subtotal: order.subtotal,
        tax: order.tax,
        deliveryFee: order.delivery_fee,
        total: order.total,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        paymentGateway: order.payment_gateway,
        shippingAddress: order.shipping_address,
        billingAddress: order.billing_address,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      };
      
    } finally {
      client.release();
    }
  },

  async getOrders(userId: string, options: { page?: number; limit?: number; status?: string }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const client = await pg.connect();
    
    try {
      let whereClause = 'WHERE user_id = $1';
      const values = [userId];
      let paramCount = 2;

      if (options.status) {
        whereClause += ` AND status = $${paramCount}`;
        values.push(options.status);
        paramCount++;
      }

      // Get total count
      const countResult = await client.query(
        `SELECT COUNT(*) FROM orders ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get orders
      values.push(limit, offset);
      const ordersResult = await client.query(
        `SELECT * FROM orders ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        values
      );

      const orders = await Promise.all(
        ordersResult.rows.map(order => this.getOrderById(order.id))
      );

      return {
        orders,
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

  // Helper methods
  async getUserCart(userId: string) {
    const client = await pg.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM carts WHERE user_id = $1',
        [userId]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
      
    } finally {
      client.release();
    }
  },

  async createCart(userId: string) {
    const client = await pg.connect();
    
    try {
      const result = await client.query(
        'INSERT INTO carts (id, user_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING *',
        [generateId(), userId]
      );
      
      return result.rows[0];
      
    } finally {
      client.release();
    }
  },

  async getUserDeliveryPolicy(userId: string) {
    const client = await pg.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM user_delivery_policies WHERE user_id = $1',
        [userId]
      );
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      
      // Return default policy
      return {
        userId,
        freeRadiusKm: 5,
        payMode: 'user'
      };
      
    } finally {
      client.release();
    }
  },

  async getActiveWarehouses() {
    const client = await pg.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM warehouses WHERE active = true'
      );
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        location: {
          lat: row.location.coordinates[1], // PostGIS returns [lng, lat]
          lng: row.location.coordinates[0]
        },
        radiusKm: row.radius_km,
        active: row.active
      }));
      
    } finally {
      client.release();
    }
  }
};

import { generateId } from '@qcom/shared';