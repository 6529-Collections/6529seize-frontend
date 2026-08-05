# Museum visual-fidelity audit

## Scope and decision

This is a bounded, read-only audit of the native 6529 visual system for the
Museum rebuild. It records the design contract to reuse; it does not approve a
Museum implementation and does not change runtime code.

- Frontend branch: `codex/museum-art-first-rebuild`
- Audited frontend base: `2d310e05b886263e868eae3e06073ad20fe760df`
- Source classification: modern prefixed Tailwind is the target; legacy global
  and CSS-module styling is compatibility evidence only.
- Production routes inspected on 2026-08-02: `/discover`, `/waves`,
  `/the-memes`, and `/the-memes/529`.
- Production desktop viewport: 1440 x 900.
- Production narrow viewport: 390 x 844. This retained the desktop-pointer
  collapsed rail, so it is useful for responsive content measurements but is
  not sufficient evidence of the true touch/mobile shell.

The decision is firm: the Museum must remain inside the native 6529 shell and
visual grammar. Museum character comes from artwork scale, sequencing,
editorial rhythm, captions, and restrained negative space. It does not come
from a second design system.

## Production readback

The following values were read from computed styles on production, not inferred
only from class names.

| Surface | Production readback | Consequence for Museum |
|---|---|---|
| Global type | `Montserrat, sans-serif`; body 16px at desktop | Use Montserrat throughout. Do not introduce a Museum serif or display font. |
| App shell | 1324px maximum width; collapsed rail 80px; main receives 80px left clearance | Render Museum routes through the existing shell. Do not add a parallel site header or full-bleed viewport shell outside it. |
| Sidebar | Black background, `iron-800` divider, compact 46px navigation rows, restrained white/`iron-400` states | Keep the existing Museum entry and native active/focus behavior. Museum subnavigation belongs in page content. |
| Discovery heading | 24px/32px, weight 600, `iron-200` | Use compact headings and a clear hierarchy; avoid marketing-scale display copy. |
| Discovery cards | 377px wide in the sampled grid; `iron-950`, 12px radius, 8px inset, 0.04-white border | Use this surface grammar for secondary Museum cards, while allowing artwork-led size variation. |
| Collection page | `#0D0D0F` content surface; 1400px inner maximum; 32px desktop gutters; 30px/36px page heading | Reuse the art-collection surface, gutters, and heading scale as the nearest public-art reference. |
| Collection grid | Auto-fill columns with 15rem minimum; 20px desktop gap | Start from the same responsive grid mechanics. Museum may vary spans or lead with a larger work, but not replace the spacing system. |
| Collection card | 280 x 421px sample; `iron-950`; 12px radius; 0.1-white border; 15px/24px weight-600 title | Keep artwork dominant and metadata compact. Avoid metric tiles and badge stacks. |
| Artwork detail | 11:9 columns, 64px desktop gap; sampled artwork 613 x 613px; media `object-fit: contain`; 12px radius | Use this as the primary Casey object-page composition: large art first, interpretation beside/below, evidence later. |
| Detail navigation | One-pixel bottom divider; compact text tabs; active primary underline | Reuse the restrained link/underline language for dossier sections instead of pills or floating segmented chrome. |
| Narrow content | At 390px, the sampled detail changed to one column and document scroll width equaled client width (375px) | Preserve single-column art-first flow and require no horizontal document overflow. Verify the true touch shell separately. |
| Theme | Production surfaces are black, `#0D0D0F`, and `iron-*`; no first-class light-theme provider or toggle was found in representative source | Museum inherits the current dark-first product. Do not invent a Museum-only light palette or theme switch. |

`/waves` additionally confirms the working-app posture: a black, viewport-height,
overflow-controlled surface with a dense 320px content rail and subtle
`iron-700` dividers. The Museum should be calmer than Waves through composition,
not through disconnected typography, chrome, or color.

## Native visual-system matrix

