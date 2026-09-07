FROM node:24.11.0-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
COPY . .
RUN npm run build

FROM node:24.11.0-slim AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3002
WORKDIR /app
COPY --from=build --chown=node:node /app/.output ./.output
USER node
EXPOSE 3002
CMD ["node", ".output/server/index.mjs"]
