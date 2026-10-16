<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep upright ground projection in the browser-safe town-projection module so map geometry and exterior rendering agree.
- Render destination architecture in BuildingExterior using the same lots and frontage as navigation, so visual entrances stay reachable.
- Keep town illustration colors in global semantic CSS tokens so exterior details and the map share one palette.
- Keep housing artwork in HomeInterior using existing hotspot footprints, and luxury ownership in a separate optional bitmask so original furniture benefits and older saves remain compatible.
- Basketball arcade rendering and scoring must consume the same deterministic 3D flight frames and shared court geometry; legacy side-view and H-O-R-S-E logic stays separate to preserve reusable code without prediction-based scoring.
- Player homes render in first person (fixed eye-level camera, drag to look, tap furniture to use); venues keep the overhead walker, and activity cutscenes still use the existing third-person animations so they stay reusable.
