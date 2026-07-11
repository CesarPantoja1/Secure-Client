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

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
