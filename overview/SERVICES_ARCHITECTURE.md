# QCom Platform - Services Architecture

## 🏗️ Microservices Overview

The QCom platform consists of 7 core microservices, each responsible for specific business domains. All services follow a consistent architecture pattern and communicate via REST APIs and Kafka events.

---

## 1. Authentication Service

**Port**: 3001
**Path**: `services/auth/`

### Purpose
Handles user authentication, authorization, and identity management across the platform.

### Core Responsibilities
- User registration and login
- JWT token generation and validation
- Password management and reset
- Role-based access control (RBAC)
- Session management
- OAuth integration (planned)

### Key Endpoints
```typescript
POST   /auth/register         // Register new user
POST   /auth/login            // User login
POST   /auth/refresh          // Refresh access token
POST   /auth/logout           // User logout
GET    /auth/me               // Get current user
PUT    /auth/password         // Change password
POST   /auth/forgot-password  // Request password reset
```

### Database Tables
- `users` - User accounts
- `user_profiles` - Role-specific data
- `user_delivery_policies` - Delivery preferences

### Events Published
```typescript
user.created        // New user registered
user.updated        // User profile updated
user.deleted        // User account deleted
user.logged_in      // User authenticated
user.logged_out     // User session ended
```

### Events Consumed
- None (independent service)

### Security Features
- bcrypt password hashing (10 salt rounds)
- JWT with RS256 algorithm
- Access tokens (15 min expiry)
- Refresh tokens (7 days expiry)
- Rate limiting (100 req/min per IP)
- CORS configuration
- Helmet security headers

### Environment Variables
```bash
PORT=3001
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
KAFKA_BROKERS=kafka:29092
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

---

## 2. Catalog Service

**Port**: 3002
**Path**: `services/catalog/`

### Purpose
Manages product catalog, SKUs, pricing, and product information across all vendors.

### Core Responsibilities
- Product CRUD operations
- SKU (Stock Keeping Unit) management
- Price management with effective dates
- Category and subcategory organization
- Product search and filtering
- Brand management
- Product attributes and variants

### Key Endpoints
```typescript
// Products
GET    /products              // List products
GET    /products/:id          // Get product details
POST   /products              // Create product (vendor)
PUT    /products/:id          // Update product (vendor)
DELETE /products/:id          // Delete product (vendor)

// SKUs
GET    /products/:id/skus     // List product SKUs
POST   /products/:id/skus     // Create SKU
PUT    /skus/:id              // Update SKU
DELETE /skus/:id              // Delete SKU

// Prices
GET    /skus/:id/prices       // Get price history
POST   /skus/:id/prices       // Set price
PUT    /prices/:id            // Update price
GET    /prices/active         // Get active prices

// Categories
GET    /categories            // List categories
POST   /categories            // Create category (admin)
```

### Database Tables
- `products` - Product master data
- `skus` - Product variants
- `prices` - Pricing with time-based changes
- `categories` - Product categories

### Events Published
```typescript
product.created       // New product added
product.updated       // Product info changed
product.deleted       // Product removed
product.activated     // Product made active
product.deactivated   // Product made inactive
sku.created          // New SKU added
sku.updated          // SKU modified
price.updated        // Price changed
```

### Events Consumed
```typescript
inventory.updated     // Update stock status in catalog
order.placed          // Track popular products
```

### Features
- Full-text product search
- Category hierarchy
- Price history tracking
- Bulk import/export
- Image management
- Product variants (size, color, etc.)
- Attribute flexibility (JSONB)

---

## 3. Inventory Service

**Port**: 3003
**Path**: `services/inventory/`

### Purpose
Manages real-time inventory levels across multiple warehouses and handles stock reservations.

### Core Responsibilities
- Real-time stock tracking
- Warehouse management
- Inventory reservations (cart locking)
- Stock replenishment tracking
- Low stock alerts
- Inter-warehouse transfers
- Stock adjustments

### Key Endpoints
```typescript
// Inventory
GET    /inventory             // Get inventory levels
GET    /inventory/:skuId      // Get SKU inventory
POST   /inventory/adjust      // Adjust stock (warehouse)
GET    /inventory/low-stock   // Get low stock alerts

