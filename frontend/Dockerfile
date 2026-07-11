# ==========================================
# Etapa 1: Build (Bun)
# ==========================================
FROM oven/bun:1 AS builder
WORKDIR /app

# Copiar dependencias y construirlas
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copiar el resto del código y hacer build de producción
COPY . .
RUN bun run build

# ==========================================
# Etapa 2: Producción (Nginx Unprivileged)
# ==========================================
FROM nginxinc/nginx-unprivileged:alpine

# Limpiar configuración por defecto y meter la nuestra
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los assets estáticos desde el builder
COPY --from=builder /app/dist /usr/share/nginx/html

USER nginx

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
