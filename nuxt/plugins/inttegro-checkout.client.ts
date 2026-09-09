import {
  Checkout,
  type CheckoutEvent,
  type CheckoutExposed,
  type CheckoutProps,
} from '@inttegro/vue';
import { createApp, defineComponent, h } from 'vue';

type AdapterOptions = Pick<
  CheckoutProps,
  'appearance' | 'features' | 'locale' | 'orderId' | 'timeout' | 'title'
>;

declare global {
  interface Window {
    InttegroDemoCheckoutAdapter?: {
      packageName: '@inttegro/vue';
      mount(input: {
        target: HTMLElement;
        options: AdapterOptions;
        onEvent(event: CheckoutEvent): void;
      }): {
        ready: Promise<void>;
        destroy(): void;
        focus(): void;
      };
    };
  }
}

export default defineNuxtPlugin(() => {
  window.InttegroDemoCheckoutAdapter = {
    packageName: '@inttegro/vue',
    mount({ target, options, onEvent }) {
      let checkout: CheckoutExposed | undefined;
      let settled = false;
      let resolveReady!: () => void;
      let rejectReady!: (error: Error) => void;
      const ready = new Promise<void>((resolve, reject) => {
        resolveReady = resolve;
        rejectReady = reject;
      });
      const host = defineComponent({
        render: () =>
          h(Checkout, {
            ...options,
            ref: (instance: CheckoutExposed | null) => {
              checkout = instance ?? undefined;
            },
            onEvent: (event: CheckoutEvent) => {
              onEvent(event);
              if (event.type === 'ready' && !settled) {
                settled = true;
                resolveReady();
              }
            },
            onError: (error: unknown) => {
              if (settled) return;
              settled = true;
              rejectReady(
                error instanceof Error
                  ? error
                  : new Error('Checkout failed to load.'),
              );
            },
          }),
      });
      const app = createApp(host);
      app.mount(target);

      return {
        ready,
        destroy() {
          if (!settled) {
            settled = true;
            rejectReady(new Error('Checkout closed before it became ready.'));
          }
          app.unmount();
        },
        focus() {
          checkout?.focus();
        },
      };
    },
  };
});