// Warehouses
GET    /warehouses            // List warehouses
GET    /warehouses/:id        // Get warehouse details
POST   /warehouses            // Create warehouse (admin)
PUT    /warehouses/:id        // Update warehouse
GET    /warehouses/:id/stock  // Get warehouse inventory

// Reservations
POST   /reservations          // Reserve stock (cart)
PUT    /reservations/:id      // Update reservation
DELETE /reservations/:id      // Release reservation
GET    /reservations/expired  // Get expired reservations
```

### Database Tables
- `warehouses` - Warehouse locations (PostGIS)
- `inventory` - Stock levels per warehouse/SKU
- `inventory_reservations` - Cart item locks
- `inventory_adjustments` - Stock change history

### Events Published
```typescript
inventory.reserved      // Stock reserved for cart
inventory.released      // Reservation released
inventory.updated       // Stock level changed
inventory.depleted      // Stock reached zero
stock.low              // Stock below threshold
warehouse.created      // New warehouse added
```

### Events Consumed
```typescript
order.placed           // Convert reservation to sale
order.cancelled        // Release reservation
cart.expired           // Release expired reservations
```

### Reservation Algorithm
```typescript
// 15-minute TTL for cart reservations
interface Reservation {
  id: string;
  skuId: string;
  warehouseId: string;
  quantity: number;
  userId: string;
  expiresAt: Date;  // 15 minutes from creation
}

// Automatic cleanup of expired reservations
// Prevents overselling
// Rollback on payment failure
```

### PostGIS Features
- Geospatial warehouse locations
- Distance calculations
- Radius queries for warehouse selection
- Proximity-based filtering

---

## 4. Pricing Service

**Port**: 3004
**Path**: `services/pricing/`

### Purpose
Calculates delivery fees, manages pricing policies, and handles dynamic pricing logic.

### Core Responsibilities
- Delivery fee calculation
- Distance-based pricing
- User delivery policy management
- Dynamic pricing rules
- Promotional pricing
- Surge pricing (future)

### Key Endpoints
```typescript
// Delivery Fee Calculation
POST   /pricing/calculate-delivery  // Calculate delivery fee
GET    /pricing/policies/:userId    // Get user policy
PUT    /pricing/policies/:userId    // Update user policy

// Pricing Rules
GET    /pricing/rules               // List pricing rules
POST   /pricing/rules               // Create rule (admin)
PUT    /pricing/rules/:id           // Update rule
```

### Database Tables
- `user_delivery_policies` - User-specific delivery rules
- `delivery_pricing_rules` - Base pricing configuration

### Delivery Fee Algorithm
```typescript
interface DeliveryFeeInput {
  distance: number;        // km from warehouse to customer
  userId: string;
  orderValue: number;
  warehouseId: string;
}

interface DeliveryFeeOutput {
  baseFee: number;        // Base delivery charge
  distanceFee: number;    // Per-km charge
  totalFee: number;       // Total delivery fee
  freeDelivery: boolean;  // Within free radius?
  paidBy: 'user' | 'seller';
}

// Calculation logic:
1. Get user delivery policy
2. Check if within free radius
3. If yes: fee = 0
4. If no: fee = baseFee + (distance - freeRadius) * perKmRate
5. Apply user policy (user pays vs seller pays)
```

### Events Published
```typescript
pricing.calculated      // Delivery fee calculated
policy.updated         // User policy changed
```

### Events Consumed
```typescript
order.placed           // Calculate final pricing
user.created           // Create default policy
```

---

## 5. Orders Service

**Port**: 3005
**Path**: `services/orders/`

### Purpose
Manages shopping carts, checkout process, and order lifecycle.

### Core Responsibilities
- Shopping cart management
- Checkout processing
- Order placement
- Order status tracking
- Order history
- Payment coordination
- Order cancellation

### Key Endpoints
```typescript
// Cart Management
GET    /cart                  // Get user cart
POST   /cart/items            // Add item to cart
PUT    /cart/items/:id        // Update cart item
DELETE /cart/items/:id        // Remove from cart
DELETE /cart                  // Clear cart

