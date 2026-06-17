# Profile Native CMS: Product And Technical Roadmap

Last updated: 2026-06-17.

## Executive Summary

Build a CMS that lets every 6529 profile publish a native website, starting at
`/{handle}/index.html`, without weakening the long-term decentralization goal.

The first launch can use 6529-operated services for speed, indexing, preview,
upload coordination, and CDN acceleration. The durable artifact must still be a
signed, content-addressed package that can live on IPFS and/or Arweave, be
mirrored by anyone, and be rendered by alternative clients.

The product should feel like a consumer-grade site builder for crypto-native
identity:

- A collector can paste wallet addresses and get a beautiful gallery.
- An artist can build a portfolio with NFT pages and collection pages.
- A project can publish docs, news, education, museum, or capital pages without
  privileged routes in the 6529 app.
- A user can share an individual NFT, card, collection, room, or transaction
  page and have it look excellent on social platforms.
- A power user can export, mirror, inspect, and verify the package.

The main strategic constraint is that this is not "content in a database that
we later migrate." It is "content packages with an accelerated 6529 publishing
service."

## Product Principles

### Launch Small, Preserve The Final Shape

The first public version should do fewer things well, but every durable object
it creates should already match the long-term model.

Acceptable launch shortcuts:

- 6529-operated builder.
- 6529-operated upload service.
- 6529-operated pointer API.
- 6529-operated indexing for gallery generation.
- 6529 CDN acceleration.

Not acceptable:

- Canonical content that only exists in a 6529 database.
- Published packages that cannot be exported.
- Routes that only work inside 6529.io app state.
- Unsigned primary-site updates.
- Storage receipts that cannot be independently checked.
- A builder model that cannot produce a static/decentralized package later.

### Profile Native

Every website belongs to a profile.

- `/{handle}` is the profile page.
- `/{handle}/index.html` is the profile website.
- Additional CMS pages live below that profile namespace, such as
  `/{handle}/collections/fidenza/index.html`.
- The profile page links to the profile website when a primary site exists.
- The profile website can link back to the profile page.

### No Privileged Content Families

Museum, About, Education, Blog, News, OM, Capital, and similar sections should
be profile-authored sites, not hardcoded protocol exceptions.

Examples:

- `6529museum` can publish a museum site.
- `6529capital` can publish a capital site.
- `punk6529` can publish a personal site.
- Any other profile can publish similar site types.

### Decentralized From First Real Publish

The first production publish path should produce durable artifacts:

- Canonical package hash.
- Payload hash.
- Storage receipts for IPFS and/or Arweave.
- Profile signature.
- Optional 6529 CDN acceleration.
- A pointer from the profile to the current primary package.

Do not make S3/database content the canonical source and promise a later
migration.

### Crypto Native, Not Generic CMS

This is not just pages, text, and images. Native first-class objects include:

- Wallets and ENS names.
- NFTs and collections.
- Meme Cards, Gradients, NextGen, and future 6529 assets.
- TDH, REP, nIC, delegations, and protocol reputation signals.
- Transactions, provenance, minting, transfers, sales, burns, and claims.
- IPFS, Arweave, content hashes, and package signatures.
- 2D galleries and eventually 3D exhibition rooms.

### Consumer Simple, Power User Verifiable

Default flows should hide complexity until needed:

- Choose a site type.
- Connect/profile-authenticate.
- Add wallets or content.
- Pick a style.
- Preview.
- Publish.
- Share.

Advanced views should expose:

- Package hash.
- Storage receipts.
- Signature details.
- Version history.
- Export/download.
- Mirror instructions.
- Validation results.

### Open Clients

The CMS cannot assume 6529.io is the only renderer forever.

The package, schemas, renderer contract, and validation rules should be open
enough that someone can build:

- Alternative web client.
- Alternative mobile client.
- Desktop/Electron client.
- Archive browser.
- CLI validator.
- Mirror gateway.

## Non-Goals And Guardrails

### V1 Non-Goals

Do not let V1 turn into an open-ended website builder project.

V1 should not include:

- Arbitrary custom JavaScript in normal pages.
- Marketplace for third-party templates.
- Custom domains.
- Multi-author editorial workflow.
- Private/gated CMS pages.
- Full transaction decoder.
- Full 3D room editor.
- Paid arbitrary-collection indexing.
- Onchain pointer registry.
- Real-time collaborative editing.

These are important later. They should not block the first public launch.

### Hard Guardrails

The following constraints should hold even in V1:

- Published package is immutable.
- Active profile pointer is mutable and auditable.
- Package can be downloaded.
- Package can be validated outside 6529.io.
- Package records all centralized services used to generate it.
- Any generated chain/indexer facts include source and snapshot metadata.
- No route family receives privileged protocol status.

## Success Metrics

### Product Metrics

Track whether users can actually build and share good sites:

- Time from first builder open to published site.
- Percent of started gallery flows that reach preview.
- Percent of previews that publish.
- Percent of published sites with complete share metadata.
- Number of shared NFT/collection pages.
- Number of profiles linking from `/{handle}` to `/{handle}/index.html`.
- Number of published packages with both IPFS and Arweave receipts.

### Decentralization Metrics

Track whether the architecture is moving in the right direction:

- Percent of published packages independently retrievable from IPFS/Arweave.
- Percent of packages passing standalone validation.
- Number of packages mirrored by non-6529 infrastructure.
- Number of clients/renderers able to render package fixtures.
- Number of pointer registry snapshots exported.
- Number of builder/indexer facts with explicit source snapshots.

### Quality Metrics

Track whether this is good enough for consumer use:

- Lighthouse or equivalent performance/accessibility baseline for generated
  pages.
- Mobile screenshot pass rate for core templates.
- Social preview success rate for top shared pages.
- Package render error rate.
- Publish failure rate by storage provider.
- Time to recover from failed publish.

## What We Can Build With The Current Foundation

The current implementation supports a broad content model and a first generator.

Ready or near-ready:

- Profile homepage package at `/{handle}/index.html`.
- Wallet-gallery package generation.
- Basic page rendering from CMS blocks.
- Theme and social metadata.
- Package hash and storage location concepts.
- Backend pointer for primary package publish.

Representable in schema, but not fully productized:

- General pages.
- Posts/articles.
- Collection pages.
- NFT/card pages.
- Transaction explainer pages.
- Room/exhibition pages.
- Knowledge packet references.

Not yet complete:

- Full builder.
- Real IPFS/Arweave upload path.
- Real package signing and verification.
- Live NFT/indexer integration.
- Polished 3D gallery runtime.
- Multi-page site tree editor.
- Version history UI.
- Third-party client validator.

## Website Types

### 1. Profile Home Site

Purpose:

Give a profile a personal or institutional homepage separate from the core
profile UI.

Examples:

- `/punk6529/index.html`
- `/6529museum/index.html`
- `/6529capital/index.html`

Core features:

- Hero or intro section.
- Profile identity summary.
- Featured links.
- Featured NFTs, collections, posts, rooms, or transactions.
- Social share metadata.
- Button on `/{handle}` profile page.

MVP:

- Template-driven page builder.
- Profile link integration.
- Publish signed package.

Later:

- Custom domains.
- Multiple home templates.
- Profile-controlled navigation.

### 2. Collector Wallet Gallery

Purpose:

Generate a beautiful gallery from one or more ETH addresses.

Inputs:

- ETH addresses.
- Optional ENS names.
- Optional collection filters.
- Optional hidden tokens.
- Optional featured collections.
- Optional statement or curatorial text.

Pages:

- Homepage gallery.
- All NFTs.
- Collections index.
- Collection detail pages.
- NFT detail pages.

Styles:

- Editorial.
- Dense market grid.
- Museum wall.
- 3D room.
- Minimal archive.

MVP:

- Address input.
- NFT/collection import from approved indexers.
- Generated pages for top collections and individual NFTs.
- Share metadata for every page.

Later:

- Custom sorting.
- Trait filters.
- Per-token captions.
- Multi-wallet collection merging.
- Snapshot pinning by block number.

### 3. Artist Or Creator Portfolio

Purpose:

Let creators show work, provenance, essays, exhibitions, and links to mint or
market pages.

Core features:

- Featured works.
- Collections and series.
- Creator statement.
- Exhibitions.
- Press/news/posts.
- External mint/market links.

Crypto-native additions:

- Contract provenance.
- Mint history.
- Holder distribution summaries.
- Selected transactions.
- Creator wallet attestations.

MVP:

- Portfolio template using manual blocks plus NFT/collection references.

Later:

- Creator-controlled knowledge packets.
- Edition and series management.
- Live sales and floor widgets clearly labeled by source.

### 4. Collection Site

Purpose:

A project or curator can publish a standalone collection site.

Examples:

- Fidenza explainer.
- CryptoPunks collector page.
- Meme Cards season page.
- 6529 Gradient collection page.

Core features:

- Collection summary.
- Visual gallery.
- Knowledge packet.
- Contract and chain facts.
- Creator/project links.
- Notable tokens.
- Selected sales and provenance.

MVP:

- Collection page template.
- Open knowledge packet format.
- NFT grid and token detail links.

Later:

- Extensible community knowledge packets.
- Sponsored indexing for arbitrary collections.
- Curated routes for top collections by market cap and cultural importance.

### 5. Individual NFT Or Card Detail Page

Purpose:

Create a shareable, good-looking page for one token.

Examples:

- `/punk6529/nfts/ethereum/{contract}/{token_id}/index.html`
- `/6529museum/cards/the-collector/index.html`

Core features:

- Media.
- Title and collection.
- Creator.
- Owner snapshot.
- Traits or edition facts.
- Provenance timeline.
- Related collection link.
- Share card.

6529-specific opportunities:

- Meme Card pages can be spectacular.
- Include artist, season, card number, edition, TDH relevance, cultural context,
  known rememes, related drops, and onchain provenance.
- Some cards can have custom 2D or 3D pages.

MVP:

- Standard token page from indexer data.
- Custom rendering for 6529 collections where reliable metadata exists.

Later:

- Per-card immersive templates.
- Collector notes.
- Related Waves/discussions.
- Historical context modules.

### 6. 3D Exhibition Room

Purpose:

Let a profile publish a room-like exhibition experience.

Core features:

- Room layout.
- Wall placement.
- Token/media frames.
- Optional audio/ambient controls.
- Click through to NFT pages.
- Mobile-friendly fallback.

MVP:

- 3D room as a template choice that renders a simple, reliable Three.js gallery.
- 2D fallback for low-power devices and crawler/social contexts.
- Basic room presets.

Later:

- Multiple connected rooms.
- Custom frame styles.
- Curator walkthrough mode.
- Spatial comments or labels.
- Exportable room package usable outside 6529.io.

Important engineering rule:

The package should store room data, not a 6529-only runtime assumption. Other
clients should be able to render the same room differently if needed.

### 7. Editorial, Blog, News, And Education Site

Purpose:

Replace hardcoded editorial/institutional sections with profile-authored sites.

Core features:

- Posts.
- Pages.
- Tags/categories.
- Author/profile identity.
- Rich media.
- Social share.
- Archives.

MVP:

- Manual article builder.
- Post list template.
- Basic navigation.

Later:

- RSS/Atom export.
- Search index export.
- Multi-author profile groups.
- Review/publish workflow.

### 8. Transaction Explainer Site

Purpose:

Make block explorer data human-readable.

Core features:

- Transaction summary in plain English.
- Parties involved.
- Asset movements.
- Contract calls.
- Value changes.
- Links to chain explorers.
- Warnings when interpretation is uncertain.

Example use cases:

- "This wallet minted this NFT."
- "This wallet transferred Punk #1234 to this address."
- "This sale routed through marketplace X."
- "This claim created these assets."

MVP:

- Static transaction reference block.
- Manual summary with structured transaction facts.

Later:

- Automatic decode service.
- Human-readable event timeline.
- Contract ABI/plugin registry.
- Explainability confidence levels.
- Shareable transaction cards.

### 9. Initiative, Campaign, Or Organization Site

Purpose:

Let a profile publish a focused microsite for an initiative.

Examples:

- Capital initiative.
- Museum exhibition.
- Education course.
- Meme campaign.
- Event page.

Core features:

- Landing page.
- Updates/posts.
- Resources.
- Team/profile links.
- Calls to action.
- NFT/transaction references where relevant.

MVP:

- Page and post templates.

Later:

- Time-based campaign modules.
- Event schedules.
- Claim/mint integrations where appropriate.

### 10. Proof, Resume, Or Reputation Site

Purpose:

Let users publish a profile-owned proof page.

Core features:

