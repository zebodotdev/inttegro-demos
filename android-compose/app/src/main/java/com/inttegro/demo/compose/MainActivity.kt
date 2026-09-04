package com.inttegro.demo.compose

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.inttegro.payments.InttegroPaymentSheet
import com.inttegro.payments.PaymentSheetAdapter
import com.inttegro.payments.PaymentSheetConfiguration
import com.inttegro.payments.PaymentSheetResult
import com.inttegro.payments.PaymentSheetSession
import java.time.Instant

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { InttegroDemoTheme { CheckoutScreen() } }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CheckoutScreen() {
    var showPaymentSheet by remember { mutableStateOf(false) }
    var outcome by remember { mutableStateOf("Ready for payment") }

    Scaffold(topBar = { TopAppBar(title = { Text("Inttegro checkout") }) }) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            Text("Integration workshop", style = MaterialTheme.typography.headlineSmall)
            Card {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(18.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Total", modifier = Modifier.weight(1f))
                    Text("GHS 50.00", fontWeight = FontWeight.SemiBold)
                }
            }
            Text(
                "The app receives one short-lived payment-session secret from its backend. " +
                    "Never put INTTEGRO_API_KEY in an Android app.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Button(
                onClick = { showPaymentSheet = true },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Preview Inttegro payment sheet")
            }
            Spacer(Modifier.size(2.dp))
            Text("Latest result", style = MaterialTheme.typography.labelLarge)
            Text(outcome)
            Text(
                "Preview data is used until Inttegro's public mobile payment-session API is available.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }

    if (showPaymentSheet) {
        InttegroPaymentSheet(
            configuration = PaymentSheetConfiguration(
                paymentSessionSecret = "ps_demo_compose",
                returnUrl = "inttegro-demo://payment-return",
            ),
            adapter = DemoPreviewAdapter,
            onDismissRequest = { showPaymentSheet = false },
            onResult = { result ->
                showPaymentSheet = false
                outcome = when (result) {
                    is PaymentSheetResult.Completed ->
                        "Client flow completed; verify payment on the server."
                    PaymentSheetResult.Canceled -> "Payment canceled."
                    is PaymentSheetResult.Failed ->
                        "Payment unavailable (${result.error.code})."
                }
            },
        )
    }
}

private object DemoPreviewAdapter : PaymentSheetAdapter {
    override suspend fun retrieve(configuration: PaymentSheetConfiguration) =
        PaymentSheetSession(
            id = "ps_demo_compose",
            merchant = PaymentSheetSession.Merchant(
                displayName = "Inttegro demo store",
                supportText = "Secure checkout powered by Inttegro",
            ),
            amount = PaymentSheetSession.Money(5_000, "GHS"),
            paymentMethods = listOf(
                PaymentSheetSession.PaymentMethod(
                    id = "mobile-money",
                    kind = PaymentSheetSession.PaymentMethod.Kind.MOBILE_MONEY,
                    label = "Mobile money",
                    detail = "Choose a provider after continuing",
                ),
                PaymentSheetSession.PaymentMethod(
                    id = "card",
                    kind = PaymentSheetSession.PaymentMethod.Kind.CARD,
                    label = "Card",
                    detail = "Visa, Mastercard, or Amex",
                ),
            ),
            expiresAt = Instant.now().plusSeconds(15 * 60),
        )

    override suspend fun confirm(
        configuration: PaymentSheetConfiguration,
        session: PaymentSheetSession,
        paymentMethod: PaymentSheetSession.PaymentMethod,
    ) = PaymentSheetResult.Completed("pay_demo")
}

@Preview(showBackground = true)
@Composable
private fun CheckoutPreview() {
    InttegroDemoTheme { CheckoutScreen() }
}

@Composable
private fun InttegroDemoTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (isSystemInDarkTheme()) darkColorScheme() else lightColorScheme(),
        content = content,
    )
}
