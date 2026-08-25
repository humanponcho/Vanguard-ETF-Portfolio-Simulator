// swift-tools-version: 6.0
import PackageDescription

// The engine is a package, not a folder in the app target, for three reasons:
// it compiles in seconds without a simulator, it can be unit-tested headlessly
// in CI, and the widget extension (Stage 15) imports the same code the app does.
//
// Language mode is pinned to v5 while the engine is being written. Stage 12
// flips it to .v6 and turns every data-race warning into an error — do that
// deliberately, as a piece of work, not by accident on some unrelated day.
let package = Package(
    name: "SimulationKit",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "SimulationKit", targets: ["SimulationKit"])
    ],
    targets: [
        .target(
            name: "SimulationKit",
            swiftSettings: [.swiftLanguageMode(.v5)]
        ),
        .testTarget(
            name: "SimulationKitTests",
            dependencies: ["SimulationKit"],
            swiftSettings: [.swiftLanguageMode(.v5)]
        )
    ]
)