- Wallet attestations.
- REP/nIC/TDH summaries.
- Delegations.
- Collected/created assets.
- Contributions.
- External links.

MVP:

- Profile + wallet + protocol data blocks.

Later:

- Verifiable credentials.
- Selective disclosure.
- Portable proof bundle.

## Art And NFT Display System

Detailed display guidance lives in
`ops/workstreams/profile-native-cms-roadmap/art-nft-display-best-practices.md`.

Core decisions:

- Art display should be art-first, faithful, aspect-ratio preserving, and
  provenance-rich.
- NFT media should be modeled as source assets plus display derivatives, not as
  one URL.
- 2D V1 should include collection grids, NFT detail pages, lightbox, responsive
  display variants, posters, provenance panels, and social images.
- High-resolution still images should support optional deep zoom/IIIF-like tile
  manifests.
- 3D V1 should include simple rooms for 2D works, basic object viewer support
  for GLB/glTF, posters, deferred loading, and 2D fallback.
- 2D art inside 3D rooms needs a faithful display mode where room lighting does
  not alter the artwork pixels.
- Every 3D room work should link to a faithful 2D detail page.
- Interactive HTML and heavy media should be sandboxed or deferred with static
  fallback.

Required native entities:

- `art_asset`.
- `display_variant`.
- `nft_media_profile`.
- `deep_zoom_manifest`.
- `exhibition_room`.
- `artwork_placement`.
- `interactive_policy`.

## AI Agent Affordances

6529 should not pay to run open-ended inference for every user's CMS work.
Instead, the CMS should be extremely friendly to users' own AI tools, local
models, paid model accounts, agents, and alternative clients.

The product goal is:

- 6529 provides structured facts, schemas, tools, docs, examples, and safe write
  surfaces.
- Users point their own AI at those affordances.
- The AI can inspect, propose, edit, validate, and package a site.
- The user remains in control of publish/sign actions.
- Published sites remain static, signed, portable artifacts.

This is better for cost, decentralization, openness, and ecosystem growth.

### What 6529 Should Expose

AI-friendly affordances should include:

- JSON schemas for packages, pages, blocks, assets, knowledge packets, source
  packets, validation results, and publish requests.
- Machine-readable route manifests.
- Stable API endpoints for profile, wallet, NFT, collection, transaction, draft,
  validation, and package data.
- MCP server tools for reading profile/CMS state and proposing edits.
- `SKILL.md` files that teach Codex/Claude-like agents how to build valid 6529
  CMS packages.
- Example packages and fixtures.
- Validation CLI.
- Standalone renderer or render preview endpoint.
- Import/export package JSON.
- Diff format for proposed site edits.
- Structured error output that agents can repair.
- Human-readable docs that match the machine-readable contracts.

### MCP Surface

An MCP server for the CMS should expose read tools first:

- `get_profile(handle)`.
- `get_profile_site(handle)`.
- `get_cms_package(package_hash)`.
- `list_profile_site_versions(handle)`.
- `get_wallet_snapshot(addresses, options)`.
- `get_collection(contract, chain_id)`.
- `get_nft(contract, token_id, chain_id)`.
- `get_transaction(chain_id, tx_hash)`.
- `get_knowledge_packet(id_or_hash)`.
- `validate_cms_package(package)`.
- `render_cms_preview(package_or_draft)`.

Write/propose tools should be explicit and permissioned:

- `create_draft(handle, template)`.
- `apply_draft_patch(draft_id, patch)`.
- `validate_draft(draft_id)`.
- `prepare_publish_candidate(draft_id)`.

Publish tools should require user-controlled auth/signing:

- `request_package_signature(candidate_id)`.
- `publish_signed_package(candidate_id, signature)`.
- `rollback_profile_site(handle, package_hash)`.

Rules:

- Read-only tools should be easy to expose broadly.
- Draft write tools require profile-owner/editor session.
- Publish/signature tools must never run silently.
- MCP output should be structured enough for agents to reason over without
  scraping HTML.

### SKILL.md Affordances

Provide repo-owned skills for agents:

- `profile-cms-site-builder`.
- `profile-cms-wallet-gallery`.
- `profile-cms-nft-page`.
- `profile-cms-collection-page`.
- `profile-cms-transaction-explainer`.
- `profile-cms-3d-room`.
- `profile-cms-validator`.
- `profile-cms-publisher`.

Each skill should include:

- When to use it.
- Required source data.
- Package schema links.
- Safe editing rules.
- URL/slug rules.
- Accessibility requirements.
- Share metadata requirements.
- Provenance requirements.
- Validation command/API.
- Publish/signing boundaries.

This lets a user's agent build with 6529 conventions without 6529 operating the
agent or paying for its model calls.

### Source Packets For User Agents

The system should produce compact, hashable source packets that a user can hand
to their AI.

Source packet examples:

- Wallet holdings packet.
- NFT metadata packet.
- Collection knowledge packet.
- Transaction facts packet.
- Profile facts packet.
- Existing draft/package packet.
- Validation error packet.

Source packets should be:

- JSON.
- Versioned.
- Hashable.
- Small enough for agent context when possible.
- Explicit about source, timestamp, chain id, block, provider, and confidence.
- Free of executable HTML/script content.

Agents can use these packets to write captions, organize pages, explain
transactions, suggest layouts, or produce package patches.

### Agent Patch Format

Agents should not need to rewrite a whole site package for small edits.

Define a patch format for:

- Add page.
- Remove page.
- Update page metadata.
- Add block.
- Update block.
- Reorder blocks.
- Update navigation.
- Update theme.
- Update share metadata.
- Attach knowledge packet.
- Mark source/provenance.

Patch requirements:

- JSON.
- Schema-validated.
- Human previewable.
- Reversible where practical.
- Bound to a draft/package version.
- Rejects edits that would break route or package invariants.

The builder can show an "AI proposed these changes" review screen before the
user applies them.

### Fact, Interpretation, And Author Copy

Even if 6529 is not running the AI, packages should distinguish:

- Fact: sourced from chain data, NFT metadata, knowledge packets, transaction
  data, profile data, or explicit user input.
- Interpretation: agent-authored or human-authored explanation based on facts.
- Author copy: text the profile publisher takes responsibility for.

This matters because user agents will generate text. The package should still
make source and responsibility legible.

Examples:

- "Token ID 123 is owned by wallet X at block Y" is a fact.
- "This appears to be one of the profile's key PFP holdings" is an
  interpretation.
- "This Punk is my favorite because it was my first major NFT" is author copy.

### Agent Safety

AI-facing data must be treated as hostile input.

Risks:

- NFT metadata prompt injection.
- Collection description prompt injection.
- Malicious HTML/script in metadata.
- Poisoned knowledge packets.
- Agent-proposed unsafe URLs.
- Agent-proposed claims that look like sourced facts but are not.

Mitigations:

- Sanitize source packets.
- Strip executable content from AI-facing source packets.
- Label untrusted metadata.
- Validate all agent patches.
- Require user review for semantic/content changes.
- Keep signing and publishing as explicit user actions.
- Never let agent output bypass renderer sanitization.

### Bring-Your-Own-AI UX

The builder should support users who want AI help without 6529 operating the AI.

Possible UX:

- "Export source packet."
- "Copy MCP connection details."
- "Open in local agent."
- "Import AI patch."
- "Review proposed changes."
- "Validate."
- "Preview."
- "Sign and publish."

Later:

- Browser extension integration.
- Desktop/Electron local-agent integration.
- Local model workflows.
- Third-party builder integrations.

### What 6529 May Still Generate

6529 can still provide deterministic or bounded helper services that are not
open-ended user inference:

- Route/page generation from wallet snapshots.
- Collection grouping from indexer data.
- Static OpenGraph image rendering from templates.
- Schema validation.
- Accessibility checks.
- Link/media checks.
- Package canonicalization.

If 6529 later offers optional hosted AI assistance, it should be clearly
separate from the core CMS protocol and not required for publishing, rendering,
or portability.

## Framework Prior Art To Adopt

We should study Astro and Starlight for product and architecture ideas, but we
do not need Astro or Starlight exporters in V1.

Recommended decision:

- Use a framework-neutral CMS package as the protocol.
- Keep 6529.io rendering inside the current app for integrated profile UX.
- Build a plain static HTML export path before framework-specific exporters.
- Use Astro/Starlight as prior art for package design, builder UX, validation,
  static rendering, docs navigation, search, and i18n.
- Leave Astro/Starlight adapters as possible community or later official
  adapters after the package format is stable.

Official prior art reviewed:

- Astro content collections:
  `https://docs.astro.build/en/guides/content-collections/`.
- Astro content loader API:
  `https://docs.astro.build/en/reference/content-loader-reference/`.
- Astro islands architecture:
  `https://docs.astro.build/en/concepts/islands/`.
- Starlight frontmatter:
  `https://starlight.astro.build/reference/frontmatter/`.
- Starlight sidebar navigation:
  `https://starlight.astro.build/guides/sidebar/`.
- Starlight site search:
  `https://starlight.astro.build/guides/site-search/`.
- Starlight i18n:
  `https://starlight.astro.build/guides/i18n/`.
- Starlight plugins:
  `https://starlight.astro.build/resources/plugins/`.

### Why Not Adopt A Framework As Protocol

The same package should be renderable by:

- 6529.io web app.
- Plain static mirror.
- Electron client.
- Mobile client.
- Third-party client.
- Local archive browser.
- Future Astro/Starlight adapter if someone wants one.

If the canonical artifact is an Astro project, a Starlight project, or a Next.js
route tree, we inherit that framework's assumptions as protocol assumptions.
That makes alternative clients, mobile rendering, Electron/offline rendering,
and future migration harder.

### Idea 1: Typed Content Collections

Astro content collections are a strong pattern: related entries share a schema,
can be queried, can reference each other, and can get editor/type support.

Adopt this natively as CMS collections:

- `pages`.
- `posts`.
- `assets`.
- `nfts`.
- `collections`.
- `rooms`.
- `transactions`.
- `knowledge_packets`.
- `source_packets`.
- `navigation`.
- `translations`.

Each CMS collection should have:

- JSON schema.
- Stable id.
- Slug/path rules.
- References to other entries.
- Validation errors.
- Optional editor/agent JSON schema export.

This gives us the best part of Astro content collections without making the
package an Astro project.

### Idea 2: Loader Model For Source Data

Astro's loader concept is useful: content can come from local files, remote
systems, or live data, but is normalized into typed collections.

Adopt this as CMS source loaders:

- Wallet holdings loader.
- ENS/profile loader.
- NFT metadata loader.
- Collection metadata loader.
- Knowledge packet loader.
- Transaction facts loader.
- Media loader.
- Existing CMS package loader.

Each loader should produce:

- Source packet.
- Normalized entries.
- Fetch timestamp.
- Chain id and block where relevant.
- Provider/source.
- Confidence/completeness notes.
- Content hash where possible.

Important rule:

The published package should include a frozen snapshot of the facts needed to
render. Live loaders can refresh drafts, but the public site should not require
live loader access for core rendering.

### Idea 3: Static-First Pages With Interactive Islands

Astro's island pattern is the correct mental model for decentralized CMS sites:
most of the page should be static HTML, and only specific widgets should hydrate
or run interactive code.

Adopt this as block-level rendering policy:

- `static`: rendered as HTML, no client JavaScript.
- `client_island`: isolated interactive widget.
- `deferred_island`: loaded only after user intent or viewport visibility.
- `sandboxed_embed`: iframe or equivalent isolation.
- `static_fallback_required`: interactive block must include fallback HTML.

Examples:

- Rich text: `static`.
- Image gallery: `static` or small `client_island`.
- NFT media carousel: `client_island` only if needed.
- 3D room: `deferred_island` with static fallback.
- Transaction explainer: mostly `static`.
- Interactive HTML artwork: `sandboxed_embed`.

Every interactive block should declare:

- Hydration policy.
- Required assets.
- Fallback block.
- Accessibility fallback.
- Security sandbox.
- Performance budget.

### Idea 4: Frontmatter-Like Page Metadata

Starlight's page frontmatter pattern is useful: every page has typed metadata
that drives title, description, SEO, social previews, navigation, and search.

Adopt a `page_metadata` object for every CMS page:

- Title.
- Description.
- Slug.
- Page type.
- Locale.
- Canonical URL.
- Social image.
- Square social image.
- Navigation label.
- Search inclusion.
- Robots/noindex state.
- Last updated.
- Source/provenance.

Validation rules:

- Title required.
- Description strongly recommended for shareable pages.
- Social image required for public launch templates.
- Locale required once i18n exists.
- Search inclusion must be explicit for private/gated or sensitive pages.

