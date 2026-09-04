import 'package:flutter_test/flutter_test.dart';
import 'package:inttegro_demo_flutter/demo_backend.dart';

void main() {
  test('decodes and trims a payment-session secret', () {
    final response = PaymentSessionResponse.fromJson({
      'paymentSessionSecret': '  ps_demo  ',
    });
    expect(response.paymentSessionSecret, 'ps_demo');
  });

  test('rejects a missing payment-session secret', () {
    expect(
      () => PaymentSessionResponse.fromJson(<String, Object?>{}),
      throwsFormatException,
    );
  });
}
