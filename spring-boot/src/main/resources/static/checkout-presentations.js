import { loadInttegro } from "./inttegro-loader.js";

/**
 * Inttegro Checkout presentation demo
 *
 * This browser module progressively enhances every server-rendered demo form.
 * The form still works without JavaScript: the server responds with the
 * Inttegro Pages URL and the browser follows a 303 redirect. For embedded and
 * modal Checkout, this module asks the same endpoint for JSON, receives only
 * the finalized Order ID, and mounts Inttegro Checkout on the merchant page.
 *
 * INTTEGRO:SECURITY [client-order-reference] The API key, price, line items, customer authority, and
 * finalization stay on the server. Treat the returned Order ID as a payment
 * capability: do not place it in analytics, logs, or a URL.
 *
 * INTTEGRO:DECISION [checkout-presentation] The payer chooses the presentation,
 * while every option pays the same server-finalized Order.
 *
 * INTTEGRO:DECISION [hosted-runtime-loader] This module imports the
 * reproducible browser bundle built from `@inttegro/js`. The public loader
 * downloads the executable runtime only from Inttegro's fixed origin. Never
 * download, bundle, mirror, proxy, or self-host that private runtime.
 *
 * INTTEGRO:DOCS https://studio.inttegro.com/web/javascript
 * INTTEGRO:DOCS https://studio.inttegro.com/accept-payment-with-inttegro-checkout
 */
