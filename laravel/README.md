# Inttegro + Laravel demo

A conventional Laravel application that uses the Inttegro PHP SDK on the
server and redirects to hosted checkout.

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan serve --port 3007
```

Open <http://localhost:3007>. Run `composer test` for the focused checks.
