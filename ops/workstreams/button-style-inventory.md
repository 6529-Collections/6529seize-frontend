# Button style inventory: current landscape

**Status:** discovery overview

**Baseline:** `main` at `2bd1f1a` on 21 July 2026

**Change scope:** documentation only; this document does not propose a redesign,
component API, migration, or preferred visual treatment.

## Current state in one page

Buttons are not governed by one shared variant system. The application has a
small set of reusable button components, but most controls are native buttons
with local Tailwind classes or feature-specific wrappers.

A broad source scan of the main application found:

| Measure | Current result |
| --- | ---: |
| Native `<button>` elements | 1,103 |
| Files containing those buttons | 612 |
| Exact static class/CSS signatures | 792 |
| Button-like links (secondary heuristic) | 164 |
| Base background tokens or values used | 119 |
| Base text-color tokens or values used | 63 |
| Base border-color tokens or values used | 63 |
| Radius utilities used | 19 |
| Explicit height/min-height utilities used | 28 |
| Padding utilities used | 70 |

These are implementation signatures, not 792 meaningful design variants. A
single signature can contain alternative state branches, while equivalent
visuals can have different class order or implementation. The number is useful
as a measure of fragmentation, not as a proposed component-variant count.

A class-based role heuristic places the 1,103 native buttons into the following
broad implementation groups. Dynamic classes and context-dependent intent make
this directional rather than a semantic source of truth.

| Heuristic group | Native buttons |
| --- | ---: |
| Primary or filled | 467 |
| Outline or ghost | 198 |
| Pill or circular | 148 |
| Text or icon | 75 |
| Destructive | 43 |
| Success | 14 |
| Warning or special | 2 |
| Unclassified/dynamic | 156 |

The clearest current-state findings are:

1. **“Primary” has three meanings in shared code.** `PrimaryButton` is a light
   iron/white action, while `ActionButton` and `PrimaryButtonLink` are brand
   blue. Local primary actions also use brand blue, black, white, legacy blue,
   green, and other feature colors.
2. **Shared adoption is limited.** The three main shared components account for
   about 75 JSX call sites (`PrimaryButton` 44, `SecondaryButton` 23,
   `ActionButton` 8), compared with 1,103 native button elements.
3. **Waves are the densest surface.** The waves/brain/drop stack contains 419
   native button elements and 328 static signatures. One data-heavy wave-detail
   render exposed 596 visible buttons, mostly repeated drop, voting, badge, and
   media controls rather than hundreds of distinct visual roles.
4. **The scale is continuous rather than stepped.** Explicit source sizes run
   from 18px activity badges to controls with 58px minimum height. Rendered
   conventional controls in the reviewed views ranged from 13px score toggles
   to 64px play buttons; large media and card click targets extend far beyond
   that range.
5. **Interaction-state coverage is uneven.** 851 of 1,103 native buttons
   contain a hover treatment (77%); 467 contain a focus treatment (42%). Of the
   336 buttons with a disabled expression, 181 include an explicit disabled
   class treatment (54%). CSS-module and inherited states can make these source
   figures undercounts, but the gap is still material.
6. **Responsive behavior is component-specific.** At least 156 native buttons
   contain responsive classes and 12 explicitly hide a visible label at a
   breakpoint. Other icon-only behavior is driven by alternate components,
   touch detection, app mode, or layout selection and is not captured by that
   count.

## Audit boundary and method

### Phase 1: reviewed in this document

This first pass prioritizes the surfaces most people encounter:

- application shell and shared search/menu/modal controls;
- home/base view;
- waves feed, channel/wave detail, and the shared drop stack;
- direct messages;
- profile, identity, REP, NIC, and profile-wave content;
- network and group views;
- shared dialogs and overlays reached from those surfaces.

The source review followed route entry points into their layouts, reusable
components, feature components, and modal/dialog dependencies. It combined:

- an AST-assisted scan of production files under `app/`, `components/`,
  `contexts/`, and `hooks/` (tests and stories excluded);
