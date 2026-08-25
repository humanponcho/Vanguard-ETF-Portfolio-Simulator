import Testing
import Foundation
@testable import SimulationKit

/// Doubles are compared with a tolerance, never with `==`. Nine significant
/// figures is far tighter than anything here needs and far looser than the
/// last-bit differences that make float equality flaky.
private func isClose(_ a: Double, _ b: Double, tolerance: Double = 1e-12) -> Bool {
    abs(a - b) <= tolerance
}

@Suite("Portfolio composition")
struct PortfolioCompositionTests {

    @Test("total is the sum of every holding")
    func totalSumsHoldings() {
        #expect(isClose(Portfolio.starter.total, 33_000))
    }

    @Test("weights sum to one")
    func weightsSumToOne() {
        let portfolio = Portfolio.starter
        let sum = portfolio.holdings.reduce(0.0) { $0 + portfolio.weight(of: $1) }
        #expect(isClose(sum, 1.0, tolerance: 1e-9))
    }

    @Test("an empty portfolio never divides by zero")
    func emptyPortfolioIsSafe() {
        // The web version guards this case with a string comparison buried in
        // the render path. Here it is a property, and every derived figure has
        // to answer for itself.
        var portfolio = Portfolio.starter
        for index in portfolio.holdings.indices {
            portfolio.holdings[index].amount = 0
        }

        #expect(portfolio.isEmpty)
        #expect(isClose(portfolio.total, 0))
        #expect(isClose(portfolio.naiveVolatility, 0))
        #expect(isClose(portfolio.weightedAverageVolatility, 0))
        #expect(isClose(portfolio.blendedEntryCost, 0))
        #expect(isClose(portfolio.cgtExemptWeight, 0))
        #expect(isClose(
            portfolio.expectedReturn(withholdingRate: 0.15, platformFee: 0.0025),
            0
        ))
        #expect(portfolio.riskProfile == .conservative)
    }

    @Test("a portfolio with no holdings at all is also safe")
    func noHoldingsIsSafe() {
        let portfolio = Portfolio(holdings: [])
        #expect(portfolio.isEmpty)
        #expect(isClose(portfolio.total, 0))
        #expect(isClose(portfolio.naiveVolatility, 0))
    }

    @Test("survives a Codable round trip")
    func codableRoundTrip() throws {
        let data = try JSONEncoder().encode(Portfolio.starter)
        let restored = try JSONDecoder().decode(Portfolio.self, from: data)
        #expect(restored == Portfolio.starter)
    }
}

@Suite("Volatility")
struct VolatilityTests {

    private func single(volatility: Double) -> Portfolio {
        Portfolio(holdings: [
            Holding(
                asset: Asset(
                    id: "test",
                    name: "Test",
                    shortName: "Test",
                    kind: .equity,
                    expectedReturn: 0.05,
                    volatility: volatility,
                    ongoingCost: 0,
                    paysIncome: false
                ),
                amount: 1_000
            )
        ])
    }

    @Test("a single-asset portfolio has exactly that asset's volatility")
    func singleAssetVolatility() {
        #expect(isClose(single(volatility: 0.18).naiveVolatility, 0.18, tolerance: 1e-15))
    }

    @Test("an equal split of two equally volatile assets gives v over root two")
    func equalSplitVolatility() {
        // sqrt((0.5v)^2 + (0.5v)^2) == v / sqrt(2). Provable by hand, which is
        // what makes it worth asserting.
        let v = 0.20
        let portfolio = Portfolio(holdings: [
            Holding(asset: single(volatility: v).holdings[0].asset, amount: 500),
            Holding(
                asset: Asset(
                    id: "test.two",
                    name: "Test Two",
                    shortName: "Two",
                    kind: .commodity,
                    expectedReturn: 0.05,
                    volatility: v,
                    ongoingCost: 0,
                    paysIncome: false
                ),
                amount: 500
            )
        ])
        #expect(isClose(portfolio.naiveVolatility, v / 2.0.squareRoot(), tolerance: 1e-15))
    }

