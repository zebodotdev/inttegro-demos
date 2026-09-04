<?php

namespace Tests\Unit;

use App\Services\CheckoutService;
use Inttegro\ProductType;
use PHPUnit\Framework\TestCase;

final class CheckoutServiceTest extends TestCase
{
    public function test_it_builds_the_shared_order_payload(): void
    {
        $payload = CheckoutService::orderPayload([
            'name' => 'Akua', 'email' => 'akua@example.com', 'phone' => '+233', 'attempt_id' => 'attempt_123',
        ], 'https://demo.example');

        self::assertSame('demo-attempt_123', $payload['request_meta']['idempotency_key']);
        self::assertTrue($payload['finalize']);
        self::assertSame('https://demo.example/complete', $payload['checkout_settings']['redirect_url']);
        self::assertSame(ProductType::Physical, $payload['line_items'][0]['product']['type']);
        self::assertSame('Dawn Brew Set', $payload['line_items'][0]['product']['name']);
        self::assertSame(5000, $payload['line_items'][0]['product']['price']->value);
    }
}
