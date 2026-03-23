FROM node:20-alpine AS base
WORKDIR /app

# 构建前端
FROM base AS client-build
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

# 构建后端
FROM base AS server-build
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install
COPY server/ ./server/
RUN cd server && npm run build

# 生产镜像
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache curl

COPY server/package.json server/package-lock.json* ./
RUN npm install --production

COPY --from=server-build /app/server/dist ./dist
COPY --from=client-build /app/client/dist ./public

RUN mkdir -p data logs

EXPOSE 3001

CMD ["node", "dist/index.js"]