- manual review of shared primitives and representative local implementations;
- rendered inspection on the local application at 1440 x 1000 and 390 x 844;
- computed-style sampling of visible buttons, including state attributes and
  accessible labels.

Rendered counts are snapshots of data- and authentication-dependent views, not
permanent totals. The mobile-width run tests responsive CSS at 390px. The app
also uses touch, Capacitor/app, and device hooks, so a narrow desktop browser
does not exercise every true-device branch.

### Overall baseline, deferred detailed review

The whole-app counts above keep the long tail visible, but the following areas
are not exhaustively classified in Phase 1:

- collection, minting, The Memes, Meme Lab, Rememes, and marketplace flows;
- NextGen and Drop Forge;
- distribution, delegation, mapping, and other specialist tools;
- admin-only routes;
- museum/media legacy areas and standalone applications.

They remain part of the 1,103-button baseline. Their variants should be
classified in later batches rather than mixed into the high-traffic overview.

## How the main views are composed

This map explains why the same controls recur across routes and where local
variants enter the tree.

| Surface | Route/component model | Main button layers | Typical overlays |
| --- | --- | --- | --- |
| App shell | `components/providers/LayoutWrapper.tsx` selects web or small-screen layouts; `components/header/AppHeader.tsx` and `components/header/AppSidebar.tsx` supply global controls | navigation buttons/links, 24–56px icon controls, header actions, user menu | global search, compact menus, account/about panels |
| Home/base | `app/page.tsx` -> home content and latest-drop/media components | shell controls, text CTA, link CTA, video/media controls | media preview and account/search overlays |
| Waves feed | `app/waves/page.tsx` -> `WavesPageClient` -> brain sidebar/feed/drop cards | create/add, wave scores, wave pills, activity badges, reactions, copy/link and media controls | create-wave/drop flows, artist preview, reactions, search, share/menu panels |
| Wave/channel detail | `app/waves/[wave]/page.tsx` reuses the waves shell and `MyStreamWave`/drop stack | header icon actions, 47px view tabs, submission controls, voting, drop actions, media controls | rules/restrictions, voting logs, drop actions, submission and delete dialogs |
| Direct messages | `app/messages/` reuses the brain/waves layout and `MyStreamWave` for an active DM | create-DM action plus the same composer, drop/message, reaction, copy, search, and media families used in waves | new-DM flow, message search, reactions and message/drop menus |
| Profile/identity | `app/[user]/` -> user layout/header, identity, REP/NIC, activity and profile-wave components | header actions, follow/rate, tabs, filters, category/text controls, statement/address controls | edit profile, rate NIC/REP, raters/categories, statement and delete dialogs |
| Network | `app/network/page.tsx` -> `CommunityMembers` and table/mobile list | filter/sort/nerd-view header actions, table sorting/pagination and row links | filter/group and mobile-sort dialogs |
| Groups | `app/network/groups/` -> group list/detail/create/edit components | full-card targets, search/filter, create/edit membership and destructive actions | assignment, create/edit, membership and delete dialogs |

The important structural overlap is that direct messages are not a separate
button system: active DMs render through much of the same brain/wave/drop stack.
Likewise, profile waves bring drop and media controls into the profile surface.

## Token reference used below

Where a class maps to the Tailwind theme, this inventory uses the repository
token name. The principal values are:

| Token | Hex | Current use in buttons |
| --- | --- | --- |
| `primary-300` | `#84ADFF` | lighter brand text/rings |
| `primary-400` | `#528BFF` | brand borders, text, focus rings |
| `primary-500` | `#406AFE` | shared/local blue primary fill |
| `primary-600` | `#395FE4` | blue hover/pressed fill |
| `iron-50`–`iron-950` | `#F5F5F5`–`#131316` | white/gray text, borders and surfaces |
| `red` / `error` | `#F97066` | semantic destructive/error treatment |
| `success` | `#83BF6E` | success treatment |
| `green` | `#3CCB7F` | positive state treatment |

