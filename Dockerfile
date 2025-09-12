# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

# Add build-time argument for environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm install --production=false
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app

# Copy runtime environment variables
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY public ./public
COPY next.config.ts ./
EXPOSE 3000
CMD ["npm", "start"]