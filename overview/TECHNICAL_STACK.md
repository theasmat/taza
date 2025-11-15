# QCom Platform - Technical Stack

## 🔧 Technology Stack Overview

Complete breakdown of all technologies, frameworks, libraries, and tools used in the QCom platform.

## 🖥️ Backend Technologies

### Runtime & Language
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20+ | JavaScript runtime environment |
| TypeScript | 5.3+ | Type-safe programming language |
| pnpm | 8+ | Fast, efficient package manager |

### Web Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| Fastify | 4.24+ | High-performance web framework |
| @fastify/cors | Latest | Cross-Origin Resource Sharing |
| @fastify/helmet | Latest | Security headers middleware |
| @fastify/rate-limit | Latest | Rate limiting protection |
| @fastify/swagger | Latest | API documentation |
| @fastify/swagger-ui | Latest | Interactive API explorer |

### Database & Storage
| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 17 | Primary relational database |
| PostGIS | 3.4 | Geospatial database extension |
| Redis | 8-alpine | Caching and session storage |
| pg (node-postgres) | Latest | PostgreSQL client for Node.js |

### Message Queue & Events
| Technology | Version | Purpose |
|------------|---------|---------|
| Apache Kafka | Latest | Event streaming platform |
| KafkaJS | Latest | Kafka client for Node.js |
| KRaft Mode | - | Kafka without ZooKeeper |

### Authentication & Security
| Technology | Version | Purpose |
|------------|---------|---------|
| jsonwebtoken | Latest | JWT token generation/validation |
| bcrypt | Latest | Password hashing |
| uuid | Latest | UUID generation |
| Zod | Latest | Schema validation |

### API Gateway
| Technology | Version | Purpose |
|------------|---------|---------|
| Apollo Server | Latest | GraphQL server |
| Apollo Gateway | Latest | GraphQL federation gateway |
| @apollo/subgraph | Latest | Subgraph support |
| graphql | Latest | GraphQL implementation |

## 🐳 Infrastructure & DevOps

### Containerization
| Technology | Version | Purpose |
|------------|---------|---------|
| Docker | Latest | Container runtime |
| Docker Compose | 3.8 | Multi-container orchestration |
| Kubernetes | Ready | Production orchestration (ready) |

### Cloud & CDN
| Technology | Version | Purpose |
|------------|---------|---------|
| Oracle Cloud | Free Tier | Cloud hosting platform |
| Cloudflare | - | DNS, CDN, and WAF |
| Cloudflare Workers | - | Edge computing (optional) |

### CI/CD
| Technology | Version | Purpose |
|------------|---------|---------|
| GitHub Actions | - | Continuous integration/deployment |
| Turborepo | 1.11+ | Monorepo build system |

## 🛠️ Development Tools

### Build & Bundling
| Technology | Version | Purpose |
|------------|---------|---------|
| TypeScript Compiler | 5.3+ | TypeScript to JavaScript compilation |
| Turborepo | 1.11+ | Monorepo task orchestration |
| tsx | Latest | TypeScript execution |

### Code Quality
| Technology | Version | Purpose |
|------------|---------|---------|
| ESLint | 8.54+ | JavaScript/TypeScript linting |
| Prettier | 3.1+ | Code formatting |
| @typescript-eslint | 6.13+ | TypeScript-specific linting rules |
| eslint-config-prettier | 9.0+ | Prettier integration with ESLint |

### Testing
| Technology | Version | Purpose |
|------------|---------|---------|
| Jest | Latest | Testing framework |
| @types/jest | Latest | Jest type definitions |
| supertest | Latest | HTTP assertion testing |

### Logging & Monitoring
| Technology | Version | Purpose |
|------------|---------|---------|
| Pino | Latest | Fast JSON logger |
| pino-pretty | Latest | Pretty logging for development |

## 📦 Shared Libraries & Utilities

### Validation & Types
```typescript
// packages/shared
- Zod (Schema validation)
- TypeScript types
- DTOs (Data Transfer Objects)
- Event contracts
```

### Utility Functions
```typescript
// packages/shared/src/utils.ts
- Distance calculation (Haversine formula)
- Password hashing utilities
- Date/time helpers
- Data transformation utilities
```

### Algorithms
```typescript
// packages/shared/src/algorithms.ts
- Warehouse selection algorithm
- Inventory reservation system
- Delivery fee calculation
- Multi-warehouse splitting logic
```

## 🌐 Frontend Technologies (Planned)

### Customer Web/Mobile App
| Technology | Purpose |
|------------|---------|
| React | UI framework |
| Next.js | React framework with SSR |
| React Native | Mobile app development |
| TailwindCSS | Utility-first CSS framework |
| Apollo Client | GraphQL client |

### Vendor Dashboard
| Technology | Purpose |
|------------|---------|
| React | UI framework |
| Next.js | React framework with SSR |
| TailwindCSS | Styling |
| Recharts | Analytics charts |
| Apollo Client | GraphQL client |

### Warehouse Keeper App
| Technology | Purpose |
|------------|---------|
| React Native | Cross-platform mobile app |
| React Navigation | Navigation library |
| Expo | Development toolchain |
| Apollo Client | GraphQL client |

### Rider App (Future)
| Technology | Purpose |
|------------|---------|
| React Native | Cross-platform mobile app |
| React Native Maps | Map integration |
| Geolocation API | GPS tracking |
| WebSocket | Real-time updates |

## 📚 Documentation Tools

### Technical Documentation Website
| Technology | Purpose |
|------------|---------|
| Vanilla HTML/CSS/JS | Core structure |
| TailwindCSS | Styling framework |
| Anime.js | Smooth animations |
| ECharts.js | Architecture diagrams |
| Splitting.js | Text animation effects |
| Typed.js | Typewriter effects |

