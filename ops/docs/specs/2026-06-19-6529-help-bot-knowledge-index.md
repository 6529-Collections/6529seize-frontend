---
title: 6529 Help Bot Knowledge Index
version: 0.1
status: draft
created: 2026-06-19
---

# 6529 Help Bot Knowledge Index

The `waves.native-competitions` record covers optional anonymous submissions,
their default-off creation setting, publication lock, per-entry winner reveal,
continued anonymity across later draws, own-entry access, and submitters'
responsibility for identifying information in authored content or metadata.
Unrevealed entries bypass account blocks to prevent author identification;
related author notifications also bypass account blocks and identity mutes
until that entry wins. Explicit drop hiding, platform moderation, and ordinary
notification filters remain effective.

The `profiles.identity-tab` record covers the existing-category Rep editor,
its permission rules, stable allowance loading, retry action, and dismissal.

The search record covers punctuation-tolerant Wave names across site search,
sidebar search, composer mentions and the message-search Wave picker. It explains
all-term matching, partial names, relevance ordering, literal wildcard characters,
and each surface's existing minimum-length and access rules.

The `profiles.followers-tab` record points to the profile header's Followers
dialog and private Following list. It covers own-profile authentication and
proxy restrictions, total counts, pagination, profile navigation, unfollowing,
and error recovery. The legacy followers URL remains a redirect.

The `content-moderation.controls` record covers WatchTower's red Deleted pills,
reasoned and confirmed resolution of open reports for a deleted post, retained
evidence and history, and the distinction from Mark reviewed. Live originals
have a dedicated post link; deleted posts hide that action and identify saved
evidence without claiming expired evidence remains available. Saved previews
include post titles and textual parts. Needs review is the default queue of
unique subject-based cases covering user reports and pending checks, with a
shared sidebar signal and summary/tab count and a compatible older
open-reports link. Review case opens all outstanding cases on the left with the
selected case highlighted and its reports, checks and evidence on the right.
The Needs review only toggle applies review status immediately, preserving other
applied filters. Filter checks opens advanced controls explicitly; edits remain
pending until Apply filters synchronizes the results and toggle. Quick toggles
preserve other drafts and the panel's open/closed state. Additional filters browse
individual check history. Back to list appears on mobile; desktop uses the
visible list without a redundant back button. Automated outcome is distinct
from deletion and manual review status.

The `home.overview` record also describes the shared hero artwork and copy, with
Connect wallet followed by Start here for logged-out visitors. The hero uses a
fixed selection of Meme cards #1–5, with #1 at the front, independent of mint state. The visitor-only
What is 6529? section explains art, Waves, and participation, linking to
`/the-memes`, `/waves`, and The Memes - Main Stage Wave respectively.

The `home.overview` record describes the shared discovery cards on the homepage:
covers beside the content on mobile and filling the card behind a dark, image-tinted text
fade on larger screens. Homepage
cards retain wave descriptions and activity rather than showing latest chat
messages or message authors. Explore Waves keeps its existing layout.

The `home.overview` record describes the typography-only hero without artwork,
while preserving the original copy, onboarding actions, and authentication rules.

The `home.overview` record maps the first three How to start headings to the
wallet flow, profile guide, and Waves. Collect or create has a plain heading and
two inline links within its existing sentence: “Hold Meme Cards” opens
`/the-memes` and “submit your own art” opens `/about/apply`, explaining submission
eligibility and nominations for new artists. Restricted iOS visitors keep the
browsing/community description without those links. The record includes the
“Four steps into 6529.” introduction, the “Read the full guide” link, and
“Explore Main Stage” as the A real say card's link to
`/waves/b6128077-ea78-4dd9-b381-52c4eadb2077`.

The `home.overview` record explains the Coming up full-width vertical card
list below 768px, keyboard navigation through card links, tablet/desktop grid,
and drop, profile and wave destinations. It also explains the optional next
voting-decision time in the visitor's local time zone, including daylight-saving
adjustments, and omission when no future scheduled decision is available. The
label uses today, tomorrow, a weekday for two to six days ahead, or a short
month/day for later dates. Its hover title retains the full local timestamp.

The `home.overview` record also describes the homepage-only two-row countdown,
with the complete phase heading above a dark timer row, zero-padded segments,
and responsive wrapping. The countdown uses background contrast without outlines.
Subscription awareness appears above the Latest Drop countdown. It keeps its
toggle beside the title and its contextual action aligned right, with details
below and a stacked fallback in narrow cards.
The shared phase-selection and mint-action rules are unchanged.

The `the-memes.minting` record explains that Latest Drop and mapped Next Drop
cards omit Your allowance until a wallet address is available. Connected wallets
retain allocation pills and distinct loading, unpublished, empty, and unavailable
states; an allocation does not guarantee that it remains mintable.

The `waves.artist-submissions-popup` record explains the artist activity icon,
Active Submissions promise badges, and the distinction between reading a badge,
opening artwork, and casting a vote.