Not all reviewed colors map to repository tokens. Notable exceptions include
the legacy blue set `#0d6efd` / `#0b5ed7`, destructive
`#F04438` / `#D92D20`, trophy amber `#ffc107`, browser/Tailwind palette blues,
and emerald utilities used by the NIC action.

## Reusable/shared button inventory

These are the closest things to shared primitives in the reviewed application.
Feature-specific shared components are included where they form a repeated
visual family.

| Shared source | Role and use | Default visual specification | States |
| --- | --- | --- | --- |
| `components/utils/button/PrimaryButton.tsx` | Light primary/action button; waves/drop creation, DMs, group cards, statements, subscriptions, dialogs, app header | `iron-200` background, `iron-950` text, white inset ring; 8px radius; semibold; default ~40px (`px-3.5 py-2.5`, 14px), small ~32px (`px-2.5 py-2`, 12px), large ~48px (`px-5 py-3`, 16px). Can render a link. | hover `iron-300`; `focus:` inset ring; loading spinner; disabled/loading opacity 50 and not-allowed cursor. No active treatment. Callers can fully alter geometry through `padding`/`className`. |
| `components/utils/button/SecondaryButton.tsx` | Dark secondary/cancel; profile editors, wave dialogs, groups, NFT picker | `iron-800` background, `iron-100` text, `iron-600/25` border plus `white/5` ring; 6px radius; semibold; default ~40px, small ~32px. | desktop hover `iron-700`; active `iron-900`; `focus-visible` `primary-400/60` ring; disabled switches to `iron-900`/`iron-600`; loading uses the same inactive style. |
| `components/utils/button/ActionButton.tsx` | Brand-blue submit/save action; profile name, classification, about and picture editors; wave follow | `primary-500` fill/border, white text, white/10 inset ring; 6px radius; semibold; default ~40px, small ~30–32px. | hover `primary-600`; `focus-visible` `primary-600` outline; disabled/loading opacity 50; loading spinner. No distinct active fill. |
| `components/utils/button/PrimaryButtonLink.tsx` | Brand-blue navigational primary; group selection/creation | `primary-500` fill/border with 1px `primary-400`→`primary-500` gradient wrapper; white text; 8px radius; 14px semibold; default ~42px including wrapper. | desktop hover `primary-600`; `focus-visible` `primary-600` outline. No disabled API. |
| `components/utils/button/WaveDropDeleteButton.tsx` | Destructive drop action in single-drop views | `red/5` fill, `red/20` border, `red/70` text; `px-4 py-3`; 8px radius; 12px regular. | hover strengthens red fill, border and text. No explicit focus, active, disabled or loading treatment on the trigger. |
| `components/common/TooltipIconButton.tsx` | Minimal icon/help controls in wave-creation forms | Transparent, borderless, padding 0; icon defaults to 16px `iron-400`; geometry is caller-defined. | Shows tooltip on hover or focus; base component does not supply a visible focus ring, active or disabled visual. |
| `components/compact-menu/subcomponents/CompactMenuItemButton.tsx` | Shared action/link row inside compact menus throughout shell, waves and profiles | Default item classes come from `components/compact-menu/constants.ts`; supports active, inactive, keyboard-focus and caller overrides. | Central menu-active focus state; disabled `iron-500` with opacity 60; can be intentionally unstyled. |
| `components/utils/radio/CommonBorderedRadioButton.tsx` | Large selectable option card in wave creation | `iron-800` or `iron-900` surface, 16px padding, 8px or 12px radius; selected state uses `primary-500/20` or `/5` and primary ring/text. | hover changes ring/surface; focus classes live on a wrapper rather than the native radio; disabled opacity 50. |
| `components/utils/button/actionButtonStyles.ts` | White high-emphasis CTA class used by the join flow | white fill/border, black text, min 48px, `px-5 py-3`, 10px radius, 14px semibold and white glow. | gray hover; `focus-visible` white ring; disabled opacity 70. |
| `components/waves/drops/ArtistActivityBadge.tsx` | Repeated compact submission/winner indicator in waves and profile-wave drops | 18px or 20px square; 6px radius; blue palette treatment for submissions or amber/yellow treatment for minted memes. | focus-visible colored ring; desktop hover lightens border/fill/text; tooltip is suppressed on touch/mobile. No disabled state. |
| `components/community/CommunityMembers.tsx` (`NetworkHeaderActionButton`) | Network filter, sort and view controls | 32px desktop / 36px compact height, 8px radius, 12px semibold; transparent `iron-300` default or `primary-500/15` active with `primary-300` text. | hover white/5; focus primary ring; active indicator dot. No disabled state. |

