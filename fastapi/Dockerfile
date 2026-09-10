FROM node:24-slim AS web-build
WORKDIR /build
COPY package.json package-lock.json angular.json tsconfig.client.json ./
RUN npm ci
COPY client ./client
RUN npm run build:client

FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements-runtime.txt ./
RUN pip install --no-cache-dir -r requirements-runtime.txt
COPY src ./src
COPY public ./public
COPY --from=web-build /build/public/static/angular ./public/static/angular
EXPOSE 3005
CMD ["sh", "-c", "exec uvicorn src.app.main:app --host 0.0.0.0 --port ${PORT:-3005} --proxy-headers --forwarded-allow-ips='*'"]