The `waves.drop.editing` record covers author-only editing, the normal edit
window, and unlimited editing of the wave's current pinned description drop.

The `about.6529-apps` record includes a concise `brief_answer` naming both
6529 Mobile and 6529 Desktop and an `answer_links` footer to the official Apps
page. The companion backend uses it for short availability/download requests
such as "is there an app", "6529 app", and contextual "link?" replies.

The `waves.native-competitions` record covers competition collections and links,
shared chat, independent credits, native entry content, draft/publication and
terminal lifecycle rules. It qualifies availability rather than promising
controls in every deployment, and retains the original-wave experience in its
navigation guidance. Backend runtime continues consuming the published corpus.
Its setup guidance identifies the Competition type desktop dropdown and
small-screen bottom sheet, including selection and dismissal behavior, and
keyboard-aware name and description fields in the app's setup editor.
Its navigation guidance distinguishes the app's compact collection and Votes
pills from web tabs and the shared published-competition wave row. The collection
uses More for its remaining choices.

The `waves.content-tabs` record describes steady tab rows with screen-reader
loading announcements, section-specific loading, and destination-bound competition
controls. It also explains that app tabs already in view keep their position
when selected. It does not promise instant data or a loading screen on every switch.

The `waves.leaderboard.sort-group-filters` record covers Main Stage's one-tap
Additional Action checkbox, independent sorting and view selection, complete-result
filtering including promises without plans, reset behavior, and empty/error recovery.
It directs readers to artwork details for the optional plan and distinguishes the
artist's promise from verification of approval or fulfillment.

The Wave discovery record describes the independent Active Votes and Worth Checking Out
sidebar sections, their explanations and view-all destinations. It describes
quiet loading placeholders, explanations that appear with content, empty messages
only after successful empty requests, and retry without discarding loaded votes.
It covers the scrollable three-row voting window, pagination, compact empty/error states and
independently persisted collapse preferences. Worth Checking Out comes first
and retains its own compact preview height.
The discovery and Network wave score records also describe returning from Score
formula: the app header Back control restores the originating Discover URL and
its selected sort and threshold; the page link provides the same return on web.
The Memes Quick Vote record describes its persistent top-left close below 768px,
top-right close at wider widths, matching loading header and focus restoration.

The `delegation.wallet-checker` record covers linked-wallet reads with a
six-counterparty cap, pair deduplication, relevant missing-reverse-link
recommendations, waiting for the active-consolidation request, and partial
results after a linked-wallet failure. It also explains that absent pairs have
no recommendation and listed registrations do not themselves establish active
counted membership or activate four-wallet support.

The primary-address and consolidation records distinguish immediate primary
selection from the roughly seven-day, 50,400-processed-block rule for profile
retention after a split. The subscription record covers balance and setting
merges, manual quantity precedence over All eligible, priority preservation,
highest-TDH split routing, and finalized-allocation conflicts that need manual
reconciliation. The subscriptions overview also explains that profile history
sections start closed on phones and preserve user toggles during resizing or
data refreshes. The profile subscription record also explains how tapping,
hovering, or focusing the address reveals its full value on compact layouts.
These remain frontend-owned facts published through the existing
help-index sync and consumed by the existing backend loader.

The `waves.notification-controls` record describes the notification subview inside the About sheet
on phone layouts, dismissal back to About, and the anchored keyboard-accessible
menu in desktop and tablet sidebars.

The `network.identities-leaderboard` record describes the mobile filter's vertical
criteria list, individual editors, Back navigation, preserved drafts, and
readiness guidance available from the information button. On mobile, the selected
criteria summary is a filled card at the end of the list or editor, scrolling
with the content while only the create action remains fixed. Desktop keeps the
summary beside the action. Create Wave uses the matching mobile summary card
in the form's scroll flow. The top summary appears only for a selected group.
Both identity tabs omit repeated empty-selection and import messages, and the
bottom summary retains the combined counts. The xTDH grant
search shows Clear filters only when a collection name or grantor is set;
clearing preserves the active status tab without removing a selected grant.
On mobile, grant search fields and cards share one scroll area, with Load more
after the last loaded card and sheet navigation and the bottom action accessible. Desktop retains
the left-side criteria list, and saving still creates and applies a new group.

The `the-memes.list-sorting` record explains the phone's sticky, horizontally
scrollable sort controls, side-by-side Year and Season filters, bottom sheets,
and square card previews. Existing sorting, query, and detail-page guidance
continues to apply.

## Problem Statement

Users often ask practical product questions in Waves instead of finding the
right page or control themselves. Some questions are glossary-like, for example
`what is TDH`, while others are workflow questions, for example `how do I create
a wave` or `how do subscriptions work`.

The 6529 Help Bot, also referred to as the helper chatbot, needs reliable
product knowledge and accurate 6529.io links. The backend should not inspect the
frontend repository, GitHub, or a live rendered page while a user waits for an
answer. The frontend should provide a structured, versioned help corpus that can
be synchronized by the backend and used for retrieval-augmented generation.

