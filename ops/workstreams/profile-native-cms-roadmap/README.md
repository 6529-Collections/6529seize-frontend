# Profile Native CMS Roadmap

## Charter

Build a profile-native CMS that lets any 6529 profile publish a beautiful,
crypto-native website at `/{handle}/index.html`, while keeping the normal
profile page at `/{handle}` intact.

The CMS must launch before full decentralization, but it must not create a
future migration trap. Published sites should be portable, content addressed,
signed by profile authority, mirrorable outside 6529.io, and renderable by
alternative web, desktop, mobile, and Electron clients.

## Core Idea

6529.io should stop treating Museum, Capital, About, Education, Blog, News, and
similar content families as privileged app sections. Those should become
examples of profile-owned websites built with the same CMS available to every
profile.

Examples:

- `/punk6529` remains the normal profile page.
- `/punk6529/index.html` is punk6529's chosen profile website.
- The profile page links to `/punk6529/index.html` when a primary CMS site is
  published.
- `6529museum`, `6529capital`, and other institutional profiles can publish
  their own sites through the same system.

## Planning Docs

- [Product And Technical Roadmap](product-technical-roadmap.md)
- [Agentic Storm Execution Plan](agentic-storm-execution-plan.md)
- [Art And NFT Display Best Practices](art-nft-display-best-practices.md)
- [Phase 0 Decision Record](phase-0/decision-record.md)
- [Phase 0 Storm Lanes](phase-0/storm-lanes.md)
- [Phase 0 Test Matrix](phase-0/test-matrix.md)
- [Phase 0 PR Wave Plan](phase-0/pr-wave-plan.md)
- [Phase 1 Protocol Foundation](phase-1/README.md)
- [Phase 1 Schema Index](phase-1/schema-index.md)
- [Phase 1 Fixture Corpus](phase-1/fixtures/README.md)
- [Phase 1 Validation Plan](phase-1/validation-plan.md)
- [Active Context](active-context.md)
- [Run Log](run-log.md)

## Initial Build Mode

This workstream should proceed as a sequence of reviewable FE and BE PRs:

1. Decide the V1 storage, signing, hashing, pointer, route-conflict, and media
   limit details.
2. Stabilize package, pointer, renderer, and publish foundations.
3. Ship primary profile CMS sites with decentralized storage receipts.
4. Expand the builder from wallet gallery generation into a true site builder.
5. Add crypto-native page types: NFT, collection, transaction, exhibition room,
   and knowledge packet pages.
6. Harden for decentralization: open schemas, standalone renderer, Electron
   support, third-party clients, and mirrorable registry/index data.

## V1 Cutline

V1 should prove the whole shape without trying to become a generic website
builder:

- Primary profile website at `/{handle}/index.html`.
- Profile page button to the primary website.
- Simple guided builder.
- Wallet gallery generator.
- AI-agent affordances such as schemas, source packets, MCP tools, `SKILL.md`,
  validation, and patch import so users can bring their own AI.
- Home, collection, and NFT pages.
- Art/NFT display primitives: art assets, display variants, NFT media profiles,
  posters, provenance panels, lightbox, optional deep zoom manifests, simple 3D
  rooms, and basic GLB/glTF object viewing.
- Signed immutable package.
- IPFS and/or Arweave storage receipt.
- 6529 CDN acceleration as optional convenience.
- Package export and provenance panel.
- Astro/Starlight-inspired native ideas: typed content collections, source
  loaders, static-first interactive islands, frontmatter-style page metadata,
  generated navigation, static search, and i18n-ready fields.
- Jekyll/Hugo/Eleventy/Docusaurus/VitePress/MkDocs/Gatsby/Zola-inspired native
  ideas: scoped metadata defaults, archetypes, taxonomies, safe block macros,
  data cascade rules, pagination, permalinks and aliases, site/build manifests,
  Markdown import/export, and standalone local tooling direction.
