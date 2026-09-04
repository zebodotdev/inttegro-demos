import 'dart:convert';
import 'dart:io';

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
      return CheckoutOrderResponse.fromJson(jsonDecode(body));
    } finally {
      client.close(force: true);
    }
  }
}
