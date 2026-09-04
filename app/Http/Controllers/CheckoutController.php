<?php

namespace App\Http\Controllers;

use App\Services\CheckoutService;
use App\Services\DemoError;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;
use Illuminate\View\View;

final class CheckoutController extends Controller
{
    public function index(Request $request): View
    {
        return view('checkout', [
            'attemptId' => (string) Str::uuid(),
            'errorCode' => $request->query('code', ''),
            'errorMessage' => $request->query('message', ''),
        ]);
    }

    public function create(Request $request): RedirectResponse
    {
        try {
            $checkout = $request->validate([
                'name' => ['required', 'string', 'max:100'],
                'email' => ['required', 'email'],
                'phone' => ['required', 'string', 'max:40'],
                'attempt_id' => ['required', 'regex:/^[A-Za-z0-9_-]{8,100}$/'],
            ]);
            $result = CheckoutService::create($checkout, (string) config('inttegro.public_url'));
            return redirect()->away($result['checkout_url'], 303)->withCookie(cookie(
                'inttegro_demo_order', $result['order_id'], 30, '/', null, $request->isSecure(), true, false, 'Lax'
            ));
        } catch (DemoError $error) {
            return redirect()->route('home', ['code' => $error->errorCode, 'message' => $error->getMessage()], 303);
        }
    }

    public function complete(): View { return view('result', ['complete' => true]); }
    public function cancel(): View { return view('result', ['complete' => false]); }
}
