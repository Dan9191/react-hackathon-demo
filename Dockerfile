# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Продакшен
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY public/config.json /usr/share/nginx/html/config.json

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80