## 🗄️ Database Schema Management

### Migration Tools
```sql
-- infra/sql/001_create_base_tables.sql
- PostgreSQL DDL
- PostGIS spatial extensions
- Index creation
- Default data seeding
```

### Schema Features
- UUID primary keys
- JSONB for flexible attributes
- PostGIS Geography types
- Timestamp tracking (created_at, updated_at)
- Foreign key constraints
- Check constraints
- Unique constraints
- Optimized indexes

## 🔐 Security Stack

### Application Security
| Layer | Technology |
|-------|------------|
| Authentication | JWT (RS256) |
| Password Hashing | bcrypt (salt rounds: 10) |
| Rate Limiting | @fastify/rate-limit |
| CORS | @fastify/cors |
| HTTP Headers | @fastify/helmet |
| Input Validation | Zod schemas |

### Infrastructure Security
| Layer | Technology |
|-------|------------|
| SSL/TLS | Cloudflare SSL |
| DDoS Protection | Cloudflare WAF |
| API Gateway | Rate limiting + WAF |
| Database | Connection encryption |
| Secrets | Environment variables |

## 📊 Performance Stack

### Caching Strategy
```
L1: Application Memory
L2: Redis Cache
L3: Database Query Cache
CDN: Cloudflare Edge Cache
```

### Optimization Techniques
- Connection pooling (PostgreSQL)
- Redis for session storage
- Database indexing strategy
- Query optimization
- Lazy loading
- Pagination
- GraphQL batching/caching

## 🔄 Event-Driven Architecture

### Event Topics (Kafka)
```javascript
// User events
user.created
user.updated
user.deleted

// Product events
product.created
product.updated
product.deleted
price.updated

// Order events
order.placed
order.confirmed
order.cancelled
order.fulfilled

// Inventory events
inventory.reserved
inventory.released
inventory.updated
stock.low
```

## 🏗️ Microservices Communication

### Synchronous (REST)
- Service-to-service REST calls
- GraphQL Gateway aggregation
- Health check endpoints

### Asynchronous (Events)
- Kafka event streaming
- Pub/Sub pattern
- Event sourcing ready

### Data Consistency
- Saga pattern for distributed transactions
- Eventual consistency model
- Compensation logic

## 🌍 Internationalization (Future)

### Planned Support
| Technology | Purpose |
|------------|---------|
| i18next | Internationalization framework |
| react-i18next | React integration |
| date-fns | Date localization |

### Supported Languages (Planned)
- English (en-IN)
- Hindi (hi-IN)
- Regional languages

## 📱 Mobile Development

### React Native Stack
```javascript
// Core
- React Native
- React Navigation
- Expo (optional)

// State Management
- Redux Toolkit
- React Query (TanStack Query)

// UI Components
- React Native Paper
- Native Base
- Custom components

// Maps & Location
- React Native Maps
- Geolocation API

// Push Notifications
- Firebase Cloud Messaging
- OneSignal
```

## 🧪 Testing Stack

### Backend Testing
```javascript
// Unit Tests
- Jest
- @types/jest

// Integration Tests
- supertest
- @testcontainers (Postgres, Redis)

// E2E Tests
- Playwright (planned)
```

### Frontend Testing (Planned)
```javascript
// Unit & Component Tests
- Jest
- React Testing Library

// E2E Tests
- Cypress
- Playwright
```

## 📈 Monitoring & Observability (Planned)

### Logging
| Technology | Purpose |
|------------|---------|
| Pino | Structured logging |
| Loki | Log aggregation |
| Grafana | Log visualization |

### Metrics
| Technology | Purpose |
|------------|---------|
| Prometheus | Metrics collection |
| Grafana | Metrics visualization |
| Node Exporter | System metrics |

### Tracing
| Technology | Purpose |
|------------|---------|
| OpenTelemetry | Distributed tracing |
| Jaeger | Trace visualization |

### Error Tracking
| Technology | Purpose |
|------------|---------|
| Sentry | Error monitoring |
| Alerting | Email/Slack notifications |

## 🔧 Development Environment

### IDE Recommendations
- Visual Studio Code
- WebStorm
- Cursor

### VSCode Extensions
- ESLint
- Prettier
- TypeScript
- Docker
- PostgreSQL
- GraphQL
- GitLens

### System Requirements
```
Minimum:
- RAM: 8GB
- Storage: 20GB
- CPU: 4 cores

Recommended:
- RAM: 16GB+
- Storage: 50GB+
- CPU: 8 cores
- SSD for Docker volumes
```

## 📦 Package Manager Configuration

### pnpm Workspace
```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'services/*'
  - 'packages/*'
```

### Turborepo Pipeline
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

## 🔗 External Services & APIs

### Payment Gateways (Planned)
- Razorpay
- Paytm
- PhonePe

### Communication Services (Planned)
- Twilio (SMS)
- SendGrid (Email)
- Firebase (Push notifications)

### Maps & Geolocation
- Google Maps API (planned)
- OpenStreetMap (alternative)
- PostGIS for spatial queries

## 🎯 Version Management

### Node.js Version Management
```bash
# Using nvm
nvm use 20

# Or using fnm
fnm use 20
```

### Package Versions
- Semantic Versioning (SemVer)
- Lock files (pnpm-lock.yaml)
- Exact versions for core dependencies

## 🚀 Deployment Stack

### Container Registry
- Docker Hub
- GitHub Container Registry
- Oracle Cloud Container Registry

### Orchestration (Production)
- Kubernetes
- Helm charts
- kubectl

### Load Balancing
- Cloudflare Load Balancer
- Kubernetes Ingress
- Oracle Cloud Load Balancer

---

**Last Updated**: November 15, 2025
**Maintained By**: QCom Platform Team
