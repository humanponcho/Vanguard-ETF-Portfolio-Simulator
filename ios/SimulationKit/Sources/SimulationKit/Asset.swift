import Foundation

/// A single investable instrument and the assumptions attached to it.
///
/// Every figure here is a forward-looking *assumption*, not a measurement.
/// They are arguable, and they are meant to be argued with — which is why they
/// live in one catalogue (`Asset.defaultCatalogue`) rather than being scattered
/// through the code the way the web version scatters them.
///
/// Cost is split three ways because the instruments genuinely differ:
///
/// - ``ongoingCost`` is annual drag: an ETF expense ratio, or vaulted gold's
///   storage and insurance.
/// - ``entryCost`` is a one-off charge on purchase: broker commission on an
///   ETF, or a dealer's spread over spot on a gold coin.
/// - ``exitCost`` is a one-off charge on sale.
///
/// The web version has only the annual field, which is why the 0.50% buy fee
/// printed next to the DigiGold slider is never actually applied to anything.
public struct Asset: Identifiable, Codable, Hashable, Sendable {

    /// Broad instrument class. Drives the risk profile and the chart series
    /// slot, so it is data rather than a string comparison on the name.
    public enum Kind: String, Codable, Hashable, Sendable, CaseIterable {
        case equity
        case corporateBond
        case governmentBond
        case commodity
        case cash
    }

    public let id: String
    public let name: String
    /// Short label for chart legends and narrow layouts, where the full name
    /// will not fit on a phone.
    public let shortName: String
    public let kind: Kind

    /// Nominal expected annual return, gross of all costs.
    public let expectedReturn: Double
    /// Annualised standard deviation of returns.
    public let volatility: Double

    /// Annual cost drag: expense ratio, or storage and insurance.
    public let ongoingCost: Double
    /// One-off cost on purchase, as a fraction of the amount invested.
    public let entryCost: Double
    /// One-off cost on sale, as a fraction of the amount realised.
    public let exitCost: Double

    /// Distributing instruments pay income, so dividend withholding applies.
    /// Accumulating ETFs and physical gold do not.
    public let paysIncome: Bool

    /// UK: Britannia and Sovereign coins are legal tender and therefore exempt
    /// from Capital Gains Tax. Bars and foreign coins are not.
    public let isCGTExempt: Bool

    public init(
        id: String,
        name: String,
        shortName: String,
        kind: Kind,
        expectedReturn: Double,
        volatility: Double,
        ongoingCost: Double,
        entryCost: Double = 0,
        exitCost: Double = 0,
        paysIncome: Bool,
        isCGTExempt: Bool = false
    ) {
        self.id = id
        self.name = name
        self.shortName = shortName
        self.kind = kind
        self.expectedReturn = expectedReturn
        self.volatility = volatility
        self.ongoingCost = ongoingCost
        self.entryCost = entryCost
        self.exitCost = exitCost
        self.paysIncome = paysIncome
        self.isCGTExempt = isCGTExempt
    }
}

extension Asset {

    /// Expected return after this asset's own ongoing cost and, for
    /// distributing instruments, dividend withholding.
    ///
    /// The platform fee is deliberately *not* applied here: it is charged on
    /// the whole portfolio, not per holding, so it belongs one level up in
    /// ``Portfolio/expectedReturn(withholdingRate:platformFee:)``.
    ///
    /// - Note: Known simplification, carried over from the web version on
    ///   purpose so the golden-vector tests in Stage 05 can match it.
    ///   Withholding is applied to the asset's *total* return, when in reality
    ///   it applies only to the income component. For a bond fund yielding
    ///   most of its return as income the error is small; for an equity fund
    ///   it would not be. See the backlog issue on refining this.
    public func expectedReturnNet(ofWithholding withholdingRate: Double) -> Double {
        let gross = paysIncome
            ? expectedReturn * (1 - withholdingRate)
            : expectedReturn
        return gross - ongoingCost
    }
}
