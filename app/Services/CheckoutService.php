<?php

namespace App\Services;

use Inttegro\APIError;
use Inttegro\Client;
use Inttegro\Money\Currency;
use Inttegro\PriceParams;
use Inttegro\ProductType;
use RuntimeException;

/*
 * Inttegro integration map
 *
 * INTTEGRO:FLOW [hosted-checkout] This server-only service creates and
 * finalizes the Kora Market Order and returns its hosted invoice URL.
 * INTTEGRO:SECURITY [server-api-key] INTTEGRO_API_KEY belongs only in the
 * trusted PHP process. Never expose it through VITE_ variables, Blade, public
 * assets, logs, or error responses.
 * INTTEGRO:ALTERNATIVE [hosted-checkout] Direct API payment offers more UI
 * control but makes the merchant own more payment state, recovery,
 * method-specific behavior, testing, and compliance analysis.
 * INTTEGRO:DOCS https://studio.inttegro.com/accept-payment-with-inttegro-checkout
 * INTTEGRO:DOCS https://studio.inttegro.com/orders
 * INTTEGRO:DOCS https://studio.inttegro.com/keys
 * See ../../../INTEGRATION_GUIDE.md and ../../../integration-decisions.json for the shared
 * rationale and machine-readable alternatives.
 */

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
            // INTTEGRO:DECISION [stable-idempotency-key] Reuse the key for a
            // retry of this logical checkout. Production code should persist a
            // cart/invoice-derived key; creating a new key after a timeout can
            // create a duplicate. https://studio.inttegro.com/idempotency
            'request_meta' => ['idempotency_key' => 'demo-'.$checkout['attempt_id']],
            // INTTEGRO:DECISION [inline-customer] customer_data suits this guest
            // flow. Account-based apps should resolve customer_id server-side;
            // the Orders API accepts exactly one customer representation.
            'customer_data' => ['name' => $checkout['name'], 'email_address' => $checkout['email'], 'phone_number' => $checkout['phone']],
            // INTTEGRO:DECISION [finalize-on-create] The cart is settled, so one
            // operation freezes the Order and produces invoice formats. Use a
            // draft, updates, then finalization when tax, shipping, inventory,
            // approval, or line items can still change.
            'finalize' => true,
            'checkout_settings' => ['redirect_url' => $origin.'/complete', 'cancel_url' => $origin.'/cancel'],
            'line_items' => [[
                'type' => 'product',
                'product' => [
                    // INTTEGRO:DECISION [inline-product] Inline product data
                    // keeps this demo self-contained. Catalog merchants can use
                    // product_id plus price or price_id; do not mix both shapes.
                    'type' => ProductType::Physical,
                    'name' => 'Dawn Brew Set',
                    'quantity' => 1,
                    // INTTEGRO:DECISION [minor-unit-money] Integer 5000 is
                    // GHS 50.00. Use a currency-aware decimal/money type when
                    // converting variable amounts.
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
        // INTTEGRO:SECURITY [server-api-key] Load the key from a deployment
        // secret store in production and rotate it there. Do not serialize it.
        $apiKey = trim((string) getenv('INTTEGRO_API_KEY'));
        if ($apiKey === '') {
            throw new DemoError('configuration_error', 'Set INTTEGRO_API_KEY on the server.');
        }
        // INTTEGRO:SECURITY [configured-public-origin] Prefer an allow-listed
        // origin in production. Request-derived values are safe only behind a
        // precise trusted-proxy configuration. Return URLs must be HTTP(S), and
        // Inttegro appends order_id after checkout.
        $parts = parse_url($origin);
        if (!is_array($parts) || !in_array($parts['scheme'] ?? '', ['http', 'https'], true) || empty($parts['host'])) {
            throw new DemoError('configuration_error', 'The demo public URL is invalid.');
        }
        $publicOrigin = $parts['scheme'].'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '');

        try {
            // INTTEGRO:ALTERNATIVE [server-api-key] A production container may
            // inject one startup-configured Client for transport reuse and
            // application-owned OpenTelemetry. Per-call construction is concise
            // for the demo. https://studio.inttegro.com/sdk-observability
            $order = (new Client($apiKey))->orders->create(self::orderPayload($checkout, $publicOrigin));
            // INTTEGRO:DECISION [returned-checkout-url] Use the URL in the
            // response. Constructing one from the order ID relies on
            // undocumented routing conventions.
            $checkoutUrl = $order->invoice?->format?->web?->url;
            if (!$checkoutUrl) {
                throw new DemoError('api_error', 'Inttegro did not return a hosted checkout URL.');
            }
            return ['order_id' => $order->id, 'checkout_url' => $checkoutUrl];
        } catch (DemoError $error) {
            throw $error;
        } catch (APIError $error) {
            // INTTEGRO:SECURITY [safe-error-boundary] Keep raw API bodies,
            // credentials, and traces in protected diagnostics. Public messages
            // remain stable; log only bounded metadata and request IDs.
            throw new DemoError('api_error', 'Inttegro rejected the checkout request.', previous: $error);
        } catch (\Throwable $error) {
            throw new DemoError('api_error', 'Checkout is temporarily unavailable.', previous: $error);
        }
    }
}
