<?php

namespace App\Http\Controllers;

use App\Services\CheckoutService;
use App\Services\DemoError;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

final class CheckoutController extends Controller
{
    /*
     * INTTEGRO:FLOW [checkout-presentation] create() builds one finalized Order
     * for hosted-page, embedded, and modal Checkout documented at
     * https://studio.inttegro.com/accept-payment-with-inttegro-checkout.
     * INTTEGRO:VERIFY [server-side-verification] Returning to /complete is not
     * payment proof. Resolve an owner-scoped order and look it up server-side;
     * current reconciliation guidance is https://studio.inttegro.com/webhooks.
     */
    public function index(Request $request): View
    {
        return view('checkout', [
            'attemptId' => (string) Str::uuid(),
            'errorCode' => $request->query('code', ''),
            'errorMessage' => $request->query('message', ''),
        ]);
    }

    public function create(Request $request): JsonResponse|RedirectResponse
    {
        try {
            $checkout = $request->validate([
                'name' => ['required', 'string', 'max:100'],
                'email' => ['required', 'email'],
                'phone' => ['required', 'string', 'max:40'],
                'attempt_id' => ['required', 'regex:/^[A-Za-z0-9_-]{8,100}$/'],
            ]);
            $result = CheckoutService::create($checkout, (string) config('inttegro.public_url'));
            // INTTEGRO:DECISION [durable-order-correlation] The HttpOnly cookie
            // is only a demo aid. Persist the merchant cart, owner, Inttegro
            // order ID, and idempotency key together in production.
            $cookie = cookie(
                'inttegro_demo_order', $result['order_id'], 30, '/', null, $request->isSecure(), true, false, 'Lax'
            );
            if ($request->expectsJson()) {
                return response()->json(['orderId' => $result['order_id']], 201)
                    ->header('Cache-Control', 'no-store')
                    ->withCookie($cookie);
            }
            // INTTEGRO:DECISION [see-other-redirect] 303 follows with GET and
            // avoids replaying this merchant POST as 307/308 would.
            return redirect()->away($result['checkout_url'], 303)->withCookie($cookie);
        } catch (ValidationException $error) {
            if ($request->expectsJson()) {
                return response()->json([
                    'code' => 'validation_error',
                    'message' => 'Enter a name, valid email, and phone number.',
                ], 400)->header('Cache-Control', 'no-store');
            }
            throw $error;
        } catch (DemoError $error) {
            // INTTEGRO:SECURITY [safe-error-boundary] Only the bounded demo
            // vocabulary reaches the browser; upstream diagnostics stay private.
            if ($request->expectsJson()) {
                $status = $error->errorCode === 'validation_error' ? 400 : 503;
                return response()->json(['code' => $error->errorCode, 'message' => $error->getMessage()], $status)
                    ->header('Cache-Control', 'no-store');
            }
            return redirect()->route('home', ['code' => $error->errorCode, 'message' => $error->getMessage()], 303);
        }
    }

    public function complete(): View { return view('result', ['complete' => true]); }
    public function cancel(): View { return view('result', ['complete' => false]); }
}