    @Test("diversification never makes the blend riskier than the average")
    func diversificationBound() {
        // sqrt(sum of squares) <= sum, by the triangle inequality. If this
        // ever fails, the formula has been mistyped.
        let portfolio = Portfolio.starter
        #expect(portfolio.naiveVolatility <= portfolio.weightedAverageVolatility)
        #expect(portfolio.naiveVolatility > 0)
    }
}

@Suite("Expected return")
struct ExpectedReturnTests {

    @Test("withholding only touches distributing assets")
    func withholdingAppliesToIncomeAssetsOnly() {
        let equity = Asset.defaultCatalogue[0]      // accumulating
        let corporate = Asset.defaultCatalogue[1]   // distributing

        #expect(!equity.paysIncome)
        #expect(corporate.paysIncome)

        let noTax = equity.expectedReturnNet(ofWithholding: 0)
        let taxed = equity.expectedReturnNet(ofWithholding: 0.15)
        #expect(isClose(noTax, taxed))

        let corpNoTax = corporate.expectedReturnNet(ofWithholding: 0)
        let corpTaxed = corporate.expectedReturnNet(ofWithholding: 0.15)
        #expect(corpTaxed < corpNoTax)
        // 6.0% gross, 15% withheld, less the 0.10% expense ratio.
        #expect(isClose(corpTaxed, 0.06 * 0.85 - 0.0010, tolerance: 1e-15))
    }

    @Test("the platform fee comes off the blend, not each holding")
    func platformFeeIsCharacterisedOnce() {
        let portfolio = Portfolio.starter
        let withoutFee = portfolio.expectedReturn(withholdingRate: 0.15, platformFee: 0)
        let withFee = portfolio.expectedReturn(withholdingRate: 0.15, platformFee: 0.0025)
        #expect(isClose(withoutFee - withFee, 0.0025, tolerance: 1e-15))
    }
}

@Suite("Risk profile")
struct RiskProfileTests {

    private func portfolio(equityWeight: Double) -> Portfolio {
        Portfolio(holdings: [
            Holding(asset: Asset.defaultCatalogue[0], amount: equityWeight * 100),
            Holding(asset: Asset.defaultCatalogue[4], amount: (1 - equityWeight) * 100)
        ])
    }

    @Test(
        "equity exposure sets the label",
        arguments: [
            (0.80, Portfolio.RiskProfile.aggressive),
            (0.70, Portfolio.RiskProfile.aggressive),
            (0.60, Portfolio.RiskProfile.moderate),
            (0.50, Portfolio.RiskProfile.moderate),
            (0.40, Portfolio.RiskProfile.conservative),
            (0.00, Portfolio.RiskProfile.conservative)
        ]
    )
    func thresholds(equityWeight: Double, expected: Portfolio.RiskProfile) {
        #expect(portfolio(equityWeight: equityWeight).riskProfile == expected)
    }
}

@Suite("Costs")
struct CostTests {

    @Test("gold's dealer spread shows up in the blended entry cost")
    func goldSpreadIsModelled() {
        // The web version prints "Buy 0.50%" next to the DigiGold slider and
        // then never applies it. This asserts the port actually does.
        let gold = Asset.defaultCatalogue[3]
        #expect(gold.entryCost > 0)
        #expect(gold.exitCost > 0)

        let allGold = Portfolio(holdings: [Holding(asset: gold, amount: 1_000)])
        #expect(isClose(allGold.blendedEntryCost, gold.entryCost, tolerance: 1e-15))
        #expect(isClose(allGold.blendedExitCost, gold.exitCost, tolerance: 1e-15))
    }

    @Test("CGT-exempt weight tracks the gold sleeve")
    func cgtExemptWeightTracksGold() {
        let portfolio = Portfolio.starter
        let gold = portfolio.holdings.first { $0.asset.id == "commodity.gold.physical" }
        let goldWeight = gold.map { portfolio.weight(of: $0) } ?? 0
        #expect(isClose(portfolio.cgtExemptWeight, goldWeight, tolerance: 1e-15))
        #expect(goldWeight > 0)
    }
}