| Area | Exact source to reuse | Native rule | Intentional Museum extension | Rejected divergence |
|---|---|---|---|---|
| Fonts | `styles/fonts.css`, `styles/globals.css` | Montserrat is the product face. `Square One` is an available brand asset, not the reading face. | Montserrat with editorial measure, deliberate line-height, and weight contrast. | Serif display type, oversized luxury-museum type, or using `Square One` for prose/headings. |
| Core tokens | `tailwind.config.ts` | `tw-` prefix; black and `iron-*` neutrals; `primary-*`, `error`, and `success`; default Tailwind spacing plus `3xl` at 2048px. | Use the same tokens with art-driven black/neutral staging. | New palette, hard-coded decorative colors, unscoped utility system, Bootstrap, Sass, or another CSS framework. |
| Global canvas | `styles/globals.css` | Black root/body, white text, Montserrat, scoped Tailwind behavior, 1324px layout variables. | Museum reading surfaces may use `#0D0D0F`/`iron-950` inside the shell. | White Museum canvas, detached microsite background, or global reset changes. |
| Layout selection | `components/providers/LayoutWrapper.tsx` | Existing device-aware Web, Small Screen, and app layouts own the global shell. | Museum components adapt inside the selected layout. | Museum-owned viewport detection or duplicate global navigation. |
| Desktop shell | `components/layout/WebLayout.tsx`, `constants/sidebar.ts` | 1324px shell; 17.1875rem expanded rail; 5rem collapsed rail; shell thresholds at 1024px and 1280px. | Museum content can use its full allocated main width and responsive internal grids. | Full-viewport escape that covers, offsets, or visually replaces the sidebar. |
| Desktop navigation | `components/layout/sidebar/WebSidebar.tsx`, `components/layout/sidebar/WebSidebarNav.tsx`, `components/layout/sidebar/nav/WebSidebarNavItem.tsx`, `components/layout/sidebar/WebSidebarHeader.tsx` | Black rail, `iron-800` divider, compact icon/text rows, explicit current-page state, visible keyboard ring, motion-reduced transitions. | Preserve the existing direct Museum section link; use an in-page Museum navigation for deeper IA. | Parallel Museum rail, floating luxury nav, custom logo treatment, or hover-only navigation. |
| Museum entry | `hooks/useSidebarSections.ts` | Museum is already a first-class direct route in the native sidebar and active for descendants. | Keep the entry; update only its destination/descendant semantics if later IA requires it. | Adding duplicate Museum entries or moving primary Museum IA into dashboard-style sidebar groups. |
| Small-screen shell | `components/layout/SmallScreenLayout.tsx`, `components/layout/SmallScreenHeader.tsx` | Sticky 64px black header, 40px 6529 mark, `iron-800` divider, 40px rounded-lg menu control, off-canvas native sidebar. | Museum begins immediately below the native header with full-width art pacing. | Museum mobile masthead, horizontal clipped global nav, or non-native hamburger treatment. |
| App bottom navigation | `components/navigation/BottomNavigation.tsx` | Existing touch/app navigation owns safe areas, visibility, compacting, and reduced-motion behavior. | Museum must coexist with it where the app layout selects it. | Museum fixed footer navigation or controls that overlap the dock/safe area. |
| Primary controls | `components/utils/button/buttonStyles.ts`, `components/utils/button/Button.tsx`, `components/utils/button/ButtonLink.tsx` | Rounded-lg controls, 32–44px size tiers, semibold labels, native primary/action/secondary/tertiary states, disabled opacity, loading state, primary focus outline. | Use for actions such as “View live work,” retry, and source/document links when a button treatment is warranted. | Gradient CTAs, glass buttons, capsule-everything, bespoke loading buttons, or disabled controls without semantic state. |
| Tabs and compact selectors | `components/utils/select/tabs/CommonTabs.tsx` | Scrollable keyboard-operable tabs with arrow/Home/End behavior, `iron-950` surface, `iron-800` ring, overflow fades. | Reuse only for actual in-page view switching. Route navigation should remain semantic links with the detail-page underline pattern. | Pill carpets used as decoration or route navigation disguised as controls. |
| Artwork browse page | `components/the-memes/TheMemes.tsx`, `components/the-memes/TheMemesCard.tsx` | `#0D0D0F` collection canvas, responsive 2/3/auto-fill grid, 12px card radius, subtle border, visible focus ring, artwork before metadata. | A Museum grid may introduce a larger lead work and varied art aspect ratios while retaining tokens, gutters, and interaction states. | Uniform registry cards, accession-count tiles, marketplace metrics, masonry with unstable layout shifts, or image-less cards. |
| Artwork detail | `components/the-memes/MemePage.tsx`, `components/the-memes/MemePageArtViewer.tsx` | Art-first 11:9 desktop split, one-column narrow flow, large contain-fit media, compact heading, understated tabs, fullscreen/media actions. | Add Museum caption, credit, rights, live/fallback disclosure, and interpretation without shrinking the art into a dashboard panel. | Metadata-first dossier, oversized hero copy above the art, floating glass toolbar, or raw evidence as the primary page. |
| Media renderer | `components/nft-image/renderers/NFTImageRenderer.tsx`, `components/nft-image/NFTMediaContainer.tsx`, `components/common/FallbackImage.tsx` | Preserve aspect ratio, center media, lazy-load browse thumbnails, prioritize detail media, and provide explicit source fallback behavior. | Museum viewer adds governed alt/description, still-first live activation, approved-origin checks, and a visible failure return to the still. | Distorted art, background-image-only art, arbitrary remote URLs, invisible failures, auto-running untrusted live work, or claiming upstream media is retained. |
| Content cards | `components/home/explore-waves/ExploreWaveCard.tsx`, `components/home/explore-waves/ExploreWavesSection.tsx` | 12px cards, subtle white edges, `iron-950`, restrained hover lift, compact type, standard 16/24/32px responsive gutters. | Use this cadence for related stories/programs, with real artwork or editorial imagery as the richness. | Decorative blobs, ornamental gradients, gratuitous shadows, generic feature-icon grids, or repeating AI-template sections. |
| Loading | `components/the-memes/MemePageSkeleton.tsx`, `components/home/explore-waves/ExploreWaveCardSkeleton.tsx`, `components/utils/animation/CommonSkeletonLoader.tsx` | Geometry-matched `iron-800` pulse blocks reserve final media/text space. | Museum skeletons must reserve the actual artwork aspect ratio and dossier rhythm. | Centered spinner replacing a full page, skeletons that resemble final records, or layout shift when art arrives. |
| Empty state | `components/common/EmptyState.tsx`, `components/the-memes/TheMemes.tsx` | Restrained neutral panel, useful title/message, optional recovery action. | Explain whether the publication truly contains no works or a filter has no matches. | Empty metric dashboard, celebratory decoration, or silent omission. |
| Error and recovery | `components/error/Error.tsx`, `components/providers/LayoutErrorFallback.tsx`, detail retry treatment in `components/the-memes/MemePage.tsx` | Human-readable error, explicit retry, native Button, optional technical disclosure. | Museum-specific stale/publication/media/live-work errors keep art or last-valid content visible where safe. | Copying `ExploreWavesSection`'s silent error return, replacing failed media with blank space, or leading with stack traces/hashes. |
| Focus and pointer states | `tailwind.config.ts`, `components/utils/button/buttonStyles.ts`, `components/layout/sidebar/nav/WebSidebarNavItem.tsx`, `components/the-memes/TheMemesCard.tsx` | `focus-visible` primary/iron rings, ring offsets on dark surfaces, `desktop-hover` only when supported, explicit touch variants. | Every artwork card, dossier link, and viewer control gets a visible, ordered focus state and non-hover affordance. | Removing outlines, hover-only captions/actions, or focus colors unrelated to `primary-400`. |
| Motion | `tailwind.config.ts`, `styles/globals.css` | Short purposeful transitions, `motion-reduce` opt-outs, reduced-motion handling for app shell behavior. | Optional image reveal may use existing fade/gallery timing only when it does not delay access to art. | Parallax, ambient floating art, autoplay reveal sequences, long easing, or motion required to understand the work. |

