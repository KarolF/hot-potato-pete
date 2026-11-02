# Hot Potato Pete

A portrait card game built with Phaser 3 and TypeScript. Draw hidden cards,
watch your opponent's eyes, and avoid being left holding the Hot Potato Pete.
Three opponents have different tells and shuffle styles, with escalating
difficulty across a score-based run.

By **Karol Furmann**. Portfolio source for viewing and review; original code
is all rights reserved.

<img src="docs/character.png" alt="The Hot Potato Pete cover character" width="180">

Play the [live game](https://karolf.github.io/public-games/hot-potato-pete/).
The image above is character artwork, not a gameplay screenshot. The quality
workflow checks the source project and does not deploy the demo.

## Play

- Tap or click an opponent card to draw it. Matching ranks leave your hand
  automatically. The 25-card deck contains 12 pairs and one Hot Potato Pete.
- Watch eye movements and follow the first-play tutorial to learn the tells.
- Tap your own hand to shuffle it when it is your turn, outside the tutorial.
- Tap during a skippable card animation to advance that animation.
- Use `?` for instructions and the pause button for sound, music, or menu.

Each win awards 1,000 points plus 250 for each preceding consecutive win.
Drawing the marked shuffle card adds 250 points. A loss ends the run. Stats,
audio preferences, tutorial progress, and the best score persist locally.

## Run locally

Use Node **22.19 or newer in the 22.x line**, or **24.x**. The lockfiles are
committed; run commands from the directory containing this game's package.json.

```sh
npm ci
npm run dev
```

The manual development server uses `http://127.0.0.1:8080`. Stop it when done.
Browser audio requires a click/tap before playback. No account or backend is
required for the ordinary web build. The owner confirmed working music and
sound effects in manual testing on 2 November 2026.

| Command | Result |
| --- | --- |
| `npm run typecheck` | Strict TypeScript checks |
| `npm run lint` | Unused variables, equality, and declaration rules |
| `npm run test:run` | Unit and lifecycle regression tests |
| `npm run check:assets` | Asset-manifest and audio-key validation |
| `npm run build` | Production web files in `dist/` |
| `npm run build:poki` | Poki-enabled files in `dist-poki/` |
| `npm run check:production` | Inspect both completed builds for debug exports and missing assets |
| `npm run verify` | All non-browser checks and both builds |

Playwright is a separate, explicit check. Install its Chromium browser with
`npx playwright install chromium`, then run `npm run test:e2e`. Its server uses
port **8081**; set `E2E_PORT` to select another port. Routine verification and CI
do not start the browser or a development server.

## Architecture

The architecture began as a manually crafted project designed by a human.
The codebase has been developed under human supervision with AI assistance.
The separation of responsibilities is explicit:

```text
src/model/       Card rules, seeded decisions, snapshots, scoring, persistence
src/mediators/   Turn coordination, pointer input, cross-component animations
src/view/scenes/ Scene composition, HUD, opponent and result presentation
src/view/components/ Local card, hand, face, modal, and progress visuals
src/utils/       RNG, animation cancellation, platform and shared UI helpers
src/debug/       Development-only inspection and test controls
src/tests/       Model, turn, integrity, and lifecycle regressions
```

`GameController` remains the model entry point. `BotDrawPolicy`,
`GameSnapshotFactory`, `DrawProgressRecorder`, and `MatchOutcomeResolver` handle
focused rule/state work. `GameplayMediator` connects snapshots to the view;
`GameplayScreen` composes concrete input, HUD, result, and opponent helpers.
`PeterFaceView` owns eye scanning and delegates reactions to
`PeterReactionAnimator`.

The game uses a 600 x 960 design coordinate system with responsive canvas
layout. Persistence uses fresh `hot-potato-pete` save keys with no migration
from previous saves. Saved data belongs to the browser origin; active matches
and the current run are not restored after a reload.

## Engineering examples

**Snapshot integrity.** Copying an array alone left individual card objects
shared with stored state. Cards are now copied on both input and output,
including discarded pairs. Regression tests mutate the supplied snapshot and
a returned snapshot independently, then check the stored snapshot. Thirty
complete seeded games also check card uniqueness and conservation after
every draw.

**Scene lifecycle.** Stopping a scene can remove timers and tweens before their
promises resolve. Animation waits now cancel through a typed path. Generation
guards reject continuations from a stopped/restarted scene, including delayed
result modals and advertisement completions. Tests cover cancellation, skipped
final states, ad failure recovery, and stale bot callbacks after reinitializing
the mediator.

**Production boundary.** Browser inspection APIs and forced-win actions load
through a development-only module. Production builds remove that import and
the associated code. A build inspection checks for debug API/cheat markers,
unexpected JavaScript chunks, and missing manifest assets.

These are examples of the supervised AI-assisted cleanup recorded in this
revision. They do not assert who typed every historical method. The human
contribution confirmed by the owner is the initial manually crafted project,
architecture, and ongoing supervision. All images, sound effects, and music
are AI-generated; exact generation tools and terms have not been recorded.

## Build targets

The ordinary web target has no Poki runtime integration. The Poki target enables
the existing Phaser plugin and platform lifecycle hooks. Both targets can be
built locally; Poki platform services and acceptance require the platform's
environment and are not covered by local build checks.

The public source export contains the web game only. The private Capacitor
Android wrapper, signing tools, and deployment script are excluded. Its quality
workflow validates the web project and has read-only repository permissions;
it does not publish builds or push commits to the game's hosting repository.

## Contributions

This repository is a portfolio snapshot maintained by its owner. External
contributions and pull requests are not accepted. Repository access settings,
rather than this statement, control who can push or merge changes.

## Verification status and rights

See [verification notes](docs/VERIFICATION.md) for the audit findings and limits.
The non-browser checks are reproducible. The owner confirmed manual build,
gameplay, music, and sound-effect checks on 2 November 2026. Automated browser
tests were not rerun for this publication cleanup, and cross-browser/device
coverage is not recorded. Music files remain large and Webpack reports size warnings.

See [LICENSE](LICENSE), [third-party notices and asset provenance](THIRD_PARTY_NOTICES.md),
and [upstream license texts](licenses/). The project package is `UNLICENSED`;
this does not replace dependency licenses. A public GitHub repository can
still be viewed and forked under [GitHub's platform terms](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).
No general reuse permission for the original project is granted.