The agreed bot handle is `@help6529`. The first runtime release ships without
full RAG, but it now uses a frontend-owned curated help index rather than
backend-owned frontend product records. The source lives at
`ops/help/help-index.json`, the sync step writes `public/help-index.json`, and
the backend consumes the deployed `/help-index.json` with a short cache.

The wallet connection and Wave composer records explain **Sign in to 6529 to
post**, the wallet chooser, and the **Sign message** step. The sign-in explanation
confirms address ownership, with no transaction or gas fees. Profile setup and
Wave permissions still determine participation after authentication.

The drop open/copy record includes the visible **Share** action in an opened
drop's header, including the artist-badge preview entry path. It describes
system sharing, confirmed clipboard fallback, silent cancellation, temporary
drop availability, and the existing Main Stage, Quorum, and direct-message URL
rules. Sharing a direct-message URL does not grant conversation access.

The direct-message record covers **New message**, its responsive web bottom sheet
and desktop dialog, its **To** recipient field,
search results that remain visible after keyboard dismissal, removable recipient
chips, selection circles, and the **Message** action for one person or a group.
It also describes retry behavior and the native screen's hidden tab bar.

The Memes submission profile and wallet signing record covers the EIP-712
**Submit a Meme Card to The Memes** action, readable artwork and destination,
terms agreement, and submission-only scope with no gas fee. Its five-minute
authorization expiry does not expire a completed submission or the agreement.
The record distinguishes canceling a wallet request, which retains the open
draft, from closing the submission modal, which discards it. Wallet layout and
classification vary; failed typed signing does not trigger a text-signature
fallback.

The Stream review record includes its four current entry guides and the
**All topics** navigation. Its collector and code-review guide links refer to
current pages; those guides are not invented as historical snapshot routes.

The Meebits #445 record explains the compatibility viewer's Coinbase ETH/USD
feed, automatic retries, and animated background. It directs users to the
card's **Details** tab for the original Arweave artwork and metadata.

The collecting record describes results below the goal controls, priced
quantities, costs and explicit budget-versus-available scenarios. **Collect now**
opens purchase selection and **Make offers** opens per-NFT offer pricing.
Listing-card facts distinguish compact ETH prices from expandable Exact amounts;
shortened prices do not change listing terms or purchase quantities.
The card records preserve `focus=the-art` deep links to the Memes and Meme Lab
**Overview**, where artwork details follow the description. The **Listings & offers**
tab opens the market directly without another accordion. Primary and History tab changes keep the tab row visible and
show the selected section from its top while deferred content loads.
The Memes card record also describes the mobile Collectors list, with Balance,
TDH and Unweighted TDH headers over This card and Total rows, its six sort
metrics and separate direction arrows, identity filtering, 25-row pagination,
and full-value CSV export. On narrow screens the list scrolls horizontally by
swipe or keyboard, keeping labels and values on one line. Screens 768 px and
wider use the sortable table.
Compact values are presentation only.
The Listings and Offers record distinguishes direct **Collect** and **Sell**
actions for one order from the explicit choice among multiple orders at a price.
The Meme card record places connection guidance first when needed, then Collect
and Make an offer beside the more-actions menu. Collect keeps its complete label
and price; Make an offer can shrink. Very narrow panels place Collect on its own
row above the other controls. When Collect is present, the available List action moves into the menu; without
Collect it takes the second slot, or Make an offer spans both slots if List is
unavailable. Review offers remains available in the menu. Delivery controls appear
below the actions once the required wallet is connected. View listings & offers
has a separate navigation row below Supply details & rankings. Labels, action
availability and wallet requirements stay unchanged.
Tabs and the off-screen action replacement stay sticky below 1024px, matching
the single-column card layout; selected-listing review retains bottom-bar priority.
Market browsing facts describe quiet periodic updates while visible and idle,
paused for expanded order details, a chosen listing or open review as applicable.
Healthy and empty states have no routine Refresh action; retrieval failures retain
Try again or Retry details, as shown.
Captured quotes are not guaranteed executable orders, and browsing updates do
not replace the exact checks at preparation and Continue in wallet.
The Collect navigation label opens the set planner. Individual purchase facts
describe separate Pay with and Deliver to rows, expandable full wallet addresses,
and editing delivery from expanded delivery rows on every supported purchase,
including selected listings, Collect purchases and saved purchases in Orders.
For multiple items or split deliveries, an edit retains all other NFTs and
allocations. Choosing an existing destination for the same NFT combines its copies.
Send to me offers confirmed profile wallets; Send to a fren supports a profile,
ENS name or wallet address. The chooser shows available profile picture, name,
profile level and profile TDH, plus each wallet's TDH when known. Level describes
the profile, not an individual wallet. These cues do not replace checking the
full resolved destination address. Use this address applies the selected
destination to a fresh review, Cancel retains the current one, and an external
address requires confirmation. Continue in wallet stays disabled until the edit
is applied or cancelled; confirmation is unavailable while the new review prepares.
Delivery editing is unavailable during a wallet transaction or
outcome recovery. Purchase facts also describe included order fees, network fee
caps and conditional maximum totals. Price breakdown, nested Exact amounts and
Contract details preserve precise amounts,
permissions and named Ethereum contract identities. Continue in wallet checks
current terms and refreshes quotes when needed for purchases, listings, offers,
sales and cancellations, including supported multiple-item purchases. Changed
terms require another review; unresolved sends are checked instead of resent.
View listings & offers selects the market tab from other token detail views;
switching tabs retains the market selection and active review.

