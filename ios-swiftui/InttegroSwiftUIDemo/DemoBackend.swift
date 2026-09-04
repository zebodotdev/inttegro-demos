import Foundation

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
        var request = URLRequest(url: baseURL.appending(path: "mobile/orders"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
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
        return orderID
    }
}
