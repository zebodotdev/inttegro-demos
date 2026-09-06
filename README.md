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

Open <http://localhost:3007>. Run `composer test` for the focused checks.

## Deploy your own

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos%2Ftree%2Fdeploy-laravel-v1.1.1)

Render builds the released Dockerfile. Railway uses the same image and
checked-in health policy; its button follows after the public template is
registered and smoke-tested. Generate `APP_KEY` in the deployment and keep it
separate from the Inttegro test API key. See
[`DEPLOYING.md`](https://github.com/zebodotdev/inttegro-demos/blob/v1.1.1/DEPLOYING.md).

## Understand the integration

Start with [`app/Services/CheckoutService.php`](./app/Services/CheckoutService.php)
for the Order payload and SDK boundary, then read
[`app/Http/Controllers/CheckoutController.php`](./app/Http/Controllers/CheckoutController.php)
for validation, correlation, and the 303 handoff. The `INTTEGRO:*` comments map
choices and alternatives to the shared
[integration guide](https://github.com/zebodotdev/inttegro-demos/blob/v1.1.1/INTEGRATION_GUIDE.md) and
[machine-readable decision registry](https://github.com/zebodotdev/inttegro-demos/blob/v1.1.1/integration-decisions.json).
