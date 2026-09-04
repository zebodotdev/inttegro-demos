import {
  initializePaymentSheet,
  presentPaymentSheet,
  type PaymentSheetResult,
} from '@inttegro/react-native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { createPaymentSession } from './src/demoBackend';

export default function App() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready for payment');

  async function checkout() {
    if (busy) return;
    setBusy(true);
    try {
      const session = await createPaymentSession();
      await initializePaymentSheet({
        paymentSessionSecret: session.paymentSessionSecret,
        returnURL: 'inttegro-demo://payment-return',
      });
      setStatus(describe(await presentPaymentSheet()));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Payment is unavailable.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>INTTEGRO SDK · EXPO</Text>
        <Text style={styles.title}>Integration workshop</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Total</Text>
          <Text style={styles.amount}>GHS 50.00</Text>
        </View>
        <Text style={styles.copy}>
          Your backend creates a short-lived payment session. The app never
          receives INTTEGRO_API_KEY.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Creates a payment session and opens Inttegro"
          disabled={busy}
          onPress={checkout}
          style={({ pressed }) => [
            styles.button,
            (pressed || busy) && styles.buttonPressed,
          ]}
        >
          {busy ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Pay with Inttegro</Text>}
        </Pressable>
        <View style={styles.status} accessible accessibilityLiveRegion="polite">
          <Text style={styles.label}>Latest result</Text>
          <Text style={styles.copy}>{status}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function describe(result: PaymentSheetResult): string {
  if (result.status === 'completed') {
    return 'Client flow completed; verify payment on the server.';
  }
  if (result.status === 'canceled') return 'Payment canceled.';
  return `Payment unavailable (${result.error.code}).`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f4f5f9' },
  content: { flex: 1, justifyContent: 'center', gap: 20, padding: 24 },
  eyebrow: { color: '#536078', fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: '#111827', fontSize: 32, fontWeight: '700' },
  card: { alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 20, flexDirection: 'row', padding: 20 },
  label: { color: '#667085', flex: 1, fontSize: 14, fontWeight: '600' },
  amount: { color: '#111827', fontSize: 20, fontWeight: '700' },
  copy: { color: '#536078', fontSize: 16, lineHeight: 24 },
  button: { alignItems: 'center', backgroundColor: '#3956d8', borderRadius: 14, minHeight: 52, justifyContent: 'center', paddingHorizontal: 18 },
  buttonPressed: { opacity: 0.72 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  status: { backgroundColor: '#e9ecf7', borderRadius: 16, gap: 6, padding: 16 },
});
