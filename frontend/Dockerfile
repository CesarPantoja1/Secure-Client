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
# Etapa 2: Producción (Nginx)
# ==========================================
FROM nginx:alpine

# Eliminar conf por defecto y usar el nuestro seguro
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los assets estáticos desde el builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Correr como usuario no-root por seguridad
RUN chown -R nginx:nginx /usr/share/nginx/html /etc/nginx/conf.d /var/cache/nginx /var/run /var/log/nginx
USER nginx

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
