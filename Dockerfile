FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# Instalamos dependencias
RUN npm install

COPY . .

# ¡ESTA LÍNEA ES CLAVE si usas Prisma!
RUN npx prisma generate

# Compilamos el código (esto crea la carpeta /dist)
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/src/main.js"]