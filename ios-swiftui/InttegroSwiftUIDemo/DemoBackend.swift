import Foundation

/*
 Inttegro mobile integration boundary

 INTTEGRO:FLOW [mobile-backend-boundary] The app asks a trusted merchant backend
 to create and finalize an Order, then receives only the order ID required by
 the Inttegro SDK.
 INTTEGRO:SECURITY [server-api-key] INTTEGRO_API_KEY must never be compiled into
 an iOS application. Values in schemes, Info.plist, xcconfig files, or the app
 binary are recoverable by the device owner. The demo backend holds the key,
 customer, product, amount, and allowed payment methods.
 INTTEGRO:ALTERNATIVE [mobile-backend-boundary] An existing authenticated API
 gateway or backend-for-frontend can expose the same narrow operation; using the
 reference Next.js route is not required.
 INTTEGRO:DOCS https://studio.inttegro.com/orders
 INTTEGRO:DOCS https://studio.inttegro.com/keys
 See ../../INTEGRATION_GUIDE.md and ../../integration-decisions.json for the
 shared rationale and machine-readable alternatives.
 */

struct DemoBackend {
    enum Error: LocalizedError {
        case invalidConfiguration
        case unavailable
        case invalidResponse

        var errorDescription: String? {
            switch self {
            case .invalidConfiguration:
                "Set INTTEGRO_DEMO_BACKEND_URL to the demo backend origin."
            case .unavailable:
                "The demo backend could not create the checkout order."
            case .invalidResponse:
                "The demo backend returned an invalid checkout order."
            }
        }
    }

    private struct CheckoutOrder: Decodable {
        let orderId: String
    }

    private let baseURL: URL

    static func configured() throws -> Self {
        let rawValue = ProcessInfo.processInfo.environment["INTTEGRO_DEMO_BACKEND_URL"]?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard let rawValue,
              let url = URL(string: rawValue),
              ["http", "https"].contains(url.scheme?.lowercased()),
              url.host != nil else {
            throw Error.invalidConfiguration
        }
        return Self(baseURL: url)
    }

    func createCheckoutOrder(attemptID: UUID = UUID()) async throws -> String {
        // INTTEGRO:SECURITY [mobile-backend-boundary] This demo sends only an
        // opaque attempt ID. A production backend must authenticate the user,
        // authorize their cart, recalculate commercial data, rate-limit abuse,
        // and optionally verify platform attestation. Do not accept an arbitrary
        // customer ID, product, price, or currency from an untrusted app.
        var request = URLRequest(url: baseURL.appending(path: "mobile/orders"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            // INTTEGRO:DECISION [stable-idempotency-key] One attempt ID represents
            // one logical checkout and must be reused for its network retries.
            // In production, persist it with the authenticated cart.
            // https://studio.inttegro.com/idempotency
            "attemptId": attemptID.uuidString.lowercased(),
        ])

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw Error.unavailable
        }
        guard let httpResponse = response as? HTTPURLResponse,
              (200 ..< 300).contains(httpResponse.statusCode) else {
            throw Error.unavailable
        }
        guard let order = try? JSONDecoder().decode(CheckoutOrder.self, from: data) else {
            throw Error.invalidResponse
        }
        let orderID = order.orderId.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !orderID.isEmpty else { throw Error.invalidResponse }
        // INTTEGRO:DECISION [mobile-backend-boundary] The response intentionally
        // exposes only orderId. Credentials and order construction stay behind
        // the merchant server's authorization boundary.
        return orderID
    }
}
