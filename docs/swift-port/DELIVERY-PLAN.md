# Ballast — delivery plan

A solo learning project run as if it were a funded one. The point is not
ceremony for its own sake: it is that the habits which make professional teams
work — a definition of done, a green pipeline, a reviewed change, a versioned
release — are *learnable skills* in their own right, and this is a low-stakes
place to build them.

Scope and technical decisions: [`SPEC.md`](./SPEC.md).
Stage-by-stage tutorial: https://claude.ai/code/artifact/12f9def3-9e10-4a36-a7fa-74aff7e52b66

---

## 1. Operating model

| | |
|---|---|
| **Team** | One developer, wearing every hat deliberately and one at a time |
| **Cadence** | 2-week sprints, 8 sprints, ~6–8 focused hours per week |
| **Elapsed** | ~16 weeks at that pace. Slipping is fine; skipping the gates is not |
| **Board** | GitHub Issues + labels, one `sprint-N` label per sprint |
| **Branching** | Trunk-based: short-lived branches off `master`, PR, squash-merge |
| **Releases** | Semantic versioning, four tagged releases (§5) |

### Wearing one hat at a time

The failure mode of solo projects is doing all the roles simultaneously and
badly. Separate them in *time*:

- **Planning** (30 min, start of sprint) — you are a product owner. Pick the
  sprint goal, pull issues, refuse to start anything not Ready.
- **Building** (the sprint) — you are an engineer. If a new idea appears, it
  becomes an issue in the backlog, not a detour.
- **Review** (30 min, end of sprint) — you are a reviewer. Read your own diffs
  cold, against the checklist in §4. Demo the build to yourself on a device.
- **Retro** (15 min, written) — append five lines to `docs/swift-port/RETROS.md`:
  what worked, what didn't, one change for next sprint.

The written retro is the highest-value ceremony here and the one most likely
to be skipped. Do it even when the answer is boring.

---

## 2. Sprint schedule

| # | Sprint goal | Stages | Exit criteria |
|---|---|---|---|
| **1** | Foundations and a green pipeline | 00–01 | Xcode project builds; CI green on three jobs |
| **2** | A domain model and randomness you can test | 02–03 | `swift test` green; seeded RNG reproducible |
| **3** | A working engine, proven against the old one | 04–05 | Golden vectors match; **v0.1.0** |
| **4** | Correlated returns and a hardened loop | 06 | Cholesky tested; 10k×40y benchmarked |
| **5** | The app can be driven | 07–08 | Allocation screen live on device |
| **6** | It looks like the thing | 09–10 | Three charts; both appearances; **v0.2.0** |
| **7** | It behaves like an app | 11–13 | Navigation, off-main-thread, saved scenarios; **v0.3.0** |
| **8** | It ships | 14–16 | Accessible, native surface, submitted; **v1.0.0** |

### The board

