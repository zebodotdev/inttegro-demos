package com.inttegro.demo.compose

import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

/*
 * Inttegro mobile integration boundary
 *
 * INTTEGRO:FLOW [mobile-backend-boundary] The app asks a trusted merchant
 * backend to create and finalize an Order, then receives only the order ID that
 * the Inttegro SDK needs.
 * INTTEGRO:SECURITY [server-api-key] INTTEGRO_API_KEY must never enter Gradle
 * BuildConfig, resources, source, or the APK/AAB. Mobile configuration is not a
 * secret store. Product, price, customer, and payment policy stay server-side.
 * INTTEGRO:ALTERNATIVE [mobile-backend-boundary] An existing authenticated API
 * gateway or backend-for-frontend can expose this operation; the reference
 * Next.js endpoint is only one implementation.
 * INTTEGRO:DOCS https://studio.inttegro.com/orders
 * INTTEGRO:DOCS https://studio.inttegro.com/keys
 * See the repository INTEGRATION_GUIDE.md and integration-decisions.json for the shared
 * rationale and machine-readable alternatives.
 */

internal class DemoBackend(private val baseUrl: String) {
    suspend fun createCheckoutOrder(attemptId: String): String = withContext(Dispatchers.IO) {
        // INTTEGRO:SECURITY [mobile-backend-boundary] This demo sends only an
        // opaque attempt ID. Production must authenticate the caller, authorize
        // the cart, recalculate totals, apply rate limits, and consider Play
        // Integrity. Never trust client-selected customer, product, or price.
        val base = runCatching { URL(baseUrl) }.getOrNull()
        require(
            base != null && base.host.isNotBlank() && base.protocol in setOf("http", "https"),
        ) { "Set INTTEGRO_DEMO_BACKEND_URL to the demo backend origin." }

        val connection = URL(base, "/mobile/orders").openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "POST"
            connection.connectTimeout = 10_000
            connection.readTimeout = 20_000
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")
            connection.outputStream.use { output ->
                output.write(
                    JSONObject().put("attemptId", attemptId).toString().toByteArray(Charsets.UTF_8),
                )
            }
            if (connection.responseCode !in 200..299) {
                throw IllegalStateException(
                    "The demo backend could not create the checkout order.",
                )
            }
            val body = connection.inputStream.bufferedReader().use { it.readText() }
            val orderId = runCatching { JSONObject(body).getString("orderId").trim() }
                .getOrDefault("")
            check(orderId.isNotEmpty()) {
                "The demo backend returned an invalid checkout order."
            }
            // INTTEGRO:DECISION [mobile-backend-boundary] Only orderId crosses
            // back into the app. Merchant credentials and commercial state stay
            // behind the backend authorization boundary.
            orderId
        } finally {
            connection.disconnect()
        }
    }
}
