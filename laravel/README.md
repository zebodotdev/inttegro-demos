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

## Understand the integration

Start with [`app/Services/CheckoutService.php`](./app/Services/CheckoutService.php)
for the Order payload and SDK boundary, then read
[`app/Http/Controllers/CheckoutController.php`](./app/Http/Controllers/CheckoutController.php)
for validation, correlation, and the 303 handoff. The `INTTEGRO:*` comments map
choices and alternatives to the shared
[integration guide](../INTEGRATION_GUIDE.md) and
[machine-readable decision registry](../integration-decisions.json).
