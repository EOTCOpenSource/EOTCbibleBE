# Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and lockfiles
COPY package*.json tsconfig.json ./
COPY pnpm-lock.yaml* ./
COPY yarn.lock* ./

# Install dependencies using available package manager
RUN if [ -f pnpm-lock.yaml ]; then \
    npm install -g pnpm && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then \
    npm install -g yarn && yarn install --frozen-lockfile; \
    else \
    npm ci; \
    fi

# Copy source code
COPY src ./src

# Build TypeScript
RUN if [ -f pnpm-lock.yaml ]; then \
    pnpm run build; \
    elif [ -f yarn.lock ]; then \
    yarn build; \
    else \
    npm run build; \
    fi

# --------------------------
# Production Stage
# --------------------------
FROM node:22-alpine AS production

WORKDIR /app

# Copy package files and lockfiles
COPY package*.json ./
COPY pnpm-lock.yaml* ./
COPY yarn.lock* ./

# Install only production dependencies
RUN if [ -f pnpm-lock.yaml ]; then \
    npm install -g pnpm && pnpm install --prod --frozen-lockfile; \
    elif [ -f yarn.lock ]; then \
    npm install -g yarn && yarn install --production --frozen-lockfile; \
    else \
    npm ci --only=production; \
    fi

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Use non-root user for security
USER node

# Start the application
CMD ["node", "dist/index.js"]
