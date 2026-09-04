<?php

use App\Http\Controllers\CheckoutController;
use Illuminate\Support\Facades\Route;

Route::get('/', [CheckoutController::class, 'index'])->name('home');
Route::post('/checkout', [CheckoutController::class, 'create'])->name('checkout');
Route::get('/complete', [CheckoutController::class, 'complete'])->name('complete');
Route::get('/cancel', [CheckoutController::class, 'cancel'])->name('cancel');
Route::get('/health', fn () => response()->json(['status' => 'ok', 'demo' => 'laravel']));
