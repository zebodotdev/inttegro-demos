import 'package:flutter/material.dart';
import 'package:inttegro_flutter/inttegro_flutter.dart';

import 'demo_backend.dart';

void main() => runApp(const InttegroDemoApp());

class InttegroDemoApp extends StatelessWidget {
  const InttegroDemoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Inttegro Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff3956d8)),
        useMaterial3: true,
      ),
      home: const CheckoutScreen(),
    );
  }
}

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  static const _backendUrl = String.fromEnvironment(
    'INTTEGRO_DEMO_BACKEND_URL',
  );

  bool _busy = false;
  String _status = 'Ready for payment';

  Future<void> _checkout() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      if (_backendUrl.isEmpty) {
        throw StateError('Set INTTEGRO_DEMO_BACKEND_URL.');
      }
      final session = await DemoBackend(_backendUrl).createPaymentSession();
      await Inttegro.instance.initializePaymentSheet(
        PaymentSheetConfiguration(
          paymentSessionSecret: session.paymentSessionSecret,
          returnUrl: Uri.parse('inttegro-demo://payment-return'),
        ),
      );
      final result = await Inttegro.instance.presentPaymentSheet();
      _status = switch (result) {
        PaymentSheetCompleted() =>
          'Client flow completed; verify payment on the server.',
        PaymentSheetCanceled() => 'Payment canceled.',
        PaymentSheetFailed(:final code) => 'Payment unavailable ($code).',
      };
    } on Object catch (error) {
      _status = error is StateError
          ? error.message.toString()
          : 'Payment is temporarily unavailable.';
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Inttegro checkout')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'INTTEGRO SDK · FLUTTER',
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Integration workshop',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 20),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          const Expanded(child: Text('Total')),
                          Text(
                            'GHS 50.00',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Your backend creates a short-lived payment session. '
                    'The app never receives INTTEGRO_API_KEY.',
                  ),
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: _busy ? null : _checkout,
                    child: _busy
                        ? const SizedBox.square(
                            dimension: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Pay with Inttegro'),
                  ),
                  const SizedBox(height: 24),
                  Semantics(
                    liveRegion: true,
                    label: 'Latest payment result: $_status',
                    child: Card(
                      color: Theme.of(context).colorScheme.surfaceContainerHigh,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text(_status),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