### Idea 5: Generated Navigation With Manual Overrides

Starlight's sidebar model has two useful modes: manual groups and autogenerated
links from content structure.

Adopt both:

- Auto-generate navigation from the site tree.
- Let users create manual groups.
- Let users hide pages from nav.
- Let users override labels and order.
- Let templates create default nav.
- Generate breadcrumbs.
- Generate previous/next links where useful.

Navigation should be data in the package, not only UI state.

### Idea 6: Static Search Index

Starlight uses a static-site-friendly search model by default. The CMS should
have the same instinct: generate a local search index as part of the package or
static export instead of depending on a centralized search service for basic
site search.

Adopt:

- Package-level search index manifest.
- Per-page search inclusion flag.
- Per-block search exclusion flag.
- Local static search index for public pages.
- Optional external search adapter later.

Rules:

- Search index must not leak hidden/private/gated plaintext.
- Search index should be content-addressed with the package.
- Large gallery sites may use a compact index first: titles, collections,
  token ids, captions, and tags.

### Idea 7: I18n And Locale Fallbacks

Starlight's i18n model is worth copying early at the data-model level even if
the UI ships English-only first.

Adopt:

- Site default locale.
- Page locale.
- Translation groups across pages.
- Fallback locale behavior.
- RTL direction support.
- Localized navigation labels.
- Localized social metadata.

Do not bolt this on later if the package route model makes it impossible.

### Idea 8: Plugin Boundary Without Runtime Danger

Starlight's plugin ecosystem is useful, but arbitrary runtime plugins would be
dangerous for a decentralized CMS renderer.

Adopt a safer plugin concept:

- Source loader plugins.
- Validator plugins.
- Template plugins.
- Export plugins.
- Static transform plugins.
- Transaction decoder plugins.
- Knowledge packet plugins.

Avoid in V1:

- Arbitrary client JavaScript plugins in the main renderer.
- Plugins that mutate published packages without validation.
- Plugins that require a centralized service to render.

Plugin manifests should declare:

- Capabilities.
- Input schemas.
- Output schemas.
- Network needs.
- Security sandbox.
- Package compatibility.

### Idea 9: Docs-Site Ergonomics

Starlight has good docs ergonomics that should become native CMS blocks and
template behaviors:

- Table of contents from headings.
- Breadcrumbs.
- Previous/next links.
- Last updated.
- Edit/source/provenance link.
- Callouts.
- Code blocks.
- Link validation.
- Broken-anchor validation.
- Search.
- Responsive side navigation for docs-heavy sites.

This is how About, Education, Museum, Capital, and protocol docs can feel
excellent without becoming hardcoded route families.

### Idea 10: Editor And Agent Intellisense

Astro's schema/type-safety direction is exactly what we want for user-owned AI
agents and human editors.

Adopt:

- Export JSON schemas for every CMS collection.
- Provide examples next to schemas.
- Provide `SKILL.md` instructions that point to schemas.
- Return structured validation errors with paths.
- Support repair loops: agent proposes patch, validator returns path-specific
  errors, agent fixes patch.
- Keep package fixtures small enough for agent context.

### V1 Framework Decision

V1 should not build Astro or Starlight exporters.

V1 should build:

- Framework-neutral CMS package.
- Native 6529 renderer.
- Plain static HTML export.
- Typed CMS collections.
- Source loader model.
- Static-first island-style block policies.
- Page metadata/frontmatter object.
- Generated navigation with overrides.
- Basic static search manifest.
- I18n-ready package fields.
- Plugin boundaries.
- AI-agent schemas, skills, source packets, and patch validation.

Later:

- Community Astro adapter.
- Community Starlight adapter for docs-heavy packages.
- Official adapters only if there is proven demand.

## Additional Static Site Prior Art To Adopt

We should also steal proven ideas from Jekyll, Hugo, Eleventy, Docusaurus,
VitePress, MkDocs/Material, Gatsby, and Zola. The point is not to adopt their
runtimes. The point is to make the native 6529 CMS package feel as mature as
the best static-site systems.

Official prior art reviewed:

- Jekyll front matter:
  `https://jekyllrb.com/docs/front-matter/`.
- Jekyll front matter defaults:
  `https://jekyllrb.com/docs/configuration/front-matter-defaults/`.
- Jekyll collections:
  `https://jekyllrb.com/docs/collections/`.
- Hugo taxonomies:
  `https://gohugo.io/content-management/taxonomies/`.
- Hugo archetypes:
  `https://gohugo.io/content-management/archetypes/`.
- Eleventy data cascade:
  `https://www.11ty.dev/docs/data-cascade/`.
- Eleventy pagination:
  `https://www.11ty.dev/docs/pagination/`.
- Eleventy permalinks:
  `https://www.11ty.dev/docs/permalinks/`.
- Eleventy collections:
  `https://www.11ty.dev/docs/collections/`.
- Eleventy directory data:
  `https://www.11ty.dev/docs/data-template-dir/`.
- Docusaurus sidebar:
  `https://docusaurus.io/docs/sidebar`.
- Docusaurus versioning:
  `https://docusaurus.io/docs/versioning`.
- Docusaurus i18n:
  `https://docusaurus.io/docs/i18n/tutorial`.
- VitePress frontmatter:
  `https://vitepress.dev/reference/frontmatter-config`.
- VitePress build-time data loading:
  `https://vitepress.dev/guide/data-loading`.
- MkDocs configuration:
  `https://www.mkdocs.org/user-guide/configuration/`.
- Material for MkDocs:
  `https://squidfunk.github.io/mkdocs-material/`.
- Gatsby content and data:
  `https://www.gatsbyjs.com/docs/content-and-data/`.
- Zola overview:
  `https://www.getzola.org/documentation/getting-started/overview/`.

### Idea 11: Scoped Metadata Defaults

Jekyll's front matter defaults and Eleventy's directory data are very useful.
They let a site define defaults by scope instead of repeating the same metadata
on every page.

Adopt a `metadata_defaults` layer:

- Site-level defaults.
- Collection-level defaults.
- Directory/path-prefix defaults.
- Template defaults.
- Page-level overrides.
- Block-level overrides where needed.

Precedence should be explicit:

1. Computed/derived values.
2. Page/block explicit values.
3. Draft/template local values.
4. Collection defaults.
5. Path-prefix defaults.
6. Site defaults.
7. Protocol defaults.

Rules:

- The resolved metadata should be materialized during validation/export.
- The package should preserve both raw defaults and resolved values where useful.
- Validation errors should identify whether a value came from a default or an
  explicit page override.
- Authors and agents should be able to inspect the resolved output.

Good uses:

- Default layout for all collection pages.
- Default social image for all posts.
- Default search inclusion for docs pages.
- Default locale and direction.
- Default NFT page template for a collection.

### Idea 12: Archetypes As Creation Recipes

Hugo archetypes are a good model for new-content creation. In 6529 terms,
archetypes should be creation recipes for pages and sites.

Adopt CMS archetypes:

- New profile homepage.
- New collector gallery.
- New post.
- New collection page.
- New NFT page.
- New transaction explainer.
- New 3D room.
- New docs section.

Each archetype should define:

- Initial page/block structure.
- Required source data.
- Default metadata.
- Validation checklist.
- Suggested navigation placement.
- Optional source loader.
- Optional AI-agent instructions.

This is different from a visual template:

- Archetype: how to create a new thing with correct structure.
- Template: how a thing looks.
- Theme: shared visual tokens.

### Idea 13: Taxonomies, Tags, And Facets

Hugo's taxonomy model is directly useful for galleries and editorial sites.

Adopt first-class taxonomies:

- Tags.
- Categories.
- Series.
- Collections.
- Artists.
- Wallets.
- Contracts.
- Seasons.
- Traits.
- Chains.
- Media types.
- Exhibition rooms.
- Custom profile-defined taxonomies.

Each taxonomy should support:

- Term pages.
- Term metadata.
- Term ordering.
- Term aliases.
- Term social metadata.
- Search inclusion.
- Source/provenance.

Crypto-native examples:

- `/punk6529/tags/ai-art/index.html`.
- `/punk6529/series/fidenzas/index.html`.
- `/6529museum/seasons/memes-season-1/index.html`.
- `/punk6529/contracts/ethereum/0xabc/index.html`.

Rules:

- Taxonomies are content organization, not protocol authority.
- Terms can be generated from chain data but should be editable/curatable.
- High-cardinality traits may need compact indexes instead of full page
  generation by default.

### Idea 14: Safe Shortcodes As Block Macros

Hugo shortcodes and Jekyll includes show a useful pattern: authors need compact
ways to insert richer content without hand-building full blocks.

Adopt safe block macros:

- NFT card.
- Collection card.
- Wallet card.
- Transaction summary.
- Callout.
- Quote.
- Button group.
- Gallery slice.
- Table of contents.
- Video/media embed.

Rules:

- Macros expand to normal validated CMS blocks.
- No arbitrary template execution in V1.
- Macro inputs are schema-validated.
- Macro expansion is deterministic.
- Expanded output is visible in preview and package validation.

This gives authors and AI agents a concise authoring surface without creating a
dangerous runtime template system.

### Idea 15: Data Cascade And Override Semantics

Eleventy's data cascade is valuable because it makes data precedence explicit.
6529 needs the same discipline for package data, generated data, user edits,
template defaults, and source snapshots.

Adopt a CMS data cascade:

- Protocol defaults.
- Site defaults.
- Theme defaults.
- Archetype defaults.
- Source loader data.
- Knowledge packet data.
- Generated page data.
- User-authored draft data.
- Page/block explicit overrides.
- Computed/resolved values.

Rules:

- Precedence order must be documented.
- Each resolved field should know its source where practical.
- Users must be able to override generated/imported values.
- Refreshing source data must not silently overwrite explicit user edits.
- Agent patches must declare which layer they modify.

This is especially important for wallet gallery generation and knowledge
packets.

### Idea 16: Pagination And Large Collection Generation

Eleventy's pagination model is useful for large wallets, large collections, and
search/tag pages.

Adopt pagination as a package-level route generation primitive:

- Page size.
- Sort key.
- Filter.
- Source collection.
- Route pattern.
- Previous/next links.
- Canonical first page.
- Search/noindex policy for deep pages.

Examples:

- All NFTs page with 60 items per page.
- Collection page with trait filters.
- Blog archive by year.
- Transaction list.
- Tag page.

Rules:

- Generated pagination routes must be deterministic.
- Route collisions must fail validation.
- Large high-cardinality routes should be opt-in.
- Deep pagination should not bloat packages unnecessarily.

### Idea 17: Permalinks And Collision Detection

Eleventy and Jekyll both reinforce that stable URLs matter. For 6529, this is
even more important because packages are mirrored and content-addressed.

Adopt strict permalink rules:

- Every page has a resolved output path.
- Every route ends in `index.html` for static export.
- Slug generation is deterministic.
- Route collisions are validation errors.
- Route redirects/aliases are package data.
- Hidden pages can exist without navigation links.
- Some entries can be processed but not emitted as standalone pages.

Support aliases:

- Old app route.
- Old CMS route.
- Custom short route.
- Legacy collection slug.

This helps migrate Museum/Capital/About content without breaking links.

### Idea 18: Docs Versioning As Package Version Channels

Docusaurus versioning is useful, but it also warns against unnecessary
complexity. 6529 should not version every casual site like docs software.

Adopt version channels only where they help:

- Protocol docs.
- Education docs.
- Legal/policy pages.
- Museum exhibitions.
- Capital documentation.
- API/reference docs.

Model:

- Current version.
- Frozen versions.
- Version label.
- Version route prefix where needed.
- Versioned navigation.
- Versioned search index.
- Version provenance.

Rules:

- Ordinary profile sites use package history, not docs-style version channels.
- Version channels are opt-in.
- Versioned docs must remain reachable after new publishes.

### Idea 19: Site Config Manifest

MkDocs' simple YAML config is a useful mental model. A CMS package should have a
clear site-level manifest that can be read before page content.

Adopt `site_manifest`:

- Site title.
- Profile id/handle.
- Default locale.
- Base route.
- Theme id/tokens.
- Navigation root.
- Content collections.
- Search settings.
- Taxonomy settings.
- Storage/provenance summary.
- Package version.
- Required renderer capabilities.

The manifest should be:

- Small.
- JSON.
- Validated first.
- Useful for agents.
- Useful for mirrors.
- Useful for Electron/offline clients.

### Idea 20: Source Plugin Model Without GraphQL Lock-In

Gatsby's source plugin ecosystem has the right high-level idea: bring many data
sources into one normalized content layer. The part to avoid is making GraphQL
or a heavy build system the protocol.