Issues live at
[github.com/humanponcho/Vanguard-ETF-Portfolio-Simulator/issues](https://github.com/humanponcho/Vanguard-ETF-Portfolio-Simulator/issues),
grouped by a `sprint-N` label. Filter a sprint with
`is:issue is:open label:sprint-1`.

| Sprint | Issues |
|---|---|
| 1 · Foundations | [#1](../../issues/1) name clearance · [#2](../../issues/2) Xcode project · [#3](../../issues/3) CI green · [#4](../../issues/4) branch protection · [#5](../../issues/5) Swift spike |
| 2 · Domain and randomness | [#6](../../issues/6) verify Stage 02 · [#7](../../issues/7) SeededGenerator · [#8](../../issues/8) Box–Muller · [#9](../../issues/9) withholding decision |
| 3 · Engine | [#10](../../issues/10) I/O types · [#11](../../issues/11) faithful port · [#12](../../issues/12) fixtures · [#13](../../issues/13) golden test · [#14](../../issues/14) monthly steps · [#15](../../issues/15) lognormal · [#16](../../issues/16) percentiles · [#17](../../issues/17) ensemble band · [#18](../../issues/18) **v0.1.0** |
| 4 · Correlation | [#19](../../issues/19) Cholesky · [#20](../../issues/20) correlated shocks · [#21](../../issues/21) perf baseline · [#22](../../issues/22) property tests |
| 5 · UI foundation | [#23](../../issues/23) epic |
| 6 · Charts | [#24](../../issues/24) epic |
| 7 · Structure | [#25](../../issues/25) epic |
| 8 · Ship | [#26](../../issues/26) epic |

**Milestones are not set up.** GitHub milestones have to be created through the
web UI (Issues → Milestones → New). Create eight, named for the sprint goals in
the table above, then bulk-assign each `sprint-N` label's issues to its
milestone. Ten minutes, and it buys you the burndown and the % complete that
the labels alone do not give.

### Backlog depth

Sprints 1–4 are broken into issues now. Sprints 5–8 exist as **epics** only.

That is deliberate, not laziness: grooming sprint 8 during sprint 1 produces
tickets written in ignorance of everything sprints 1–7 will teach you. Break
each epic down at its own sprint-planning session. Real teams that groom the
whole roadmap up front spend the second half of the project rewriting tickets.

---

## 3. Definition of Ready

An issue may not be started until it has:

- [ ] A one-sentence statement of the outcome, in user or system terms
- [ ] Acceptance criteria that can be checked, not judged
- [ ] A stage reference, so it connects to the learning objective
- [ ] No dependency on an unfinished issue, or that dependency linked

## 4. Definition of Done

A change is not done until **all** of these hold. No exceptions for "it's only
a small one" — that exception is how every codebase rots.

- [ ] Behaviour is covered by a test that fails without the change
- [ ] `swift test` green locally
- [ ] `swiftlint --strict` and `swift format lint --strict` clean
- [ ] Public API has doc comments explaining *why*, not restating the signature
- [ ] Self-review completed on the PR diff, read top to bottom
- [ ] CI green on the PR
- [ ] `ios/README.md` status table updated if a stage completed
- [ ] Squash-merged with a conventional-commit subject

### Self-review checklist

Reading your own diff cold is a skill. Prompts that make it work:

1. What would a reviewer who dislikes me flag first?
2. Which line here would I not be able to explain in six months?
3. What input breaks this? Is that input in a test?
4. Is there a number in this diff that should be a named constant?
5. Did I leave a `TODO` that should be an issue instead?

---

## 5. Versioning and releases

Semantic versioning against the *product*, tagged on `master`.

| Tag | Meaning | Gate |
|---|---|---|
| `v0.1.0` | Engine complete and proven against the JS implementation | Golden vectors green |
| `v0.2.0` | Walking skeleton: real data, real charts, real theme | Runs on a device |
| `v0.3.0` | Feature complete against SPEC | All P1 issues closed |
| `v1.0.0` | Submitted to the App Store | Approved |

`CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com).
Write the entry when the PR merges, not at release — nobody remembers a
sprint's worth of changes in one sitting.

### Commit convention

Conventional Commits, because it makes the changelog mechanical:

```
feat(engine): draw returns from a lognormal distribution
fix(engine): resample u1 when Box–Muller draws exactly zero
test(engine): pin percentile interpolation against the JS fixtures
chore(ci): run swift-format in strict mode
docs(spec): record why gold's expected return moved to 5%
refactor(ui): lift allocation state into SimulatorModel
```

Scopes in use: `engine`, `ui`, `charts`, `ci`, `spec`, `a11y`, `release`.

---

## 6. Quality gates

| Gate | Enforced by | Fails the build? |
|---|---|---|
| Unit tests | `swift test` in CI | Yes |
| Lint | SwiftLint `--strict` | Yes |
| Formatting | `swift format lint --strict` | Yes |
| App compiles | `xcodebuild` (once the project exists) | Yes |
| Coverage | `llvm-cov` summary in the job summary | No — reported, not gated |
| Concurrency safety | Swift 6 language mode | From sprint 7 |

Coverage is reported and never gated. A coverage threshold makes people write
tests that execute lines without asserting anything. Target ≥90% on
`SimulationKit` because the engine is pure and easy to test; expect far less on
views, and do not chase it.

### Branch protection

Once CI is green, turn on for `master`: require PRs, require the three status
checks, no direct pushes. You will occasionally curse this. That is the point —
it is what stops "just this once" at 11pm.

---

## 7. Risk register

| Risk | Likelihood | Impact | Response |
|---|---|---|---|
| Name collision on "Ballast" | Medium | High if late | Clear it in sprint 1; the name touches bundle ID and module name |
| App Review 4.2 rejection | Medium | Medium | Sprint 8 ships two native-only features; review notes drafted in advance |
| Motivation decay around sprint 4 | **High** | High | v0.1.0 lands at the end of sprint 3 — a real, working, testable thing before the hardest maths |
| Scope creep from modelling ideas | High | Medium | New idea → backlog issue. Sprint scope is fixed once planned |
| Xcode/toolchain churn breaking CI | Low | Low | Xcode version pinned in the workflow, not `latest` |
| Correlation maths harder than it looks | Medium | Medium | Sprint 4 holds one stage and nothing else, on purpose |

## 8. Metrics worth tracking

Two numbers, appended to the retro. Not for productivity theatre — for noticing
drift.

- **Sprint completion**: issues closed ÷ issues committed. Consistently under
  70% means you are over-committing, not underperforming. Reduce the commit.
- **Pipeline time**: how long CI takes. When it passes ~10 minutes you will
  start skipping it, so treat that as a bug.

---

## 9. What "professional" actually bought you

At the end, the transferable skills are these — and they matter more than the
Swift:

- A codebase where a change is safe because a machine checks it.
- A habit of writing down *why*, so the decision survives the reasoning.
- A release process that is boring, which is the only kind worth having.
- The discipline to close an idea into a backlog instead of chasing it.
