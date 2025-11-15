# QCom Platform - Quick Reference

A concise reference guide for developers working on the QCom platform.

## 🚀 Quick Start Commands

```bash
# Install dependencies
pnpm install

# Start infrastructure (Postgres, Redis, Kafka)
pnpm docker:up

# Run database migrations
pnpm db:migrate

# Start all services in dev mode
pnpm dev

# Build all services
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format

# Stop infrastructure
pnpm docker:down
```

## 🌐 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Auth | 3001 | http://localhost:3001 |
| Catalog | 3002 | http://localhost:3002 |
| Inventory | 3003 | http://localhost:3003 |
| Pricing | 3004 | http://localhost:3004 |
| Orders | 3005 | http://localhost:3005 |
| Fulfillment | 3006 | http://localhost:3006 |
| Notifications | 3007 | http://localhost:3007 |
| GraphQL Gateway | 4000 | http://localhost:4000 |

## 🗄️ Infrastructure Ports

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |
| Kafka | 9092 | Message Queue |

## 🔑 Environment Variables

### Database
```bash
DATABASE_URL=postgresql://qcom_user:qcom_password@localhost:5432/qcom
```

### Redis
```bash
REDIS_URL=redis://localhost:6379
```

### Kafka
```bash
KAFKA_BROKERS=localhost:9092
```

### JWT Secrets
```bash
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

## 📊 Database Quick Reference

### Connection
```bash
# Connect to PostgreSQL
psql postgresql://qcom_user:qcom_password@localhost:5432/qcom

# Common commands
\dt                 # List tables
\d table_name       # Describe table
\q                  # Quit
```

### Main Tables
- `users` - User accounts
- `user_profiles` - Role-specific data
- `warehouses` - Warehouse locations (PostGIS)
- `products` - Product catalog
- `skus` - Product variants
- `prices` - Pricing data
- `inventory` - Stock levels
- `inventory_reservations` - Cart locks
- `orders` - Order records
- `order_items` - Order line items
- `carts` - Shopping carts
- `cart_items` - Cart contents

## 🎯 Common API Patterns

### Authentication
```typescript
// Register
POST /auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+919876543210"
}

// Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": { ... }
}

// Use token
Authorization: Bearer eyJhbGc...
```

### Product Catalog
```typescript
// Create Product
POST /products
Authorization: Bearer {token}
{
  "name": "Product Name",
  "description": "Description",
  "category": "Electronics",
  "subcategory": "Phones"
}

// Create SKU
POST /products/{productId}/skus
{
  "name": "Red - Medium",
  "attributes": { "color": "red", "size": "M" },
  "weightGrams": 500
}

// Set Price
POST /skus/{skuId}/prices
{
  "mrp": 999.00,
  "salePrice": 799.00,
  "effectiveFrom": "2025-01-01T00:00:00Z"
}
```

### Cart & Checkout
```typescript
// Add to Cart
POST /cart/items
{
  "skuId": "uuid",
  "quantity": 2
}

// Checkout
POST /checkout/place
{
  "deliveryAddress": {
    "lat": 12.9716,
    "lng": 77.5946,
    "line1": "123 Main St",
    "city": "Bangalore",
    "pincode": "560001"
  },
  "paymentMethod": "card"
}
```

## 📋 User Roles

| Role | Code | Permissions |
|------|------|-------------|
| Customer | `customer` | Browse, order, track |
| Vendor | `vendor` | Manage products, prices |
| Warehouse Staff | `warehouse_staff` | Pick, pack, update stock |
| Rider | `rider` | Accept, deliver orders |
| Admin | `admin` | Full access |

## 🔄 Event Topics (Kafka)

### User Events
- `user.created`
- `user.updated`
- `user.deleted`

### Product Events
- `product.created`
- `product.updated`
- `price.updated`

### Order Events
- `order.placed`
- `order.confirmed`
- `order.cancelled`

### Inventory Events
- `inventory.reserved`
- `inventory.released`
- `inventory.updated`
- `stock.low`

### Fulfillment Events
- `fulfillment.assigned`
- `fulfillment.packed`
- `fulfillment.dispatched`
- `fulfillment.delivered`

## 🛠️ Development Tools

### Docker Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Stop all services
docker-compose down

# Remove volumes (clean slate)
docker-compose down -v

# Rebuild services
docker-compose build
```