Meme Lab card records include the shared Collect, Make an offer, List and Sell
controls, exact-card eligibility checks, edition quantities and purchase delivery
choices. Meme Lab trading is distinct from the Memes, Gradients and Pebbles
universe used by the set planner, Lowest listings and TDH tools.

Collecting strategy records cover Collect now, At WETH offer, WETH + %, Ask − %,
and Blended. They distinguish per-NFT calculations, separate ETH purchase and
WETH offer budgets, exact listing quantities, and reservations that do not imply
a submitted or confirmed purchase.

The EMMA record covers the five fixed collection shortcuts, Memes season
selection, Intern JPG token IDs, and the manual contract path in Create Snapshots.

The Memes mint-route record covers **Confirm in your wallet**, the expandable
**Wallet not showing?** instructions, **Mint submitted**, and the
receipt-confirmed **SEIZED!** state. Artwork details, **Quantity**, and the full
destination stay visible throughout; the destination label changes from
**Recipient** to **Minted to** after confirmation. Pending states cannot be
dismissed; a wallet request can be rejected in the wallet before submission.
The record distinguishes **Done**, available after confirmation, from the
optional **View transaction** link, which opens a new tab. An unavailable
artwork preview does not imply a failed mint.

The artwork documentation record owns the six-chapter writing flow, named next
chapter controls, **Answer options**, deliberate examples, file preparation,
**Read the draft** and saved publication previews. It distinguishes program
viewers from editors, describes read-only answers and source comparisons, and
keeps questions, draft content and dated confirmed versions separate. Its
control names must match the artist workspace and personal record list.

The interactive text-entry record covers iPhone and iPad Safari focus behavior,
continued Safari pinch zoom, and the native app's keyboard space for artwork
frames. Its canonical answer links to Waves and its source includes the shared
browser zoom guide. Artwork files and sandbox permissions stay unchanged.

The artwork-sharing record covers the `Share artwork` icon in the existing
media controls: over the artwork on individual Meme and Gradient pages, and
in the strip below the artwork on NextGen pages. It covers canonical artwork
links, copied captions, and feed, square, Story, and landscape PNG exports.
The dialog shows the preview first, with an `Image format` menu and a primary
image action. `Caption and link` starts collapsed with an adjacent `Copy`
control, while `Share a link` groups destination actions and the copyable URL.
Copy failures reveal and select the exact text for manual recovery.
It distinguishes link composers from file sharing, includes Instagram's
save/share-and-paste flow, and explains preparation failures and device-dependent
share destinations.
It does not claim automatic posting or successful publication after a handoff.

The profile tab record covers immediate selection feedback, the persistent header,
scroll preservation with natural settling for shorter content, and clearing
Collected transfer selections when leaving that tab. It preserves shared
`address` and `locale` parameters and describes the xTDH Granted default.

The profile website studio records cover 39 editable templates (23 original
compositions and 16 credited Memes inspirations), page and menu editing, image
uploads, indexed wallet galleries, and the profile header's published Website
link. They describe readable custom page addresses while preserving archive
paths, owner-only save and publish, browser recovery, wallet signing, version
restoration, and unpublishing. Upload records explicitly state that image files
become public before the website is published. The optional agent record covers
complete multipage file exchange and temporary access to one saved draft through
the local MCP adapter, using the owner's external inference account. It covers
review, revocation, expiry, unchanged artwork catalogs, interrupted-save recovery,
and the separate first-page legacy patch controls. These records link to the studio's
user guide and distinguish removing the active website pointer from deleting
immutable storage. Per-page sharing-image choices and automatic reset, search
visibility (`noindex` pages remain public), and Apply/Discard form recovery behavior are
also included.

The `groups.eligibility` business-rule record mirrors the backend eligibility
specification in the frontend-owned corpus. It covers configured zero bounds,
Level zero and negative scores, empty and identity-list-only groups,
inclusion/exclusion precedence, inclusive rating bounds, zero totals, rounded-down
xTDH, and member-preview parity. It distinguishes invisible saved groups from
the `Hide criteria and members` privacy control. The Wave access guide owns the
user-facing explanation, and Network's group-scope guide links to it. Publish
these facts after the corresponding backend SQL behavior is deployed in each
environment; the help runtime continues to consume `/help-index.json`.

