import 'dart:convert';
import 'dart:io';

/*
 * Inttegro mobile integration boundary
 *
 * INTTEGRO:FLOW [mobile-backend-boundary] The app asks a trusted merchant
 * backend to create and finalize an Order, then receives only the order ID that
 * the Inttegro SDK needs.
 * INTTEGRO:SECURITY [server-api-key] INTTEGRO_API_KEY must never be passed with
 * --dart-define, stored in assets, or compiled into a Flutter application.
 * Client configuration is recoverable. Product, price, customer, and payment
 * policy remain server-side.
 * INTTEGRO:ALTERNATIVE [mobile-backend-boundary] An existing authenticated API
 * gateway or backend-for-frontend can implement the narrow endpoint; the
 * reference Next.js route is not a requirement.
 * INTTEGRO:DOCS https://studio.inttegro.com/orders
 * INTTEGRO:DOCS https://studio.inttegro.com/keys
 * See ../../INTEGRATION_GUIDE.md and ../../integration-decisions.json for the shared
 * rationale and machine-readable alternatives.
 */

final class CheckoutOrderResponse {
  const CheckoutOrderResponse(this.orderId);

  final String orderId;

  factory CheckoutOrderResponse.fromJson(Object? value) {
    if (value is! Map<String, Object?>) {
      throw const FormatException('Invalid checkout-order response');
    }
    final orderId = value['orderId'];
    if (orderId is! String || orderId.trim().isEmpty) {
      throw const FormatException('Invalid checkout-order response');
    }
    return CheckoutOrderResponse(orderId.trim());
  }
}

final class DemoBackend {
  DemoBackend(String baseUrl) : baseUri = Uri.parse(baseUrl);

  final Uri baseUri;

  Future<CheckoutOrderResponse> createCheckoutOrder(String attemptId) async {
    // INTTEGRO:SECURITY [mobile-backend-boundary] This demo sends only an opaque
    // attempt ID. Production must authenticate the user, authorize the cart,
    // recompute its commercial data, rate-limit abuse, and consider platform
    // attestation. Never trust a client-selected customer, product, or price.
    if (!baseUri.isAbsolute) {
      throw StateError('Set INTTEGRO_DEMO_BACKEND_URL to an absolute URL.');
    }

    final client = HttpClient();
    try {
      final request = await client.postUrl(
        baseUri.resolve('/mobile/orders'),
      );
      request.headers.contentType = ContentType.json;
      request.add(
        utf8.encode(
          jsonEncode({
            'attemptId': attemptId,
          }),
        ),
      );
      final response = await request.close();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw const HttpException(
          'The demo backend could not create the checkout order.',
        );
      }
      final body = await utf8.decoder.bind(response).join();
      // INTTEGRO:DECISION [mobile-backend-boundary] Decode only the minimal
      // orderId projection. Merchant credentials and order construction never
      // cross the backend authorization boundary.
      return CheckoutOrderResponse.fromJson(jsonDecode(body));
    } finally {
      client.close(force: true);
    }
  }
}
