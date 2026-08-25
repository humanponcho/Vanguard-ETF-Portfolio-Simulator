import Foundation

extension Asset {

    /// The default roster: generic instruments, no fund provider named.
    ///
    /// The numbers are recorded and argued in `docs/swift-port/SPEC.md`.
    /// Two deliberately differ from the web version:
    ///
    /// - Gold's 10% expected return was an artefact of measuring from 1971,
    ///   the year the gold standard ended — a one-off repricing that cannot
    ///   recur. 30% volatility was likewise high; realised annual volatility
    ///   sits nearer 16%.
    /// - Equity at 9% is the optimistic end of the range. Long-run US nominal
    ///   returns support it; forward-looking estimates from current valuations
    ///   do not. 7.5% is a defensible middle.
    public static let defaultCatalogue: [Asset] = [
        Asset(
            id: "equity.us.largecap",
            name: "US Large-Cap Equity ETF",
            shortName: "US Equity",
            kind: .equity,
            expectedReturn: 0.075,
            volatility: 0.18,
            ongoingCost: 0.0007,
            entryCost: 0.0010,
            paysIncome: false
        ),
        Asset(
            id: "bond.corporate",
            name: "USD Corporate Bond ETF",
            shortName: "Corp Bonds",
            kind: .corporateBond,
            expectedReturn: 0.06,
            volatility: 0.08,
            ongoingCost: 0.0010,
            entryCost: 0.0010,
            paysIncome: true
        ),
        Asset(
            id: "bond.government",
            name: "USD Government Bond ETF",
            shortName: "Govt Bonds",
            kind: .governmentBond,
            expectedReturn: 0.05,
            volatility: 0.07,
            ongoingCost: 0.0009,
            entryCost: 0.0010,
            paysIncome: true
        ),
        Asset(
            id: "commodity.gold.physical",
            name: "Physical Gold",
            shortName: "Gold",
            kind: .commodity,
            expectedReturn: 0.05,
            volatility: 0.16,
            // Vaulted storage and insurance, per annum.
            ongoingCost: 0.0060,
            // Dealer spread over spot on purchase, and under spot on sale.
            // These are the costs the web model has no way to express.
            entryCost: 0.0200,
            exitCost: 0.0100,
            paysIncome: false,
            // Assumes Britannias or Sovereigns: legal tender, so CGT-exempt.
            // Set false for bars or foreign coins.
            isCGTExempt: true
        ),
        Asset(
            id: "cash.gbp",
            name: "Cash",
            shortName: "Cash",
            kind: .cash,
            expectedReturn: 0.02,
            volatility: 0.01,
            ongoingCost: 0,
            paysIncome: false
        )
    ]
}
