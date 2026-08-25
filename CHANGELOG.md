# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Native iOS port scaffolding: `SimulationKit` Swift package with the Stage 02
  domain model (`Asset`, `Holding`, `Portfolio`) and its test suite.
- Ballast app target sources — walking skeleton proving the package links.
- SwiftLint, swift-format, `.editorconfig` and Xcode `.gitignore`.
- CI workflow running engine tests, lint and format checks on macOS.
- Port specification and delivery plan under `docs/swift-port/`.