## Goals

- Define frontend-owned source material for 6529 Help Bot answers.
- Make frontend routes, page meanings, UI entry points, and user-facing docs
  available to the backend through a generated help index.
- Support broad natural-language questions without requiring a predefined list
  of questions.
- Preserve accurate canonical 6529.io links in generated answers.
- Make important UI affordances discoverable, such as the `+` button that opens
  wave creation from the Waves panel.
- Keep the live bot answer path fast by publishing an index that the backend can
  cache.

## Non-Goals

- Implement the bot runtime in the frontend.
- Add a user-facing help center UI in this iteration.
- Index every component or every line of source code.
- Let the LLM infer routes or UI locations from raw code at answer time.
- Replace existing user-facing docs under `ops/docs`.

## Terminology

- 6529 Help Bot: the product-facing bot identity that users mention in Waves.
- Helper chatbot: a friendly alias for the same capability.
- Help corpus: all indexed records and chunks available for retrieval.
- Help index: the generated artifact consumed by the backend.
- Curated record: a manually authored record for a term, workflow, route, or UI
  action.
- Doc chunk: a searchable chunk generated from existing product docs.
- UI affordance record: a structured record describing a control, location,
  prerequisite, and result.

## Source Ownership

The artwork Review offers guidance places that action in the more-actions menu
on artwork pages. It includes
the responsive review layout: when a connection is required, wallet guidance and
Connect wallet share the same top card as Make an offer, before the order list.
The order list scrolls above quantity and Review exact terms, which remain visible
at the bottom of the phone sheet and desktop dialog. Connected wallet details remain beside those bottom
controls. The Meme trading block uses one initial loading placeholder before revealing its controls, without replacing them during background listing refreshes. Order selection and wallet authority remain unchanged.

The NFT activity record describes both wide-screen columns and stacked rows on
narrow screens, with the same activity information, links, filters and pagination.

The Collect workflow record owns `/collect` and `/collect/orders`, profile-wide
set scope, direct gift recipients, marketplace review and recovery, observed
price/TDH coverage, and saved rules that prepare purchases for wallet approval.
Its facts must distinguish profile collecting from wallet authority and quote
freshness from signed-order expiry. It must never imply an unattended spending
mandate or exhaustive marketplace coverage.
For an uncertain wallet broadcast, the record also explains **Checking the
outcome**, **Transaction hash from your wallet**, and **Check this transaction**.
Recovery checks the original action and does not send a replacement transaction.

The frontend should own source-of-truth records for frontend concepts and
navigation because the frontend owns:

- routes and route metadata
- sidebar and page entry points
- user-visible UI labels
- page-level product documentation under `ops/docs`
- affordances such as buttons, menus, tabs, and empty-state calls to action

The backend should own caching, retrieval, embeddings when added, job
orchestration, LLM calls, message reactions, and bot replies.

The backend also owns Help6529 Credit accounting. The V1 public behavior is
indexed here so users can ask about it: the credit category is `Help6529
Credits`, each bot question costs 1 REP in that category, signup grants 5,
profile setup grants 5, and daily activity grants 5 when a user sends any
message that day. Automatic daily activity grants do not have a balance cap.

## Agent Maintenance Contract

Future agents must update the help bot knowledge materials when frontend changes
affect what users can ask `@help6529` about. This applies to:

- new or renamed routes
- new product terms or changed user-facing definitions
- workflow changes, especially multi-step creation or eligibility flows
- prominent controls and UI entry points, such as create buttons, tabs, menus,
  empty states, and settings panels
- canonical links, route redirects, or page moves
- docs under `ops/docs` that explain user-facing behavior

For the current V1, keep `ops/help/help-index.json` aligned with the UI in the
same PR as the frontend feature change, then run `6529 run help-index:sync` so
the generated `public/help-index.json` stays in sync. Do not rely on the
backend, LLM, GitHub lookup, or source-code inspection to discover new frontend
routes or controls at answer time.

Do not add migrated legacy WordPress pages to the help index. These pages are
dated content snapshots and should not be used as bot knowledge or returned as
canonical answer links. The sync step rejects records whose canonical or related
paths resolve to WordPress-migrated route files, and rejects `source_refs` that
point at those files.

The mobile handoff route `/open-mobile` is excluded from help knowledge entirely,
including facts, links, related paths, and source references. The publishing
validator rejects records that reintroduce it. App downloads use the official
6529 Apps page; the handoff route is not a help destination.

## Proposed Help Sources

### 1. Curated Glossary Records

Use curated records for core terms where the bot must be concise and accurate:

- TDH
- xTDH
- Rep
- CIC
- NIC
- Waves
- Drops
- Groups
- Subscriptions

Recommended fields:

