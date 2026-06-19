# Art And NFT Display Best Practices

Last updated: 2026-06-18.

## Purpose

Define how the profile-native CMS should display art and NFTs in 2D and 3D.

The goal is not to imitate marketplaces or block explorers. The goal is to make
art look excellent, remain faithful to the source, load well, preserve
provenance, work accessibly, and support decentralized storage and alternative
clients.

## Research Baseline

Official sources reviewed:

- IIIF Image API: `https://iiif.io/api/image/3.0/`.
- IIIF Presentation API: `https://iiif.io/api/presentation/2.0/`.
- ERC-721: `https://eips.ethereum.org/EIPS/eip-721`.
- OpenSea metadata standards:
  `https://docs.opensea.io/docs/metadata-standards`.
- Khronos glTF: `https://www.khronos.org/gltf/`.
- Khronos glTF PBR: `https://www.khronos.org/gltf/pbr/`.
- three.js GLTFLoader:
  `https://threejs.org/docs/pages/GLTFLoader.html`.
- three.js DRACOLoader:
  `https://threejs.org/docs/pages/DRACOLoader.html`.
- three.js KTX2Loader:
  `https://threejs.org/docs/pages/KTX2Loader.html`.
- three.js LoadingManager:
  `https://threejs.org/docs/pages/LoadingManager.html`.
- model-viewer:
  `https://web.dev/articles/model-viewer` and
  `https://modelviewer.dev/docs/`.
- web.dev image performance:
  `https://web.dev/learn/performance/image-performance`.
- web.dev browser lazy loading:
  `https://web.dev/articles/browser-level-image-lazy-loading`.
- WCAG 2.2: `https://www.w3.org/TR/WCAG22/`.
- W3C alt decision tree:
  `https://www.w3.org/WAI/tutorials/images/decision-tree/`.
- W3C captions and transcripts:
  `https://www.w3.org/WAI/media/av/captions/` and
  `https://www.w3.org/WAI/media/av/transcripts/`.
- C2PA: `https://c2pa.org/`.

## Core Principles

### Art First

The art surface should be the first visual priority.

Do:

- Give the work space.
- Preserve aspect ratio.
- Let users inspect detail.
- Keep metadata available but not dominant.
- Use quiet, neutral UI around the work.

Do not:

- Trap artwork in tiny marketplace cards.
- Crop detail pages.
- Bury the media below stats.
- Overdecorate the frame or room.
- Make price/floor data the primary context.

### Faithful By Default

Display should not modify the artwork unless explicitly requested by the
publisher or viewer.

Rules:

- Preserve the original aspect ratio in detail views.
- Do not apply CSS filters, blur, saturation, or contrast changes to artwork.
- Preserve transparent backgrounds by showing a checker, neutral field, or
  publisher-selected background.
- Make derivative crops/thumbnails clearly secondary to the original display.
- Keep a link to the original asset and source metadata where possible.

### Context On Demand

Context is valuable, but it should not crowd the art.

Use a layered model:

1. Artwork.
2. Title, artist/creator, collection.
3. Short caption or curatorial note.
4. Expandable provenance and chain facts.
5. Deep technical metadata.

### Provenance Always

NFT display must expose where the media and facts came from.

Important provenance:

- Chain.
- Contract.
- Token id.
- Token standard.
- Metadata URI.
- Original media URI.
- IPFS/Arweave/content hash where known.
- Snapshot block/time.
- Owner at snapshot.
- Collection/contract metadata.
- Display derivative hashes.
- Package hash.
- Any C2PA/content credential reference if present.

### Static First, Interactive When Worth It

Most art pages should render useful static HTML.

Interactive behavior should be added only where it improves inspection:

- Deep zoom.
- Carousel.
- 3D room.
- 3D object viewer.
- Interactive HTML artwork sandbox.

Every interactive display needs a static fallback.

## NFT Media Taxonomy

The CMS should treat NFT media as a family of related assets, not a single URL.

### Source Asset

The original or canonical media referenced by token metadata or collection
knowledge.

Examples:

- `image`.
- `image_data`.
- `animation_url`.
- `external_url`.
- Contract-level media.
- Artist-supplied alternate file.

### Display Derivatives

