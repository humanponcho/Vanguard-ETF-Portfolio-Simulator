# Ballast — iOS

Native rewrite of the portfolio simulator. See
[`docs/swift-port/SPEC.md`](../docs/swift-port/SPEC.md) for the decisions and
[`docs/swift-port/DELIVERY-PLAN.md`](../docs/swift-port/DELIVERY-PLAN.md) for
the schedule.

```
ios/
├── SimulationKit/          Swift package — the engine. No UIKit, no SwiftUI.
│   ├── Sources/            Asset, Holding, Portfolio  (Stage 02 ✔)
│   └── Tests/              Swift Testing suites
├── Ballast/                App target sources
│   ├── BallastApp.swift
│   └── Views/
├── .swiftlint.yml
└── .swift-format
```

## First run — the engine only

The package needs no Xcode project and no simulator:

```bash
cd ios/SimulationKit
swift test
```

That is the whole of Stage 02 and it should be green before you build any UI.

## Creating the Xcode project

The `.xcodeproj` is **not** committed yet because it has to be generated on a
Mac — an Xcode project file hand-written on another platform is a project that
fails to open, which is a worse first evening than five minutes of clicking.
Do this once, then commit it:

1. **Xcode → File → New → Project → iOS → App.**
   - Product Name: `Ballast`
   - Team: your personal team (free Apple ID is fine until Stage 16)
   - Organisation Identifier: `com.humanponcho` — change this if you own a
     domain; it becomes the bundle ID `com.humanponcho.Ballast`
   - Interface: **SwiftUI** · Language: **Swift** · Testing: **Swift Testing**
   - Storage: **None** (SwiftData arrives deliberately at Stage 13)
   - Save it into `ios/`, so the project sits at `ios/Ballast.xcodeproj`

2. **Delete** the `ContentView.swift` and `BallastApp.swift` Xcode generated,
   then drag `ios/Ballast/BallastApp.swift` and `ios/Ballast/Views/` into the
   project navigator. Choose *Create groups*, and leave "Copy items if needed"
   **unchecked** — the files should stay where they are in the repo.

3. **Add the package.** File → Add Package Dependencies → *Add Local…* →
   select `ios/SimulationKit`. Then in the target's **General → Frameworks,
   Libraries, and Embedded Content**, add `SimulationKit`.

4. **Set the deployment target to iOS 17.0** (Swift Charts' `SectorMark` and
   `@Observable` both need it).

5. **Share the scheme** — Product → Scheme → Manage Schemes → tick *Shared*.
   CI cannot build an unshared scheme, and this is the single most common
   reason a first CI run fails.

6. Build and run. You should see the starter portfolio, a £33,000 total, and
   the derived figures — proof the app target can see `SimulationKit`.

Commit the `.xcodeproj` once it opens and builds. From then on the `app` job in
[`.github/workflows/ios.yml`](../.github/workflows/ios.yml) picks it up
automatically; until then that job skips itself rather than failing.

> If pbxproj merge conflicts start to hurt later, `project.yml` with
> [XcodeGen](https://github.com/yonaskolb/XcodeGen) generates the project from
> a manifest and the `.xcodeproj` stops being tracked. Worth knowing about;
> not worth the indirection while you are learning.

## Local checks before pushing

```bash
brew install swiftlint                       # once

cd ios/SimulationKit && swift test           # engine
swiftlint lint --strict --config ios/.swiftlint.yml
swift format lint --configuration ios/.swift-format \
  --recursive --strict ios/SimulationKit/Sources ios/Ballast
```

CI runs exactly these three. Running them locally first is the difference
between a two-minute loop and a twelve-minute one.

## Status

| Stage | | |
|---|---|---|
| 02 | Domain model — `Asset`, `Holding`, `Portfolio` | ✔ scaffolded, **unverified** |
| 03 | `SeededGenerator`, Box–Muller | — |
| 04 | Engine | — |

The Stage 02 code has never been compiled: it was written on a machine with no
Swift toolchain. Expect to fix a few small things on first build — that is the
first task of Sprint 2, and the tests are there to tell you when it is right.
