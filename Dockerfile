# Multi-stage Dockerfile for Creditz (Node.js 22 + SQLite + Vite + Express)

# --- Stage 1: Build Phase ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install all dependencies (including devDependencies required for compilation)
RUN npm ci

# Copy full application source code
COPY . .

# Build Vite frontend and bundle Express server.ts into dist/server.cjs
RUN npm run build

# --- Stage 2: Production Execution Phase ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled dist bundle from builder stage
COPY --from=builder /app/dist ./dist

# Create data and uploads directories for persistent storage
RUN mkdir -p /app/data /app/uploads

# Expose server port
EXPOSE 3000

# Start the compiled production Express server
CMD ["node", "dist/server.cjs"]
