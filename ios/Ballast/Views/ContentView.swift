import SwiftUI
import SimulationKit

/// Walking skeleton.
///
/// This exists to prove one thing on day one: the app target can see
/// `SimulationKit`, and the domain model computes. Stage 07 replaces it with
/// the real allocation screen — do not grow this file.
struct ContentView: View {
    private let portfolio = Portfolio.starter

    var body: some View {
        NavigationStack {
            List {
                Section("Holdings") {
                    ForEach(portfolio.holdings) { holding in
                        LabeledContent(holding.asset.name) {
                            Text(
                                holding.amount,
                                format: .currency(code: "GBP")
                                    .precision(.fractionLength(0))
                            )
                            .monospacedDigit()
                        }
                    }
                }

                Section("Derived") {
                    LabeledContent("Total") {
                        Text(
                            portfolio.total,
                            format: .currency(code: "GBP")
                                .precision(.fractionLength(0))
                        )
                        .monospacedDigit()
                    }
                    LabeledContent("Expected return") {
                        Text(
                            portfolio.expectedReturn(
                                withholdingRate: 0.15,
                                platformFee: 0.0025
                            ),
                            format: .percent.precision(.fractionLength(2))
                        )
                        .monospacedDigit()
                    }
                    LabeledContent("Volatility (naive)") {
                        Text(
                            portfolio.naiveVolatility,
                            format: .percent.precision(.fractionLength(2))
                        )
                        .monospacedDigit()
                    }
                    LabeledContent("Risk profile") {
                        Text(portfolio.riskProfile.rawValue.capitalized)
                    }
                }
            }
            .navigationTitle("Ballast")
        }
    }
}

#Preview {
    ContentView()
}
