import { pg } from '../database';
import { redis } from '../cache';
import { kafkaProducer } from '../messaging';
import { 
  CreateProductDTO, 
  CreateSKUDTO, 
  UpdatePriceDTO, 
  generateId, 
  NotFoundError,
  ConflictError,
  EVENT_TOPICS
} from '@qcom/shared';

export const catalogService = {
  async getProducts(query: {
    page?: number;
    limit?: number;
    category?: string;
    subcategory?: string;
    vendorId?: string;
    search?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE p.active = true';
    const values = [];
    let paramCount = 1;

    if (query.category) {
      whereClause += ` AND p.category = $${paramCount}`;
      values.push(query.category);
      paramCount++;
    }

    if (query.subcategory) {
      whereClause += ` AND p.subcategory = $${paramCount}`;
      values.push(query.subcategory);
      paramCount++;
    }

    if (query.vendorId) {
      whereClause += ` AND p.vendor_id = $${paramCount}`;
      values.push(query.vendorId);
      paramCount++;
    }

    if (query.search) {
      whereClause += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      values.push(`%${query.search}%`);
      paramCount++;
    }

    // If location is provided, filter by warehouse availability
    if (query.lat && query.lng) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM stock s
        JOIN warehouses w ON s.warehouse_id = w.id
        WHERE s.sku_id IN (SELECT id FROM skus WHERE product_id = p.id)
        AND s.on_hand > s.reserved
        AND ST_DWithin(w.location, ST_GeographyFromText('POINT(' || $${paramCount} || ' ' || $${paramCount + 1} || ')'), $${paramCount + 2} * 1000)
      )`;
      values.push(query.lng, query.lat, query.radius || 10);
      paramCount += 3;
    }

    const client = await pg.connect();
    
    try {
      // Get total count
      const countResult = await client.query(
        `SELECT COUNT(DISTINCT p.id) 
         FROM products p 
         ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get products with SKUs and prices
      values.push(limit, offset);
      const productsResult = await client.query(
        `SELECT 
          p.id, p.name, p.description, p.category, p.subcategory, p.brand, p.images, p.attributes,
          p.created_at, p.updated_at,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', s.id,
              'name', s.name,
              'attributes', s.attributes,
              'price', pr.sale_price,
              'mrp', pr.mrp
            ) ORDER BY s.created_at
          ) as skus
         FROM products p
         LEFT JOIN skus s ON s.product_id = p.id AND s.active = true
         LEFT JOIN LATERAL (
           SELECT sale_price, mrp 
           FROM prices 
           WHERE sku_id = s.id 
           AND effective_from <= NOW() 
           AND (effective_to IS NULL OR effective_to > NOW())
           ORDER BY effective_from DESC 
           LIMIT 1
         ) pr ON true
         ${whereClause}
         GROUP BY p.id, p.name, p.description, p.category, p.subcategory, p.brand, p.images, p.attributes, p.created_at, p.updated_at
         ORDER BY p.created_at DESC
         LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        values
      );

      const products = productsResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        subcategory: row.subcategory,
        brand: row.brand,
        images: row.images || [],
        attributes: row.attributes || {},
        skus: row.skus?.filter((sku: any) => sku.id) || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      return {
        products,
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

  async getProductById(productId: string) {
    const client = await pg.connect();
    
    try {
      const productResult = await client.query(
        `SELECT 
          p.*,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', s.id,
              'name', s.name,
              'attributes', s.attributes,
              'barcode', s.barcode,
              'weight', s.weight_grams,
              'dimensions', JSON_BUILD_OBJECT(
                'length', s.length_mm,
                'width', s.width_mm,
                'height', s.height_mm
              ),
              'price', pr.sale_price,
              'mrp', pr.mrp
            ) ORDER BY s.created_at
          ) as skus
         FROM products p
         LEFT JOIN skus s ON s.product_id = p.id AND s.active = true
         LEFT JOIN LATERAL (
           SELECT sale_price, mrp 
           FROM prices 
           WHERE sku_id = s.id 
           AND effective_from <= NOW() 
           AND (effective_to IS NULL OR effective_to > NOW())
           ORDER BY effective_from DESC 
           LIMIT 1
         ) pr ON true
         WHERE p.id = $1 AND p.active = true
         GROUP BY p.id`,
        [productId]
      );

      if (productResult.rows.length === 0) {
        throw new NotFoundError('Product not found');
      }

      const product = productResult.rows[0];

      return {
        id: product.id,
        vendorId: product.vendor_id,
        name: product.name,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        images: product.images || [],
        attributes: product.attributes || {},
        skus: product.skus?.filter((sku: any) => sku.id) || [],
        createdAt: product.created_at,
        updatedAt: product.updated_at
      };
      
    } finally {
      client.release();
    }
  },

  async createProduct(dto: CreateProductDTO) {
    const client = await pg.connect();
    
    try {
      await client.query('BEGIN');

      const productId = generateId();
      const productResult = await client.query(
        `INSERT INTO products (id, vendor_id, name, description, category, subcategory, brand, images, attributes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         RETURNING *`,
        [
          productId,
          dto.vendorId,
          dto.name,
          dto.description,
          dto.category,
          dto.subcategory,
          dto.brand,
          dto.images || [],
          dto.attributes || {}
        ]
      );

      const product = productResult.rows[0];

      await client.query('COMMIT');

      // Publish product created event
      await kafkaProducer.send({
        topic: EVENT_TOPICS.PRODUCT_CREATED,
        messages: [{
          key: productId,
          value: JSON.stringify({
            eventId: generateId(),
            eventType: EVENT_TOPICS.PRODUCT_CREATED,
            aggregateId: productId,
            timestamp: new Date().toISOString(),
            source: 'catalog-service',
            payload: {
              productId,
              vendorId: dto.vendorId,
              name: dto.name,
              category: dto.category
            }
          })
        }]
      });

      // Clear cache
      await this.clearProductCache();

      return {
        id: product.id,
        vendorId: product.vendor_id,
        name: product.name,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        images: product.images,
        attributes: product.attributes,
        createdAt: product.created_at
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async updateProduct(productId: string, updates: Partial<CreateProductDTO>) {
    const client = await pg.connect();
    
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      const allowedFields = ['name', 'description', 'category', 'subcategory', 'brand', 'attributes'];
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          setClause.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (setClause.length === 0) {
        throw new Error('No valid fields to update');
      }

      setClause.push(`updated_at = NOW()`);
      values.push(productId);

      const productResult = await client.query(
        `UPDATE products SET ${setClause.join(', ')} WHERE id = $${paramCount} AND active = true
         RETURNING id, vendor_id, name, description, category, subcategory, brand, attributes, updated_at`,
        values
      );

      if (productResult.rows.length === 0) {
        throw new NotFoundError('Product not found');
      }

      const product = productResult.rows[0];

      // Clear cache
      await this.clearProductCache();

      return {
        id: product.id,
        vendorId: product.vendor_id,
        name: product.name,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        attributes: product.attributes,
        updatedAt: product.updated_at
      };
      
    } finally {
      client.release();
    }
  },

  async deleteProduct(productId: string) {
    const client = await pg.connect();
    
    try {
      const result = await client.query(
        'UPDATE products SET active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
        [productId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Product not found');
      }

      // Clear cache
      await this.clearProductCache();
      
    } finally {
      client.release();
    }
  },

  async createSKU(productId: string, dto: CreateSKUDTO) {
    const client = await pg.connect();
    
    try {
      // Verify product exists and belongs to vendor
      const productResult = await client.query(
        'SELECT id, vendor_id FROM products WHERE id = $1 AND active = true',
        [productId]
      );

      if (productResult.rows.length === 0) {
        throw new NotFoundError('Product not found');
      }

      // Check if SKU with same attributes already exists
      const existingSKUResult = await client.query(
        'SELECT id FROM skus WHERE product_id = $1 AND attributes = $2 AND active = true',
        [productId, JSON.stringify(dto.attributes)]
      );

      if (existingSKUResult.rows.length > 0) {
        throw new ConflictError('SKU with same attributes already exists');
      }

      const skuId = generateId();
      const skuResult = await client.query(
        `INSERT INTO skus (id, product_id, name, attributes, barcode, weight_grams, length_mm, width_mm, height_mm, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         RETURNING *`,
        [
          skuId,
          productId,
          dto.name,
          JSON.stringify(dto.attributes),
          dto.barcode,
          dto.weight,
          dto.dimensions.length,
          dto.dimensions.width,
          dto.dimensions.height
        ]
      );

      const sku = skuResult.rows[0];

      return {
        id: sku.id,
        productId: sku.product_id,
        name: sku.name,
        attributes: sku.attributes,
        barcode: sku.barcode,
        weight: sku.weight_grams,
        dimensions: {
          length: sku.length_mm,
          width: sku.width_mm,
          height: sku.height_mm
        },
        createdAt: sku.created_at
      };
      
    } finally {
      client.release();
    }
  },

  async getSKUById(skuId: string) {
    const client = await pg.connect();
    
    try {
      const skuResult = await client.query(
        `SELECT 
          s.*,
          pr.sale_price as price,
          pr.mrp
         FROM skus s
         LEFT JOIN LATERAL (
           SELECT sale_price, mrp 
           FROM prices 
           WHERE sku_id = s.id 
           AND effective_from <= NOW() 
           AND (effective_to IS NULL OR effective_to > NOW())
           ORDER BY effective_from DESC 
           LIMIT 1
         ) pr ON true
         WHERE s.id = $1 AND s.active = true`,
        [skuId]
      );

      if (skuResult.rows.length === 0) {
        throw new NotFoundError('SKU not found');
      }

      const sku = skuResult.rows[0];

      return {
        id: sku.id,
        productId: sku.product_id,
        name: sku.name,
        attributes: sku.attributes,
        barcode: sku.barcode,
        weight: sku.weight_grams,
        dimensions: {
          length: sku.length_mm,
          width: sku.width_mm,
          height: sku.height_mm
        },
        price: sku.price,
        mrp: sku.mrp,
        createdAt: sku.created_at
      };
      
    } finally {
      client.release();
    }
  },

  async updatePrice(skuId: string, dto: UpdatePriceDTO) {
    const client = await pg.connect();
    
    try {
      // Verify SKU exists
      const skuResult = await client.query(
        'SELECT id FROM skus WHERE id = $1 AND active = true',
        [skuId]
      );

      if (skuResult.rows.length === 0) {
        throw new NotFoundError('SKU not found');
      }

      // Deactivate existing prices
      await client.query(
        'UPDATE prices SET effective_to = NOW() WHERE sku_id = $1 AND effective_to IS NULL',
        [skuId]
      );

      // Create new price
      const priceResult = await client.query(
        `INSERT INTO prices (sku_id, mrp, sale_price, tax_included, currency, effective_from, effective_to, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [
          skuId,
          dto.mrp,
          dto.salePrice,
          dto.taxIncluded,
          dto.currency || 'INR',
          dto.effectiveFrom,
          dto.effectiveTo
        ]
      );

      const price = priceResult.rows[0];

      // Publish price updated event
      await kafkaProducer.send({
        topic: EVENT_TOPICS.PRICE_UPDATED,
        messages: [{
          key: skuId,
          value: JSON.stringify({
            eventId: generateId(),
            eventType: EVENT_TOPICS.PRICE_UPDATED,
            aggregateId: skuId,
            timestamp: new Date().toISOString(),
            source: 'catalog-service',
            payload: {
              skuId,
              oldPrice: 0, // Would need to fetch previous price
              newPrice: dto.salePrice,
              currency: dto.currency || 'INR'
            }
          })
        }]
      });

      // Clear cache
      await this.clearProductCache();

      return {
        skuId: price.sku_id,
        mrp: price.mrp,
        salePrice: price.sale_price,
        taxIncluded: price.tax_included,
        effectiveFrom: price.effective_from,
        createdAt: price.created_at
      };
      
    } finally {
      client.release();
    }
  },

  async getCategories() {
    const client = await pg.connect();
    
    try {
      const categoriesResult = await client.query(
        `SELECT 
          category as name,
          JSON_AGG(DISTINCT subcategory) as subcategories,
          COUNT(*) as product_count
         FROM products 
         WHERE active = true
         GROUP BY category
         ORDER BY product_count DESC`
      );

      return categoriesResult.rows.map(row => ({
        name: row.name,
        subcategories: row.subcategories.filter((s: string) => s),
        productCount: parseInt(row.product_count, 10)
      }));
      
    } finally {
      client.release();
    }
  },

  async searchProducts(query: {
    q?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const offset = (page - 1) * limit;

    const client = await pg.connect();
    
    try {
      let whereClause = 'WHERE p.active = true';
      const values = [];
      let paramCount = 1;

      if (query.q) {
        whereClause += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
        values.push(`%${query.q}%`);
        paramCount++;
      }

      if (query.category) {
        whereClause += ` AND p.category = $${paramCount}`;
        values.push(query.category);
        paramCount++;
      }

      // Get total count
      const countResult = await client.query(
        `SELECT COUNT(DISTINCT p.id) FROM products p ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get search results
      values.push(limit, offset);
      const productsResult = await client.query(
        `SELECT 
          p.id, p.name, p.description, p.category,
          pr.sale_price as price,
          p.images
         FROM products p
         LEFT JOIN LATERAL (
           SELECT sale_price 
           FROM skus s
           LEFT JOIN prices pr ON pr.sku_id = s.id 
           WHERE s.product_id = p.id 
           AND s.active = true
           AND pr.effective_from <= NOW() 
           AND (pr.effective_to IS NULL OR pr.effective_to > NOW())
           ORDER BY pr.effective_from DESC 
           LIMIT 1
         ) pr ON true
         ${whereClause}
         ORDER BY 
           CASE WHEN p.name ILIKE $${paramCount - 2} THEN 1 ELSE 2 END,
           p.created_at DESC
         LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
        values
      );

      const products = productsResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        price: row.price,
        images: row.images || []
      }));

      return {
        products,
        total,
        page,
        limit
      };
      
    } finally {
      client.release();
    }
  },

  async clearProductCache() {
    // Clear product-related cache entries
    const keys = await redis.keys('products:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
};