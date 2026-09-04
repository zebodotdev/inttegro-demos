import 'dart:convert';
import 'dart:io';

final class PaymentSessionResponse {
  const PaymentSessionResponse(this.paymentSessionSecret);

  final String paymentSessionSecret;

  factory PaymentSessionResponse.fromJson(Object? value) {
    if (value is! Map<String, Object?>) {
      throw const FormatException('Invalid payment-session response');
    }
    final secret = value['paymentSessionSecret'];
    if (secret is! String || secret.trim().isEmpty) {
      throw const FormatException('Invalid payment-session response');
    }
    return PaymentSessionResponse(secret.trim());
  }
}

final class DemoBackend {
  DemoBackend(String baseUrl) : baseUri = Uri.parse(baseUrl);

  final Uri baseUri;

  Future<PaymentSessionResponse> createPaymentSession() async {
    if (!baseUri.isAbsolute) {
      throw StateError('Set INTTEGRO_DEMO_BACKEND_URL to an absolute URL.');
    }

    final client = HttpClient();
    try {
      final request = await client.postUrl(
        baseUri.resolve('/mobile/payment-sessions'),
      );
      request.headers.contentType = ContentType.json;
      request.add(
        utf8.encode(
          jsonEncode({
            'item': {
              'name': 'Inttegro integration workshop',
              'type': 'digital',
              'quantity': 1,
              'currency': 'GHS',
              'value': 5000,
            },
          }),
        ),
      );
      final response = await request.close();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw const HttpException(
          'The demo backend could not create a payment session.',
        );
      }
      final body = await utf8.decoder.bind(response).join();
      return PaymentSessionResponse.fromJson(jsonDecode(body));
    } finally {
      client.close(force: true);
    }
  }
}
