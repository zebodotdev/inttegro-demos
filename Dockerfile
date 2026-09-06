FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt gunicorn==23.0.0
COPY . .
RUN python manage.py collectstatic --noinput
EXPOSE 3004
CMD ["sh", "-c", "exec gunicorn inttegro_demo.wsgi:application --bind 0.0.0.0:${PORT:-3004} --workers 2 --threads 4 --access-logfile -"]
