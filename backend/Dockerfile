FROM node:20-bookworm AS build
WORKDIR /app
RUN apt-get update && apt-get install -y openssl libssl3 && rm -rf /var/lib/apt/lists/*
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-3.0.x,native"
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate --schema=./prisma/schema.prisma
COPY . .
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y openssl libssl3 && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
