import Foundation

/// An amount of money in one asset.
///
/// `id` is derived from the asset rather than stored, so a holding cannot end
/// up with an identity that disagrees with the thing it holds.
public struct Holding: Identifiable, Codable, Hashable, Sendable {
    public let asset: Asset
    /// Amount in the portfolio's currency (GBP).
    public var amount: Double

    public var id: String { asset.id }

    public init(asset: Asset, amount: Double) {
        self.asset = asset
        self.amount = amount
    }
}
