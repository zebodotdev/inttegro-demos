<?php

namespace App\Services;

use Inttegro\APIError;
use Inttegro\Client;
use Inttegro\Money\Currency;
use Inttegro\PriceParams;
use Inttegro\ProductType;
use RuntimeException;

final class DemoError extends RuntimeException
{
    public function __construct(public readonly string $errorCode, string $message, ?\Throwable $previous = null)
    {
        parent::__construct($message, 0, $previous);
    }
}

final class CheckoutService
{
    /** @param array{name: string, email: string, phone: string, attempt_id: string} $checkout */
    public static function orderPayload(array $checkout, string $origin): array
    {
        return [
            'request_meta' => ['idempotency_key' => 'demo-'.$checkout['attempt_id']],
            'customer_data' => ['name' => $checkout['name'], 'email_address' => $checkout['email'], 'phone_number' => $checkout['phone']],
            'finalize' => true,
            'checkout_settings' => ['redirect_url' => $origin.'/complete', 'cancel_url' => $origin.'/cancel'],
            'line_items' => [[
                'type' => 'product',
                'product' => [
                    'type' => ProductType::Digital,
                    'name' => 'Inttegro integration workshop',
                    'quantity' => 1,
                    'price' => new PriceParams(Currency::GHS, 5000),
                ],
            ]],
        ];
    }

    /** @param array{name: string, email: string, phone: string, attempt_id: string} $checkout
     *  @return array{order_id: string, checkout_url: string}
     */
    public static function create(array $checkout, string $origin): array
    {
        $apiKey = trim((string) getenv('INTTEGRO_API_KEY'));
        if ($apiKey === '') {
            throw new DemoError('configuration_error', 'Set INTTEGRO_API_KEY on the server.');
        }
        $parts = parse_url($origin);
        if (!is_array($parts) || !in_array($parts['scheme'] ?? '', ['http', 'https'], true) || empty($parts['host'])) {
            throw new DemoError('configuration_error', 'The demo public URL is invalid.');
        }
        $publicOrigin = $parts['scheme'].'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '');

        try {
            $order = (new Client($apiKey))->orders->create(self::orderPayload($checkout, $publicOrigin));
            $checkoutUrl = $order->invoice?->format?->web?->url;
            if (!$checkoutUrl) {
                throw new DemoError('api_error', 'Inttegro did not return a hosted checkout URL.');
            }
            return ['order_id' => $order->id, 'checkout_url' => $checkoutUrl];
        } catch (DemoError $error) {
            throw $error;
        } catch (APIError $error) {
            throw new DemoError('api_error', 'Inttegro rejected the checkout request.', previous: $error);
        } catch (\Throwable $error) {
            throw new DemoError('api_error', 'Checkout is temporarily unavailable.', previous: $error);
        }
    }
}
