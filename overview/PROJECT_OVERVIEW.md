# QCom Platform - Project Overview

## 🎯 Project Identity

**Name**: QCom (Quick Commerce) Platform
**Type**: Multi-seller, Multi-warehouse Quick Commerce Platform
**Focus**: India Market
**Architecture**: Microservices-based, Event-driven
**Status**: Implementation Phase

## 📋 Executive Summary

QCom is a modern quick-commerce platform designed for the Indian market, featuring a sophisticated microservices architecture that supports multiple sellers and warehouses. The platform enables fast product delivery through intelligent warehouse selection and real-time inventory management.

### Core Capabilities
- **Multi-seller Catalog**: Independent vendor management with product catalog control
- **Multi-warehouse Fulfillment**: Intelligent routing based on proximity and inventory
- **Real-time Inventory**: Live stock management across multiple locations
- **Dynamic Pricing**: Delivery fee calculations based on distance and policies
- **Event-driven Architecture**: Scalable, decoupled service communication

## 🏗️ Architecture Overview

### Microservices Structure

```
QCom Platform
├── Authentication Service (Port 3001)
│   ├── User registration & login
│   ├── JWT token management
│   └── Role-based access control
│
├── Catalog Service (Port 3002)
│   ├── Product & SKU management
│   ├── Category organization
│   └── Price management
│
├── Inventory Service (Port 3003)
│   ├── Stock tracking
│   ├── Warehouse management
│   └── Reservation system
│
├── Pricing Service (Port 3004)
│   ├── Delivery fee calculation
│   ├── Distance-based pricing
│   └── User policy management
│
├── Orders Service (Port 3005)
│   ├── Cart management
│   ├── Checkout processing
│   └── Order tracking
│
├── Fulfillment Service (Port 3006)
│   ├── Pick & pack operations
│   ├── Warehouse selection
│   └── Delivery coordination
│
└── Notifications Service (Port 3007)
    ├── Email notifications
    ├── Push notifications
    └── SMS integration
```

### Technology Stack

#### Backend
- **Language**: TypeScript 5.3+
- **Runtime**: Node.js 20+
- **Framework**: Fastify 4.24+
- **Database**: PostgreSQL 17 with PostGIS
- **Cache**: Redis 8
- **Message Queue**: Apache Kafka (KRaft mode)
- **Authentication**: JWT (15min access, 7d refresh tokens)

#### Infrastructure
- **Container Platform**: Docker & Docker Compose
- **Cloud Provider**: Oracle Cloud Free Tier
- **CDN & Security**: Cloudflare (DNS, WAF, CDN)
- **CI/CD**: GitHub Actions
- **Orchestration**: Kubernetes-ready architecture

#### Development Tools
- **Monorepo**: pnpm workspaces with Turborepo
- **Build System**: TypeScript Compiler
- **Code Quality**: ESLint + Prettier
- **Testing**: Jest (configured)
- **API Gateway**: Apollo GraphQL Gateway (BFF pattern)

## 📁 Repository Structure

```
qcom-platform/
├── apps/
│   └── gateway/              # GraphQL BFF Gateway
├── services/
│   ├── auth/                 # Authentication service
│   ├── catalog/              # Product catalog service
│   ├── inventory/            # Stock management service
│   ├── pricing/              # Pricing engine service
│   ├── orders/               # Order management service
│   ├── fulfill/              # Fulfillment service
│   └── notifications/        # Notification service
├── packages/
│   └── shared/               # Shared types, DTOs, utils
├── infra/
│   ├── docker-compose.yml    # Dev environment
│   └── sql/                  # Database migrations
├── documentation/            # Technical docs
│   ├── index.html           # Platform overview
│   ├── services.html        # Backend services
│   ├── frontend.html        # Frontend apps
│   └── infrastructure.html  # DevOps docs
└── overview/                 # This folder
```

## 🔑 Key Features Implemented

### ✅ Authentication & Authorization
- User registration with email/phone
- JWT-based authentication (access + refresh tokens)
- Role-based access control (Customer, Vendor, Warehouse Staff, Rider, Admin)
- Password hashing with bcrypt
- Event publishing for user lifecycle

### ✅ Product Catalog Management
- Complete product CRUD operations
- SKU management with variants
- Price management with effective dates
- Category and subcategory hierarchy
- Product search and filtering
- Event-driven catalog updates

### ✅ Inventory Management
- Real-time stock tracking across warehouses
- Reservation system for cart items
- Warehouse-specific inventory
- Automatic stock allocation
- Low stock alerts

### ✅ Intelligent Warehouse Selection
- Distance-based warehouse selection
- Stock availability checking
- Multi-warehouse order splitting capability
- Optimal route calculation
- Delivery radius management

### ✅ Dynamic Pricing
- Distance-based delivery fee calculation
- User-specific delivery policies
- Free delivery radius support
- Seller vs. user payment models
- Real-time pricing updates

### ✅ Order Management
- Shopping cart functionality
- Multi-item checkout
- Order status tracking
- Payment integration ready
- Order history

### ✅ Database Schema
- Complete relational design
- PostGIS integration for geospatial queries
- Optimized indexes for performance
- Event sourcing support
- Default data seeding

## 🔄 Core Algorithms

### 1. Warehouse Selection Algorithm
**Location**: `packages/shared/src/algorithms.ts`

Selects the optimal warehouse based on:
- Customer location proximity
- Product availability
- User delivery policy (free radius)
- Warehouse operational capacity
- Multi-warehouse order splitting

### 2. Reservation System
**Location**: `packages/shared/src/algorithms.ts`