### Database Commands
```bash
# Run migrations
cd infra
psql -U qcom_user -d qcom -f sql/001_create_base_tables.sql

# Backup database
pg_dump -U qcom_user qcom > backup.sql

# Restore database
psql -U qcom_user qcom < backup.sql
```

### pnpm Commands
```bash
# Add dependency to specific service
cd services/auth
pnpm add fastify

# Add dev dependency
pnpm add -D @types/node

# Update dependencies
pnpm update

# Clean all node_modules
pnpm -r clean
rm -rf node_modules
pnpm install
```

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
pnpm test

# Run specific service tests
cd services/auth
pnpm test

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

### Manual API Testing
```bash
# Using curl
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","name":"Test User"}'

# Using httpie
http POST http://localhost:3001/auth/register \
  email=test@example.com password=pass123 name="Test User"
```

## 📦 Package Structure

```
service/
├── src/
│   ├── index.ts              # Entry point
│   ├── config.ts             # Configuration
│   ├── database.ts           # DB connection
│   ├── cache.ts              # Redis connection
│   ├── messaging.ts          # Kafka setup
│   ├── routes.ts             # Route definitions
│   ├── controllers/          # Request handlers
│   ├── services/             # Business logic
│   └── middleware/           # Middleware functions
├── package.json
├── tsconfig.json
└── Dockerfile
```

## 🔐 Common Middleware

### Authentication
```typescript
import { authenticateJWT } from './middleware/auth';

fastify.get('/protected', {
  preHandler: authenticateJWT
}, async (request, reply) => {
  // request.user available here
});
```

### Role Authorization
```typescript
import { requireRole } from './middleware/auth';

fastify.post('/admin-only', {
  preHandler: [authenticateJWT, requireRole(['admin'])]
}, async (request, reply) => {
  // Only admins can access
});
```

## 🐛 Debugging

### View Logs
```bash
# Service logs
docker-compose logs -f auth-service

# Database logs
docker-compose logs -f postgres

# Kafka logs
docker-compose logs -f kafka
```

### Connect to Services
```bash
# PostgreSQL
docker exec -it qcom-postgres psql -U qcom_user -d qcom

# Redis
docker exec -it qcom-redis redis-cli

# Check Kafka topics
docker exec -it qcom-kafka kafka-topics --bootstrap-server localhost:9092 --list
```

## 🔍 Health Checks

```bash
# Auth Service
curl http://localhost:3001/health

# All services should respond with:
{"status":"ok","timestamp":"..."}
```

## 📈 Performance Tips

1. **Enable caching**: Use Redis for frequently accessed data
2. **Database indexes**: Ensure proper indexes on query fields
3. **Connection pooling**: Configure pool size based on load
4. **Pagination**: Always paginate large result sets
5. **GraphQL**: Use DataLoader to batch requests

## 🚨 Common Issues

### Port Already in Use
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Kafka Not Ready
```bash
# Wait for Kafka to be ready (can take 30-60 seconds)
docker-compose logs -f kafka

# Look for "Kafka Server started"
```

### Node Modules Issues
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📚 Useful Queries

### Get all orders for a user
```sql
SELECT o.*, oi.*
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = 'user-uuid'
ORDER BY o.created_at DESC;
```

### Get low stock items
```sql
SELECT p.name, s.name as sku, i.quantity, w.name as warehouse
FROM inventory i
JOIN skus s ON i.sku_id = s.id
JOIN products p ON s.product_id = p.id
JOIN warehouses w ON i.warehouse_id = w.id
WHERE i.quantity < 10
ORDER BY i.quantity ASC;
```

### Find warehouses near location
```sql
SELECT
  name,
  ST_Distance(
    location::geography,
    ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography
  ) / 1000 as distance_km
FROM warehouses
WHERE ST_DWithin(
  location::geography,
  ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography,
  10000  -- 10km radius
)
ORDER BY distance_km;
```

## 🔗 External Resources

- [Fastify Documentation](https://fastify.dev/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [PostGIS Manual](https://postgis.net/docs/)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [pnpm Documentation](https://pnpm.io/)

## 💡 Best Practices

1. **Always validate input** using Zod schemas
2. **Use transactions** for multi-step database operations
3. **Publish events** after successful database commits
4. **Handle errors** with proper HTTP status codes
5. **Log appropriately** (debug in dev, info in prod)
6. **Write tests** for critical business logic
7. **Document APIs** using Swagger/OpenAPI
8. **Version APIs** (e.g., `/v1/products`)

---

**Last Updated**: November 15, 2025
**Maintained By**: QCom Platform Team
