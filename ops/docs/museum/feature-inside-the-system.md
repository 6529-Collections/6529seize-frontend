# Inside the System

[Network Museum documentation](README.md)

## Overview

Inside the System is the Museum's project-level reading environment for
generative art. It explains how a project moves from initial conditions through
algorithmic stages to visible form, maps the relevant possibility space, and
locates accessioned works within that field.

The project owns the study. A gift or accession links to it but does not define
its boundary, so a later acquisition from the same project can join the same
analysis.

## Location in the Site

- Project study: `/museum/network/projects/{project-slug}/system`
- Project entry: `/museum/network/projects/{project-slug}`
- Object entry: `/museum/network/collection/{object-id}`
- Casey gift directory: `/museum/network/gifts/6529NM.2026.001`
- Research directory: `/museum/network/stories`

The current Casey Reas release includes studies for CENTURY, Pre-Process,
Phototaxis, 923 EMPTY ROOMS, and Ex Nihilo (Cosmos).

## User Journey

1. Open a represented project and choose **Enter the system**.
2. Read the curatorial thesis before the technical apparatus.
3. Keep a Museum-held work fixed at left and choose what appears beside it:
   another minted work, or a Museum model.
4. Find any minted work by invocation or token ID, choose a random minted work,
   or filter the complete project snapshot by a published trait and value.
5. Choose **Try a variation** to change selected conditions, or **Restage a
   session** when the project has no unminted starting compositions.
6. Explore the project's map or switch to the semantic data table.
7. Follow the numbered causal stages from rule to visible image.
8. Open suggested minted comparisons: one with many shared published traits,
   one with many different traits, and one less often seen in the Museum's
   reviewed edition analysis.
9. Read the curatorial finding and consult scope limits at the end.

An object page includes **In the system**, with exact coordinates and a deep
link back to the full project map.

## Map Types

- **Exhaustive lattice:** every authored position is shown. Pre-Process uses the
  complete `8 × 3 × 5 = 120` Surface × Origin × Growth field.
- **Finite combinatorial:** complete discrete groups are shown without inventing
  a continuous scatterplot. 923 EMPTY ROOMS groups all 923 non-empty form
  multisets by size.
- **Sampled field:** released or observed states are summarized without claiming
  an exhaustive Cartesian possibility space. CENTURY and Cosmos use this form.
- **Dynamic state:** causal and temporal change is primary. Phototaxis exposes
  its sensing-to-trace sequence and fixed light coordinates.

## Interaction and Accessibility

- Visual maps and semantic tables contain the same declared structure.
- The Pre-Process grid uses arrow keys, Home, End, Ctrl+Home, and Ctrl+End.
- Museum-held works use a diamond marker and text, not color alone.
- Controls retain 44-pixel touch targets; dense lattice cells have a table
  alternative.
- No map auto-plays or requires dragging, hovering, pinching, or motion.
- Analytical diagrams are labeled as analysis views and are never presented as
  artwork states.
- **Copy comparison link** preserves the selected minted work, filters, and the
  complete versioned Museum-model or restaged-session state.

## Side-by-Side Explorer

The interaction stays consistent while each project receives its own visual
language:

- **Museum reference:** the accessioned work remains fixed at left.
- **Minted comparison:** the right side uses the official still, token hash,
  invocation, and published trait map from a pinned complete project snapshot.
- **Try a variation:** the right side changes selected conditions in a clearly
  labeled Museum model.
- **Restage a session:** where every authored starting composition was minted,
  the controls vary presentation or runtime conditions.
- **Suggestions:** the first two compare published project traits. **Less often
  seen** uses the Museum's reviewed edition analysis. No marketplace data or
  value judgments enter the selection.

Each Casey project has a distinct SVG-native analytical renderer: CENTURY's
reordered slices, Pre-Process's collision lattice, Phototaxis's causal trace
field, 923 EMPTY ROOMS's combinatorial amphitheater and line-built room, and
Cosmos's state atlas and displaced memory field.

The compact project indexes in `lib/museum/generative-studies/minted-indexes/`
are generated from the Museum's pinned complete snapshots by
`scripts/museum/build-generative-minted-indexes.mjs`. They contain only the
fields required for lookup, filtering, comparison, and official still display.

## Source and Scope

These are Museum interpretations built from published source code, metadata,
and pinned project snapshots. The live works remain the primary objects. The
studies do not alter accession records or claim artist approval.

## Failure and Recovery

- An unknown project or a project without a study returns the Museum not-found
  page.
- A missing or invalid core Museum release uses the publication-unavailable
  state rather than inferring replacement collection facts.
- If a visual map is difficult to use, switch to **Show data table**.

## Implementation References

- `app/museum/network/projects/[slug]/system/page.tsx`
- `components/museum/MuseumGenerativeSystemStudyPage.tsx`
- `components/museum/MuseumPossibilitySpace.tsx`
- `components/museum/MuseumInsideSystem.tsx`
- `lib/museum/generative-studies/`
