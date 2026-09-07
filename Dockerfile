FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src
WORKDIR /app
COPY requirements-runtime.txt ./
RUN pip install --no-cache-dir -r requirements-runtime.txt
COPY . .
RUN python manage.py collectstatic --noinput
EXPOSE 3004
CMD ["sh", "-c", "exec uvicorn inttegro_demo.asgi:application --host 0.0.0.0 --port ${PORT:-3004} --proxy-headers --forwarded-allow-ips='*'"]