## Composition rules for the Museum

These are the allowed Museum-specific extensions to the native system.

1. Artwork may occupy more vertical space than standard collection cards and
   may lead a page before its title on narrow screens when the semantic heading
   remains correctly ordered for assistive technology.
2. Browse grids may vary spans for a lead work, but must use the existing gutter
   scale, stable aspect-ratio reservations, and native card/focus boundaries.
3. Long-form writing should use a readable measure of roughly 42rem/65–72
   characters inside the existing main canvas. It keeps Montserrat, native text
   colors, and compact heading scale.
4. Museum captions can extend the native media pattern with title, artist,
   date, medium, accession number, credit, rights summary, and source/preservation
   state. These are text hierarchy, not a field of pills.
5. Dossier navigation may reuse the one-pixel divider and active underline from
   the artwork-detail tabs. Technical evidence remains a later disclosure.
6. Quiet spacing may increase from dense app rows to the established editorial
   cadence already used by `ExploreWavesSection` (`tw-py-10` through
   `md:tw-py-16`). It should not become an oversized marketing hero.
7. Browse images may use intentional cover crops when the governed media model
   supplies a safe crop. Object/detail media remains contain-fit and uncropped.

## Explicitly rejected patterns

- Oversized serif headings, luxury-museum mastheads, or a detached editorial
  identity.
- Glass cards, frosted panels, ornamental gradients, glowing blobs, or a new
  shadow language. The existing translucent mobile dock is not a general card
  pattern.