(function enhanceCheckoutPresentations() {
  const formSelector = "[data-checkout-form], [data-contribution-form]";
  const sessions = new WeakMap();

  const presentations = {
    embedded: {
      label: "Embedded",
      description: "Pay here while the order stays in view.",
      icon: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="13" rx="2"/><path d="M6 7h8M6 10h5M6 13h3"/></svg>',
    },
    modal: {
      label: "Modal",
      description: "Open a focused payment window above this page.",
      icon: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="13" rx="2"/><rect x="5.5" y="6.5" width="9" height="7" rx="1.5"/></svg>',
    },
    hosted: {
      label: "Hosted page",
      description: "Continue to the full Inttegro Pages experience.",
      icon: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 4H4.5a2 2 0 0 0-2 2v9.5a2 2 0 0 0 2 2H14a2 2 0 0 0 2-2V12"/><path d="M11 2.5h6.5V9M17 3l-8 8"/></svg>',
    },
  };

  function presentationPicker() {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "checkout-presentation-picker";
    fieldset.innerHTML = `
      <legend>Checkout experience</legend>
      <div class="checkout-presentation-options">
        ${Object.entries(presentations)
          .map(
            ([value, option]) => `
              <label>
                <input type="radio" name="checkout_mode" value="${value}"${value === "embedded" ? " checked" : ""}>
                <span>${option.icon}<strong>${option.label}</strong></span>
              </label>`,
          )
          .join("")}
      </div>
      <p class="checkout-presentation-description" data-checkout-presentation-description>
        ${presentations.embedded.description}
      </p>`;
    return fieldset;
  }

  function feedbackRegion(form) {
    let feedback = form.querySelector("[data-checkout-feedback]");
    if (feedback) return feedback;
    feedback = document.createElement("p");
    feedback.className = "checkout-presentation-feedback";
    feedback.dataset.checkoutFeedback = "";
    feedback.setAttribute("aria-live", "polite");
    feedback.hidden = true;
    form.append(feedback);
    return feedback;
  }

  function setFeedback(form, message, kind = "status") {
    const feedback = feedbackRegion(form);
    feedback.textContent = message;
    feedback.dataset.kind = kind;
    feedback.hidden = !message;
  }

  function setFormBusy(form, busy, message) {
    const button = form.querySelector('button[type="submit"]');
    if (button instanceof HTMLButtonElement) {
      button.disabled = busy;
      button.setAttribute("aria-busy", String(busy));
      const candidate = button.querySelector("span");
      const label =
        candidate && candidate.textContent?.trim() !== "→" ? candidate : button;
      if (busy) {
        label.dataset.checkoutOriginalContent = label.innerHTML;
      }
      if (busy) label.textContent = message;
      else if (label.dataset.checkoutOriginalContent) {
        label.innerHTML = label.dataset.checkoutOriginalContent;
      }
    }
    for (const input of form.querySelectorAll(
      '.checkout-presentation-picker input[type="radio"]',
    )) {
      input.disabled = busy;
    }
  }

  function updatePresentationDescription(form) {
    const mode = new FormData(form).get("checkout_mode");
    const description = form.querySelector(
      "[data-checkout-presentation-description]",
    );
    if (description && typeof mode === "string" && presentations[mode]) {
      description.textContent = presentations[mode].description;
    }
  }

  function inlineSurface(form) {
    let surface = form.parentElement?.querySelector(
      ":scope > [data-inttegro-inline-surface]",
    );
    if (surface) return surface;
    surface = document.createElement("section");
    surface.className = "inttegro-checkout-surface inttegro-checkout-inline";
    surface.dataset.inttegroInlineSurface = "";
    surface.hidden = true;
    surface.innerHTML = `
      <header class="inttegro-checkout-surface-header">
        <span class="inttegro-checkout-kicker">Secure payment</span>
        <h3>Complete your payment here</h3>
        <p>Your order remains with this app. Payment details stay inside Inttegro Checkout.</p>
      </header>
      <div data-inttegro-checkout-target></div>
      <p class="checkout-presentation-feedback" data-checkout-surface-feedback aria-live="polite"></p>`;
    form.insertAdjacentElement("afterend", surface);
    return surface;
  }

  function modalSurface() {
    let dialog = document.querySelector("[data-inttegro-checkout-dialog]");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.className = "inttegro-checkout-dialog";
    dialog.dataset.inttegroCheckoutDialog = "";
    dialog.setAttribute("aria-labelledby", "inttegro-checkout-dialog-title");
    dialog.innerHTML = `
      <div class="inttegro-checkout-dialog-frame">
        <header class="inttegro-checkout-dialog-header">
          <div><span class="inttegro-checkout-kicker">Secure payment</span><h2 id="inttegro-checkout-dialog-title">Complete your order</h2></div>
          <button type="button" aria-label="Close payment window" data-inttegro-dialog-close>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg>
          </button>
        </header>
        <div class="inttegro-checkout-dialog-scroll">
          <div data-inttegro-checkout-target></div>
          <p class="checkout-presentation-feedback" data-checkout-surface-feedback aria-live="polite"></p>
        </div>
      </div>`;
    document.body.append(dialog);
    dialog
      .querySelector("[data-inttegro-dialog-close]")
      ?.addEventListener("click", () => dialog.close());
    return dialog;
  }

  function closeOwningDialog(form) {
    const owner = form.closest("dialog[open]");
    if (owner instanceof HTMLDialogElement) {
      owner.close();
      return owner;
    }
    return null;
  }

  async function parseOrderResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("The demo server returned an unexpected response.");
    }
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(
        typeof payload.message === "string"
          ? payload.message
          : "Checkout could not be started.",
      );
    }
    if (
      typeof payload.orderId !== "string" ||
      payload.orderId.length < 8 ||
      payload.orderId.length > 200
    ) {
      throw new Error("The demo server did not return a checkout Order ID.");
    }
    return payload.orderId;
  }

  async function startEmbeddedCheckout(form, mode) {
    const previous = sessions.get(form);
    previous?.controller?.destroy();

    setFormBusy(
      form,
      true,
      mode === "modal" ? "Preparing payment window…" : "Preparing checkout…",
    );
    setFeedback(form, "Creating a finalized order securely on the server…");

    let surface;
    let dialog;
    let owningDialog;
    let controller;
    try {
      // Load the client before creating an Order so a missing or blocked
      // runtime does not leave behind a finalized Order the payer cannot open.
      const inttegro = await loadInttegro();
      const formBody = new URLSearchParams();
      for (const [name, value] of new FormData(form)) {
        if (typeof value === "string") formBody.append(name, value);
      }
      const response = await fetch(form.action, {
        method: "POST",
        body: formBody,
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const orderId = await parseOrderResponse(response);

      if (mode === "modal") {
        owningDialog = closeOwningDialog(form);
        dialog = modalSurface();
        surface = dialog;
        dialog.showModal();
      } else {
        surface = inlineSurface(form);
        form.hidden = true;
        surface.hidden = false;
        surface.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "nearest",
        });
      }

      const target = surface.querySelector("[data-inttegro-checkout-target]");
      const surfaceFeedback = surface.querySelector(
        "[data-checkout-surface-feedback]",
      );
      if (!(target instanceof HTMLElement)) {
        throw new Error("The demo could not prepare its Checkout container.");
      }

      controller = inttegro.createCheckout({
        orderId,
        appearance: { theme: "system" },
        features: {
          showLineItems:
            mode === "modal" &&
            form.dataset.checkoutShowLineItems !== "false",
          showInvoiceDownload: true,
          showReceiptDownload: true,
          allowPaymentMethodChange: true,
        },
        locale: document.documentElement.lang || "en-GH",
        title: mode === "modal" ? "Complete payment in a secure window" : "Complete payment securely",
      });
      sessions.set(form, { controller, dialog, surface });

      controller.on("completed", () => {
        if (surfaceFeedback) {
          surfaceFeedback.textContent = "Payment completed. Verifying the order…";
        }
        window.location.assign("/complete");
      });
      controller.on("canceled", () => {
        if (surfaceFeedback) {
          surfaceFeedback.textContent = "Payment was canceled. You can safely try again.";
          surfaceFeedback.dataset.kind = "error";
        }
      });
      controller.on("error", ({ error }) => {
        if (surfaceFeedback) {
          surfaceFeedback.textContent = error.message;
          surfaceFeedback.dataset.kind = "error";
        }
      });

      if (dialog) {
        dialog.addEventListener(
          "close",
          () => {
            controller.destroy();
            sessions.delete(form);
            setFormBusy(form, false, "");
            setFeedback(form, "Payment window closed. Your finalized order is ready if you want to try again.");
            if (owningDialog?.isConnected && !owningDialog.open) {
              owningDialog.showModal();
            }
          },
          { once: true },
        );
      }

      await controller.mount(target);
      setFeedback(form, "");
      if (surfaceFeedback) {
        surfaceFeedback.textContent = "Checkout is ready.";
        surfaceFeedback.dataset.kind = "status";
      }
      if (mode === "modal") controller.focus();
    } catch (error) {
      controller?.destroy();
      sessions.delete(form);
      if (dialog?.open) dialog.close();
      if (surface && mode === "embedded") surface.hidden = true;
      form.hidden = false;
      setFormBusy(form, false, "");
      setFeedback(
        form,
        error instanceof Error ? error.message : "Checkout could not be started.",
        "error",
      );
    }
  }

  function enhanceForms() {
    for (const form of document.querySelectorAll(formSelector)) {
      if (
        !(form instanceof HTMLFormElement) ||
        form.dataset.checkoutPresentationsEnhanced === "true"
      ) {
        continue;
      }
      form.dataset.checkoutPresentationsEnhanced = "true";
      const button = form.querySelector('button[type="submit"]');
      const picker = presentationPicker();
      if (button) form.insertBefore(picker, button);
      else form.append(picker);
      feedbackRegion(form);

      form.addEventListener("change", (event) => {
        const input = event.target;
        if (input instanceof HTMLInputElement && input.name === "checkout_mode") {
          updatePresentationDescription(form);
        }
      });

      form.addEventListener("submit", (event) => {
        const mode = String(new FormData(form).get("checkout_mode") || "hosted");
        if (mode === "hosted") {
          setFormBusy(form, true, "Opening Inttegro Pages…");
          return;
        }
        event.preventDefault();
        void startEmbeddedCheckout(form, mode === "modal" ? "modal" : "embedded");
      });

      window.addEventListener("pageshow", () => setFormBusy(form, false, ""));
    }
  }

  // Hydrating frameworks must own their server-rendered tree before this
  // progressive enhancement adds controls. Two animation frames after load
  // also keeps the selector from competing with the app's first paint.
  const scheduleEnhancement = () =>
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(enhanceForms),
    );
  if (document.readyState === "complete") scheduleEnhancement();
  else window.addEventListener("load", scheduleEnhancement, { once: true });
})();