```json
{
  "id": "network.tdh",
  "kind": "glossary",
  "title": "TDH",
  "aliases": ["tdh", "total days held"],
  "facts": [
    "TDH stands for Total Days Held.",
    "TDH is a time-weighted NFT holding metric.",
    "TDH uses days held, edition-size weighting, and active boosters."
  ],
  "canonical_path": "/network/tdh",
  "related_paths": ["/network/definitions", "/network/tdh/historic-boosts"],
  "tags": ["network", "tdh", "metric"]
}
```

### 2. Curated UI Affordance Records

Use UI affordance records for common actions users miss even when the control is
visible.

Example:

```json
{
  "id": "waves.create.entrypoint.sidebar",
  "kind": "ui_affordance",
  "intent": "create_wave",
  "title": "Create a wave from the Waves panel",
  "aliases": ["create wave", "make a wave", "new wave", "start a wave"],
  "facts": [
    "Click the + button at the top-right of the Waves panel.",
    "The action opens the Create Wave flow.",
    "Create controls require a connected profile.",
    "Wave types are Chat, Rank, and Approve."
  ],
  "canonical_path": "/waves/create",
  "ui": {
    "surface": "waves_panel",
    "control": "+ button",
    "position": "top-right of the Waves panel",
    "requires": ["connected profile"]
  },
  "tags": ["waves", "create", "ui-action"]
}
```

The exact schema can evolve, but the important product rule is that the LLM
should not discover the `+` button live. The UI location is authored ahead of
time in `ops/help/help-index.json`.

### 3. Generated Route Records

Generate records from App Router pages where safe:

- static path where derivable from `app/**/page.tsx`
- metadata title and description where present
- route owner area, for example `network`, `waves`, `profiles`, or `tools`
- related docs detected from `ops/docs` references

Generated route records should be low confidence unless paired with curated docs
or route metadata. They are useful for retrieval, but curated records should
select canonical links for important questions.

### 4. Future Product Doc Chunks

Chunk existing docs under `ops/docs` by heading and paragraph group. Preserve:

- source file
- heading path
- route references
- related docs
- tags inferred from path
- last generated commit SHA

Example source areas for wave creation:

- `ops/docs/waves/create/README.md`
- `ops/docs/waves/create/feature-overview-step.md`
- `ops/docs/waves/create/feature-modal-entry-points.md`
- `app/waves/create/page.tsx`

For a user asking `Do we have docs how to create a wave?`, retrieval should find
these chunks and allow the backend LLM to answer with the `+` button location,
the `/waves/create` route, and a short summary of Chat, Rank, and Approve wave
configuration.

### 5. Frontend API and UI Behavior Summaries

For product areas where route docs point to frontend behavior, the index can
include short summaries generated from existing docs and selected component
metadata. Examples:

- where subscription reports live
- what the profile subscriptions tab is for
- where open-data subscription exports live
- how to start wave creation on desktop vs app

This source should summarize user-visible behavior only. Backend business rules
belong in backend-owned records.

## Optional Component Metadata Convention

Curated docs are enough for V1. For a stronger V2, add structured metadata to
important controls so the index can be generated more reliably.

Example:

```tsx
<button
  aria-label="Create Wave"
  data-help-id="waves.create"
  data-help-location="top-right of the Waves panel"
  data-help-intent="create_wave"
>
  <PlusIcon />
</button>
```

Rules:

- Metadata must complement accessible names, not replace them.
- Metadata should be reserved for important user actions, not every button.
- `data-help-id` values should be stable.
- CI should fail when a curated `data-help-id` is duplicated.

## Current Artifact

The frontend publishes one generated help artifact:

```text
help-index.json
```

The artifact should include:

- schema version
- generated timestamp
- frontend commit SHA
- records array
- canonical base URL assumptions
- route validation summary

Recommended high-level shape:

```json
{
  "schema_version": 1,
  "generated_at": "2026-06-19T00:00:00.000Z",
  "commit_sha": "example",
  "base_url": "https://6529.io",
  "records": []
}
```

The backend consumes the artifact from the deployed public site by default at
`https://6529.io/help-index.json`, with `HELP_BOT_INDEX_URL` available as an
override. The answer path consumes only the backend's cached copy.

## Agent Discovery Artifacts

The same corpus also feeds two public artifacts for external AI agents, so
term definitions never fork from the help bot's source of truth:

- `public/llms.txt`: the agent entry point, rendered from
  `ops/help/llms.txt.template` with the published corpus's base URL. It explains
  6529's mission and links the main site areas, detailed help index, API guides,
  and website-agent integration. It does not advertise the corpus's manually
  maintained timestamp as a current revision. The template must keep
  referencing `/llms.txt`, `/glossary.json`,
  `/help-index.json`, and `/sitemap.xml`; the sync step fails otherwise.
- `public/glossary.json`: a projection of glossary records. A record is
  included when its `kind` is `glossary` or its `tags` include `glossary`.
  Use the `glossary` tag to expose a route, workflow, or UI affordance record
  whose facts define a product term (for example `waves.overview` or
  `about.license`) without duplicating it as a second record.

