# ============================================================================
# OC TechCloudUp — Multi-stage Docker Build
# ============================================================================
# Stage 1: Build static export with Next.js
# Stage 2: Serve with Nginx Alpine (tiny, ~10 MB)
#
# Build:
#   docker build -t oc-techcloudup .
#
# Run:
#   docker run -p 8080:80 oc-techcloudup
#   open http://localhost:8080
# ============================================================================

# --- Stage 1: Build ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency files first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:1.27-alpine AS runtime

# Copy static files from builder
COPY --from=builder /app/out /usr/share/nginx/html

# Custom nginx config
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