// Checkout
POST   /checkout/calculate    // Calculate order totals
POST   /checkout/place        // Place order

// Orders
GET    /orders                // List user orders
GET    /orders/:id            // Get order details
PUT    /orders/:id/cancel     // Cancel order
GET    /orders/:id/status     // Get order status
```

### Database Tables
- `carts` - Shopping carts
- `cart_items` - Items in cart
- `orders` - Order records
- `order_items` - Order line items
- `order_fulfillments` - Warehouse assignments

### Order Placement Flow
```typescript
1. Validate cart items
2. Check inventory availability
3. Select optimal warehouse(s)
4. Calculate delivery fee
5. Reserve inventory
6. Create order record
7. Initiate payment
8. Confirm order (on payment success)
9. Publish order.placed event
10. Clear cart
```

### Events Published
```typescript
order.placed           // New order created
order.confirmed        // Payment successful
order.cancelled        // Order cancelled
order.updated          // Order modified
cart.updated           // Cart changed
cart.expired           // Cart abandoned (15 min)
```

### Events Consumed
```typescript
inventory.reserved     // Proceed with checkout
inventory.depleted     // Inform user item unavailable
payment.success        // Confirm order
payment.failed         // Release reservation
```

### Order States
```typescript
enum OrderStatus {
  PENDING = 'pending',           // Order created
  CONFIRMED = 'confirmed',       // Payment successful
  PREPARING = 'preparing',       // Being picked
  READY = 'ready',               // Ready for pickup
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}
```

---

## 6. Fulfillment Service

**Port**: 3006
**Path**: `services/fulfill/`

### Purpose
Coordinates warehouse operations, picking/packing, and delivery logistics.

### Core Responsibilities
- Order assignment to warehouses
- Pick list generation
- Pack and verify operations
- Rider assignment (future)
- Delivery tracking
- Return processing (future)

### Key Endpoints
```typescript
// Pick Operations
GET    /fulfill/pending       // Get pending orders
GET    /fulfill/pick-list/:orderId  // Generate pick list
POST   /fulfill/start-pick    // Start picking
POST   /fulfill/complete-pick // Complete picking

// Pack Operations
GET    /fulfill/ready-to-pack // Orders ready for packing
POST   /fulfill/pack          // Pack order
POST   /fulfill/verify        // Verify packed order

// Delivery
POST   /fulfill/assign-rider  // Assign to rider
POST   /fulfill/dispatch      // Mark as dispatched
POST   /fulfill/delivered     // Mark as delivered
```

### Database Tables
- `order_fulfillments` - Fulfillment records
- `pick_lists` - Picking instructions
- `pack_records` - Packing verification

### Warehouse Selection Algorithm
```typescript
// Located in packages/shared/src/algorithms.ts

