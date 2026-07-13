# Use the official lightweight Node.js image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build both frontend assets and backend bundle
RUN npm run build

# --- Production runner stage ---
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts and package files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Expose port (Cloud Run automatically routes traffic to the port configured in PORT env)
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/server.cjs"]