`6529 run agent-files:sync` regenerates both artifacts and runs in `prebuild`
after `help-index:sync`. The generated files are committed;
`__tests__/scripts/sync-agent-files.test.ts` fails CI when they drift from
`ops/help/help-index.json`, so regenerate them in the same PR as any corpus
change. The generated `robots.txt` (see `next-sitemap.config.ts`) appends a
comment block pointing crawlers at these files.

## Validation Requirements

The frontend `help-index:sync` step validates:

- every `canonical_path` starts with `/` or `https://`
- every internal `canonical_path` resolves to a known App Router page, including
  dynamic routes such as `/{user}/subscriptions`
- every related internal path resolves to a known App Router page
- record IDs are unique
- aliases are normalized and non-empty
- required records for critical terms/actions exist
- source references exist in the frontend repository
- generated JSON matches schema

Initial critical records:

- `network.tdh`
- `network.xtdh`
- `waves.create.entrypoint.sidebar`
- `waves.create.flow`
- `waves.direct-messages`
- `profiles.subscriptions-tab`
- `subscriptions.report`

## Retrieval Expectations

The index should support these query classes:

- exact term lookup: `what is TDH`
- workflow lookup: `how do I create a wave`
- location lookup: `where do I find subscription reports`
- feature explanation: `what are Rank waves`
- broad docs request: `Do we have docs how to create a wave and the features`

The index should not require exact question strings. It should provide enough
semantic material for the backend to retrieve relevant records and ask an LLM to
compose a short answer.

## Answer Link Rules

- User replies should point to 6529.io pages, not GitHub source files.
- GitHub source paths are for debugging, provenance, and PR review only.
- Prefer one canonical URL and at most two related URLs in normal bot answers.
- When the canonical route is dynamic, prefer the nearest stable landing page.
- If the best answer is an in-context UI action, include both the UI action and
  a stable fallback URL when available.

## Rollout Plan

### Phase 1: Curated Frontend Corpus - Done In PR

- Add curated records for top glossary terms and common actions.
- Include wave creation and TDH as first test cases.
- Publish a static help index artifact from the frontend.

### Phase 2: Backend Consumption - Done In Paired Backend PR

- Fetch the deployed frontend artifact from `/help-index.json`.
- Cache the parsed index in the backend answer path.
- Use deterministic retrieval plus optional LLM wording.

### Phase 3: Docs Chunking

- Chunk `ops/docs` and include route references.
- Add richer provenance and chunk-level route references.

### Phase 4: Component Help Metadata

- Add `data-help-*` metadata for high-value controls.
- Generate UI affordance records from annotated controls.
- Keep curated records as the higher-confidence source.

### Phase 5: Coverage and Evals

- Add eval questions for glossary, workflow, UI location, and broad docs
  requests.
- Track unanswered questions and add records where users are confused.

## Open Questions

- Should private or role-gated routes be indexed with public fallback wording?
- Which controls should receive `data-help-*` metadata in the next pass?
- How should unanswered production questions feed back into corpus updates and
  eval coverage?

### Drop media format guidance

The `waves.composer.image-uploads` record owns the accepted drop media format
list, AVIF still-image conversion and limits, immediate rejection feedback,
and mixed-batch draft preservation. Keep its facts aligned with the shared
upload format definitions and the composer media guide. Other upload surfaces
retain separate rules.

## Desktop Core knowledge

The `desktop.*` records, tagged `desktop-core`, cover the native 6529 Desktop
menu, setup and RPC activation, worker schedules, TDH comparisons and recovery,
Core wallets, IPFS, and diagnostics. They remain available in the public corpus
so users can ask how to get started before installing the application.

Core-only navigation is expressed as native menu labels. Canonical paths remain
valid public Apps destinations with source-link suppression; never publish a
website `/core` URL. Procedure facts retain full details, including
local-data effects and warnings, with pinned Core GitHub source references.
The [maintenance contract](../../help/desktop-core-sources.md) tracks the source
baseline and the [Desktop guides](../desktop/README.md) explain the workflows.

The companion backend scopes retrieval to local Desktop support, keeps replies
short by default, and permits longer procedures on explicit request. It does not add
remote control of workers or access to local wallets, logs, or database contents.

Deploy the companion backend routing/renderer change before publishing these
records. Its older-corpus fallback is safe; the older backend does not isolate
Core records from generic questions and has insufficient procedural reply space.

Desktop conversational replies use optional `brief_answer` and `answer_links`
metadata. Short answers preserve action-specific warnings. Links appear once at
the end, never inline; source provenance remains separate. The corpus separates
“What is Core?” from setup, initial node mismatch triage, and follow-ups after
recalculation or history reconciliation. Full facts remain available for explicit
requests for detail. A plain RPC-provider question without local-app context asks
which application the user means.

