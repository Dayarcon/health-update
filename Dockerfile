# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from backend directory
COPY backend/package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy backend source
COPY backend/src ./src
COPY backend/tsconfig.json ./
COPY backend/nest-cli.json ./
COPY backend/prisma ./prisma

# Build the application
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install production dependencies only
RUN npm install --production --legacy-peer-deps

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/auth/me', (r) => {if (r.statusCode !== 401) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "dist/main"]
