# Verification and review status

This is a local portfolio-preparation checkpoint dated 2 November 2026.
This document records source verification. Source repository publication and
Android builds are outside its scope; hosting changes are a separate owner action.

## Reproducible checks

From the game directory, install with `npm ci` and run `npm run verify`.
That command checks TypeScript, lint, unit tests, asset references, both web
builds, and the absence of development bridge/cheat markers in production.
The CI workflow runs these checks on Node 22.19.0 and 24. Local verification
uses Node 22.19.0; CI itself has not been executed on GitHub during this work.

Regression coverage includes isolated input/output snapshots, malformed saved
stats, invalid draw indices and turns, conservation of 25 unique cards through
30 seeded complete games, tween/timer cancellation, rejected advertisements,
and stale result/bot callbacks after shutdown or reinitialization.

## Completed local checks

- Clean npm installation is checked in the standalone public web project.
- Latest source verification passed: strict typecheck, lint, 85 tests across
  20 files, 41 asset keys, both web builds, and production bundle inspection.
- Web JavaScript: 1,334,233 bytes; Poki JavaScript: 1,340,476 bytes.
- CI paths were checked for the monorepo and standalone web export;
  GitHub-hosted CI was not run.
- All 104 exported source files match the working project.
- Scoped secret-pattern scans found no matches in exported text; no credential
  filenames were found in that scope. Private repository history is excluded.

The 2 November follow-up moves face cleanup before Phaser object destruction
and isolates nested opponent face data. Regression tests first reproduced both
defects, then passed with the fixes. A subagent reviewed the changes and found
no actionable issues.

The naming follow-up standardizes code, metadata, asset keys, and save keys on
Hot Potato Pete. Existing saves are intentionally not migrated. The 14 browser
test cases were split into focused files and type-checked without execution.
Original artwork was preserved without generating or editing images.

## Dependencies

Production-only npm audits have no known findings at this checkpoint.

The 2 November full audit reports 10 moderate findings in the web project's
development toolchain. These are propagation counts, not 10 independent
vulnerabilities:

- Web: ESLint/typescript-eslint depend on affected minimatch versions.

The advisory is [minimatch pattern amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249).
Patched majors lie outside the installed parents' dependency ranges. npm's
suggested force fix downgrades ESLint to 4 and was
not applied. No incompatible major override was introduced. Revisit when
upstream tooling adopts compatible fixes; do not feed untrusted glob patterns
to this development tooling.

## Review limits

- The owner confirmed manual build, gameplay, music, and sound-effect checks
  on 2 November 2026. Browser/device coverage is not recorded. Automated
  Playwright checks were not rerun for the publication cleanup.
- The README image is character art. A current gameplay screenshot is still pending;
  the installed local video encoder failed to extract a frame from the existing recording.
- The private Android wrapper is outside the public export and review scope.
  Original artwork was preserved without generating or editing images.
- The live game is hosted at
  [Hot Potato Pete](https://karolf.github.io/public-games/hot-potato-pete/).
- Asset provenance is the owner's AI-generation declaration; provider terms
  are not on record.
- The export excludes Git history, deployment scripts, signing scripts and
  credentials, local notes, other games, and generated output. A pattern scan
  of selected text files is useful evidence, not a guarantee of no secrets.

## Public project contents

The public project contains the web sources, tests, build tools, documentation,
licenses, and manifest-listed runtime assets. Optional Poki support is retained;
its platform services require the platform environment and are not validated by
local compilation. The Capacitor wrapper, deployment/signing/export scripts,
local plans, artwork experiments, promo files, and Git history from the private
project are excluded. Generated installs, builds, and test reports are ignored.
