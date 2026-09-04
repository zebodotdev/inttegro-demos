import 'package:flutter_test/flutter_test.dart';
import 'package:inttegro_demo_flutter/demo_backend.dart';

void main() {
  test('decodes and trims a checkout order ID', () {
    final response = CheckoutOrderResponse.fromJson({
      'orderId': '  or_demo  ',
    });
    expect(response.orderId, 'or_demo');
  });

  test('rejects a missing checkout order ID', () {
    expect(
      () => CheckoutOrderResponse.fromJson(<String, Object?>{}),
      throwsFormatException,
    );
  });
}
