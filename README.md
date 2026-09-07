# Inttegro + Laravel demo

**Kora Market** is a product-led Laravel storefront with an interactive finish
picker and accessible bag dialog. Laravel validates the customer and redirects
to the exact hosted checkout URL returned by the Inttegro PHP SDK.

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan serve --port 3007
```

Open <http://localhost:3007>. Configure `INTTEGRO_DEMO_PRODUCT_ID` and
`INTTEGRO_DEMO_PRICE_ID` with the active Kora Market Product and Price. Laravel
resolves and validates both server-side; the storefront cannot submit its own
product or amount. Run `composer test` for the focused checks.

## Run with Docker

After configuring `.env` and setting `APP_KEY` to the output of
`php artisan key:generate --show`, run `docker compose up --build --wait`. Compose
starts the production image at <http://localhost:3007> and monitors
`GET /health`. Use `docker compose down` to stop it. Set both `APP_URL` and
`INTTEGRO_DEMO_PUBLIC_URL` to the exact HTTPS origin before exposing the
container publicly.

## Deploy your own

[![Deploy to Cloud Run](https://raw.githubusercontent.com/zebodotdev/inttegro-demos/v1.4.1/assets/providers/cloud-run-button.svg)](https://deploy.cloud.run/?git_repo=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos.git&revision=deploy-laravel-v1.4.1)
[![Run with Docker](https://raw.githubusercontent.com/zebodotdev/inttegro-demos/v1.4.1/assets/providers/docker-button.svg)](#run-with-docker)
[![Deploy on Railway](https://raw.githubusercontent.com/zebodotdev/inttegro-demos/v1.4.1/assets/providers/railway-button.svg)](https://railway.com/new/template/p5qiP5?utm_medium=integration&utm_source=inttegro-demos&utm_campaign=laravel)
[![Deploy to Render](https://raw.githubusercontent.com/zebodotdev/inttegro-demos/v1.4.1/assets/providers/render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos%2Ftree%2Fdeploy-laravel-v1.4.1)

Cloud Run, Railway, and Render build the released Dockerfile. The Railway template pins the
release commit and generates `APP_KEY` in the deployment, separate from the
Inttegro test API key. See
[`DEPLOYING.md`](https://github.com/zebodotdev/inttegro-demos/blob/v1.4.1/DEPLOYING.md).

## Understand the integration

Start with [`app/Services/CheckoutService.php`](./app/Services/CheckoutService.php)
for the Order payload and SDK boundary, then read
[`app/Http/Controllers/CheckoutController.php`](./app/Http/Controllers/CheckoutController.php)
for validation, correlation, and the 303 handoff. The `INTTEGRO:*` comments map
choices and alternatives to the shared
[integration guide](https://github.com/zebodotdev/inttegro-demos/blob/v1.4.1/INTEGRATION_GUIDE.md) and
[machine-readable decision registry](https://github.com/zebodotdev/inttegro-demos/blob/v1.4.1/integration-decisions.json).