async function selectOptimalWarehouse(
  items: OrderItem[],
  customerLocation: Point,
  userPolicy: UserDeliveryPolicy
): Promise<WarehouseSelection> {

  // 1. Find warehouses with all items in stock
  const eligibleWarehouses = await findWarehousesWithStock(items);

  // 2. Calculate distance to customer
  const withDistances = eligibleWarehouses.map(w => ({
    ...w,
    distance: calculateDistance(w.location, customerLocation)
  }));

  // 3. Filter by warehouse operational radius
  const inRange = withDistances.filter(w =>
    w.distance <= w.radiusKm
  );

  // 4. Sort by distance (closest first)
  const sorted = inRange.sort((a, b) =>
    a.distance - b.distance
  );

  // 5. Select closest warehouse
  return sorted[0];

  // If no single warehouse has all items:
  // - Split order across multiple warehouses
  // - Or show items unavailable
}
```

### Events Published
```typescript
fulfillment.assigned    // Order assigned to warehouse
fulfillment.picking     // Picking started
fulfillment.packed      // Order packed
fulfillment.dispatched  // Out for delivery
fulfillment.delivered   // Delivered to customer
```

### Events Consumed
```typescript
order.confirmed         // Start fulfillment process
order.cancelled         // Cancel fulfillment
inventory.updated       // Check stock availability
```

---

## 7. Notifications Service

**Port**: 3007
**Path**: `services/notifications/`

### Purpose
Sends notifications via email, SMS, and push notifications to users.

### Core Responsibilities
- Email notifications
- SMS notifications
- Push notifications (mobile)
- Notification templates
- Notification preferences
- Delivery tracking
- Notification history

### Key Endpoints
```typescript
// Send Notifications
POST   /notifications/email       // Send email
POST   /notifications/sms         // Send SMS
POST   /notifications/push        // Send push notification

// User Preferences
GET    /notifications/preferences // Get user preferences
PUT    /notifications/preferences // Update preferences

// History
GET    /notifications/history     // Get notification history
```

### Database Tables
- `notifications` - Notification log
- `notification_preferences` - User preferences
- `notification_templates` - Email/SMS templates

### Notification Types
```typescript
enum NotificationType {
  // Auth
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',

  // Orders
  ORDER_PLACED = 'order_placed',
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_PREPARING = 'order_preparing',
  ORDER_DISPATCHED = 'order_dispatched',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',

  // Inventory
  LOW_STOCK_ALERT = 'low_stock_alert',
  OUT_OF_STOCK = 'out_of_stock',

  // Promotions
  PROMOTIONAL = 'promotional',
  DISCOUNT = 'discount'
}
```

### Events Consumed
```typescript
user.created           // Send welcome email
order.placed           // Send order confirmation
order.confirmed        // Send payment confirmation
fulfillment.dispatched // Send tracking link
fulfillment.delivered  // Send delivery confirmation
order.cancelled        // Send cancellation notice
inventory.low          // Alert vendor
```

### External Integrations (Planned)
- SendGrid (Email)
- Twilio (SMS)
- Firebase Cloud Messaging (Push)
- OneSignal (Push alternative)

---

## 🔗 Service Communication

### Inter-Service Communication Patterns

#### 1. Synchronous (REST)
```typescript
// Service A calls Service B directly
const response = await fetch('http://service-b:3002/api/resource');
```

#### 2. Asynchronous (Events)
```typescript
// Service A publishes event
await kafka.publish('order.placed', { orderId, userId });

// Service B consumes event
kafka.subscribe('order.placed', async (event) => {
  // Handle event
});
```

#### 3. GraphQL Gateway (BFF)
```typescript
// Gateway aggregates multiple services
query {
  user { id, name }              // Auth service
  cart { items { product } }     // Orders + Catalog
  nearbyWarehouses { name }      // Inventory service
}
```

---

## 📊 Service Dependencies

```
Auth Service (Independent)
  ↓
Catalog Service → depends on: Auth
  ↓
Inventory Service → depends on: Catalog, Auth
  ↓
Pricing Service → depends on: Inventory, Auth
  ↓
Orders Service → depends on: Catalog, Inventory, Pricing, Auth
  ↓
Fulfillment Service → depends on: Orders, Inventory, Auth
  ↓
Notifications Service → depends on: All services (consumer only)
```

---

## 🛡️ Common Service Features

All services implement:
- Health check endpoint (`GET /health`)
- Metrics endpoint (`GET /metrics`)
- API documentation (Swagger UI)
- CORS configuration
- Rate limiting
- Error handling middleware
- Structured logging (Pino)
- Graceful shutdown
- Database connection pooling
- Redis caching
- Kafka event publishing

---

**Last Updated**: November 15, 2025
**Maintained By**: QCom Platform Team