Generated or curated assets optimized for viewing.

Examples:

- Thumbnail.
- Grid tile.
- Detail image.
- Fullscreen image.
- Deep zoom tiles.
- Video MP4/WebM transcode.
- Audio waveform/poster.
- 3D poster.
- Social image.

Derivative rules:

- Derivatives must never replace the original as provenance.
- Derivatives should be content-addressed when possible.
- Derivatives should record generation settings and source hash.
- The user should be able to open the original where safe.

### Posters

Every non-instant media type should have a poster:

- Video.
- Audio.
- 3D model.
- Interactive HTML.
- Heavy generative art.
- 3D room.

Poster requirements:

- Content-addressed if possible.
- Aspect ratio recorded.
- Used for social sharing when appropriate.
- Used as static fallback.

### Metadata

OpenSea's metadata convention supports image, multimedia attachments, audio,
video, 3D models, and interactive traits. ERC-721 itself defines the core NFT
contract API and metadata extension surface.

CMS implication:

- Store raw metadata.
- Store normalized metadata.
- Store source and retrieval details.
- Support more than one media field.
- Show when marketplace metadata differs from direct token metadata.

## 2D Display Modes

### Collection Grid

Use for browsing many works.

Best practices:

- Default to aspect-ratio-preserving tiles.
- Offer optional uniform crop mode for dense scanning.
- Never use cropped grid thumbnails as the detail-page display.
- Use stable tile dimensions to avoid layout shift.
- Lazy-load offscreen images.
- Avoid lazy-loading the main above-the-fold image.
- Show title/collection/creator on hover or under tile depending on density.
- Keep floor/rarity/market data off by default or secondary.

Recommended grid modes:

- Editorial grid: fewer works, larger tiles, captions.
- Dense collector grid: many works, compact labels.
- Contact sheet: uniform rows for quick scanning.
- Chronological wall: by mint/acquire date.
- Collection grouped grid: sections by collection.

### Detail Page

Use for one work.

Required:

- Large media display.
- Title.
- Creator/artist when known.
- Collection.
- Chain/contract/token id.
- Owner snapshot.
- Source/provenance panel.
- Share metadata.
- Links to collection and profile/gallery context.

Recommended:

- Fullscreen mode.
- Zoom/pan for high-resolution still images.
- Download/open-original action where appropriate.
- Related works.
- Curatorial note.
- Trait/attribute panel.
- Provenance timeline.
- Display variant selector if multiple media assets exist.

### Lightbox

Use for focused inspection without leaving context.

Best practices:

- Keyboard navigation.
- Escape closes.
- Arrow keys move between works.
- Zoom controls.
- Fullscreen action.
- Captions and metadata toggle.
- Do not trap focus incorrectly.
- Preserve browser back behavior where possible.

### Deep Zoom

For large still images, adopt an IIIF-like tile pyramid model even if we do not
implement full IIIF immediately.

Why:

- High-resolution art should be inspectable without loading huge originals.
- Tiles let users zoom into detail.
- Cultural heritage institutions use IIIF for high-quality attributed image
  delivery at scale.

CMS model:

- Original image.
- Tile manifest.
- Tile levels.
- Tile size.
- Dimensions.
- Format.
- Generator version.
- Source hash.

V1:

- Support optional deep zoom for very large images.
- Generate tiles only for curated/high-value images or when user requests it.
- Keep normal responsive image variants for standard display.

### Editorial Display

For essays, museum pages, and artist pages:

- Let text and image alternate rhythmically.
- Support captions and credits.
- Support image comparisons.
- Support side-by-side details.
- Support pull quotes/callouts.
- Support footnotes/source references.
- Keep the artwork visually primary, not decoration.

### Comparison Mode

Useful for:

- Meme Card and Rememe relationships.
- Before/after metadata or artwork variants.
- Multi-edition comparisons.
- Trait comparisons.
- Collection study pages.

Best practices:

- Keep synchronized zoom/pan optional.
- Show clear labels.
- Preserve aspect ratios.
- Avoid overloading mobile layouts.

## Image Performance

Images are usually among the heaviest web resources, so art pages need a strong
media pipeline.

Required variants:

