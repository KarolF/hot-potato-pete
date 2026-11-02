# Third-party software and asset provenance

The project's original code is all rights reserved. Third-party components
retain their own terms; `UNLICENSED` in package metadata applies to the project,
not to its dependencies.

| Component | Version in lockfile | License | Notice |
| --- | --- | --- | --- |
| Phaser | 3.90.0 | MIT | [Full notice](licenses/phaser.txt) |
| Poki Phaser plugin (`@poki/phaser-3`) | 0.0.6 | ISC | [Full notice](licenses/poki.txt) |

Phaser is bundled in both web targets. The Poki plugin is included only in the
Poki target. The private Capacitor Android wrapper is excluded from the public
source export. The Poki SDK
and platform services have their own platform terms. These notices do not
grant access to those services.

Builds retain extracted upstream copyright comments in
`bundle.min.js.LICENSE.txt` and copy `licenses/` alongside the web assets.
Dependencies installed by npm include their own notices.

## Game assets

The owner confirmed on 1 November 2026 that **all images, sound effects, and
music are AI-generated**. No stock-asset author or sample-library provenance
is asserted. The generation tools, model versions, prompts, and account terms
were not supplied, so no particular provider license or exclusivity is claimed.

| Asset group | Files | Provenance |
| --- | --- | --- |
| Runtime card/table/UI art | Images referenced by `public/assets/asset-pack.json` | AI-generated, owner declaration |
| Runtime sound effects | Referenced `.ogg`/`.m4a` files in `public/sounds/chosen_1/` | AI-generated, owner declaration |
| Background music | `public/sounds/music/sunday_morning_plan.{ogg,m4a}` | AI-generated, owner declaration |
| Documentation illustration | `docs/character.png` | Copy of the game's AI-generated cover character |

The asset manifest is the exact runtime inventory; `npm run check:assets`
validates every referenced file. Source WAVs, alternate sound selections,
unused images, artwork experiments, and full promo videos remain in the
private working checkout and are omitted from the curated export. Nothing in
this document grants a general reuse license for those assets.
