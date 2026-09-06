package com.inttegro.demo.compose

import com.inttegro.payments.PaymentSheetAdapter
import com.inttegro.payments.PaymentSheetConfiguration
import com.inttegro.payments.PaymentSheetConfirmationChallenge
import com.inttegro.payments.PaymentSheetPaymentOutcome
import com.inttegro.payments.PaymentSheetPaymentSelection
import com.inttegro.payments.PaymentSheetSession
import java.time.Instant

/** Deterministic, non-networked checkout data used only for documentation capture builds. */
object DemoPaymentSheetAdapter : PaymentSheetAdapter {
    override suspend fun retrieve(
        configuration: PaymentSheetConfiguration,
    ): PaymentSheetSession = PaymentSheetSession(
        id = "or_android_documentation",
        merchant = PaymentSheetSession.Merchant(displayName = "Kora Market"),
        amount = PaymentSheetSession.Money(value = 5_000, currency = "GHS"),
        paymentMethods = listOf(
            PaymentSheetSession.PaymentMethod(
                id = "pm_demo_mtn",
                kind = PaymentSheetSession.PaymentMethod.Kind.MOBILE_MONEY,
                source = PaymentSheetSession.PaymentMethod.Source.SAVED,
                label = "MTN Mobile Money",
                detail = "••• ••• 0042",
            ),
            PaymentSheetSession.PaymentMethod(
                id = "new_mobile_money",
                kind = PaymentSheetSession.PaymentMethod.Kind.MOBILE_MONEY,
                source = PaymentSheetSession.PaymentMethod.Source.NEW,
                label = "Use another Mobile Money account",
            ),
        ),
        expiresAt = Instant.now().plusSeconds(60 * 60),
    )

    override suspend fun pay(
        configuration: PaymentSheetConfiguration,
        session: PaymentSheetSession,
        selection: PaymentSheetPaymentSelection,
    ): PaymentSheetPaymentOutcome =
        PaymentSheetPaymentOutcome.Completed("pay_android_documentation")

    override suspend fun requestConfirmation(
        configuration: PaymentSheetConfiguration,
        session: PaymentSheetSession,
        challenge: PaymentSheetConfirmationChallenge,
    ): PaymentSheetPaymentOutcome =
        PaymentSheetPaymentOutcome.Completed("pay_android_documentation")

    override suspend fun confirmPayment(
        configuration: PaymentSheetConfiguration,
        session: PaymentSheetSession,
        challenge: PaymentSheetConfirmationChallenge,
        token: String,
    ): PaymentSheetPaymentOutcome =
        PaymentSheetPaymentOutcome.Completed("pay_android_documentation")

    override suspend fun refreshPayment(
        configuration: PaymentSheetConfiguration,
        session: PaymentSheetSession,
    ): PaymentSheetPaymentOutcome =
        PaymentSheetPaymentOutcome.Completed("pay_android_documentation")
}