- Thumbnail.
- Grid tile.
- Detail display.
- Fullscreen.
- Social image.
- Original.

Best practices:

- Use responsive image sizes.
- Set width/height or aspect-ratio to avoid layout shift.
- Lazy-load offscreen images.
- Do not lazy-load the LCP/hero artwork.
- Use modern formats for derivatives where safe.
- Keep original file accessible separately.
- Generate blur/solid-color placeholders from the image.
- Keep asset hashes and dimensions in the package.

CMS validation should warn when:

- An image lacks dimensions.
- A grid uses only original files.
- A page has no social image.
- A huge original is used as a thumbnail.
- Important media lacks a poster/fallback.

## Video, Audio, Animated, And Interactive Media

### Video

Best practices:

- Use poster image.
- Use native controls or accessible custom controls.
- Avoid autoplay with sound.
- Provide captions when audio carries meaning.
- Provide transcript or descriptive transcript where needed.
- Offer reduced-motion or still fallback for loops.
- Use MP4/WebM derivatives while preserving the original source reference.

### Audio

Best practices:

- Use accessible controls.
- Provide transcript for spoken audio.
- Provide cover/poster image.
- Show duration and waveform only as enhancement.

### Animated GIFs

Best practices:

- Preserve original when it is the artwork.
- Generate video derivative for performance when appropriate.
- Provide pause/reduce-motion controls for long or intense animation.

### Interactive HTML NFTs

Best practices:

- Render in sandboxed iframe or equivalent isolation.
- Use a poster/static fallback.
- Require click-to-activate for heavy or script-based work.
- Restrict privileges.
- Keep source URL and content hash where possible.
- Do not execute arbitrary HTML inside the main app context.

## 3D Display Modes

### Object Viewer

Use for a single 3D NFT/model.

Best practices:

- Prefer GLB/glTF for runtime display.
- Use a poster before loading.
- Lazy/defer model loading.
- Provide camera controls.
- Provide reset view.
- Provide fullscreen.
- Provide model metadata.
- Provide 2D fallback.
- Avoid autoplaying animation unless subtle and pausable.

model-viewer is good prior art for simple object display: declarative model
embedding, poster images, responsive behavior, camera controls, AR support, and
visibility-aware loading.

### 3D Room

Use for a profile gallery, exhibition, or room-like presentation.

Core UX:

- Immediate poster/static preview.
- Click/tap to enter.
- Works arranged on walls or pedestals.
- Click a work to open metadata/detail page.
- Keyboard, mouse, and touch controls.
- Exit/fullscreen controls.
- Minimap or room list for larger exhibitions.
- Mobile fallback.

Room types:

- Simple wall room.
- Salon wall.
- White cube.
- Dark room.
- Outdoor/plaza.
- Timeline room.
- Collection-specific themed room.
- Card-specific immersive room.

V1 should start with simple wall rooms, not a full 3D world editor.

### 2D Art In 3D Rooms

This is surprisingly important.

If lighting and shadows alter the artwork, the result may be beautiful but not
faithful. We need two modes:

Faithful mode:

- Artwork surface uses unlit or color-faithful material.
- Room lighting affects frame/wall, not the pixels of the art.
- Best for canonical display.

Gallery mode:

- Artwork can receive subtle environmental integration.
- Frames, glass, shadows, and lighting can make the room feel real.
- Must not be the only way to inspect the work.

Rule:

Every 2D work in a 3D room must link to a faithful 2D detail page.

### 3D NFT Models

For native 3D works:

- Respect artist-provided model, animations, and materials.
- Prefer glTF/GLB as display format.
- Preserve source asset and provide optimized derivative if needed.
- Do not bake the work into a generic room in a way that changes it.
- Provide object viewer and optional room placement.

### 3D Asset Pipeline

Recommended runtime formats:

- GLB/glTF for web 3D.
- KTX2/Basis compressed textures where useful.
- Draco or Meshopt geometry compression where useful.
- USDZ only as an optional AR export path, not core package format.

Use glTF because Khronos defines it for efficient transmission/loading of 3D
scenes and models, with PBR support for realistic material rendering.

Asset metadata:

- Source URI.
- Runtime URI.
- Poster URI.
- File size.
- Vertex/triangle count where known.
- Texture count and dimensions.
- Animation list.
- Compression extensions.
- Bounds.
- Recommended camera.
- License/rights notes.

Validation warnings:

- Model too large.
- Textures too large.
- No poster.
- No fallback.
- No camera/bounds.
- No compressed derivative for heavy asset.
- Unsupported extension.

### 3D Performance

Best practices:

- Defer loading until user intent or viewport.
- Use poster image.
- Use progress and error states.
- Use LoadingManager-style progress accounting.
- Reuse decoders.
- Dispose resources when leaving room.
- Cap device pixel ratio.
- Use adaptive quality on mobile.
- Avoid loading many models at once.
- Use instancing for repeated frames.
- Use compressed textures.
- Use simple geometry for frames/walls.

Suggested V1 budgets:

- Simple room initial JS and scene should stay small enough to load quickly on
  mobile.
- 2D wall art should use display derivatives, not originals.
- GLB object viewer should warn above a configured file-size threshold.
- Texture dimensions should be capped or flagged.
- If the room cannot hit performance targets, fall back to 2D.

### 3D Navigation And Comfort

Avoid making users fight the camera.

V1 controls:

- Orbit/pan for object viewer.
- Guided hotspots or simple walk/teleport for room.
- Keyboard alternatives.
- Touch-friendly controls.
- Reset view.
- Exit room.

Avoid in V1:

- Forced pointer lock.
- Fast first-person motion.
- Complex physics.
- Collision-heavy navigation.
- Motion that cannot be paused.

Accessibility:

- Provide DOM list of works in the room.
- Provide detail pages for every work.
- Provide keyboard path to every work.
- Respect reduced motion.
- Do not rely on spatial position as the only navigation method.

### 3D Visual Quality

Use a restrained museum-like default:

- Neutral wall/background.
- Subtle floor.
- Good spacing.
- Reasonable frame thickness.
- Soft lighting.
- No decorative clutter.
- No gradients/orbs/bokeh as substitute for design.

Rendering:

- Use correct color workflow.
- Use PBR for room materials.
- Use unlit/faithful option for 2D artwork.
- Use environment maps carefully.
- Avoid post-processing that changes artwork colors.
- Keep labels readable and not floating over art unless requested.

## NFT Detail Page Structure

Recommended layout:

1. Media display.
2. Title and collection.
3. Creator/artist/project.
4. Short curatorial text or caption.
5. Primary facts:
   - Chain.
   - Contract.
   - Token id.
   - Token standard.
   - Owner snapshot.
   - Metadata source.
6. Provenance:
   - Mint.
   - Transfers.
   - Sales if source is reliable and labeled.
   - Package snapshot block/time.
7. Attributes/traits.
8. Related works.
9. Source links:
   - Original media.
   - Metadata URI.
   - Marketplace/explorer links.
   - IPFS/Arweave links.
10. Rights/license notes where known.

Do not treat marketplace links as canonical. They are useful context, not the
source of truth.

## Gallery Builder Implications

The builder should ask simple questions:

- Which wallets?
- Which collections matter most?
- Hide spam/unwanted NFTs?
- Which works are featured?
- What mood: editorial, dense, museum wall, 3D room, archive?
- What background: light, dark, neutral, transparent-aware?
- Generate individual NFT pages?
- Generate collection pages?
- Generate 3D room?
- Freeze snapshot at current block/time?

The builder should infer sensible defaults, but users need override controls.

## Schema Implications

Add or expand these CMS entities:

### `art_asset`

Fields:

- `id`.
- `kind`: image, video, audio, model, html, document, social_image.
- `source_uri`.
- `content_hash`.
- `mime_type`.
- `width`.
- `height`.
- `duration`.
- `file_size`.
- `source_role`: original, derivative, poster, thumbnail, tile, social.
- `storage_locations`.
- `generation_provenance`.
- `rights`.

### `display_variant`

Fields:

- `asset_id`.
- `role`: grid, detail, fullscreen, poster, social, tile.
- `width`.
- `height`.
- `crop_mode`.
- `background`.
- `content_hash`.
- `source_asset_id`.

### `nft_media_profile`

Fields:

- `chain_id`.
- `contract`.
- `token_id`.
- `metadata_uri`.
- `metadata_hash`.
- `original_assets`.
- `display_variants`.
- `animation_assets`.
- `model_assets`.
- `interactive_assets`.
- `poster_asset`.
- `snapshot`.

### `deep_zoom_manifest`

Fields:

- `source_asset_id`.
- `tile_size`.
- `levels`.
- `format`.
- `dimensions`.
- `tile_uri_template`.
- `content_hash`.
- `generator`.

### `exhibition_room`

Fields:

- `id`.
- `title`.
- `room_type`.
- `layout`.
- `placements`.
- `lighting`.
- `navigation_mode`.
- `fallback_page_id`.
- `poster_asset_id`.
- `performance_budget`.

### `artwork_placement`

Fields:

- `nft_reference`.
- `asset_id`.
- `position`.
- `rotation`.
- `size`.
- `frame_style`.
- `label`.
- `display_mode`: faithful, gallery.
- `detail_page`.

### `interactive_policy`

Fields:

- `hydration`: static, client_island, deferred_island, sandboxed_embed.
- `requires_user_activation`.
- `fallback_asset_id`.
- `sandbox_permissions`.
- `performance_budget`.

## Recommended V1 Scope

Current frontend MVP status:

- The CMS renderer can now mount a deferred Three.js object viewer for GLB/glTF
  model assets and a simple exhibition room renderer for `exhibition_room`
  placements.
- The room renderer supports deterministic presets, framed 2D works, faithful
  unlit art surfaces, poster/static preview, mobile fallback, and click/tap
  links to canonical 2D detail pages.
- The builder MVP can create a simple single-work 3D room package with a
  matching faithful 2D detail route.
- This is not a full room editor, game engine, AR/VR surface, or automatic NFT
  gallery generator.

2D:

- Collection grid.
- NFT detail page.
- Lightbox.
- Responsive display variants.
- Original asset link.
- Posters for video/audio/3D/interactive media.
- Basic deep zoom manifest support, optional generation later.
- Provenance panel.
- Social image.

3D:

- Simple generated room for 2D works.
- Faithful art surface mode.
- Clickable works to detail pages.
- Poster and 2D fallback.
- Basic object viewer for GLB/glTF.
- Deferred loading.
- Desktop/mobile Playwright and canvas checks.

Not V1:

- Full 3D world editor.
- VR.
- Complex multi-room navigation.
- Arbitrary 3D plugin runtime.
- Arbitrary scripts in room.
- Automatic AR pipeline.
- Per-card custom cinematic rooms for every card.

## Later Opportunities

- Custom Meme Card rooms.
- Season-level 3D exhibitions.
- Collection-specific room templates.
- Guided tours with narration.
- AR object viewing.
- Synchronized zoom comparisons.
- IIIF-compatible export for still images.
- C2PA/content credential display.
- Local 3D package validator.
- Community room template registry.

## Testing Requirements

2D:

- Aspect ratio preservation.
- No text overlap on mobile/desktop.
- Responsive image variants selected correctly.
- Lazy loading not applied to LCP image.
- Lightbox keyboard navigation.
- Alt text validation.
- Captions/transcripts for media where required.
- Provenance panel renders.

3D:

- Canvas nonblank.
- Poster visible before load.
- Model/room load success.
- Model/room error state.
- Click work opens detail page.
- Keyboard/touch controls.
- Reduced motion behavior.
- Mobile fallback.
- Performance budget smoke test.
- Asset cleanup/dispose on route leave.

Security:

- Interactive HTML sandboxing.
- URL/media sanitization.
- Package schema validation.
- Size limits.
- Unsupported asset fallback.

## Open Questions

- Do we build deep zoom tiles ourselves, or define the manifest first and add
  generation later?
- What file-size and texture-size budgets should V1 enforce?
- Should V1 use `model-viewer` for object viewing, Three.js directly, or both?
- What is the minimum acceptable mobile 3D fallback?
- Which 6529 collections deserve custom 2D/3D display templates first?
- How should rights/license metadata be represented when unknown?
- Should C2PA/content credentials be displayed in V1 or later?
- How aggressive should we be about copying remote NFT media into decentralized
  package storage?
