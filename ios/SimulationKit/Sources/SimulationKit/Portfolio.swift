import Foundation

/// A set of holdings, denominated in GBP.
///
/// Note what is *not* here: five named properties. The web version repeats
/// every asset five times in every function — weights, returns, volatilities,
/// expense ratios, summary markup — so adding a sixth asset means edits in
/// nine places. Modelled as a collection, it means editing one array.
public struct Portfolio: Codable, Hashable, Sendable {

    public var holdings: [Holding]

    public init(holdings: [Holding]) {
        self.holdings = holdings
    }

    /// The default roster with the web version's starting amounts.
    public static let starter = Portfolio(holdings: [
        Holding(asset: Asset.defaultCatalogue[0], amount: 15_000),
        Holding(asset: Asset.defaultCatalogue[1], amount: 6_000),
        Holding(asset: Asset.defaultCatalogue[2], amount: 5_000),
        Holding(asset: Asset.defaultCatalogue[3], amount: 2_000),
        Holding(asset: Asset.defaultCatalogue[4], amount: 5_000)
    ])
}

// MARK: - Composition

extension Portfolio {

    public var total: Double {
        holdings.reduce(0) { $0 + $1.amount }
    }

    /// True when there is nothing to simulate. The web version guards this
    /// with a string comparison against zero deep inside the render path;
    /// here it is a property of the portfolio, checked before any work starts.
    public var isEmpty: Bool {
        total <= 0
    }

    /// Fraction of the portfolio held in one holding, or 0 for an empty
    /// portfolio. Never divides by zero.
    public func weight(of holding: Holding) -> Double {
        let total = self.total
        guard total > 0 else { return 0 }
        return holding.amount / total
    }

    /// Combined weight of every holding of a given kind.
    public func weight(ofKind kind: Asset.Kind) -> Double {
        let total = self.total
        guard total > 0 else { return 0 }
        return holdings
            .filter { $0.asset.kind == kind }
            .reduce(0) { $0 + $1.amount } / total
    }
}

// MARK: - Risk and return

extension Portfolio {

    public enum RiskProfile: String, Codable, Sendable {
        case conservative
        case moderate
        case aggressive
    }

    /// Coarse label based on equity exposure, matching the web version's
    /// thresholds — but keyed on asset *kind* rather than on one hardcoded
    /// ticker, so it still means something when the roster changes.
    public var riskProfile: RiskProfile {
        let equity = weight(ofKind: .equity)
        if equity >= 0.7 { return .aggressive }
        if equity >= 0.5 { return .moderate }
        return .conservative
    }

    /// Blended expected annual return, net of each asset's ongoing cost,
    /// of withholding on distributing assets, and of the platform fee.
    public func expectedReturn(
        withholdingRate: Double,
        platformFee: Double
    ) -> Double {
        let total = self.total
        guard total > 0 else { return 0 }
        let blended = holdings.reduce(0.0) { sum, holding in
            let weight = holding.amount / total
            return sum + weight * holding.asset.expectedReturnNet(
                ofWithholding: withholdingRate
            )
        }
        return blended - platformFee
    }

    /// Blended volatility **assuming the assets are uncorrelated**.
    ///
    /// This is a faithful port of the web version's formula, and it is wrong.
    /// Equities and corporate bonds co-move, so this understates portfolio
    /// risk; gold is roughly uncorrelated with both, so it also understates
    /// gold's diversification benefit. Wrong in two directions at once.
    ///
    /// It exists so the Stage 05 golden-vector tests have something to match
    /// before Stage 06 replaces it with a correlation matrix. When that lands,
    /// this stays only as the baseline the new figure is compared against.
    public var naiveVolatility: Double {
        let total = self.total
        guard total > 0 else { return 0 }
        let sumOfSquares = holdings.reduce(0.0) { sum, holding in
            let contribution = (holding.amount / total) * holding.asset.volatility
            return sum + contribution * contribution
        }
        return sumOfSquares.squareRoot()
    }

    /// Weighted average volatility, ignoring diversification entirely.
    ///
    /// Never the right number to show a user — it is here as the upper bound
    /// that ``naiveVolatility`` must always sit below, which is the cheapest
    /// available check that the diversification maths is doing anything.
    public var weightedAverageVolatility: Double {
        let total = self.total
        guard total > 0 else { return 0 }
        return holdings.reduce(0.0) { sum, holding in
            sum + (holding.amount / total) * holding.asset.volatility
        }
    }
}

// MARK: - Costs

extension Portfolio {

    /// Weighted one-off cost of buying this allocation, as a fraction.
    /// Gold's dealer spread makes this materially non-zero, which is the
    /// whole reason the field exists.
    public var blendedEntryCost: Double {
        let total = self.total
        guard total > 0 else { return 0 }
        return holdings.reduce(0.0) { sum, holding in
            sum + (holding.amount / total) * holding.asset.entryCost
        }
    }

    /// Weighted one-off cost of liquidating this allocation, as a fraction.
    public var blendedExitCost: Double {
        let total = self.total
        guard total > 0 else { return 0 }
        return holdings.reduce(0.0) { sum, holding in
            sum + (holding.amount / total) * holding.asset.exitCost
        }
    }

    /// Fraction of the portfolio exempt from Capital Gains Tax — currently
    /// gold held as Britannias or Sovereigns.
    public var cgtExemptWeight: Double {
        let total = self.total
        guard total > 0 else { return 0 }
        return holdings
            .filter { $0.asset.isCGTExempt }
            .reduce(0) { $0 + $1.amount } / total
    }
}
