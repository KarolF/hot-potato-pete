# Codex Project Instructions

Hot Potato Pete is a Phaser 3 and TypeScript card game. Runtime source lives in `src/`, static web assets live in `public/`, unit tests live in `src/tests/`, and Playwright tests live in `e2e/`.

Repository context:

- This is the standalone Hot Potato Pete Git repository.
- Run Git and npm commands from this repository root.
- Keep generated installs, builds, test reports, logs, and local environment files out of commits.
- The public project supports the ordinary web game and an optional Poki build.
- Deployment, Android packaging, and private export tools are not included.

The Hot Potato Pete architecture is:

- `src/model/`: card/deck/player rules, game state, and stats persistence.
- `src/mediators/GameplayMediator.ts`: connects game state to the Phaser view layer.
- `src/view/scenes/`: Phaser scene flow.
- `src/view/components/`: reusable cards, hands, modals, and UI controls.
- `src/utils/`: deterministic RNG, logging, tween, and UI helpers.

Common commands:

```bash
npm run dev
npm run build
npm run typecheck
npm run test:run
npm run test:e2e
```

Keep generated build output out of source diffs when possible. Use existing model/mediator/view patterns for gameplay changes and add focused tests when changing card rules or turn flow.

Code principles:

- Keep the current architecture explicit:
  - `src/model/` owns card rules, scoring, run state, persistence models, and deterministic game decisions.
  - `src/mediators/` coordinates model state with scene/view updates.
  - `src/view/scenes/` owns Phaser scene flow, input wiring, transitions, and screen-level composition.
  - `src/view/components/` owns reusable visual objects and local visual animation.
  - `src/utils/` owns shared deterministic RNG, logging, tween, and helper utilities.
- Put new gameplay rules in the model unless the behavior is strictly presentation, input, or animation.
- Keep model code testable and avoid Phaser dependencies in `src/model/`.
- Use deterministic RNG from `src/utils/Utils.ts` for game logic that must be reproducible in tests.
- Prefer existing project patterns and dependencies. Add new dependencies only when they solve a clear problem better than local code or existing packages.
- Avoid duplicate functions and parallel implementations. Reuse or refactor shared behavior when the same logic appears in more than one place.
- Keep files under 300 lines and functions under 50 lines. If a touched file or function is already over the limit, extract focused helpers or components as part of the change instead of making it larger.
- Centralize strings, asset keys, storage keys, colors, and other repeated constants in `src/CST.ts` or an appropriate local constant near the feature.
- Centralize gameplay numbers and identifiers too: shuffle timings, delay values, rank lists, pair suit lists, Hot Potato Pete IDs, multipliers, and fixed thresholds should not be hard-coded inside controller, mediator, or view methods.
- Use named types for non-trivial payloads and return values. Do not add anonymous inline object type annotations when a model interface, class, or local named type would make the contract reusable.
- Keep card construction behind a factory boundary. Do not add new card creation methods to general model classes when a dedicated factory is the clearer responsibility.
- Keep mediator methods readable by storing repeated singleton lookups and nested call results in local variables before using them.
- Do not silently swallow errors with empty or catch-and-ignore blocks. Prevent invalid calls before invoking model/controller code, or surface the failure through an explicit typed path.
- Guard delayed callbacks and animation completions against stale state, destroyed views, and changed turns before mutating model or view state.
- Keep Phaser components focused on local presentation. Move cross-component input state, registries, blockers, and scene-wide coordination into mediator/manager classes instead of static mutable state on individual components.
- Prefer factories for repeated Phaser element construction so scenes and components do not duplicate setup details for cards, buttons, modals, or other reusable objects.
- Keep comments rare and useful: explain non-obvious game rules, timing, animation sequencing, or model/view contracts.
- Preserve ASCII-only source unless the edited file already uses Unicode for a specific reason.

Testing and verification:

- Add or update focused unit tests for changes to card rules, turn flow, run scoring, shuffling, persistence, or deterministic behavior.
- Use Playwright tests for user-facing flow regressions that unit tests cannot cover well.
- Run the narrowest meaningful check first, then broader checks when touching shared behavior.
- For routine refactors, do not run Playwright, e2e tests, browser smoke tests, or start a dev server unless the
  user explicitly asks.
- Usual checks from the repository root:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- only if needed:
  - `npm run test:run`
  - `npm run test:e2e`
- Do not start `npm run dev` or bind/use port `8080` unless the user explicitly asks. The user reserves that command and port for manual testing. For visual smoke checks, either use a server the user says is already running, or state that the visual check was not run.

Commit guidance:

- Write concise descriptive commit messages that say what changed and why.
- File paths may be included when they make the summary clearer.
- Do not include generated output, logs, local environment files, coverage, Playwright reports, `dist/`, or `node_modules/` in commits.