`PrimaryButton`, `SecondaryButton`, and `ActionButton` are reusable, but they do
not form a single coordinated variant API. Their names, colors, radius, state
models, available sizes, and link behavior differ.

## Scoped visual families actually in use

The following groups collapse exact class signatures into visual/intent
families. A family is listed separately when its color, geometry, state model,
or responsive behavior is materially different.

### 1. Primary and filled actions

| Family | Shared or custom | Appearance and size | States | Where it appears |
| --- | --- | --- | --- | --- |
| Light iron primary | Shared `PrimaryButton` | `iron-200`/`iron-950`, 8px radius, 12–16px semibold, ~32/40/48px presets | `iron-300` hover; inset focus ring; opacity-50 disabled/loading; no active style | add/create drop, Create DM, wave creation/submission, group actions, identity statements, app-header add action |
| Brand-blue action | Shared `ActionButton` | `primary-500`/white, 6px radius, ~30–40px | `primary-600` hover and focus outline; opacity-50 disabled/loading; no active style | profile edit save/submit actions and wave follow |
| Brand-blue primary link | Shared `PrimaryButtonLink` | `primary-500`/white, 8px radius, ~42px including wrapper | `primary-600` desktop hover and focus outline; no active or disabled API | group header/select flows |
| Brand-blue local CTA | Custom per view | Usually `primary-500`/white, but padding, border, radius and font differ. The rendered profile-gated Messages CTA was 44px, `px-4 py-2.5`, 8px, 14px semibold. | commonly `primary-600` hover; focus ring/outline, active and disabled treatment vary by file | message/profile gates, empty states, wave create/submit steps, profile subscriptions and other local CTAs |
| White join CTA | Shared class, not component | white/black, min 48px, 10px radius, 14px semibold | gray hover, white focus ring, opacity-70 disabled; no active style | `/join-6529` flow |
| Legacy Bootstrap-blue action | Custom duplicated classes | `#0d6efd` fill/border, `#0b5ed7` hover, 6px radius, `px-3 py-1.5`, 16px regular or bold | hard-coded hover; `primary-400` focus outline; opacity-65 disabled; no active style | `components/app-wallets/AppWalletModal.tsx`, `AppWalletImport.tsx`, `AppWallets.tsx` (seven buttons) |
| Emerald NIC action | Feature-shared `RateNicButton` | emerald-600 fill/border, white text, 8px radius, `px-3 py-2`, 12px bold (~32px) | emerald-500 hover only; no explicit focus, active or disabled style | profile identity/REP desktop and mobile compositions |

Near-duplicates in this group are not only color differences: the three
blue-primary families use both 6px and 8px radii, two state models, two link
models, and caller-specific height overrides. Conversely, the component named
`PrimaryButton` is the light family rather than the brand-blue family.

### 2. Secondary, outline and ghost actions

