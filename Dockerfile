# Multi-stage build for coidea.ai

# Stage 1: Build contracts
FROM node:18-alpine AS contracts-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY contracts/ ./contracts/
COPY hardhat.config.js ./
RUN npx hardhat compile

# Stage 2: Backend
FROM node:18-alpine AS backend
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --production
COPY backend/ ./
COPY --from=contracts-builder /app/artifacts ./artifacts
EXPOSE 3000
CMD ["npm", "start"]

# Stage 3: Frontend (static)
FROM nginx:alpine AS frontend
COPY frontend/build/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
