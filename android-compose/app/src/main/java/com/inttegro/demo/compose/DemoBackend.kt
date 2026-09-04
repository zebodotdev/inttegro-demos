package com.inttegro.demo.compose

import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

internal class DemoBackend(private val baseUrl: String) {
    suspend fun createCheckoutOrder(attemptId: String): String = withContext(Dispatchers.IO) {
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
            orderId
        } finally {
            connection.disconnect()
        }
    }
}
