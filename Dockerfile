# Stage 1: Build the frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build args for environment variables (injected at build time)
ARG VITE_API_BASE_URL
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Build the app
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy nginx config template
COPY nginx.conf /etc/nginx/nginx.conf.template

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Railway provides PORT env var
ENV PORT=80

EXPOSE 80

# Use envsubst to replace only $PORT, then start nginx
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