Adopt source plugins/loaders:

- Wallets.
- ENS.
- NFT metadata.
- Market data.
- Transactions.
- Knowledge packets.
- Markdown/imported docs.
- Existing package.
- External JSON.

Rules:

- Loader outputs source packets and normalized collection entries.
- Loader output is hashable.
- Loader output can be frozen into package data.
- Loader provenance is visible.
- Loader does not run during public page rendering unless explicitly marked as
  live enhancement.

### Idea 21: Single-Binary / Local-First Tooling

Zola's single-binary and database-free posture is aligned with 6529
decentralization. We should eventually provide simple local tooling.

Adopt:

- Standalone validator binary or easily runnable CLI.
- Static exporter CLI.
- Package inspector CLI.
- Local preview server.
- Mirror/pin helper.
- Package diff tool.

Target user:

- Power user.
- Mirror operator.
- Electron user.
- Alternative client developer.
- AI agent running locally.

The CLI should not require the full 6529 frontend repo to validate or render a
package.

### Idea 22: Markdown Compatibility Without Markdown Lock-In

Jekyll, Hugo, MkDocs, VitePress, Docusaurus, Zola, and Eleventy all benefit from
Markdown being easy to write and easy for agents to edit.

Adopt:

- Markdown import.
- Markdown export for docs/posts where possible.
- Frontmatter-compatible metadata export.
- CommonMark-ish subset for portable prose.
- MDX/HTML only as advanced/sandboxed import, not core protocol.

Rules:

- The package canonical form remains structured JSON.
- Markdown is an authoring/import/export format.
- Rich crypto blocks should not be lossy when round-tripping through Markdown;
  use safe block macros where needed.

### Idea 23: Theme Override Slots, Not Runtime Swizzling

Docusaurus swizzling and theme override systems show that advanced users want to
override pieces of UI. For 6529, arbitrary component replacement is too risky
for core rendering.

Adopt controlled slots:

- Header slot.
- Footer slot.
- Hero slot.
- Collection card slot.
- NFT card slot.
- Social share card style.
- Docs sidebar style.
- Gallery tile style.

Rules:

- Slots accept schema-defined blocks or template ids.
- No arbitrary React/Vue/runtime component injection in V1.
- Slot output must pass renderer validation.
- Static export must work with the slot.

### Idea 24: Build Artifacts As First-Class Outputs

Most SSGs produce build output, but do not always make the build manifest a
first-class user artifact. We should.

Adopt a build manifest:

- Package hash.
- Renderer version.
- Static export version.
- Route list.
- Asset list.
- Search index hash.
- Sitemap hash.
- OpenGraph image list.
- Warnings.
- Build timestamp.

This helps:

- Mirrors.
- Debugging.
- AI agents.
- CI.
- Electron cache.
- Long-term archival.

### Updated V1 Static-Site Decision

V1 should build the native versions of the best SSG ideas:

- Typed content collections.
- Site manifest.
- Scoped metadata defaults.
- Archetypes.
- Taxonomies.
- Data cascade and override semantics.
- Static-first island-style blocks.
- Safe block macros.
- Deterministic pagination.
- Permalinks and collision detection.
- Static search manifest.
- I18n-ready fields.
- Source loader/plugin boundary.
- Markdown import/export for docs/posts.
- Plain static HTML export.
- Standalone validator/exporter direction.

V1 should not build:

- Jekyll/Hugo/Eleventy/Astro/Starlight/Docusaurus/VitePress/MkDocs/Gatsby/Zola
  exporters.
- Arbitrary template runtime.
- Arbitrary client plugin execution.
- GraphQL as a required protocol layer.

## Primary User Journeys

### Journey 1: Collector Publishes A Gallery

Happy path:

1. Profile owner opens website builder from their profile.
2. Chooses "Collector gallery."
3. Adds one or more wallets or ENS names.
4. Reviews imported collections and NFTs.
5. Hides spam/unwanted assets.
6. Picks a style.
7. Reviews generated home, collection, and NFT pages.
8. Edits title, intro, featured works, and share image.
9. Previews desktop, mobile, and social card.
10. Publishes.
11. Profile page now shows a website button.

Must feel easy:

- Wallet resolution.
- Spam filtering.
- Page generation.
- Share metadata.
- Publish.

Advanced details stay available but secondary:

- Snapshot block.
- Indexer source.
- Package hash.
- Storage receipts.
- Signature.

### Journey 2: Institution Migrates A Hardcoded Section

Example:

Move a hardcoded Museum or Capital page family into a profile-owned CMS site.

Happy path:

1. Create or use the existing institutional profile.
2. Import existing page content into CMS pages.
3. Recreate navigation as site navigation.
4. Attach profile identity and publishing authority.
5. Publish package.
6. Redirect or link old hardcoded routes to the new profile site.
7. Keep old routes stable during transition.

Acceptance criteria:

- The institutional profile owns the site.
- The published package is portable.
- No new privileged route family is introduced.
- Existing SEO/social links have a migration strategy.
- Content editors use the same builder as every other profile.

### Journey 3: Artist Publishes A Portfolio

Happy path:

1. Artist chooses "Creator portfolio."
2. Adds creator wallet(s), collection contracts, and manual works.
3. Picks featured works and series.
4. Adds artist statement and links.
5. Generates collection and NFT pages.
6. Publishes a signed site.

Important UX:

- Manual curation must override automatic ordering.
- Creator identity should be clear but not require protocol-level verification.
- External sales/mint links must be clearly external.

### Journey 4: User Shares One NFT Page

Happy path:

1. User opens an NFT/card detail page.
2. Page shows media, title, collection, owner snapshot, provenance, and context.
3. User copies URL or shares to social.
4. Social preview is attractive and accurate.

Acceptance criteria:

- Page does not require the builder to be open.
- Page has stable `index.html` route.
- OpenGraph tags render server-side.
- Crawler gets a meaningful image and description.

### Journey 5: Power User Verifies A Site

Happy path:

1. User opens provenance panel.
2. Downloads package or opens IPFS/Arweave link.
3. Checks package hash and signature.
4. Runs standalone validator.
5. Mirrors package if desired.

Acceptance criteria:

- Verification does not depend on hidden 6529 admin tools.
- Signature and package hash are visible.
- Storage locations are visible.
- Validator docs are linked.

## Migration Of Existing Content Families

### Goal

Move content-heavy/static-ish app sections into profile-native CMS sites without
breaking the existing public web surface.

Candidate route families:

- Museum.
- Capital.
- About.
- Education.
- Blog.
- News.
- OM.

### Migration Strategy

Step 1: Map ownership.

- Decide which profile owns each section.
- Example: Museum content belongs to `6529museum`.
- Example: Capital content belongs to `6529capital`.
- General protocol docs may belong to a protocol/profile account chosen by the
  team.

Step 2: Inventory content.

- List current routes.
- List assets.
- List metadata and social previews.
- List SEO-sensitive URLs.
- List forms, dynamic widgets, or backend dependencies.

Step 3: Convert to CMS package.

- Import content into CMS pages.
- Preserve page titles, descriptions, and share images.
- Replace hardcoded app-only widgets with safe CMS blocks.
- Record source route and migration provenance.

Step 4: Publish under profile namespace.

- Publish to `/{profile}/index.html` and subpages.
- Store package on IPFS/Arweave.
- Sign by profile authority.
- Add provenance panel.

Step 5: Bridge old routes.

- Existing app routes can redirect, canonicalize, or link to profile CMS pages.
- Route behavior should be explicit per section.
- Do not create new hardcoded content systems during migration.

Step 6: Retire privileged implementation.

- Remove old bespoke page code after traffic, SEO, and redirects are stable.
- Keep route shims only where needed for link continuity.

### Migration Acceptance Criteria

- The migrated section can be rendered from package data.
- The owning profile can publish future updates through the CMS.
- Existing important URLs have redirect/canonical behavior.
- Social previews do not regress.
- Decentralized storage receipts exist for the published package.
- The old hardcoded route family no longer needs bespoke content deployment.

## URL And Routing Model

### Required Routes

The core convention:

- `/{handle}`: existing profile page.
- `/{handle}/index.html`: primary CMS website.
- `/{handle}/{path}/index.html`: CMS subpage.

Examples:

- `/punk6529/index.html`
- `/punk6529/collections/fidenza/index.html`
- `/punk6529/nfts/ethereum/0xabc/123/index.html`
- `/punk6529/rooms/genesis/index.html`
- `/punk6529/posts/why-open-metaverse/index.html`

### Why `index.html`

`index.html` is useful because:

- It matches static site export conventions.
- It makes mirrorability obvious.
- It reduces conflicts with existing app routes.
- It signals "website page" rather than "app profile tab."
- It maps cleanly to IPFS/Arweave directory packages.

### Profile Page Integration

When a profile has a primary CMS package:

- Show a clear website button on `/{handle}`.
- The button links directly to `/{handle}/index.html`.
- The profile page stays the profile page.
- The CMS site should not replace the profile page.

### Canonical URLs

Each page should carry:

- 6529 wrapper URL: `https://6529.io/{handle}/.../index.html`.
- Content address: `ipfs://...` and/or `ar://...`.
- Optional custom domain later.
- Package version and hash.

Canonical selection:

- Use 6529 wrapper as canonical for SEO while the product is 6529-hosted.
- Expose decentralized addresses in provenance UI and machine-readable metadata.
- Allow custom domain canonical later if profile chooses it.

### Route Resolution Protocol

When a user requests `/{handle}/index.html` or a CMS subpage:

1. Resolve `{handle}` to a profile id.
2. Resolve the profile's active CMS pointer.
3. Fetch the referenced package from local cache, CDN, IPFS, or Arweave.
4. Validate package hash and schema.
5. Resolve the requested path inside the package route manifest.
6. Render the page with the CMS renderer.
7. Render safe error states if any step fails.

Resolution fallback order for 6529.io:

1. Hot in-memory or edge cache.
2. 6529 CDN/accelerated object.
3. IPFS gateway.
4. Arweave gateway.
5. Backend package fetch API.
6. Error with provenance and retry options.

Resolution fallback order for Electron/offline:

1. Local package cache.
2. User-configured IPFS node or gateway.
3. User-configured Arweave gateway.
4. Optional 6529 API/CDN if the user allows network acceleration.
5. Error with clear missing-package details.

The renderer should never trust the fallback source by location alone. It must
validate content against the pointer/package hash after fetch.

### Route Conflict Rules

CMS routes must not silently override core app routes.

Rules:

- `/{handle}` always remains the profile page.
- `/{handle}/index.html` is reserved for the profile's primary CMS site.
- CMS subpages require `index.html` suffix.
- Existing app routes such as `/about`, `/waves`, `/memes`, `/nextgen`, and
  admin/API routes remain app-owned.
- If a handle conflicts with a core route, the core route wins unless product
  explicitly reserves a profile namespace strategy.

This route model keeps the CMS powerful while avoiding ambiguous app behavior.

## Package Model

### Core Entities

The product should use a small set of durable concepts across FE, BE, storage,
and future clients.

Profile site:

- Belongs to one profile.
- Has one active primary pointer.
- Has zero or more drafts.
- Has zero or more published versions.

Draft:

- Mutable editing state.
- Stored by 6529 services during the launch phase.
- Not the canonical decentralized artifact.
- Can be discarded, previewed, or published.

Package:

- Immutable published artifact.
- Content addressed.
- Signed by profile authority.
- Stored on IPFS and/or Arweave.
- Renderable outside 6529.io.

Page:

- Route-addressable item inside a package.
- Has page type, slug, title, blocks, metadata, and optional data bindings.

Block:

- Small renderable unit inside a page.
- Must be schema-validated.
- Must be safe to render as untrusted content.

Asset:

- Image, video, model, document, social image, or other media.
- Should have content hash and storage locations where possible.

Pointer:

- Mutable reference from profile to active package.
- Initially served by backend.
- Later replicated to decentralized profile state.

Knowledge packet:

- Versioned context object for a collection, token, artist, or concept.
- Open and hashable.
- Can be bundled into a package or referenced by hash.

Indexer snapshot:

- The data facts used when generating a page from chain/indexer state.
- Includes source, block/time, chain, contracts, and hash where practical.

### Package Boundary

A published site package should include:

- Site manifest.
- Page manifests/content.
- Asset manifest.
- Theme.
- Navigation.
- Share metadata.
- Provenance.
- Package hash.
- Payload hash.
- Signature envelope.
- Storage receipts.

### Immutability

Published packages are immutable.

Updating a site creates a new package version and moves a profile pointer to the
new package.