| Family | Shared or custom | Appearance and size | States | Where it appears |
| --- | --- | --- | --- | --- |
| Dark filled secondary | Shared `SecondaryButton` | `iron-800`/`iron-100`, subtle border/ring, 6px radius, ~32/40px, semibold | `iron-700` desktop hover, `iron-900` active, primary focus ring; disabled is recolored | modal cancel/back actions, profile editors, group create, wave flows |
| Iron bordered secondary | Mostly custom | transparent or `iron-900` fill; `iron-700`/`iron-800` border; usually 8px radius and 32–44px | hover usually lightens fill/border; focus, active and disabled styles are inconsistent | wave header (“How to Submit”, link/search), profile cancel/action rows, network controls, group forms |
| Transparent shell navigation | Custom shared shell implementation | transparent, `iron-400` text, 12px radius; rendered height 46px; active item becomes white | hover changes text/surface; selected color is route-driven; no common disabled state | desktop/global NFT, About, Search controls |
| Header utility square | Feature-shared/local | 24px toggle or 32/36px actions; `iron-800`/`iron-700` border, 8px radius; icons only | hover lightens iron surface/text; newer controls have primary focus outline/ring; active/disabled vary | sidebar toggle, wave copy/search/more/show-sidebar, network/filter controls |
| Tab/navigation text control | Custom per feature | transparent, no radius, 12–14px medium; underline/border or text color indicates selection; rendered 32–47px | selection changes underline/text; hover/focus treatment varies; usually no disabled style | wave Leaderboard/Chat/Winners/Outcome/FAQ, profile tabs, REP/NIC filters |
| Full-card ghost target | Custom | transparent button spanning the visual card; rendered 194–210px in groups and up to media height elsewhere | hover is normally expressed by the child card; focus and disabled coverage vary | group cards, drop/media previews, profile content cards |
| Search modal category | Feature-local `HeaderSearchTabToggle` | transparent `iron-300`, 8px radius, min 40px; selected `primary-500/15`, `primary-400/40` border | inactive iron hover; primary focus ring; selection via ARIA/tab state; no disabled style | global Search 6529 overlay |

This intent has the broadest gray drift. Similar secondary actions use
`iron-700`, `iron-800`, `iron-900`, `iron-950`, black/opacity surfaces,
white/opacity surfaces, transparent fills, and 6/8/12px radii.

### 3. Destructive actions

| Family | Shared or custom | Appearance and size | States | Where it appears |
| --- | --- | --- | --- | --- |
| Tinted red destructive | Shared `WaveDropDeleteButton` | `red/5` fill, `red/20` border, `red/70` text, 8px radius, `px-4 py-3`, 12px | red fill/border/text strengthens on hover; no explicit focus, active or disabled state | delete drop trigger in single-drop views |
| Solid legacy destructive | Duplicated custom modal classes | `#F04438` fill/border and `#D92D20` hover, white text, usually 8px radius, `px-4 py-3`, 14px semibold | hard-coded hover; loading/disabled branches vary by modal; focus/active usually absent | wave, drop, group and identity-statement delete confirmations; `CommonConfirmationModal` |
| Semantic-token red action | Custom/local | `red`/`error` text, border or tinted fill with variable geometry | hover and disabled treatment differ by feature; explicit focus is not universal | inline remove/unset/mute actions across waves, profiles and groups |
| Destructive icon/menu row | Compact-menu or local icon control | transparent/dark row with red text/icon; menu-sized rather than CTA-sized | compact-menu focus/disabled states when shared; local menu rows vary | drop and wave action menus, group/profile item menus |

There are 43 native buttons classified as destructive across the broad scan.
The shared drop trigger and confirmation actions use different reds and
different emphasis models, and several confirmation dialogs duplicate the
same hard-coded class string.

### 4. Success, status and one-off semantic actions

| Family | Shared or custom | Appearance and size | States | Where it appears |
| --- | --- | --- | --- | --- |
| NIC rating CTA | Feature-shared custom | emerald-600/500, white, 8px, ~32px, 12px bold | emerald hover only; no explicit focus, active or disabled state | profile identity and REP/NIC views |
| Score/status positive | Custom | transparent/tinted green or emerald text; often 20–24px pill/icon target | selection/popover states vary; usually no disabled treatment | wave scores, NIC confidence/status controls |
| Minted-meme activity | Feature-shared badge | yellow-500/10 fill, yellow-500/20 border, `#ffc107` text/icon; 18/20px square, 6px radius | lighter yellow desktop hover; yellow focus ring; tooltip off on touch; no disabled state | repeated across wave feed/detail and profile-wave cards |
| Art-submission activity | Feature-shared badge | blue-500/10 fill, blue-400/20 border/text; 18/20px square, 6px radius | lighter blue desktop hover; blue focus ring; tooltip off on touch; no disabled state | same drop surfaces as minted-meme activity |

