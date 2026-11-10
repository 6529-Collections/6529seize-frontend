# Card-page design review

## Current scope

- Keep this work on the existing collectors/card-typography branch and preview.
- Desktop refinements only; preserve mobile and smaller-breakpoint behavior.
- Treat a shared design refinement requested on one included card page as a
  consistency check across The Memes, Gradient, Meme Lab, and ReMemes. Review all
  four before handoff. Keep NextGen out of scope as requested.
- The Memes Properties preview is now six tiles in two desktop rows, with a
  right-aligned text-and-chevron disclosure. The user accepted this treatment.
- Apply the same typography and ordinary control styling to Gradient, Meme Lab,
  and ReMemes detail pages. Keep NextGen unchanged.
- The user initially cancelled the listings/offers and marketplace relocation.
  They have now explicitly requested one desktop row directly below The Memes
  trading buttons: View listings & offers on the left, Marketplaces on the
  right. Marketplace icons use a shared 24 × 24 px desktop rule across all four
  collection detail pages, with no Memes-only override.
  View listings & offers changes only text color on desktop hover, matching
  Supply details & rankings; it keeps a transparent background.
  Other card layouts and purchasing visibility remain unchanged.
- Season/year calendar chips use a single desktop text row, preserving links
  and keyboard focus.
- Match Meme Lab's desktop trading area and Properties logic
  to The Memes. Gradient also uses the shared desktop trading treatment from
  the earlier unification request. Keep marketplace placement unchanged.
- Make marketplace icon width and height consistent across all
  four collection detail templates, and check shared refinements on all four.
- Supply details & rankings keeps its chevron beside the text on desktop with
  the existing down/up rotation and content below. This disclosure is specific
  to The Memes; the other three templates have no corresponding control.
- Latest request: group Mint date beside Mint price on desktop, followed by the
  existing Distribution Plan/Main Stage links, before statistics. Preserve every
  value, pending/unavailable state, rank and link-availability rule. Apply the
  corresponding date/price grouping to Meme Lab; Gradient already places mint
  date before its statistics and ReMemes has no corresponding mint fields.
- The Memes TDH rate stays visible with the supply grid, including Pending and
  the fallback when extended metadata is unavailable. Mobile order stays intact.
- Separate collection-list follow-up: fix The Memes refresh placeholders at
  every screen size. The route skeleton shares the loaded list's container and
  grid rules, including desktop auto-fill columns. This request covers loading
  layout on small screens; the earlier desktop-only detail scope still applies.
- Extend matching loading grids to Gradient, Meme Lab, and ReMemes at every
  screen size, including Meme Lab's individual collection view. Reuse each
  loaded grid's classes and retain loading announcements, data, sort/filter
  rules, pagination, and error states. NextGen remains outside this work.
- Keep the accepted iron-800 divider only between the Memes TDH breakdown and
  Stats/Boosts group, plus the explicitly requested matching divider between
  Meme Lab Card details and Properties. Do not add dividers by Arweave links or
  in ReMemes metadata. Preserve every data field and smaller-screen style.
- Match the full-width primary tab baseline across the four included card
  pages on desktop, using The Memes color and preserving all tab behavior.

## Inspection findings

- Shared desktop typography is selected by the `data-nft-card-page` boundary.
  Relevant shared consumers include
  artwork details/viewer, metadata cards, market depth/activity, and timeline.
- Gradient and Meme Lab use the shared previous/next component without its
  square treatment. The Memes already opts into square controls. Any extension
  must be desktop-only and leave NextGen and smaller-screen navigation intact.
- Gradient, Meme Lab, and ReMemes still enlarge many detail values to 18px on
  desktop. Meme Lab additionally has small uppercase section headings, old rank
  badge sizes, and bold ownership text. ReMemes metadata uses the shared cards.
- The shared boundary is now `data-nft-card-page`, applied only to The Memes,
  Gradient, Meme Lab, and ReMemes detail roots. Shared overrides remain at the
  desktop breakpoint. NextGen has no boundary and keeps its original styles.
- Gradient, Meme Lab, and ReMemes now use 14px values and 16px section headings.
  Meme Lab shares the dark timeline and property styling. Navigation uses
  compact rounded corners on desktop; mobile circular controls are retained.
- Calendar season/year links are unboxed on desktop; link destinations and
  smaller-screen chip styles remain intact.
- Existing literal detail labels in Gradient and Meme Lab remain localization
  debt. The shared Properties control reuses the existing localized messages.
- Meme Lab and Gradient opt into the existing connection header and action
  grid at 768 px. List uses the existing More trading actions menu when Collect
  is present; it stays inline without Collect. Neither adds sticky phone actions.
  The controller stays mounted when the frame changes, retaining its draft.
- Meme Lab now shares the six-tile, three-column desktop Properties preview
  and text-and-chevron disclosure. Its smaller-screen full property list stays
  intact. Memes retains its existing phone disclosure and 640–767 px full list.

## Verification

- Existing Properties follow-up: 13 component tests and two Chromium browser
  projects pass across 390, 639, 640, 767, 768, and 1600px. Keyboard expansion and
  collapse, visible counts, compact desktop disclosure, and overflow are covered.
- The broader card-page follow-up passes 104 unit tests in nine suites and ten
  distinct desktop/mobile browser cases. The final Meme Lab/ReMemes grid checks
  also pass after preserving their original grid density.
- Changed-file lint/typechecking, Playwright types, selector lint, formatting,
  documentation links, and diff checks pass. React Doctor reports 96/100;
  advisories concern existing component size and state/hook patterns that the
  presentation diff does not modify.
- ReMemes production-data coverage also runs on a loopback preview with an
  explicit `PLAYWRIGHT_ENV=production` opt-in. Its production/staging selection
  otherwise remains unchanged. The preview was started with the production API.
- Media detail coverage is registered in the media-readonly packs. Maintain the
  existing route, navigation, market, media, and locale contracts.
- The final UI review is followed by latest-main integration, GitHub checks,
  staging verification, and production verification through the release skills.
- Latest trading and Properties follow-up: 70 component tests in six suites and
  eight browser checks pass. Coverage includes responsive state retention,
  native purchasing gates, no new sticky actions, keyboard disclosures, List
  menu access, and the complete read-only Meme Lab marketplace flow. Help Bot
  records and user-facing documentation describe the new desktop controls.
