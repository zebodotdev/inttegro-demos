import {
  initializePaymentSheet,
  presentPaymentSheet,
  type PaymentSheetResult,
} from '@inttegro/react-native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { createCheckoutOrder } from './src/demoBackend';

const finishes = [
  { name: 'Sunrise clay', color: '#b84831' },
  { name: 'Night earth', color: '#302a28' },
  { name: 'River sand', color: '#c2a77d' },
];

export default function App() {
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState('New in');
  const [favorite, setFavorite] = useState(false);
  const [finish, setFinish] = useState(finishes[0]!.name);
  const [status, setStatus] = useState<string | null>(null);

  async function checkout() {
    if (busy) return;
    setBusy(true);
    try {
      const order = await createCheckoutOrder();
      await initializePaymentSheet({
        orderId: order.orderId,
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
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.brandRow}><View style={styles.brandMark}><Text style={styles.brandLetter}>K</Text></View><Text style={styles.brand}>Kora Market</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Shopping bag, one item" accessibilityHint="Creates a finalized order and opens Inttegro" disabled={busy} onPress={checkout} hitSlop={12} style={({ pressed }) => [styles.iconButton, (pressed || busy) && styles.pressed]}><Text style={styles.iconText}>▢</Text><View style={styles.bagBadge}><Text style={styles.bagBadgeText}>1</Text></View></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {['New in', 'Table', 'Textiles', 'Objects'].map((item) => (
            <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: category === item }} onPress={() => setCategory(item)} style={({ pressed }) => [styles.category, category === item && styles.categorySelected, pressed && styles.pressed]}>
              <Text style={[styles.categoryText, category === item && styles.categoryTextSelected]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.hero}>
          <Image source={require('./assets/kora-dawn-brew.jpg')} resizeMode="cover" style={styles.heroImage} accessibilityLabel="Terracotta Dawn Brew Set with a pour-over and cup" />
          <View style={styles.smallBatch}><Text style={styles.smallBatchText}>Small batch</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'} onPress={() => setFavorite(!favorite)} style={({ pressed }) => [styles.favorite, pressed && styles.pressed]}><Text style={[styles.favoriteText, favorite && styles.favoriteActive]}>{favorite ? '♥' : '♡'}</Text></Pressable>
        </View>

        <View style={styles.details}>
          <View style={styles.titleRow}><Text style={styles.title}>Dawn Brew Set</Text><Text style={styles.amount}>GHS 50</Text></View>
          <View style={styles.ratingRow}><Text style={styles.rating}>★ 4.9</Text><Text style={styles.muted}>240 reviews</Text><View style={styles.flex} /><Text style={styles.ready}>● Ready to ship</Text></View>
          <Text style={styles.description}>A sculptural pour-over and cup, shaped by hand in Ho for slower mornings and more considered rituals.</Text>

          <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Finish</Text><Text style={styles.muted}>{finish}</Text></View>
          <View style={styles.swatchRow}>{finishes.map((item) => (
            <Pressable key={item.name} accessibilityRole="button" accessibilityLabel={item.name} accessibilityState={{ selected: finish === item.name }} onPress={() => setFinish(item.name)} style={[styles.swatchOuter, finish === item.name && styles.swatchSelected]}>
              <View style={[styles.swatch, { backgroundColor: item.color }]} />
            </Pressable>
          ))}</View>

          <View style={styles.makerCard}><Text style={styles.makerTitle}>Made by Ama Ofori</Text><Text style={styles.makerCopy}>Every piece keeps the subtle marks of its making. Local clay is fired to a food-safe finish and packed without plastic.</Text><View style={styles.divider} /><Text style={styles.delivery}>▰  Delivery across Ghana in 2–4 days</Text></View>

          {status ? <View style={styles.status} accessible accessibilityLiveRegion="polite"><Text style={styles.statusTitle}>Latest update</Text><Text style={styles.statusCopy}>{status}</Text></View> : null}
        </View>
      </ScrollView>

      <View style={styles.checkoutBar}>
        <View><Text style={styles.totalLabel}>Total</Text><Text style={styles.total}>GHS 50.00</Text></View>
        <Pressable accessibilityRole="button" accessibilityHint="Creates a finalized order and opens Inttegro" disabled={busy} onPress={checkout} style={({ pressed }) => [styles.payButton, (pressed || busy) && styles.payPressed]}>
          {busy ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.payText}>Pay with Inttegro</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function describe(result: PaymentSheetResult): string {
  if (result.status === 'completed') return 'Payment submitted. We’ll verify it before fulfillment.';
  if (result.status === 'canceled') return 'Checkout paused. Your Dawn Brew Set is still in the bag.';
  return `Payment unavailable (${result.error.code}).`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f3e9' },
  header: { alignItems: 'center', flexDirection: 'row', height: 58, justifyContent: 'space-between', paddingHorizontal: 16 },
  iconButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  iconText: { color: '#183c32', fontSize: 20, fontWeight: '700' },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  brandMark: { alignItems: 'center', backgroundColor: '#183c32', borderRadius: 15, height: 30, justifyContent: 'center', width: 30 },
  brandLetter: { color: '#fffaf1', fontSize: 13, fontWeight: '800' },
  brand: { color: '#183c32', fontSize: 17, fontWeight: '800', letterSpacing: -.4 },
  bagBadge: { alignItems: 'center', backgroundColor: '#b84831', borderRadius: 8, height: 16, justifyContent: 'center', position: 'absolute', right: 2, top: 3, width: 16 },
  bagBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  content: { paddingBottom: 118 },
  categories: { gap: 8, paddingHorizontal: 18, paddingVertical: 12 },
  category: { backgroundColor: '#eee7dc', borderRadius: 22, justifyContent: 'center', minHeight: 40, paddingHorizontal: 16 },
  categorySelected: { backgroundColor: '#183c32' },
  categoryText: { color: '#46534e', fontSize: 13, fontWeight: '700' },
  categoryTextSelected: { color: '#fffaf1' },
  hero: { aspectRatio: 1.02, backgroundColor: '#d98c68', overflow: 'hidden', position: 'relative' },
  heroImage: { height: '100%', width: '100%' },
  smallBatch: { backgroundColor: 'rgba(255,250,241,.88)', borderRadius: 18, left: 16, paddingHorizontal: 13, paddingVertical: 9, position: 'absolute', top: 16 },
  smallBatchText: { color: '#183c32', fontSize: 12, fontWeight: '700' },
  favorite: { alignItems: 'center', backgroundColor: 'rgba(255,250,241,.9)', borderRadius: 24, height: 46, justifyContent: 'center', position: 'absolute', right: 14, top: 14, width: 46 },
  favoriteText: { color: '#183c32', fontSize: 27 },
  favoriteActive: { color: '#b84831' },
  pressed: { opacity: .72, transform: [{ scale: .97 }] },
  details: { gap: 0, padding: 20 },
  titleRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 14 },
  title: { color: '#183c32', flex: 1, fontSize: 32, fontWeight: '800', letterSpacing: -1.2, lineHeight: 34 },
  amount: { color: '#183c32', fontSize: 21, fontWeight: '800', letterSpacing: -.6 },
  ratingRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 12 },
  rating: { color: '#a65d16', fontSize: 13, fontWeight: '700' },
  muted: { color: '#69736d', fontSize: 13 },
  flex: { flex: 1 },
  ready: { color: '#26855b', fontSize: 12, fontWeight: '700' },
  description: { color: '#59665f', fontSize: 17, lineHeight: 26, marginTop: 24 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 },
  sectionTitle: { color: '#183c32', fontSize: 16, fontWeight: '800' },
  swatchRow: { flexDirection: 'row', gap: 11, marginTop: 12 },
  swatchOuter: { alignItems: 'center', borderColor: 'transparent', borderRadius: 23, borderWidth: 2, height: 46, justifyContent: 'center', width: 46 },
  swatchSelected: { borderColor: '#183c32' },
  swatch: { borderColor: '#fffaf1', borderRadius: 18, borderWidth: 3, height: 36, width: 36 },
  makerCard: { backgroundColor: '#efe7da', borderRadius: 22, marginTop: 30, padding: 20 },
  makerTitle: { color: '#183c32', fontSize: 17, fontWeight: '800' },
  makerCopy: { color: '#59665f', fontSize: 15, lineHeight: 22, marginTop: 9 },
  divider: { backgroundColor: 'rgba(24,60,50,.12)', height: 1, marginVertical: 16 },
  delivery: { color: '#183c32', fontSize: 14, fontWeight: '700' },
  status: { backgroundColor: '#dcece6', borderRadius: 18, marginTop: 18, padding: 16 },
  statusTitle: { color: '#183c32', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  statusCopy: { color: '#36584d', fontSize: 14, lineHeight: 20, marginTop: 5 },
  checkoutBar: { alignItems: 'center', backgroundColor: 'rgba(255,251,243,.97)', borderTopColor: 'rgba(24,60,50,.1)', borderTopWidth: 1, bottom: 0, flexDirection: 'row', gap: 18, left: 0, paddingHorizontal: 20, paddingVertical: 12, position: 'absolute', right: 0 },
  totalLabel: { color: '#69736d', fontSize: 11 },
  total: { color: '#183c32', fontSize: 17, fontWeight: '800' },
  payButton: { alignItems: 'center', backgroundColor: '#183c32', borderRadius: 28, flex: 1, justifyContent: 'center', minHeight: 54 },
  payPressed: { opacity: .8, transform: [{ scale: .98 }] },
  payText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