The amber and blue activity treatments are internally shared through
`ArtistActivityBadge`, but they sit outside the repository's named semantic
tokens. `Rate NIC` is the prominent green filled action in the reviewed views;
the same primary-action role elsewhere is light or brand blue.

### 5. Text, link and compact data controls

| Family | Shared or custom | Appearance and size | States | Where it appears |
| --- | --- | --- | --- | --- |
| Inline text action | Custom | transparent, borderless, no padding or very small padding; `iron-300`–`iron-500` or `primary-300`; 12–14px | usually text-color hover; focus, active and disabled states vary and are often absent | copy, view raters, REP category, followers, received/given, setup/help actions |
| Score detail | Feature-local repeated | transparent, 11px semibold, 2px radius; rendered 13px tall in the waves sidebar | opens a detail popover; hover/focus treatment is subtle; no disabled state | every scored wave row |
| Wave/profile pill | Feature-local repeated | white/5 fill, white/15 border, `iron-200`, 6px radius, 20px height, `px-1.5` | hover/focus treatment is local to the badge implementation; no disabled state | open wave/profile-wave affiliation labels |
| Reaction/voter chip | Feature-local repeated | `iron-900/40`, `iron-700` border, white text, 8px radius; 30px, `px-2 py-1` | hover/selected treatment depends on reaction or vote context; disabled is uncommon | drop reactions and vote-log openers |
| Filter/segmented chip | Custom per view | `iron-950`/`iron-800`, 8px radius, 32px, `px-3 py-1.5`, 12px medium | selected fill/text changes; keyboard focus and disabled handling differ between filters | profile REP/NIC and direction filters |
| Subwave pill | Feature-local | black/iron translucent fill, white/10 border, 12px radius, 32px, 12px medium | iron/white hover; focus and disabled treatment are not shared | waves sidebar subwave action |

Several controls in this category render below common touch-target sizes because
their visual target is intentionally compact or nested in a larger row. The
source does not apply one consistent rule for whether the surrounding row also
activates the same action.

### 6. Icon-only and media controls

| Family | Shared or custom | Appearance and size | States | Where it appears |
| --- | --- | --- | --- | --- |
| App-header add action | Shared `PrimaryButton` with overrides | light fill, dark icon, exactly 36px square, 8px radius; visible label is screen-reader-only | inherits `PrimaryButton` hover/focus/disabled model; geometry is overridden | waves/channel header when adding a drop/action |
| Header/menu utility icon | Feature-shared/local | transparent or `iron-900`, 24/32/36/40px; 8px or full radius | iron hover and primary focus are common in newer code; active/disabled vary | search, share, more, close, back, filter and menus |
| Tooltip/help icon | Shared `TooltipIconButton` or local | transparent, padding 0, usually 16–32px; caller supplies icon color/size | tooltip on hover/focus; base component supplies no focus ring, active or disabled visual | wave creation and profile help affordances |
| Activity badge icon | Shared feature component | 18/20px square, 6px radius, blue or amber | colored desktop hover and focus ring; tooltip suppressed on touch | waves/profile-wave drop metadata |
| Reaction icon | Feature-local repeated | transparent, 28px circle, `iron-400` | hover lightens text/surface; selection and disabled depend on drop permissions | add reaction on drops |
| Copy/link overlay | Feature-local repeated | transparent or black/50–70, 32–36px circle | hover/focus vary by overlay; normally no disabled state | drop/media links and marketplace cards |
| Media toolbar | Feature-shared | 36px icon targets, transparent or `iron-950/70`; square or circle depending context | overlay visibility/hover changes; focus model differs between toolbar implementations | full screen, mute, open, download |
| Media play | Feature-shared | `iron-950/65`, 64px circle | hover strengthens overlay; no disabled state in ordinary playback | image/video content throughout home, waves and profiles |