Manages inventory reservations:
- Cart item locking (15-minute TTL)
- Automatic release on timeout
- Race condition handling
- Rollback on payment failure

### 3. Delivery Fee Calculation
**Location**: Services in pricing service

Calculates delivery costs based on:
- Distance from warehouse to customer
- User delivery policy
- Base delivery charge
- Per-kilometer rate
- Free delivery radius

## 🌐 API Architecture

### REST APIs
Each microservice exposes RESTful endpoints:
- **Auth**: `/auth/register`, `/auth/login`, `/auth/refresh`
- **Catalog**: `/products`, `/skus`, `/prices`
- **Inventory**: `/stock`, `/warehouses`, `/reservations`
- **Orders**: `/cart`, `/checkout`, `/orders`

### GraphQL Gateway (BFF)
Apollo Federation gateway aggregating:
- Products and catalog data
- User information
- Cart and order management
- Real-time inventory status

### Event-Driven Communication
Kafka topics for service coordination:
- `user.created`, `user.updated`
- `product.created`, `product.updated`
- `order.placed`, `order.confirmed`
- `inventory.reserved`, `inventory.released`

## 🚀 Development Setup

### Prerequisites
- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 17 (via Docker)

### Quick Start
```bash
# Install dependencies
pnpm install

# Start infrastructure (Postgres, Redis, Kafka)
pnpm docker:up

# Run database migrations
pnpm db:migrate

# Start all services in development mode
pnpm dev

# Access services
# Auth: http://localhost:3001
# Catalog: http://localhost:3002
# Inventory: http://localhost:3003
```

### Available Scripts
- `pnpm dev` - Start all services in watch mode
- `pnpm build` - Build all services
- `pnpm test` - Run test suites
- `pnpm lint` - Lint all code
- `pnpm format` - Format code with Prettier
- `pnpm docker:up` - Start Docker services
- `pnpm docker:down` - Stop Docker services

## 📊 Database Schema Highlights

### Core Tables
- **users**: User accounts and authentication
- **user_profiles**: Role-specific user data
- **user_delivery_policies**: Delivery preferences
- **warehouses**: Warehouse locations (PostGIS)
- **products**: Product catalog
- **skus**: Product variants
- **prices**: Pricing with time-based changes
- **inventory**: Stock levels per warehouse
- **inventory_reservations**: Cart item locks
- **orders**: Order records
- **order_items**: Order line items
- **order_fulfillments**: Warehouse assignments

### Key Features
- PostGIS for geospatial queries
- Optimized indexes for performance
- Foreign key constraints for data integrity
- JSONB for flexible attributes
- Timestamp tracking (created_at, updated_at)

## 🔐 Security Features

### Authentication
- JWT with short-lived access tokens (15 min)
- Long-lived refresh tokens (7 days)
- bcrypt password hashing
- Token rotation on refresh

### Authorization
- Role-based access control (RBAC)
- Route-level permission checks
- Resource ownership validation

### Infrastructure
- Helmet.js for HTTP headers
- CORS configuration
- Rate limiting
- SQL injection prevention
- XSS protection

## 🎯 Next Steps & Roadmap

### Immediate Priorities
1. Complete remaining service implementations
2. Implement GraphQL Gateway
3. Add comprehensive test coverage
4. Set up CI/CD pipelines
5. Deploy to staging environment

### Future Enhancements
- Rider mobile application
- Advanced analytics dashboard
- Machine learning for demand forecasting
- Real-time tracking with WebSockets
- Multi-language support
- Payment gateway integration (Razorpay, Paytm)
- Push notification system

## 📚 Documentation

### Available Documentation
- **README.md**: Project introduction and setup
- **design.md**: Design philosophy and visual guidelines
- **outline.md**: Project structure and planning
- **IMPLEMENTATION_SUMMARY.md**: Detailed implementation notes
- **HTML Docs**: Interactive technical documentation website

### Technical Documentation Website
Interactive documentation with:
- Architecture diagrams
- API references
- Code examples
- Deployment guides
- Visual effects and animations

## 👥 User Roles

### Customer
- Browse products
- Add to cart
- Place orders
- Track deliveries
- Manage profile

### Vendor
- Manage product catalog
- Set prices
- View sales analytics
- Update inventory
- Handle orders

### Warehouse Staff
- Pick and pack orders
- Update stock levels
- Manage warehouse operations
- Scan and verify items

### Rider (Future)
- Accept delivery assignments
- Update delivery status
- Navigate to destinations
- Collect payments

### Admin
- System configuration
- User management
- Monitor platform health
- Generate reports
- Access all features

## 📈 Scalability Considerations

### Horizontal Scaling
- Stateless microservices
- Load balancing ready
- Database read replicas
- Redis cluster support
- Kafka partitioning

### Performance Optimization
- Database indexing
- Redis caching layer
- Connection pooling
- Query optimization
- CDN for static assets

### Monitoring & Observability
- Structured logging (Pino)
- Health check endpoints
- Metrics collection ready
- Error tracking
- Performance monitoring

## 🛠️ Development Standards

### Code Quality
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Consistent naming conventions
- Comprehensive comments

### Git Workflow
- Feature branch workflow
- Conventional commits
- Pull request reviews
- CI/CD automation
- Semantic versioning

## 📞 Contact & Support

**Repository**: https://github.com/qcom/platform.git
**Team Email**: amatbyte@gmail.com
**License**: MIT

---

**Last Updated**: November 15, 2025
**Version**: 1.0.0
**Status**: Active Development
