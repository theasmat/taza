FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.12.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY services/auth/package.json ./services/auth/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY services/auth ./services/auth
COPY packages/shared ./packages/shared

# Build shared package first
RUN cd packages/shared && pnpm build

# Build auth service
RUN cd services/auth && pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm@8.12.0

WORKDIR /app

# Copy built application
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/shared/dist ./packages/shared/dist
COPY --from=base /app/services/auth/dist ./services/auth/dist
COPY --from=base /app/services/auth/package.json ./services/auth/

# Set working directory to auth service
WORKDIR /app/services/auth

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "dist/index.js"]