import Inttegro
import SwiftUI

struct CheckoutView: View {
    @State private var configuration: PaymentSheetConfiguration?
    @State private var isPaymentSheetPresented = false
    @State private var outcome = "Ready for payment"

    var body: some View {
        NavigationStack {
            Form {
                Section("Order") {
                    LabeledContent("Product", value: "Integration workshop")
                    LabeledContent("Total", value: "GHS 50.00")
                        .fontWeight(.semibold)
                }

                Section("Integration boundary") {
                    Label(
                        "The app receives one short-lived payment-session secret from its backend.",
                        systemImage: "lock.shield"
                    )
                    Text("Never put INTTEGRO_API_KEY in an iOS app.")
                        .foregroundStyle(.secondary)
                }

                Section {
                    Button("Preview Inttegro payment sheet") {
                        configuration = try? PaymentSheetConfiguration(
                            paymentSessionSecret: "ps_demo_swiftui",
                            returnURL: URL(string: "inttegro-demo://payment-return")
                        )
                        isPaymentSheetPresented = configuration != nil
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .frame(maxWidth: .infinity)
                    .accessibilityHint("Opens the Inttegro SDK payment sheet")
                } footer: {
                    Text("Preview data is used until Inttegro's public mobile payment-session API is available.")
                }

                Section("Latest result") {
                    Text(outcome)
                        .accessibilityLabel("Latest payment result: \(outcome)")
                }
            }
            .navigationTitle("Inttegro checkout")
            .sheet(isPresented: $isPaymentSheetPresented) {
                if let configuration {
                    Group {
                    #if DEBUG
                        InttegroPaymentSheet(
                            configuration: configuration,
                            adapter: PreviewPaymentSheetAdapter(),
                            onCompletion: handle
                        )
                    #else
                        InttegroPaymentSheet(
                            configuration: configuration,
                            onCompletion: handle
                        )
                    #endif
                    }
                    .presentationDetents([.medium, .large])
                    .presentationDragIndicator(.visible)
                }
            }
        }
    }

    private func handle(_ result: PaymentSheetResult) {
        isPaymentSheetPresented = false
        switch result {
        case .completed:
            outcome = "Client flow completed; verify payment on the server."
        case .canceled:
            outcome = "Payment canceled."
        case let .failed(failure):
            outcome = "Payment unavailable (\(failure.code))."
        }
    }
}

#Preview {
    CheckoutView()
}