- Dashboard metrics, count-first home sections, schema-browser tables, or raw
  JSON as the detailed experience.
- Repeated pills/badges for artist, project, gift, accession, rights, media, and
  status. Use prose hierarchy and captions; reserve badges for real compact
  product state.
- Uniform generic feature cards with icons and invented marketing copy.
- Rounded containers around every section. Large framing uses `rounded-xl`,
  standard controls use `rounded-lg`, compact details use `rounded-md`, and
  `rounded-full` remains for genuine pills, avatars, dots, or circular controls.
- New global CSS, a Museum CSS framework, or local hard-coded color tokens when
  Tailwind and existing components express the requirement.
- A Museum-only light mode or palette.
- Hover-only metadata or controls, hidden focus, uncontrolled horizontal nav,
  and animation without reduced-motion behavior.
- Artwork used as a decorative background behind copy, distorted media, silent
  image failure, or auto-executed third-party work.

## Later visual and computed-style evidence checklist

Visual acceptance requires real rendered pixels and computed-style readback;
DOM presence, HTTP 200, and CI are not substitutes.

### Side-by-side reference captures

Capture the same browser build, color environment, and viewport for each pair.

| Viewport | Native reference | Museum comparison | What must match |
|---|---|---|---|
| 1440 x 1000 | `/discover` | Museum home and programs | Global shell, rail, gutters, compact typography, focus language, restrained surfaces |
| 1440 x 1000 | `/the-memes` | Museum collection | Art-led grid, image dominance, card borders/radii, responsive spacing, readable metadata |
| 1440 x 1000 | `/the-memes/529` | A canonical Casey object | Large contain-fit art, two-column proportion, compact title, tabs/dividers, media controls |
| 1440 x 1000 | `/waves` | Museum home or artist page | Recognizable 6529 density, black/iron palette, native rail; Museum may be calmer but not detached |
| 390 x 844, true touch/mobile context | `/the-memes` | Museum collection | Native sticky header/off-canvas shell, two-column-or-intentional-single-column grid, no clipping |
| 390 x 844, true touch/mobile context | `/the-memes/529` | Casey object, still and live/fallback states | Single-column order, full available art width, readable caption, reachable controls, no overlap with app dock |

Also retain Museum-only evidence for artist, project, gift/dossier, Keys and
Gates, stale publication, empty collection/filter, image failure, live-work
failure, keyboard focus, and reduced motion.

### Computed-style readback

Record values from the native reference and Museum counterpart for:

- body `font-family`, base `font-size`, text color, and background;
- `.layout-root` maximum width and main/sidebar offsets;
- sidebar/header dimensions, background, divider color, and selected/focus
  treatment;
- page gutter and maximum-width values at desktop and mobile;
- heading font size, line-height, weight, and color at each viewport;
- card background, border color/opacity, border width, radius, padding, and gap;
- grid column definition and row/column gaps;
- artwork box dimensions, reserved `aspect-ratio`, `object-fit`, and fallback
  dimensions;
- button height, radius, font weight, disabled opacity, loading state, and
  focused outline/ring color/offset;
- tab/link focused state and active underline/divider values;
- loading skeleton dimensions and colors compared with final content;
- `documentElement.scrollWidth <= clientWidth` at all required viewports;
- reduced-motion media-query behavior and the absence of required hover-only
  controls.

### Interaction and state proof

- Keyboard from the native shell into Museum navigation, collection cards,
  viewer controls, dossier links, disclosures, and back navigation with no focus
  loss or trap.
- Pointer and touch access to every action; no essential control appears only on
  hover.
- Still visible before any live-work activation; explicit third-party/live
  disclosure; failure returns to a meaningful still and text alternative.
- Loading reserves the eventual artwork and text geometry.
- Empty, stale, unavailable, image-error, and live-error states explain the
  condition and provide a valid next action without presenting hashes as the
  main experience.
- Captions visibly include governed credit and rights information and do not
  claim retained media or IIIF completion when those assets are absent.

## Audit limitations

- This audit did not mutate the page to force hover, keyboard focus, loading,
  errors, or reduced motion. Those decisions are grounded in source and remain
  mandatory runtime evidence later.
- The 390px production read used the desktop-pointer branch and therefore did
  not prove `SmallScreenLayout`. Final mobile evidence must use a genuine
  touch/mobile browser context and show the sticky header/off-canvas navigation.
- Production can move independently of this branch. Before product sign-off,
  repeat computed-style and screenshot capture against the exact release
  candidate and the then-current production references.
