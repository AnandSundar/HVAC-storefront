# syntax=docker/dockerfile:1
# Multi-stage build: composer install in builder, runtime uses prod PHP image.
# Render free tier requires Dockerfile (no native PHP buildpack).

# ---------- Stage 1: composer dependencies ----------
FROM composer:2 AS vendor

WORKDIR /app

# Copy composer files first for layer caching.
COPY composer.json composer.lock* ./

# Install with no dev in production (but keep dev for one-click demo deploys).
# --no-interaction ensures non-interactive install on Render.
RUN composer install \
    --no-interaction \
    --no-scripts \
    --prefer-dist \
    --optimize-autoloader

# ---------- Stage 2: runtime ----------
FROM php:8.2-cli-bookworm

# Install system deps + PHP extensions Laravel needs.
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libsqlite3-dev \
        libzip-dev \
        libonig-dev \
        libxml2-dev \
    && docker-php-ext-install pdo pdo_sqlite mbstring zip bcmath \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Configure PHP for production-ish defaults.
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Install Composer in runtime stage for artisan-driven setup.
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy application code + vendor from builder.
COPY . .
COPY --from=vendor /app/vendor ./vendor

# Render sets PORT env var; default to 8000 for `php artisan serve`.
EXPOSE 8000

# Render Dockerfile CMD must run as the listening process.
# We bind to 0.0.0.0 so Render's external proxy can reach the dev server.
# For real production, swap `serve` for `php-fpm` + nginx.
CMD php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
