# Claude visual production handoff — Town Square Tales crime phase

## Final architecture: conversation cameras and choreography
The repository now includes `src/lib/crime-cinematic-director.ts` as the typed **visual-only** director contract. Integrate it with the town camera and the existing scene-stage renderer. `crewConversationCue(member, storyId?)` supplies a three-person framing/reaction sequence. `storyLocationConversationCue(id)` supplies the matching scene/venue framing. `directedCrimeCue(actionId, cutsceneMode, reducedMotion)` gives action choreographies and guarantees no cinematic when cutscenes are off. The `beats` objects control focus, shot, gesture and pauses; adapt renderer to interpret them without changing game rules. Keep the same in-world character models in overhead and dialogue views. Conversation camera must return to the original overhead camera on close, preserving position and control state. Prefer a nonblocking bottom dialogue panel with player responses always visible. Treat this as one complete implementation pass covering all crew designs, mission contacts and reusable robbery/delivery/lookout cutscenes, not separate visual PRs. The current contract describes choreography but does not yet implement camera motion or animated actors—implement those in your pass.

## Goal
Create the visual pass for the first five completed underworld missions and reusable crime interactions. Game logic, stats, mission rules, payouts, saves, branching choices and dialogue are already implemented; **do not redesign them**.

**Read these source files first:**
- `src/lib/underworld-story-script.ts` — full narrative scenes and dialogue.
- `src/lib/underworld-stories.ts` — mission rules, stages, objectives, payout actions.
- `src/lib/crime-visual-cues.ts` — canonical, typed, gameplay-independent scene contracts.
- `src/lib/gang-career.ts` and `src/lib/street-gang.ts` — crew identities and physical placements.
- `src/components/town3d/actors.tsx` — existing Gang/Person 3D actors.
- `src/components/home3d/HomeScene3D.tsx` — existing room actor and venue geometry.
- `src/components/LocationScene.tsx` — first-person interactions and hotspots.
- `src/lib/scene-stage.ts`, `src/components/scenes/SceneStage.tsx`, `src/lib/cutscenes.ts`, and `src/components/ActionVignette.tsx` — existing cutscene infrastructure.

## Creative direction
Absurd, goofy, occasionally crude and weirdly philosophical, like a dysfunctional gang who believe their smallest jobs are major international operations. The characters do *not* know they are funny. Quiet heartfelt moments are allowed to breathe. A small minority of NPCs can be genuinely competent; they provide contrast. Do not copy recognizable characters or dialogue from other shows.

## Production order
1. **Crew 3D pass**: Mick, Lez and Nia need visually distinguishable, memorable silhouettes. Preserve their existing `CREW_SPOTS` coordinates, tap regions, camera behaviour and mobile performance. Maintain the existing minimalist stick-figure identity (head, arms, only glimpses of feet when walking) rather than switching to realistic humans. Give each one subtle idle motion and readable interaction reactions.
2. **Five mission contacts**: pawn clerk + ledger, diner stranger, Corner Shop keeper + envelope, Tipsy Stick buyer, alley trolley. Use existing venues and room hotspots, no extra map locations. Every objective needs an obvious readable focal subject in first-person and tap mode.
3. **Reusable action cutscenes**: robbery, sealed parcel handover, bank lookout, collection, investigation and negotiation. Drive these from action IDs and `visualCueForAction`. Reuse `CutsceneMode` full/short/off semantics. Keep state changes inside existing `runAction` or `runGodAction`: animation must never mutate game state, issue rewards or complete a mission.
4. **Tone details**: comics come from timing, reaction pauses, unnecessary seriousness and absurd set dressing, not from giant text overlays. Lez's trolley scene has a sincere pause before a joke.

## Five scene beats
- **Nia / The Missing Cut:** Oddities Pawn ledger, soup coupon and absurd financial investigation.
- **Lez / Someone at the Door:** diner visitor waiting on a brother who no longer works there; observational comedy.
- **Mick / An Awkward Collection:** shopkeeper, disputed wheelbarrow and returned envelope.
- **Nia / A Stranger's Offer:** indoor sunglasses, wary buyer, awkward negotiation.
- **Lez / The Late-Night Favour:** alley trolley, neglected plant, birthday card; comic but emotionally sincere.

## Engineering constraints
- No alterations to `GameState` save keys, mission reward calculations, `storyAvailable`, `finishStory`, `investigateStory`, `gangJob` or stat-reactive dialogue.
- Do not displace current NPCs or the player's position, alter the minimap/car controls or overwrite normal saves.
- Maintain 40–44px minimum mobile interactive targets; avoid persistent screen overlays. All cutscenes must be skippable and work with reduced motion.
- Keep existing overhead Stick RPG street view and first-person room vantage points unchanged.
- Avoid large new models, textures or network-loaded assets. Prefer reusable Three/R3F geometry and lightweight animation.
- Include tests for scene mapping, skipped/off animations, action state unchanged, and a build. Test on mobile after merge.

## Handoff success criteria
Mick/Lez/Nia are visually distinctive; five objectives have proper in-world NPCs/props; crime actions show brief context-appropriate cinematics; normal play, God Mode fast-track and saves remain unaffected. Submit the graphics as a separate PR for review and testing before merge.

**Scope:** visuals and choreography only. The current five missions are the first batch; Vince's backroom and other criminal tiers are not part of this graphics pass.