This gives:

- Auditability.
- Rollback.
- Mirrorability.
- Deterministic validation.

### Profile Pointer

The pointer is mutable state:

- Profile handle/id.
- Active package hash.
- IPFS CID.
- Arweave transaction id.
- Version.
- Signer.
- Published timestamp.
- Previous pointer/package.

The pointer can initially live in the backend. Long term, it should be
replicated into the 6529 special-purpose chain or another decentralized profile
state layer.

### Hashing And Canonicalization

Need deterministic package hashing:

- Canonical JSON serialization.
- Stable ordering.
- No timestamps inside the hashed payload unless they are intentional content.
- Content hashes for every asset.
- Hash references rather than mutable URLs when possible.

### Signatures

MVP:

- EIP-191 or EIP-712 signature from a profile-authorized wallet.
- Backend verifies signer can publish for profile.
- Package stores signature envelope.

Later:

- Delegated publishing keys.
- Multi-sig approval for institutional profiles.
- Revocation and recovery.
- Offline signing support.

### Storage Receipts

A package should be able to record multiple storage locations:

- IPFS CID.
- Arweave transaction id.
- 6529 CDN URL.
- Local fixture/dev URL.

Storage receipts should include:

- Provider.
- URI.
- Content hash/CID.
- Timestamp.
- Pin/permanence status.
- Uploader service id where relevant.

### Content Lifecycle

The CMS should treat draft, preview, publish, and rollback as distinct states.

Draft:

- Mutable.
- Stored in backend for convenience.
- Not canonical.
- Can reference temporary uploads.
- Can be deleted.

Preview:

- Rendered from draft state or an unsigned temporary package.
- May use temporary assets.
- Must be visually close to publish output.
- Must clearly indicate it is not published.

Publish candidate:

- Fully validated.
- Canonically serialized.
- Has all required assets resolved.
- Ready to hash and sign.

Published package:

- Immutable.
- Signed.
- Stored on decentralized storage.
- Has package and payload hashes.
- Can be mirrored.

Pointer update:

- Moves active profile site to a package.
- Records signer, timestamp, previous pointer, and validation status.
- Is the only mutable step in normal publish.

Rollback:

- Points profile back to an earlier package.
- Does not mutate the old package.
- Creates a new pointer event.

Deletion:

- Can remove drafts from 6529 services.
- Can stop 6529.io acceleration.
- Cannot guarantee removal from IPFS/Arweave or third-party mirrors.
- Must be explained clearly to publishers.

### Package Compatibility

Versioning rules:

- Schema version is required.
- Renderer must declare supported schema versions.
- Breaking schema changes require a new major version.
- Old packages should remain renderable or receive a deterministic migration.
- A package corpus should be kept for regression tests.

Package migration rules:

- Never rewrite a previously published package in place.
- If migration is needed, create a new package with migration provenance.
- Keep original package hash visible in migration metadata.

## Builder Product Spec

### Builder UX Goal

The builder should not feel like a JSON package editor. It should feel like a
guided publishing tool that happens to produce excellent decentralized artifacts.

The default user should be able to make a good site without understanding:

- IPFS.
- Arweave.
- Content hashes.
- Signature envelopes.
- Route manifests.
- OpenGraph metadata.

The advanced user should still be able to inspect all of those things before
and after publishing.

### Builder Mental Model

Use a simple four-part mental model:

1. Site: the whole profile website.
2. Pages: home, collections, NFTs, posts, rooms, and custom pages.
3. Blocks: content units inside each page.
4. Publish: immutable package plus mutable profile pointer.

Avoid exposing internal package terminology in the happy path. Use human words
in the UI:

- "Website" instead of "CMS package."
- "Publish" instead of "write pointer."
- "Permanent storage" instead of "storage receipt."
- "Version" instead of "immutable payload."
- "Verify" or "Details" for the advanced provenance panel.

### Builder Layout

Desktop layout:

- Left rail: site tree, pages, navigation, publish status.
- Center: live page canvas/preview.
- Right panel: settings for selected page/block/site.
- Top bar: profile identity, preview, save, publish, version status.

Mobile layout:

- Page preview first.
- Bottom or top controls for add block, page tree, and settings.
- Editing should be possible, but complex site organization can be desktop
  optimized at first.

Do not require users to navigate away from the builder to understand whether a
page is ready to publish.

### Builder States

Every site should have clear state:

- No site yet.
- Draft exists.
- Draft has validation warnings.
- Draft ready to publish.
- Publishing.
- Published.
- Published with partial storage.
- Published but not currently accelerated by 6529.io.
- Publish failed but draft saved.

Every page should have clear state:

- Draft.
- Published.
- Changed since last publish.
- Hidden from navigation.
- Missing share metadata.
- Has validation errors.

### First-Run Experience

The first run should be heavily guided:

1. Choose site type.
2. Confirm profile.
3. Add source material.
4. Pick style.
5. Review generated pages.
6. Edit obvious details.
7. Preview mobile and desktop.
8. Publish.

For a collector gallery, "source material" means wallets. For an editorial site,
it means title, intro, pages/posts, and optional media. For a collection site,
it means contract, chain, and knowledge packet.

### Template System

Templates should be composable, not one-off forks.

Template parts:

- Site type.
- Page type.
- Block presets.
- Theme tokens.
- Navigation pattern.
- Social card design.
- Optional data adapters.

Initial templates:

- Profile homepage.
- Collector gallery.
- Collection page.
- NFT detail page.
- Article/post.
- Initiative page.

Later templates:

- 3D room.
- Transaction explainer.
- Artist portfolio.
- Proof/reputation page.

Template quality bar:

- Looks good with sparse content.
- Looks good with dense content.
- Works on mobile.
- Has complete social metadata.
- Uses accessible headings and controls.
- Has deterministic export behavior.

### Editing Flow

Common edits should be fast:

- Click text to edit.
- Drag or button-reorder blocks.
- Add block from a short categorized menu.
- Select media from wallet/imported assets or upload.
- Choose NFT/collection/transaction from typed search.
- Preview share card before publish.

Advanced edits live in the right panel:

- Slug.
- SEO/share metadata.
- Canonical URL.
- Hide from navigation.
- Data source/snapshot.
- Alt text.
- Block-specific settings.
- Provenance details.

### Validation UX

Validation should be helpful, not punitive.

Use three levels:

- Error: cannot publish.
- Warning: can publish, but likely poor result.
- Note: optional improvement.

Examples:

- Error: invalid route slug.
- Error: unsafe URL.
- Error: package signature missing.
- Warning: missing social image.
- Warning: image missing alt text.
- Warning: decentralized storage has only one provider.
- Note: page description may be too long for social cards.

Validation should link directly to the broken page/block/setting.

### Version History UX

Version history should show:

- Publish time.
- Publisher/signing wallet.
- Package hash.
- Storage providers.
- Short change summary.
- Restore action.
- View package details.

Restoring a version should publish a new pointer to an old package, not mutate
the old package.

### Provenance Panel

Every published site should have an advanced provenance panel reachable from the
site footer or profile/site settings.

Show:

- Package hash.
- Payload hash.
- Signature signer.
- Storage locations.
- IPFS CID.
- Arweave transaction id.
- Version.
- Previous version.
- Source snapshot information.
- Validator result.

This panel is part of the decentralization UX. It lets normal users ignore the
details while power users can verify them.

### Builder Entry Points

Users should find the CMS through:

- Profile owner controls on `/{handle}`.
- A "Create website" or "Manage website" flow.
- Direct Studio route for advanced users.
- Future profile settings page.

### Builder Dashboard

The dashboard should show:

- Current published site.
- Drafts.
- Last publish date.
- Package hash.
- Storage status.
- Validation status.
- Preview button.
- Publish button.
- Version history.

Primary actions:

- Edit site.
- Create new site.
- Generate gallery from wallets.
- Add page.
- Manage navigation.
- Publish.
- Roll back.

### Site Type Picker

Start with guided templates:

- Personal/profile homepage.
- Collector gallery.
- Artist portfolio.
- Collection site.
- Blog/editorial site.
- Organization/initiative site.
- 3D exhibition room.
- Transaction explainer.

The template should create a useful first draft, not an empty canvas.

### Page Tree

The builder should show a simple site tree:

- Home.
- Collections.
- NFTs.
- Posts.
- Rooms.
- Custom pages.

Each page has:

- Title.
- Slug.
- Page type.
- Draft/published status.
- Share metadata status.
- Validation warnings.

### Block Editor

Supported early blocks:

- Heading.
- Rich text.
- Image.
- Video.
- Gallery.
- Quote.
- Callout.
- Button/link.
- NFT reference.
- Collection reference.
- Transaction reference.
- Wallet gallery.
- 3D room embed.

Block behavior:

- Add, remove, reorder.
- Inline edit where simple.
- Side panel for advanced settings.
- Mobile preview.
- Accessibility warnings.
- URL and media validation.

### Authored Content vs Generated Content

The builder needs to distinguish content the user wrote from content generated
from wallets, indexers, chain data, or knowledge packets.

Authored content:

- Title.
- Intro copy.
- Captions.
- Essays/posts.
- Navigation labels.
- Featured selections.
- Manual callouts.

Generated content:

- Wallet holdings.
- Collection summaries.
- NFT metadata.
- Ownership snapshots.
- Transaction facts.
- Trait grids.
- Provenance timelines.

Generated content must carry:

- Source.
- Fetch time.
- Chain id.
- Block number where possible.
- Indexer/provider.
- Confidence or completeness status where relevant.

User controls:

- Freeze generated data into package.
- Refresh generated data.
- Override display text.
- Hide generated items.
- Mark generated facts as source-derived.

Rule:

Published pages should not depend on a live indexer to render their core
content. Live refresh can be an enhancement, but the package should include the
snapshot needed to render the published page.

### Page Generation Rules

When a generator creates multiple pages, it should produce a predictable route
manifest.

Collector gallery example:

- `/{handle}/index.html`
- `/{handle}/collections/index.html`
- `/{handle}/collections/{collection_slug}/index.html`
- `/{handle}/nfts/{chain}/{contract}/{token_id}/index.html`

Rules:

- Slugs must be deterministic and collision-safe.
- Route changes after publish should create redirects where practical.
- Generated pages should be editable after generation.
- Deleting a generated page should not delete the source NFT/collection data.
- Hidden pages can remain in the package but should not appear in navigation.

### Media Library

The builder should include a simple media library backed by content-addressed
assets.

MVP media sources:

- Uploaded image.
- Uploaded video.
- NFT media imported from wallet data.
- Social share image generated by 6529 service.

Required metadata:

- Asset kind.
- MIME type.
- Byte size.
- Dimensions or duration where applicable.
- Content hash.
- Storage locations.
- Alt text or decorative flag for images.

Rules:

- Avoid hotlinking mutable third-party media as the only source.
- Prefer copying important media into package storage where licensing and size
  allow it.
- Preserve original source URL as provenance.
- Support gateway rotation for IPFS/Arweave media.

### Wallet Gallery Generator

Flow:

1. Enter one or more ETH addresses or ENS names.
2. Resolve addresses.
3. Fetch NFTs and collections.
4. Show import summary.
5. Choose style.
6. Choose featured collections.
7. Hide spam or unwanted assets.
8. Generate site.
9. Preview pages.
10. Publish.

Required generated pages:

- Home.
- Collections index.
- Collection detail pages.
- NFT detail pages.

Required controls:

- Re-import.
- Freeze snapshot at block/time.
- Hide assets.
- Feature assets.
- Edit captions.

### Knowledge Packet System

Knowledge packets provide collection context.

They should be:

- Open.
- Versioned.
- Hashable.
- Extensible.
- Source-cited where possible.
- Usable by builders and renderers.

Initial packet fields:

- Collection name.
- Contract(s).
- Chain(s).
- Creator/project.
- Summary.
- Historical context.
- Traits or structure.
- Notable works.
- External references.
- Security/source notes.
- Version/hash.

Top collection strategy:

- Start with top collections by overall market cap and cultural relevance.
- Include 6529 collections with deeper custom packets.
- Allow community/project submitted packets later.

### Social Share UX

Every shareable page should have:

- Title.
- Description.
- OpenGraph image.
- Square image.
- Canonical URL.
- Safe fallback image.

Builder should warn on:

- Missing title.
- Missing description.
- Missing image.
- Text too long for social preview.
- Unsafe or unsupported media URL.

Later:

- Automatic OG image generation.
- Per-template share card design.
- NFT/card-specific share visuals.

### Publish Flow

User-facing steps:

1. Validate.
2. Preview.
3. Upload to decentralized storage.
4. Sign package.
5. Publish pointer.
6. Confirm live URL.

Validation checks:

- Schema valid.
- URLs safe.
- Required share metadata present.
- Assets reachable or embedded by content hash.
- Page slugs valid.
- No route conflicts.
- Signature valid.
- Storage receipt matches package hash/CID.

Failure handling:

- Save draft if upload fails.
- Retry storage providers independently.
- Publish can proceed with one provider only if product policy allows it.
- Clearly label storage state.

## Renderer Spec

### Rendering Modes

Need at least four modes:

- 6529.io web renderer.
- Static/export renderer.
- Electron/offline renderer.
- Crawler/social metadata renderer.

### Rendering Requirements

Renderer must:

- Validate package schema before rendering.
- Sanitize URLs and rich text.
- Enforce media allow rules.
- Reject unsupported block types or render an explicit safe fallback only when a
  future compatibility layer allows it.
- Preserve page metadata.
- Support mobile and desktop.
- Avoid layout shifts.
- Provide accessible navigation and controls.
- Fail closed for unsafe interactive content.

### Interactive HTML And 3D Safety

For interactive blocks:

- Use sandboxed iframes or equivalent isolation.
- Restrict script privileges.
- Restrict network behavior where possible.
- Use CSP.
- Provide static fallback.
- Never let arbitrary package content execute inside the main app context.

### 3D Rendering Requirements

For Three.js rooms:

- Nonblank canvas test.
- Desktop and mobile viewport tests.
- Loading state.
- Reduced-motion or low-power fallback.
- Keyboard and pointer interaction basics.
- Clickable NFT/frame navigation.
- Asset load failure handling.

## Backend Spec

### Services Needed

MVP backend services:

- Draft storage.
- Package validation.
- Package upload coordination.
- AI-readable source packet export.
- Agent patch validation and import.
- MCP tools for read/validate/preview/propose flows.
- IPFS publish/pin adapter.
- Arweave publish adapter.
- Profile publish authorization.
- Profile pointer API.
- Package fetch API.
- Storage receipt verification.
- OG image render service or worker.

Later:

- NFT indexer integration.
- Transaction decode service.
- Third-party agent integration registry.
- Knowledge packet registry.
- Site search indexing.
- Version rollback.
- Mirror registry export.
- Paid indexing jobs for xTDH-like external collections.

### API Surface Draft

The exact paths can change, but the capabilities should be explicit.

Read APIs:

- Get active site pointer for profile.
- Get package metadata by hash.
- Fetch package by hash.
- List published versions for profile.
- List drafts for profile owner.
- Get draft by id.
- Get storage receipt status.
- Get knowledge packet by id/hash.
- Preview generated wallet import summary.

Write APIs:

- Create draft.
- Update draft.
- Delete draft.
- Validate draft/package.
- Create publish candidate.
- Upload package to storage providers.
- Submit package signature.
- Publish profile pointer.
- Roll back pointer to prior package.
- Stop 6529 acceleration for a package.

Generator APIs:

- Resolve ENS/address inputs.
- Import wallet holdings snapshot.
- Group holdings by collection.
- Generate collection pages.
- Generate NFT pages.
- Generate social images.

Agent affordance APIs:

- Export source packet for profile, wallet, collection, NFT, transaction, draft,
  or package.
- Export JSON schema bundle.
- Export `SKILL.md` guidance bundle.
- Validate agent patch.
- Apply approved agent patch to draft.
- Return structured validation errors for agent repair loops.
- Return preview render result for a draft/package.

Admin/operator APIs:

- Re-run storage verification.
- Export pointer registry snapshot.
- Rebuild CDN acceleration object.
- Review package moderation state.
- Inspect publish audit log.

API rules:

- Publish APIs must be idempotent where practical.
- Pointer update should be conditional on expected previous pointer/version.
- Package fetch should be cacheable by hash.
- Draft APIs require authenticated profile owner/editor access.
- Public read APIs must never expose private draft state.
- Validation errors should be structured enough for the builder to deep-link to
  the relevant field, page, or block.

### Data Tables Or Persistent Stores

Backend likely needs these durable records:

- `cms_drafts`: mutable draft state and owner profile.
- `cms_packages`: immutable package metadata, hashes, schema version.
- `cms_storage_receipts`: IPFS/Arweave/CDN receipt records.
- `cms_profile_pointers`: active pointer per profile.
- `cms_pointer_events`: append-only publish/rollback history.
- `cms_publish_signatures`: signature envelopes and signer metadata.
- `cms_validation_results`: latest validation summary and error details.
- `cms_knowledge_packets`: curated packet records and hashes.
- `cms_generation_jobs`: wallet/gallery/social image generation job state.
- `cms_agent_patch_reviews`: optional records of imported agent patches,
  validation status, reviewer, and applied draft version.

Important:

- Package bytes should not depend only on relational rows.
- Database rows can index packages, but package storage must be independently
  retrievable.
- Pointer events should be append-only even if a convenience "current pointer"
  table exists.

### Profile Authorization

Publishing should require:

- Authenticated profile session.
- Wallet signature.
- Signer authorized for profile.
- Optional delegated publisher role later.

Do not add "official" or "verified" as a protocol-level lane.

### Pointers And Registry

Backend table/API should support:

- Active primary site pointer by profile.
- Historical versions.
- Drafts.
- Package records.
- Storage receipts.
- Publish signer.
- Validation status.
- Moderation/CDN acceleration status.

Long-term decentralization:

- Export pointer registry as content-addressed snapshots.
- Replicate pointer state to the special-purpose 6529 chain.
- Let alternative clients resolve profile site pointers without the 6529 API.

### Indexing

Separate trust tiers:

- Core 6529 data such as TDH/REP should move to the special-purpose chain.
- NFT ownership remains on Ethereum and supported chains.
- TDH for 6529 collections can be highly decentralized because the data set is
  small enough for many validators/indexers.
- xTDH for arbitrary collections has more attack surface and should be labeled
  as lower-security, opt-in, sponsor-funded indexing.

For CMS:

- Gallery generation can use 6529-operated indexers at launch.
- Package should store snapshot facts and source metadata.
- Users should be able to freeze a site to a block/time snapshot.
- Later clients can re-index from chain data or compare against the snapshot.

## Decentralization Architecture

### Launch Architecture

Practical launch path:

- 6529 web app provides builder and renderer.
- Backend validates, uploads, pins, and stores pointers.
- IPFS and/or Arweave stores package data.
- S3/CloudFront accelerates delivery.
- Existing indexers power gallery generation.

This is acceptable if the canonical artifact is decentralized and portable.

### Target Architecture

Medium-term target:

- Profile/pointer state in 6529 special-purpose chain.
- TDH/REP/Waves/core protocol data in special-purpose chain.
- NFTs remain on Ethereum and supported chains.
- CMS packages on IPFS/Arweave.
- Media on IPFS/Arweave or peer-hosted content-addressed storage.
- Electron/mobile/web clients can render without trusting 6529.io.
- Any operator can run mirror/gateway/indexer services.

### Mirrorability

Anyone should be able to mirror:

- CMS package blobs.
- Asset blobs.
- Pointer registry snapshots.
- Knowledge packet registry.
- Renderer code.

6529.io can still be the best UX and fastest CDN.

### Alternative Clients

Document and support:

- Package schema.
- Validation CLI.
- Renderer contract.
- Pointer resolution.
- Storage gateway fallback.
- Signature verification.

This enables:

- Alternative website mirrors.
- Mobile apps.
- Desktop apps.
- Archive nodes.
- Community renderers.

### Centralization Ledger

Every centralized launch dependency should have an explicit target state.

Builder UI:

- Launch: hosted on 6529.io.
- Target: open source/client-renderable builder logic where practical.
- Escape hatch: users can create packages with CLI or alternative clients.

Draft storage:

- Launch: 6529 backend.
- Target: client-local drafts plus optional encrypted/cloud backup.
- Escape hatch: export draft/package JSON.

Profile pointer:

- Launch: 6529 backend table/API.
- Target: 6529 special-purpose chain or decentralized profile state.
- Escape hatch: signed pointer registry snapshots.

Package storage:

- Launch: IPFS/Arweave through 6529 upload service.
- Target: users/operators can upload/pin independently.
- Escape hatch: package hash and standalone validator.

CDN acceleration:

- Launch: 6529 S3/CloudFront or equivalent.
- Target: optional acceleration only.
- Escape hatch: IPFS/Arweave gateways and mirrors.

NFT/gallery indexing:

- Launch: 6529-operated or third-party indexers.
- Target: reproducible chain/indexer snapshots; decentralized validators for
  core 6529 collections.
- Escape hatch: package embeds frozen snapshot metadata.

Knowledge packets:

- Launch: repo/6529-curated packets.
- Target: open packet registry with review and versioning.
- Escape hatch: package can bundle packet by hash.

Social image rendering:

- Launch: 6529 render worker.
- Target: deterministic renderer or package-bundled image.
- Escape hatch: uploaded/static social image.

Moderation/CDN policy:

- Launch: 6529 decides what it accelerates.
- Target: transparent acceleration state; content remains independently
  retrievable if legal and mirrored.
- Escape hatch: third-party mirrors render package directly.

## Privacy And Gating

Most CMS websites should be public.

For gated or private pages:

- Do not rely on hidden routes for confidentiality.
- Public static packages cannot keep plaintext private.
- Use encrypted page/package payloads.
- Gate access by distributing content keys to eligible members.

Possible gated content model:

- Public metadata and teaser.
- Encrypted page payload.
- Eligibility proof from TDH/REP/NFT/profile state.
- Key envelope for eligible users or groups.
- Rotation on meaningful membership changes.

For large gated groups:

- Accept practical rotation windows.
- Use epoch keys.
- Re-key on scheduled intervals or high-risk membership changes.
- Clearly document that users who had access may have retained plaintext.

This should be a later phase unless a near-term product needs it.

## Security Requirements

### Content Safety

- Validate schemas server-side and client-side.
- Sanitize rich text.
- Restrict link protocols.
- Restrict media hosts or require content-addressed media.
- Isolate arbitrary HTML/JS.
- Enforce CSP.
- Treat package content as untrusted input.

### Publishing Safety

- Verify signer authorization.
- Verify package hash before pointer update.
- Verify storage receipts.
- Store immutable publish records.
- Support rollback to previous package.
- Rate limit publish actions.

### Supply Chain Safety

- Avoid renderer dependencies that execute untrusted content unsafely.
- Pin package schemas.
- Add schema migration tests.
- Add corpus tests for old packages.

### Moderation And CDN Policy

Decentralized storage means content may remain available outside 6529.

6529.io still needs:

- Terms/CDN acceleration policy.
- Ability to stop accelerating illegal or abusive content.
- Ability to hide links from the 6529 UI while preserving decentralized facts.
- Transparent state labels when content is not accelerated by 6529.io.

## Accessibility, Localization, And UX Quality

All visible builder and renderer work should follow repo frontend standards:

- WCAG 2.2 AA for touched UI.
- Keyboard reachable controls.
- Proper headings.
- Alt text support and warnings.
- No text overlap on mobile or desktop.
- Responsive constraints for galleries/cards/buttons.
- Localized dates, numbers, and sorting where applicable.

Builder should help authors:

- Warn when images lack alt text.
- Warn when button text is vague.
- Warn when color contrast is poor.
- Warn when page title/share metadata is missing.

## Milestone Roadmap

### Milestone 0: Spec, Schema, And MVP Hardening

Goal:

Make the current foundation explicit and stable enough to build on.

Scope:

- Finalize package schema v1.
- Finalize page/block schema v1.
- Document URL model.
- Document package hashing rules.
- Document profile pointer model.
- Add schema fixture tests.
- Add renderer safety tests.

Acceptance criteria:

- Example packages validate deterministically.
- Renderer handles all v1 blocks safely.
- Unknown blocks render as safe fallback.
- Hashes are stable across environments.
- Roadmap/spec is committed and reviewed.

### Milestone 1: Primary Profile Site Launch

Goal:

Let a profile publish a primary CMS site at `/{handle}/index.html`.

Frontend scope:

- Route for CMS site pages under `/{handle}/index.html`.
- Profile page website button.
- Basic CMS renderer.
- Preview route.
- Basic Studio dashboard.
- Social metadata rendering.

Backend scope:

- Package records.
- Profile primary pointer API.
- Publish authorization.
- Package validation.
- Storage receipt model.

Storage scope:

- IPFS upload/pin adapter.
- Arweave upload adapter or clear first-provider decision.
- CDN acceleration path.

Acceptance criteria:

- A profile can publish a site.
- Site is reachable at `/{handle}/index.html`.
- Profile page links to it.
- Package is signed.
- Package has at least one decentralized storage receipt.
- Page has valid OpenGraph metadata.
- Browser tests cover desktop and mobile.

### Milestone 2: Wallet Gallery Generator V1

Goal:

Make the first killer CMS flow: paste wallets, get a beautiful gallery site.

Frontend scope:

- Multi-address input.
- ENS resolution UI.
- Import summary.
- Gallery style selector.
- Collection hiding/featuring.
- Generated page preview.
- NFT and collection page preview.

Backend scope:

- NFT ownership import.
- Collection grouping.
- Snapshot by block/time.
- Spam/unwanted asset filtering support.
- Source metadata in package.

Acceptance criteria:

- User can generate a site from one or more wallets.
- Site includes home, collection pages, and NFT pages.
- Generated pages have share metadata.
- Snapshot provenance is visible.
- User can hide obvious unwanted assets before publish.

### Milestone 3: General Page Builder V1

Goal:

Move from generator to real CMS.

Frontend scope:

- Site tree.
- Add/edit/delete pages.
- Block editor.
- Navigation editor.
- Theme controls.
- Share metadata editor.
- Draft autosave.
- Publish validation checklist.

Backend scope:

- Draft persistence.
- Version history.
- Publish validation.
- Rollback.

Acceptance criteria:

- User can build a basic multi-page site without hand-editing JSON.
- User can publish and roll back.
- Validation catches missing/unsafe required fields.
- Published package remains portable and content-addressed.

### Milestone 4: Collection And NFT Pages V1

Goal:

Make collection and token pages first-class, shareable, and beautiful.

Frontend scope:

- Collection page template.
- NFT/card page template.
- 6529 collection custom modules.
- Share card previews.

Backend scope:

- Collection knowledge packet registry.
- Top collection packet seed data.
- 6529-specific metadata enrichment.
- Optional sponsored external collection indexing model.

Acceptance criteria:

- Top collection pages render with knowledge context.
- Individual token pages render with media/provenance facts.
- 6529 Meme Cards and Gradients have richer native modules.
- Shared pages look good on major social platforms.

### Milestone 5: 3D Exhibition Rooms

Goal:

Ship real 3D room pages with reliable fallbacks.

Frontend scope:

- Three.js room renderer.
- Room template presets.
- Frame/token placement.
- Pointer and keyboard navigation.
- 2D fallback.
- Screenshot/canvas tests.

Backend scope:

- Room data schema validation.
- Asset optimization pipeline.
- Model/media storage receipts.

Acceptance criteria:

- Generated 3D room is nonblank and interactive on desktop.
- Mobile fallback is usable.
- Each displayed work links to its NFT/page.
- Package remains renderable by non-6529 clients.

### Milestone 6: Transaction Explainers

Goal:

Build block explorer pages that explain transactions like a human would.

Frontend scope:

- Transaction page template.
- Transaction reference block.
- Event timeline UI.
- Confidence/source labels.

Backend scope:

- Transaction fetch/decode adapter.
- ABI/plugin registry.
- Human-readable action extraction.
- Source and confidence metadata.

Acceptance criteria:

- User can create/share a transaction page.
- Page clearly explains parties, value, assets, and actions.
- Raw explorer links remain available.
- Uncertain interpretations are labeled.

### Milestone 7: Decentralization Hardening

Goal:

Reduce dependence on 6529-operated services.

Scope:

- Standalone package validator CLI.
- Standalone renderer package.
- Electron renderer integration.
- Pointer registry snapshot export.
- Gateway fallback list.
- Mirror documentation.
- Third-party client docs.
- Package corpus compatibility tests.

Acceptance criteria:

- A package can be validated outside 6529.io.
- A site can be rendered from IPFS/Arweave without 6529 API.
- Electron can browse cached/pinned sites.
- A third-party mirror can resolve and serve known profile sites from exported
  registry data.

### Milestone 8: Ecosystem And Marketplace

Goal:

Let others extend templates, knowledge packets, rooms, and indexers.

Scope:

- Template registry.
- Knowledge packet submissions.
- Community review/versioning.
- Paid indexing jobs for arbitrary collections.
- Plugin model for transaction decoders.
- Analytics that preserve privacy and do not become core infrastructure.

Acceptance criteria:

- External contributors can add templates/knowledge packets through a reviewed
  path.
- xTDH-like collection indexing is opt-in, lower-security, and sponsor-funded.
- Core CMS publishing does not depend on any single centralized indexer.

## Detailed Workstream Breakdown

### Track A: Schema, Package, And Validator

Purpose:

Make the CMS artifact stable enough that every other track can trust it.

Build:

- Site manifest schema.
- Canonical package schema.
- Canonical payload schema.
- Typed CMS collection registry.
- Page schema.
- Page metadata/frontmatter schema.
- Metadata defaults schema.
- Data cascade/resolved value schema.
- Block schema.
- Safe block macro schema.
- Asset schema.
- Art asset schema.
- Display variant schema.
- NFT media profile schema.
- Deep zoom manifest schema.
- Navigation schema.
- Taxonomy schema.
- Archetype schema.
- Pagination schema.
- Permalink/alias schema.
- Static search manifest schema.
- Locale/i18n schema.
- Markdown import/export metadata schema.
- Storage receipt schema.
- Signature envelope schema.
- Knowledge packet schema.
- Indexer snapshot schema.
- Agent/source provenance schema.
- Source loader output schema.
- Plugin manifest schema.
- Exhibition room schema.
- Artwork placement schema.
- Interactive policy schema.
- Static build manifest schema.
- Canonical JSON/hash implementation.
- Standalone validator CLI.
- Fixture package corpus.

Key outputs:

- `cms-package.schema`.
- `cms-payload.schema`.
- `site-manifest.schema`.
- Collection schemas for pages, posts, assets, NFTs, collections, rooms,
  transactions, knowledge packets, source packets, navigation, and translations.
- Schemas for defaults, taxonomies, archetypes, pagination, permalinks, aliases,
  block macros, and build manifests.
- Schemas for art assets, display variants, NFT media profiles, deep zoom
  manifests, exhibition rooms, artwork placements, and interactive policies.
- Package validator.
- Hash test vectors.
- Migration compatibility tests.

Critical decisions:

- Canonical JSON rules.
- EIP-712 vs EIP-191.
- Package size limits.
- Required vs optional storage providers.

### Track B: Profile Routing And Rendering

Purpose:

Make profile websites real routes in the app while keeping profile pages intact.

Build:

- CMS route resolver for `/{handle}/index.html`.
- CMS subpage resolver for `/{handle}/{path}/index.html`.
- Profile page website button.
- Permalink and alias resolver.
- Route collision detection.
- Package fetch/cache layer.
- Renderer shell.
- Static HTML export path.
- Static-first block renderer.
- Interactive island policy support.
- Safe block macro expansion.
- 2D art grid renderer.
- NFT detail renderer.
- Lightbox/focused inspection renderer.
- Poster/fallback renderer for video, audio, 3D, and interactive media.
- Optional deep zoom renderer/manifest support.
- 3D room renderer with faithful 2D artwork mode.
- Page metadata renderer.
- Generated navigation renderer.
- Taxonomy/term page renderer.
- Pagination route renderer.
- Static search manifest renderer/loader.
- Static build manifest output.
- Error states.
- Not-accelerated state.
- Package provenance panel.

Key outputs:

- Profile website route.
- Renderer components.
- Plain static export.
- Metadata integration.
- Browser/E2E coverage.

Critical decisions:

- Route conflict rules.
- Cache invalidation.
- Edge/server rendering strategy.
- How crawler requests resolve packages.

### Track C: Publish, Storage, And Pointers

Purpose:

Make publishing create durable artifacts, not database-only content.

Build:

- Draft storage.
- Publish candidate generation.
- Package validation.
- IPFS upload/pin adapter.
- Arweave upload adapter.
- Storage receipt verification.
- Profile pointer model.
- Pointer event log.
- Rollback.
- Package export.
- Pointer registry snapshot export.

Key outputs:

- Publish API.
- Storage worker/adapters.
- Pointer API.
- Version history.
- Rollback flow.

Critical decisions:

- Required storage policy.
- Pointer concurrency model.
- Upload retry policy.
- Moderation/acceleration state model.

### Track D: Builder UX

Purpose:

Give normal users a builder that is simple enough to use and powerful enough to
produce rich crypto-native sites.

Build:

- Builder dashboard.
- Site type picker.
- First-run guided flow.
- Archetype picker for new pages/sites.
- Site tree.
- Page editor.
- Block editor.
- Safe block macro picker.
- Frontmatter-style metadata editor.
- Metadata defaults editor.
- Theme controls.
- Navigation editor.
- Generated navigation controls.
- Taxonomy/tag/series controls.
- Pagination controls for large generated lists.
- Permalink/alias controls.
- Search inclusion controls.
- Locale/i18n fields where present.
- Media library.
- Art/NFT display variant controls.
- Poster/fallback controls for heavy media.
- Lightbox/deep zoom enablement where supported.
- 3D room style and faithful/gallery mode controls.
- Share metadata editor.
- Validation checklist.
- Preview desktop/mobile/social.
- Publish progress UI.
- Version history UI.

Key outputs:

- Usable builder for primary site.
- Draft/preview/publish UX.
- Validation UX.

Critical decisions:

- Initial templates.
- Mobile editing scope.
- Autosave behavior.
- How much freeform styling V1 allows.

### Track E: Wallet Gallery Generator

Purpose:

Ship the first native killer feature.

Build:

- Wallet/ENS input.
- Wallet source loader.
- Wallet import job.
- Collection grouping.
- Spam/unwanted asset detection.
- Snapshot freeze.
- Featured collection suggestions.
- Style selection.
- Generated home page.
- Generated collections index.
- Generated collection pages.
- Generated NFT pages.
- Generated NFT media profiles.
- Generated art display variants and posters.
- Generated taxonomy/tag pages where useful.
- Paginated all-NFT and collection routes.
- Caption/share copy suggestions.

Key outputs:

- Live wallet gallery generation.
- Editable generated pages.
- Snapshot provenance.
- Source loader output that can be exported to user-owned agents.

Critical decisions:

- Supported chains for V1.
- NFT indexer source.
- Spam scoring policy.
- Maximum wallet/import size.

### Track F: Collection And NFT Knowledge

Purpose:

Make NFT and collection pages genuinely better than generic indexer output.

Build:

- Knowledge packet schema.
- Knowledge packet registry.
- Top collection packet list.
- 6529 collection deep packets.
- Meme Card native modules.
- Gradient native modules.
- Notable token curation.
- Source/citation model.
- Packet versioning.

Key outputs:

- Collection page quality bar.
- NFT/card page quality bar.
- Open packet contribution path.

Critical decisions:

- First top collections.
- Review policy for packets.
- How packets are bundled/referenced in packages.
- How to label lower-confidence community packets.

### Track G: AI Agent Affordances

Purpose:

Let users bring their own AI agents to inspect, draft, edit, validate, and
prepare CMS sites without 6529 paying for or operating their inference.

Build:

- MCP server tools for profile/CMS read, validate, preview, and draft patch
  flows.
- `SKILL.md` files for site building, wallet galleries, NFT pages, collection
  pages, transaction explainers, validation, and publishing.
- JSON schema bundle export.
- Site manifest and build manifest export.
- Source packet export.
- Agent patch schema.
- Agent patch import/review UI.
- Structured validation errors for agent repair loops.
- Prompt-injection-safe source packet sanitization.
- Markdown import/export guidance for docs/posts.
- Docs for bring-your-own-agent workflows.

Key outputs:

- AI-readable CMS contract.
- User-owned agent workflow.
- Validated patch handoff from external agents into the 6529 builder.
- Clear boundary that signing/publishing remains user-controlled.

Critical decisions:

- Which MCP tools ship in V1.
- Which `SKILL.md` files ship in V1.
- Whether agent patch import is available in V1 or V1.1.
- How agent patches are permissioned and reviewed.
- What source packets are safe to export publicly vs only to the profile owner.

### Track H: 3D Rooms

Purpose:

Make immersive exhibition pages a signature capability without sacrificing
reliability.

Build:

- Room data schema.
- Room preset templates.
- Three.js renderer.
- Basic GLB/glTF object viewer.
- Media frame component.
- Placement algorithm.
- Faithful 2D artwork surface mode.
- Gallery/ambient display mode.
- Poster/static preview.
- 2D fallback.
- Mobile fallback.
- Nonblank canvas tests.
- Performance budget.

