FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements-runtime.txt ./
RUN pip install --no-cache-dir -r requirements-runtime.txt
COPY src ./src
COPY public ./public
EXPOSE 3005
CMD ["sh", "-c", "exec uvicorn src.app.main:app --host 0.0.0.0 --port ${PORT:-3005} --proxy-headers --forwarded-allow-ips='*'"]
