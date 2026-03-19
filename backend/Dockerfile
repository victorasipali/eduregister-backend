FROM python:3.12-slim

# Cache buster - increment this number to force a full rebuild
ARG CACHE_BUST=2

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y \
    gcc \
    pkg-config \
    default-libmysqlclient-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy ALL project files fresh (no cache after this point)
COPY --chown=false . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD python manage.py migrate --noinput && \
    gunicorn config.wsgi:application \
    --bind 0.0.0.0:$PORT \
    --workers 2 \
    --timeout 120