`desktop.after-installation` answers requests for next steps after installation
with RPC activation, worker sync, and scheduled TDH. It does not repeat download
instructions or require account pairing. Explicit `answer_links` lists also
govern ordinary knowledge answers: only those links appear in the final footer,
and an empty list suppresses links. Related paths are not additional citations.

Desktop progressive reconciliation uses `desktop-calculated` records with a
non-negative safe-integer `reconciliation_min_block`. Their short answers contain
only the supported numeric placeholders (`percentage`, `minimum_block`,
`checkpoint`, `from_block`) and end with the range sentence validated by the
publisher. Backend arithmetic fills these values from the user-supplied local
checkpoint. Publish after the companion runtime update: ordinary retrieval must
exclude unrendered calculated templates. Start with 25% of the indexed block
range and widen to 50%, 75%, then 100% only when a same-block mismatch persists
after each completed reconciliation and TDH recalculation. Failed or incomplete
work stays at the current stage for completion or error diagnosis; it does not
authorize a wider range or reset.

When a same-block mismatch persists after completed 100% reconciliation and
TDH recalculation, the calculated
transaction-reset stages offer Reset to Block and its Min Block full-resync
fallback. They preserve context through resync, recalculation, and final
diagnostics. Partial, failed, or unfinished resync must not be treated as complete.

### Video playback controls

The `media.video-player` record owns custom-player seeking, elapsed/total time,
paused play controls, visibility, and homepage/submission/detail contain sizing.
Homepage, The Memes detail, and Wave submission detail videos fit the available width with a maximum
height of 95% of the usable screen in desktop browsers, mobile browsers, and the
mobile app. Header, bottom navigation, and safe areas are excluded from that
height. Submission detail also reserves its overlay header and artwork padding.
Tall videos become narrower and centered without cropping; controls stay
inside the actual frame. Sizing remains independent of neighboring loading panels.
Keep its facts aligned with the shared player and Media Rendering video guide.
Browser-native controls remain a separate behavior.

### Still artwork sizing coverage

The media playback record also describes contained still artwork on the
homepage, Meme detail, and expanded Wave submissions: the shared usable-screen
height cap, desktop homepage details-height limit, natural-height full-width
mobile homepage images without reserved gaps, and stable Meme image frame.

## Meme collaborator invitations

The Memes submission record covers multiple profile invitations, final consent,
private pending names, accepted collaborator profile attribution, and the
next-mint selection cutoff. The Craft documentation covers accepted collaborators as initial claim
credits, admin editing of final mint artwork and traits, and Arweave publication
of the saved claim without invitation checks. The frontend corpus records
that pending invitations never delay voting or minting, and that attribution
confers neither editing rights nor payment/airdrop arrangements.

## Create Wave criteria navigation

Create Wave access editing uses a vertical category list on smaller screens and
touch devices. Selecting a category opens its fields; the shared Back control
returns to the list and preserves the pending criteria. Desktop keeps its
left-side criteria list. The help corpus distinguishes this from Configuration
access editors, which retain their compact horizontal navigation.

Create Wave also uses Network Filter’s concise Included copy and shared readiness
tooltip. The editor omits Before editing and After editing captions and the default
Everyone summary during editing, while preserving saved-group details, draft
criteria, member previews, privacy, and save/cancel behavior. Configuration retains
its existing comparison captions.

Inside a Create Wave mobile category, the shared Back and Cancel actions occupy
one row, with Back on the left and Cancel on the right; their behavior is unchanged.

Create Wave and Network Filter omit the intermediate combined identity total in
both Included and Excluded. The bottom criteria summary retains the counts, while
individual source counts, limit warnings, import errors, and creator warnings remain.

Create Wave and Network Filter use distinct stacked identity, EMMA, and CSV
sections on phones and touch tablets. Search and upload controls remain visible,
alongside source results, loading, errors, retry, and removal. Desktop retains its
two-column import layout.

Both Included and Excluded omit the empty EMMA and CSV source messages in Create
Wave and Network Filter.

Both identity tabs show a title above the search field: Find an identity to include
or Find an identity to exclude. The placeholders are Search identities to
include... and Search identities to exclude..., respectively.
Create Wave and Network Filter omit empty-selection sentences in both tabs while
preserving limits, errors, warnings, and the bottom criteria summary.

Competition list corrections: My Votes includes only active nonzero votes; archived winner votes remain retained. Winners paginate by win time newest first.

Voting help records use **Explain vote** for public rationale replies in My Votes and voting dialogs. They distinguish sending a reply about a saved vote from posting one after a successful vote, and cover Slider / Numeric entry in competition submission popups. The My Votes record also describes compact phone and tablet rows, 16-pixel side padding, single-line titles and action labels, compact controls with unchanged labels on smaller rows, styled public-reply tooltips, controls that adapt to the available width, and Explain vote beside the amount control on tablet and desktop with the range hint underneath. Desktop controls stay to the right of the artwork and details.