Large media preview buttons and full-card buttons are native buttons but are not
comparable to ordinary CTA heights. They are kept as separate families so they
do not distort the action-button size picture.

### 7. Modal and overlay actions

The reviewed views use several modal button models in parallel:

- dialogs using `PrimaryButton` + `SecondaryButton` (common in newer wave and
  profile flows);
- local paired cancel/confirm buttons with `iron-900` secondary and brand-blue
  or solid-red confirm classes;
- `CommonConfirmationModal`, which accepts caller-supplied confirmation classes
  and currently participates in the hard-coded red family;
- `MobileWrapperDialog`, which standardizes the container/close affordance but
  not the footer actions;
- compact-menu rows, which standardize menu interaction but allow full style
  overrides;
- the global header-search overlay, which has its own dark icon, category,
  retry and recent-search controls (32/36px close/back and min-40px category
  tabs); the separate wallet/address `SearchModal` also has its own light/dark
  button constants.

As a result, opening a modal from a shared view does not imply a shared action
style. The same Cancel/Save/Delete intent can be supplied by a primitive, a
local class string, or a caller override.

## View-by-view findings

### Broad source concentration

The areas overlap because shared components are counted in each relevant route
stack.

| Area | Native buttons | Files | Static signatures | Main observation |
| --- | ---: | ---: | ---: | --- |
| Shell/layout/header | 70 | 36 | 50 | global icon and navigation controls already span 24, 36, 46 and 56px |
| Home-specific | 5 | 4 | 5 | local button count is small; shell, links and media controls dominate the rendered view |
| Waves/brain/drops | 419 | 245 | 328 | largest concentration and widest mixture of action, data, badge and media controls |
| Messages-specific | 3 | 3 | 3 | deceptively small because active DMs reuse the waves/brain/drop implementation |
| Profile/user | 161 | 102 | 124 | dense mix of text controls, tabs, identity actions, profile editors and embedded drop controls |
| Network | 19 | 7 | 11 | compact filter/sort controls plus CSS-module/table/link interaction |
| Groups | 45 | 28 | 37 | card targets, form actions, membership and destructive dialogs |

### Rendered samples

| View and state | Desktop sample | 390px sample | What changed |
| --- | --- | --- | --- |
| Home | 10 visible buttons, 7 computed families, 24–64px | same visible count/families; layout becomes single-column | shell/media button families remain; content reflows and the subscription setup action occupies a taller card row |
| Waves feed | 79 visible buttons, 18 computed families; 13px score to 256px media target | 29 visible, 7 families in the sidebar-first state | content panel is removed from the initial narrow view; add remains a 36px icon, scores remain 13/24px |
| Wave detail (data-heavy Winners tab) | 596 visible buttons, 22 families; 13px score to 384px media target | 570 visible after data load, 18 families; conventional controls start at 20px | sidebar is removed, back/more actions appear, header labels collapse, tabs stay 47px, repeated content controls remain |
| Messages (profile-gated account) | 6 visible buttons, including 44px brand-blue Create profile | same 6 visible families | gate CTA is stable; an active DM would reuse wave/message controls rather than this gate |
| Public profile identity | 51 visible buttons, 22 families, 12–56px | 29 visible buttons, 18 families, 16–56px excluding a 162px content target | identity cards stack, condensed tabs scroll, some REP/NIC filters and secondary details move or hide |
| Network | 7 visible buttons, 6 families, 24–56px | 7 visible, 5 families, 24–46px | sort moves into a mobile action; filter/sort grow from 32 to 36px while Nerd view changes padding |
| Groups | 25 visible buttons, 5 families; card targets 206px | 26 visible, 7 families; card targets 194–210px | one-column/overflow behavior introduces a 28px circular scroll action; card targets remain full-surface buttons |

The wave-detail count validates the original rendered observation of hundreds of
button elements. It also shows why raw element count and visual-variant count
must remain separate: 100 activity badges, 100 open-drop controls, 100 voter
chips, 91 media toolbar actions, and 63 wave pills account for most of the
sample.

