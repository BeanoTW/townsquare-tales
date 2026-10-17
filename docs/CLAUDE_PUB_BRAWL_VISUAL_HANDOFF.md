# Claude handoff — Pub brawls, AP fighting, health and future venues

**Source:** current `main` after the pub combat PR merges. Preserve existing state, save format, actor/crew animations, scene cameras and source metadata guard.

## Design ownership
Claude owns **visual presentation only**: mobile-friendly combat UI, animations and short cutscenes, updated Tipsy Stick interior and in-world bet-taking NPC. Do not independently reimplement the combat rules, wagering, turn sequencing, HP accounting or medical billing.

## Existing gameplay interfaces
- `src/lib/combat.ts`: reusable `beginFight`, `takeTurn`, `opponentMove`, `settleFight`, five moves (`jab`, `hook`, `heavy`, `block`, `recover`) with AP costs, wounds, guard, win/loss, venue mode (`pub`/`underground`).
- `src/components/PubBrawl.tsx`: deliberately simple working combat screen; redesign rather than replace business logic.
- `src/lib/rooms.ts`: `pub-brawl` hotspot with `launch: "fight"`.
- `src/routes/index.tsx`: opens the brawl overlay; leaves `main` save intact.

## Pub cinematic spec
Add a bookmaker or tipsy regular at a suitable position in the existing low-poly three-dimensional Tipsy Stick. Initiate fight from that NPC, rather than overlaying the dartboard or bar counter. For each combat move show an in-scene animation: wind-up, punch, stagger/miss, block, recover, knockout. Camera keeps fighters and ring of pub spectators visible. Maintain readable text, accessible tap targets, reduced-motion and cutscene-off options. Restore the exact prior 3D pub camera on exit. Respect existing town map and casino/darts interactions.

## Future underground venue pipework
`FightVenue` already includes `underground`; its opponents may be stronger and hospital charges more severe. **Do not** create a warehouse, map entrance, tournament ladder, championship UI or high-stakes economy yet. Provide proposed venue-specific art/scene extensibility only.

## Validation
Target existing automated combat tests, regression tests, build; inspect touch behavior on real device separately. No overwritten saved games or reset flags.