Key outputs:

- Simple generated exhibition room.
- Basic object viewer.
- Clickable works.
- Shareable room page.
- Faithful 2D detail-page path for every room artwork.

Critical decisions:

- V1 room navigation model.
- Asset optimization limits.
- Whether custom 3D models are allowed in V1.
- How much room editing is manual vs generated.

### Track I: Transaction Explainers

Purpose:

Make block explorer data understandable.

Build:

- Transaction reference block.
- Transaction page template.
- Chain transaction fetcher.
- Event decoder.
- ABI/plugin registry.
- Human-readable action model.
- Agent-readable transaction fact packet.
- Confidence/source labels.

Key outputs:

- Shareable transaction page.
- Event timeline.
- Plain-English summary.

Critical decisions:

- Supported chains.
- Supported transaction types.
- How to label uncertainty.
- Whether decoded facts are cached in package.

### Track J: Decentralization And Alternative Clients

Purpose:

Ensure 6529.io is an excellent client, not the only viable client.

Build:

- Standalone validator.
- Standalone renderer package.
- Plain static HTML exporter.
- Package inspector/diff CLI direction.
- Static search index export.
- Sitemap and build manifest export.
- Electron renderer integration.
- Local package cache.
- Pointer registry export.
- Mirror guide.
- Gateway fallback guide.
- Third-party client docs.
- Package corpus tests.

Key outputs:

- Render package without 6529 API.
- Validate package outside 6529.io.
- Export static site without Astro/Starlight.
- Mirror profile site.
- Electron/offline browse path.

Critical decisions:

- Renderer package boundary.
- Registry snapshot cadence.
- How Electron discovers profile pointers before chain migration.

### Track K: Security, Abuse, And Moderation

Purpose:

Keep CMS publishing safe for users and safe for 6529.io to accelerate.

Build:

- Rich text sanitizer.
- URL validator.
- Media validator.
- CSP policy.
- Sandbox policy.
- Upload rate limits.
- Package size limits.
- Abuse reporting path.
- Acceleration allow/deny state.
- Publish audit log.

Key outputs:

- Renderer security posture.
- Upload/publish abuse controls.
- Moderation state transparency.

Critical decisions:

- CDN acceleration policy.
- Illegal/abusive content handling.
- Upload quotas.
- Interactive HTML policy.

### Track L: Operations And Review

Purpose:

Make the roadmap buildable by many PRs and reviewers.

Build:

- PR labels.
- Milestone checklists.
- Test packs.
- Screenshot review procedure.
- Bot review procedure.
- Release gating.
- Documentation updates.
- Runbooks for storage failures.

Key outputs:

- Repeatable PR review process.
- Clear launch readiness checklist.
- Operational runbooks.

Critical decisions:

- Required checks per milestone.
- Who can approve storage/signing/security changes.
- What staging data/profiles are used for E2E.

## Implementation Order

Recommended sequence:

1. Merge foundation PRs.
2. Add typed CMS collections, source loader outputs, page metadata, navigation,
   scoped metadata defaults, data cascade rules, archetypes, taxonomies, safe
   block macros, pagination/permalinks, static search, locale fields, and block
   interactivity policies.
3. Add art/NFT display primitives: art assets, display variants, NFT media
   profiles, posters, deep zoom manifests, exhibition rooms, placements, and
   interactive policies.
4. Add profile route/link integration.
5. Add real signing and storage receipts.
6. Add IPFS/Arweave upload adapters.
7. Harden renderer and schema tests.
8. Add plain static HTML export.
9. Build basic site dashboard.
10. Expand wallet gallery generator to live data.
11. Add collection/NFT generated pages.
12. Add general page builder.
13. Add knowledge packet registry.
14. Add AI-agent affordances: MCP tools, `SKILL.md`, schema export, and patch
    import/review.
15. Add 3D rooms.
16. Add transaction explainers.
17. Add standalone validator/renderer.
18. Add mirror/Electron workflows.

## Testing And Review Plan

### Unit And Integration Tests

Required coverage:

- Schema validation.
- Hash canonicalization.
- Signature verification.
- URL sanitization.
- Block rendering.
- AI source packet sanitization.
- Agent patch schema validation.
- Agent patch import cannot bypass user review, auth, or package validation.
- Profile pointer API.
- Publish authorization.
- Storage receipt validation.
- Migration compatibility.

### Browser/E2E Tests

Required flows:

- Profile page shows website button when site exists.
- `/{handle}/index.html` renders primary site.
- Generated gallery renders on desktop and mobile.
- Share metadata exists.
- Builder validation blocks invalid publish.
- Publish success path.
- Rollback path.

### Visual QA

Use browser screenshots for:

- Profile page integration.
- Home site.
- Gallery page.
- Collection page.
- NFT page.
- Mobile views.
- 3D room once implemented.

### Security Review

Review specifically:

- Rich text sanitization.
- URL/media validation.
- Prompt-injection handling from NFT metadata, collection metadata, and user
  supplied text in AI-facing source packets.
- Agent patch validation, permissioning, and source labeling.
- Interactive HTML sandboxing.
- Signature authorization.
- Pointer update race conditions.
- Storage receipt spoofing.
- CDN moderation behavior.

### Bot/Human Review

Each major milestone PR should include:

- Product summary.
- Decentralization impact.
- Security notes.
- Screenshots.
- Test evidence.
- Known limits.
- Follow-up checklist.

## Risk Register

### Risk: Builder Scope Explosion

Concern:

The project becomes a generic website builder before proving the profile-native
crypto workflows.

Mitigation:

- Keep V1 to primary profile site, gallery generator, simple pages, and publish
  pipeline.
- Defer custom domains, arbitrary JS, private pages, and marketplace features.
- Measure time-to-publish and completion rate.

### Risk: Decentralization Theater

Concern:

The app says IPFS/Arweave, but the real canonical source remains the 6529
database.

Mitigation:

- Package hash and decentralized storage receipt required for launch publish.
- Standalone validator required before public launch.
- Package export required.
- Pointer registry snapshot export required before decentralization hardening is
  considered complete.

### Risk: Unsafe Untrusted Content

Concern:

CMS content becomes an XSS or arbitrary-code execution path.

Mitigation:

- No arbitrary JS in V1.
- Sanitize rich text.
- Validate URLs.
- Sandbox interactive content.
- Add security review gate for renderer changes.

### Risk: Indexer Trust Confusion

Concern:

Users mistake xTDH or arbitrary collection indexing for the same security level
as core TDH.

Mitigation:

- Separate trust labels.
- Embed source/snapshot metadata.
- Treat xTDH-like indexing as opt-in and sponsor-funded.
- Use stronger decentralized validation for core 6529 data.

### Risk: Poor Consumer UX

Concern:

The decentralized mechanics leak into the happy path and normal users fail to
publish.

Mitigation:

- Use guided templates.
- Hide advanced provenance until needed.
- Validate with user-flow E2E and screenshots.
- Keep first-run gallery flow tight.

### Risk: Storage Cost And Abuse

Concern:

Users upload large or abusive assets through 6529 storage services.

Mitigation:

- Size limits.
- MIME/type validation.
- Rate limits.
- Profile-level quotas.
- CDN acceleration policy.
- Separate package publish from 6529 acceleration.

### Risk: SEO And Route Breakage

Concern:

Moving hardcoded sections to CMS breaks existing links or social previews.

Mitigation:

- Inventory old routes.
- Add redirect/canonical plan per migration.
- Test social metadata.
- Keep route shims until stable.

## Decisions Needed Before First Build PRs

These decisions should be made before implementation spreads across FE and BE:

- Required storage policy: IPFS only, Arweave only, or one required plus one
  recommended.
- Signature scheme: EIP-712 from the start or EIP-191 first.
- Canonical JSON/hash rules.
- Initial backend pointer shape and optimistic-concurrency rules.
- Initial route conflict policy for handles that overlap app routes.
- Initial template list for V1.
- Initial top collection knowledge packet list.
- Initial moderation/CDN acceleration policy.
- Initial package size and media upload limits.

## Open Questions

### Product

- Should first production publish require both IPFS and Arweave, or allow one
  required and one optional?
- How much customization should V1 templates allow before the UX becomes too
  complex?
- Should profile sites support custom domains in V1, or later?
- What is the first set of top collection knowledge packets?
- Which 6529 collections deserve custom templates first?

### Technical

- Which canonical JSON library/rules should own hash determinism?
- Do we use EIP-712 from the start or begin with EIP-191?
- Where does the mutable pointer live before the special-purpose chain exists?
- How do alternative clients resolve latest profile pointers without the 6529
  API during the transition?
- Which IPFS pinning and Arweave providers are acceptable for production?

### Governance

- What content will 6529.io refuse to accelerate even if it is decentralized?
- Who can publish for institutional profiles?
- How are compromised publishing keys revoked?
- What labels do we use for lower-security xTDH/indexer-derived pages?

## Near-Term PR Breakdown

### PR 0: Shared Decisions And Test Fixtures

Repos:

- Frontend.
- Backend.

Scope:

- Lock storage/signature/hash decisions.
- Add canonical package fixtures.
- Add typed CMS collection schemas.
- Add page metadata/frontmatter schema.
- Add site manifest, scoped metadata defaults, data cascade, archetype,
  taxonomy, block macro, pagination, permalink/alias, and static build manifest
  schemas.
- Add art asset, display variant, NFT media profile, deep zoom manifest,
  exhibition room, artwork placement, and interactive policy schemas.
- Add source loader output schema.
- Add navigation, static search, locale/i18n, and block interactivity policy
  schemas.
- Add hash test vectors.
- Add schema fixture tests.
- Add package corpus folder.
- Document route conflict rules.

Why first:

This prevents FE and BE from building incompatible package assumptions.

### FE PR 1: Route And Profile Integration

- Add CMS route resolution for `/{handle}/index.html`.
- Add profile website button.
- Add metadata rendering.
- Add safe loading/error states.
- Add focused tests and screenshots.

### BE PR 1: Package Records And Pointer V1

- Add package record model.
- Add primary pointer endpoints.
- Add publish authorization.
- Add validation status.
- Add package fetch endpoint.
- Add pointer event log.
- Add optimistic concurrency on pointer update.

### FE PR 2: Renderer And Provenance Panel

- Render all V1 safe blocks.
- Add package provenance panel.
- Add unsupported-block fail-closed tests.
- Add desktop/mobile rendering tests.
- Add social metadata tests.

### BE PR 2: Validation And Signing

- Add package validation service.
- Add signature verification.
- Add signer authorization checks.
- Add validation error structure for builder deep links.
- Add tests for unauthorized publish.

### FE PR 3: Builder Dashboard V1

- Add dashboard entry.
- Show current site/drafts.
- Add preview/publish actions.
- Add validation checklist.
- Keep wallet-gallery generator available.

### BE PR 3: Storage Receipts And Uploads

- Add IPFS upload/pin adapter.
- Add Arweave upload adapter.
- Verify receipt matches package hash/CID.
- Store receipts.
- Add retry/status model.

### FE PR 4: Live Wallet Gallery V1

- Add live import flow.
- Add generated collection and NFT pages.
- Add hide/feature controls.
- Add social share preview.

### BE PR 4: Wallet Import And Snapshot V1

- Resolve wallet/ENS inputs.
- Import NFT holdings.
- Group by collection.
- Store snapshot metadata.
- Provide preview data for FE generator.

### Cross-Repo PR: AI Agent Affordances V1

- Add JSON schema bundle export.
- Add source packet export.
- Add initial MCP read/validate/preview tools.
- Add `SKILL.md` guidance for wallet gallery and package validation.
- Add agent patch schema.
- Add agent patch validation.
- Add optional agent patch import/review UI if scope allows.

### Cross-Repo PR: Publish End-To-End

- Add package signing UX.
- Add backend signature verification.
- Add package signature display.
- Add tests for unauthorized publish attempts.
- Add upload, sign, pointer publish, and live route E2E.

### Cross-Repo PR: Version History And Rollback

- Add published version list.
- Add rollback action.
- Add pointer event display.
- Add tests for rollback to earlier package.

## Definition Of Done For Public Launch

Public launch should not happen until:

- Profiles can publish primary CMS sites.
- Published packages are signed.
- Published packages are stored on IPFS and/or Arweave.
- 6529.io only accelerates content; it is not the sole canonical store.
- Profile pages link clearly to primary sites.
- Wallet gallery generator works with live data.
- Social previews are good.
- Renderer passes desktop and mobile checks.
- Security review covers untrusted content handling.
- Users can export package/provenance details.
- Internal docs explain how to mirror and validate a package.