## Responsive and device-specific patterns

1. **Width and device mode are separate inputs.** `LayoutWrapper` and related
   hooks select web, touch/small-screen and app layouts. Tailwind breakpoints
   then change individual controls inside the selected layout.
2. **Labels collapse locally, not by one global rule.** Examples include the
   single-drop Close and Show/Hide Chat controls, which are 44px circles with
   hidden labels below `sm` and become labeled, auto-width 8px-radius buttons at
   `sm`; Unset and several wave/drop labels use similar local `sm` rules.
3. **Some compact actions use alternate controls.** Wave detail replaces the
   labeled desktop header set with Back, Search, and More icons at narrow width.
   Network exposes a mobile sort action, and groups adds a circular horizontal
   scroll control.
4. **Some actions are icon-only at every width.** The app-header add action uses
   a 36px square `PrimaryButton` override with a screen-reader-only label.
5. **Targets do not share a mobile minimum.** Reviewed narrow controls include
   18/20px activity badges, 20px text/pill actions, 28px circular controls,
   32/36px utilities, 44px single-drop controls, and 46/47px navigation rows.
6. **Hover behavior is intentionally conditional in some newer components.**
   `desktop-hover:` avoids touch hover states, while older/local buttons use
   ordinary `hover:`. Both approaches appear in the same views.

The source scan found responsive behavior in 156 native buttons. The highest
concentrations are waves (67) and profile/user (54), followed by the shell (5).
Twelve buttons explicitly hide their visible label and become icon-only, but
alternate mobile component trees mean the real number of icon-only differences
is higher.

## Largest consistency gaps to carry into later work

These are observations, not proposed fixes:

1. **Semantic naming and visual intent are out of sync:** light `PrimaryButton`
   versus blue `ActionButton`/`PrimaryButtonLink`, plus local blue primaries.
2. **Equivalent roles use different palettes:** multiple primary blues,
   multiple iron/gray secondary surfaces, token red and hard-coded red, plus
   emerald/amber/blue feature semantics.
3. **Equivalent roles use different geometry:** at least 19 radius utilities,
   28 explicit height/min-height utilities and 70 padding utilities; 6, 8, 10
   and 12px radii all occur in high-emphasis actions.
4. **State models vary by implementation:** `focus:` versus `focus-visible:`,
   ring versus outline, ordinary versus desktop-only hover, optional active
   states, and opacity-only versus recolored disabled states.
5. **Shared components are easy to override and not universally adopted:**
   callers change padding/size directly, while many features duplicate the
   resulting classes instead of using the components.
6. **Modal containers and modal actions are separate systems:** shared wrappers
   do not guarantee shared Cancel/Confirm/Delete treatments.
7. **Responsive collapse lacks one observable rule:** some labels hide, some
   actions move into menus, some components swap, and some small controls remain
   small on touch layouts.
8. **Button counts mix fundamentally different interaction types:** CTAs,
   tabs, data chips, full-card targets, media canvases and toolbar icons are all
   native buttons. Any later consolidation inventory needs to preserve these
   categories rather than compare them on one size scale.

## Suggested audit batches (coverage only)

This is a sequence for completing discovery, not a standardization plan.

1. **Phase 1 — this document:** main shell, home, waves/channel detail, direct
   messages, profile/identity, network, groups, and their shared overlays.
2. **Phase 2 — high-traffic action flows:** create wave/drop/DM, wave
   submission and voting, profile editing/rating/statements, group
   create/edit/membership, and every dialog state reached from those flows.
3. **Phase 3 — collection and commerce:** The Memes, Meme Lab, Rememes,
   collection detail, minting, marketplace and related media/lightbox controls.
4. **Phase 4 — specialist and long-tail surfaces:** NextGen, Drop Forge,
   distribution/delegation/mapping tools, admin routes, museum/media legacy and
   standalone applications.

Each later batch can extend this same family taxonomy and distinguish new
families from exact duplicates. No visual direction should be inferred from
the ordering above.
