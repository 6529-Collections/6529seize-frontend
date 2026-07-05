import {
  CMS_CANONICALIZATION,
  CMS_HASH_ALGORITHM,
  CMS_PACKAGE_SCHEMA,
  CMS_PAYLOAD_SCHEMA,
  type CmsBlockV1,
  type CmsPackageV1,
  type CmsValidationIssueV1,
  type CmsValidationResultV1,
  validateCmsPackageV1,
  withComputedCmsHashes,
} from "@/lib/profile-cms/protocol/v1";
import {
  isCmsRoomPreset,
  type CmsRoomPreset,
} from "@/lib/profile-cms/runtime/threeD";
import {
  buildWalletGalleryCmsPackage,
  createDefaultWalletGalleryBuilderState,
  isWalletGalleryGeneratedPackage,
  restoreWalletGalleryStateFromPackage,
  type WalletGalleryBuilderState,
} from "./gallery";

export type CmsBuilderTemplate = "homepage" | "wallet_gallery";

export type CmsBuilderBlockKind =
  | "heading"
  | "rich_text"
  | "button_link"
  | "image"
  | "callout"
  | "quote"
  | "room_viewer";

export type CmsBuilderBlock = {
  readonly id: string;
  readonly kind: CmsBuilderBlockKind;
  readonly title: string;
  readonly text: string;
  readonly url: string;
  readonly assetUri: string;
  readonly altText: string;
  readonly roomStyle: CmsRoomPreset;
  readonly tone: string;
  readonly citation: string;
};

export type CmsBuilderState = {
  readonly template: CmsBuilderTemplate;
  readonly handle: string;
  readonly siteTitle: string;
  readonly siteDescription: string;
  readonly pageTitle: string;
  readonly pageDescription: string;
  readonly navigationLabel: string;
  readonly themeAccent: string;
  readonly socialImageAssetId: string;
  readonly blocks: readonly CmsBuilderBlock[];
  readonly gallery: WalletGalleryBuilderState;
};

export type CmsBuilderValidation = {
  readonly cmsPackage: CmsPackageV1;
  readonly page: CmsPackageV1["payload"]["pages"][number];
  readonly result: CmsValidationResultV1;
  readonly errors: readonly CmsValidationIssueV1[];
  readonly warnings: readonly CmsValidationIssueV1[];
};

const DEFAULT_HANDLE = "punk6529";
const DEFAULT_ROOM_STYLE: CmsRoomPreset = "white_cube";
const FIXTURE_ZERO_HASH =
  "sha256:0000000000000000000000000000000000000000000000000000000000000000";

export function createDefaultCmsBuilderState(
  handle = DEFAULT_HANDLE
): CmsBuilderState {
  const normalizedHandle = normalizeHandle(handle);
  return {
    template: "homepage",
    handle: normalizedHandle,
    siteTitle: normalizedHandle,
    siteDescription: `A profile-native website for ${normalizedHandle}.`,
    pageTitle: normalizedHandle,
    pageDescription: "A portable profile website built with the 6529 CMS.",
    navigationLabel: "Home",
    themeAccent: "#2f7df6",
    socialImageAssetId: "",
    blocks: [
      createBuilderBlock("heading", 0, { text: normalizedHandle }),
      createBuilderBlock("rich_text", 1, {
        text: "Write a short introduction for this profile website.",
      }),
      createBuilderBlock("button_link", 2, {
        text: "Explore profile",
        url: `/${normalizedHandle}`,
      }),
    ],
    gallery: createDefaultWalletGalleryBuilderState(normalizedHandle),
  };
}

export function createBuilderBlock(
  kind: CmsBuilderBlockKind,
  index: number,
  overrides: Partial<CmsBuilderBlock> = {}
): CmsBuilderBlock {
  return {
    id: `block-${kind.replaceAll("_", "-")}-${index + 1}`,
    kind,
    title: getDefaultBlockTitle(kind),
    text: getDefaultBlockText(kind),
    url: "",
    assetUri: "",
    altText: "",
    roomStyle: DEFAULT_ROOM_STYLE,
    tone: kind === "callout" ? "Note" : "",
    citation: "",
    ...overrides,
  };
}

export function buildCmsPackageCandidate(
  state: CmsBuilderState,
  now = new Date()
): CmsPackageV1 {
  const handle = normalizeHandle(state.handle);
  if (state.template === "wallet_gallery") {
    return buildWalletGalleryCmsPackage({
      handle,
      siteTitle: state.siteTitle.trim() || `${handle} Gallery`,
      siteDescription:
        state.siteDescription.trim() ||
        "Generated gallery from reviewed wallet snapshot.",
      themeAccent: state.themeAccent,
      walletInput: state.gallery.walletInput,
      snapshot: state.gallery.snapshot,
      hiddenAssetIds: state.gallery.hiddenAssetIds,
      featuredAssetIds: state.gallery.featuredAssetIds,
      featuredCollectionIds: state.gallery.featuredCollectionIds,
      orderedAssetIds: state.gallery.orderedAssetIds,
      now,
    });
  }

  const path = `/${handle}/index.html`;
  const createdAt = now.toISOString();
  const blocks = state.blocks.map((block, index) => toCmsBlock(block, index));
  const assets = buildAssets(state);
  const roomDetailPages = buildRoomDetailPages(state, handle, createdAt);
  const pages = [
    {
      id: "page-home",
      type: "page" as const,
      path,
      metadata: {
        title: state.pageTitle.trim() || state.siteTitle.trim() || handle,
        description: state.pageDescription.trim(),
        locale: "en",
        canonical_url: `https://6529.io${path}`,
        ...(state.socialImageAssetId.trim()
          ? { social_image_asset_id: state.socialImageAssetId.trim() }
          : {}),
        navigation_label: state.navigationLabel.trim() || "Home",
        search: "include" as const,
        robots: "index" as const,
        last_updated: createdAt,
      },
      blocks,
    },
    ...roomDetailPages.pages,
  ];
  const routes = [
    {
      path,
      kind: "page" as const,
      page_id: "page-home",
    },
    ...roomDetailPages.routes,
  ];
  const exhibitionRooms = buildExhibitionRooms(state);
  const packageWithoutHashes: CmsPackageV1 = {
    schema: CMS_PACKAGE_SCHEMA,
    package_id: `pkg-${handle}-builder-mvp`,
    profile: {
      handle,
    },
    site: {
      title: state.siteTitle.trim() || handle,
      description: state.siteDescription.trim(),
      base_path: path,
      default_locale: "en",
      direction: "ltr",
      theme: {
        mode: "system",
        accent: normalizeAccent(state.themeAccent),
      },
      navigation_id: "nav-main",
      required_renderer_capabilities: ["static_blocks", "profile_cms_v1"],
    },
    payload: {
      schema: CMS_PAYLOAD_SCHEMA,
      routes,
      pages,
      assets,
      ...(exhibitionRooms.length ? { exhibition_rooms: exhibitionRooms } : {}),
      navigation: [
        {
          id: "nav-main",
          items: [
            {
              label: state.navigationLabel.trim() || "Home",
              page_id: "page-home",
            },
          ],
        },
      ],
      build_manifest: {
        renderer: "6529-cms-builder-mvp",
        renderer_version: "0.1.0",
        route_count: routes.length,
        asset_count: assets.length,
        warnings: [],
      },
    },
    integrity: {
      canonicalization: CMS_CANONICALIZATION,
      hash_algorithm: CMS_HASH_ALGORITHM,
      payload_hash: FIXTURE_ZERO_HASH,
      package_hash: FIXTURE_ZERO_HASH,
      note: "Draft builder candidate; final publish must be signed and stored by backend.",
    },
    signatures: [
      {
        type: "fixture",
        signer: `fixture:${handle}`,
        signature: "builder-mvp-draft-signature-placeholder",
        signed_at: createdAt,
      },
    ],
    storage: [
      {
        provider: "fixture",
        uri: `ipfs://builder-mvp-${handle}`,
        content_hash: FIXTURE_ZERO_HASH,
        provider_content_id: `builder-mvp-${handle}`,
        pinned: false,
        canonical: false,
        recorded_at: createdAt,
      },
    ],
    provenance: {
      builder: "6529-cms-builder-mvp",
      builder_version: "0.1.0",
      created_at: createdAt,
      notes: "Generated by the frontend builder MVP.",
    },
  };

  return withComputedCmsHashes(packageWithoutHashes);
}

export function validateCmsBuilderState(
  state: CmsBuilderState,
  now = new Date()
): CmsBuilderValidation {
  const cmsPackage = buildCmsPackageCandidate(state, now);
  const result = validateCmsPackageV1(cmsPackage, {
    allowFixtureSignatures: true,
    allowFixtureStorage: true,
    enforceHashes: true,
  });
  const page = cmsPackage.payload.pages[0];
  if (!page) {
    throw new Error("missing_builder_homepage");
  }

  return {
    cmsPackage,
    page,
    result,
    errors: result.issues.filter((issue) => issue.severity === "error"),
    warnings: result.issues.filter((issue) => issue.severity === "warning"),
  };
}

export function parseCmsPackageCandidateJson(input: string): CmsPackageV1 {
  const parsed = JSON.parse(input) as unknown;
  const validation = validateCmsPackageV1(parsed, {
    allowFixtureSignatures: true,
    allowFixtureStorage: true,
    enforceHashes: false,
  });

  if (!validation.valid) {
    throw new Error("invalid_imported_cms_package");
  }

  return parsed as CmsPackageV1;
}

export function createBuilderStateFromPackage(
  cmsPackage: CmsPackageV1
): CmsBuilderState {
  const handle = normalizeHandle(cmsPackage.profile.handle);

  if (isWalletGalleryGeneratedPackage(cmsPackage)) {
    return createGalleryBuilderStateFromPackage(cmsPackage, handle);
  }

  const page = cmsPackage.payload.pages[0];
  return {
    template: "homepage",
    handle,
    siteTitle: cmsPackage.site.title,
    siteDescription: cmsPackage.site.description ?? "",
    pageTitle: page?.metadata.title ?? cmsPackage.site.title,
    pageDescription: page?.metadata.description ?? "",
    navigationLabel:
      cmsPackage.payload.navigation[0]?.items[0]?.label ??
      page?.metadata.navigation_label ??
      "Home",
    themeAccent: cmsPackage.site.theme.accent,
    socialImageAssetId: page?.metadata.social_image_asset_id ?? "",
    blocks: (page?.blocks ?? []).map((block, index) =>
      createBuilderBlockFromCmsBlock(block, cmsPackage, index)
    ),
    gallery: createDefaultWalletGalleryBuilderState(handle),
  };
}

// A saved wallet-gallery draft is a generated package (home page, collection
// pages, per-NFT detail pages) rather than the author-editable block list the
// homepage template produces. Loading it must restore the gallery tab and its
// curation state instead of re-importing the generated pages as homepage
// blocks (the known WS-B round-trip gap).
function createGalleryBuilderStateFromPackage(
  cmsPackage: CmsPackageV1,
  handle: string
): CmsBuilderState {
  return {
    template: "wallet_gallery",
    handle,
    siteTitle: cmsPackage.site.title,
    siteDescription: cmsPackage.site.description ?? "",
    pageTitle: cmsPackage.site.title,
    pageDescription: cmsPackage.site.description ?? "",
    navigationLabel:
      cmsPackage.payload.navigation[0]?.items[0]?.label ?? "Gallery",
    themeAccent: cmsPackage.site.theme.accent,
    socialImageAssetId:
      cmsPackage.payload.pages[0]?.metadata.social_image_asset_id ?? "",
    blocks: [],
    gallery: restoreWalletGalleryStateFromPackage(cmsPackage),
  };
}

export function getBuilderFieldIdForIssuePath(
  path: string
): string | undefined {
  if (path.startsWith("/site/title")) {
    return "cms-builder-site-title";
  }
  if (path.startsWith("/site/description")) {
    return "cms-builder-site-description";
  }
  if (path.startsWith("/site/theme/accent")) {
    return "cms-builder-theme-accent";
  }
  if (path.startsWith("/payload/navigation")) {
    return "cms-builder-navigation-label";
  }
  if (path.includes("/metadata/title")) {
    return "cms-builder-page-title";
  }
  if (path.includes("/metadata/description")) {
    return "cms-builder-page-description";
  }
  if (path.includes("/metadata/social_image_asset_id")) {
    return "cms-builder-social-image";
  }

  const blockMatch = /\/payload\/pages\/0\/blocks\/(\d+)/.exec(path);
  return blockMatch ? `cms-builder-block-${blockMatch[1]}` : undefined;
}

function toCmsBlock(block: CmsBuilderBlock, index: number): CmsBlockV1 {
  const id = normalizeId(block.id, `block-${index + 1}`);
  switch (block.kind) {
    case "heading":
      return {
        id,
        block_type: "heading",
        level: index === 0 ? 1 : 2,
        text: block.text.trim() || block.title.trim() || "Untitled",
      } as CmsBlockV1;
    case "rich_text":
      return {
        id,
        block_type: "rich_text",
        content: block.text,
      } as CmsBlockV1;
    case "button_link":
      return {
        id,
        block_type: "button_link",
        label: block.text.trim() || "Open link",
        href: block.url.trim() || "/",
      } as CmsBlockV1;
    case "image":
      return {
        id,
        block_type: "image",
        asset_id: getImageAssetId(index),
        caption: block.title.trim(),
      } as CmsBlockV1;
    case "callout":
      return {
        id,
        block_type: "callout",
        tone: block.tone.trim() || "Note",
        title: block.title.trim(),
        content: block.text,
      } as CmsBlockV1;
    case "quote":
      return {
        id,
        block_type: "quote",
        quote: block.text,
        citation: block.citation.trim(),
      } as CmsBlockV1;
    case "room_viewer":
      return {
        id,
        block_type: "room_viewer",
        room_id: getRoomId(index),
        interactive_policy: {
          hydration: "deferred_island",
          requires_user_activation: true,
          fallback_asset_id: getRoomAssetId(index),
          performance_budget: {
            max_asset_bytes: 2500000,
          },
        },
      } as CmsBlockV1;
  }
}

function buildAssets(
  state: CmsBuilderState
): CmsPackageV1["payload"]["assets"] {
  return state.blocks.flatMap<CmsPackageV1["payload"]["assets"][number]>(
    (block, index) => {
      if (block.kind === "image") {
        return [
          {
            id: getImageAssetId(index),
            kind: "image" as const,
            uri:
              block.assetUri.trim() ||
              "https://media.6529.io/ipfs/bafy-builder-placeholder/image.png",
            content_hash: FIXTURE_ZERO_HASH,
            mime_type: "image/png",
            width: 1200,
            height: 1200,
            roles: ["detail" as const],
            alt_text: block.altText.trim() || block.title.trim() || "Image",
          },
        ];
      }

      if (block.kind === "room_viewer") {
        return [
          {
            id: getRoomAssetId(index),
            kind: "image" as const,
            uri:
              block.assetUri.trim() ||
              "https://media.6529.io/ipfs/bafy-builder-placeholder/room-work.png",
            content_hash: FIXTURE_ZERO_HASH,
            mime_type: "image/png",
            width: 1200,
            height: 1200,
            file_size_bytes: 350000,
            roles: [
              "original" as const,
              "detail" as const,
              "fullscreen" as const,
              "poster" as const,
              "fallback" as const,
            ],
            alt_text:
              block.altText.trim() ||
              block.title.trim() ||
              "Artwork displayed in the 3D room",
          },
        ];
      }

      return [];
    }
  );
}

function buildRoomDetailPages(
  state: CmsBuilderState,
  handle: string,
  createdAt: string
): {
  readonly pages: CmsPackageV1["payload"]["pages"];
  readonly routes: CmsPackageV1["payload"]["routes"];
} {
  const pages: CmsPackageV1["payload"]["pages"] = [];
  const routes: CmsPackageV1["payload"]["routes"] = [];

  state.blocks.forEach((block, index) => {
    if (block.kind !== "room_viewer") {
      return;
    }

    const path = getRoomDetailPath(handle, index);
    const pageId = getRoomDetailPageId(index);
    routes.push({
      kind: "page",
      page_id: pageId,
      path,
    });
    pages.push({
      blocks: [
        {
          asset_id: getRoomAssetId(index),
          block_type: "image",
          id: `${getRoomId(index)}-detail-image`,
        } as CmsBlockV1,
      ],
      id: pageId,
      metadata: {
        canonical_url: `https://6529.io${path}`,
        description:
          block.text.trim() || "Faithful 2D detail page for this room artwork.",
        last_updated: createdAt,
        locale: "en",
        navigation_label: block.title.trim() || "Room work",
        robots: "index",
        search: "include",
        social_image_asset_id: getRoomAssetId(index),
        title: block.title.trim() || "Room work",
      },
      path,
      type: "nft_detail",
    });
  });

  return { pages, routes };
}

function buildExhibitionRooms(
  state: CmsBuilderState
): NonNullable<CmsPackageV1["payload"]["exhibition_rooms"]> {
  return state.blocks.flatMap((block, index) => {
    if (block.kind !== "room_viewer") {
      return [];
    }

    return [
      {
        fallback_page_id: getRoomDetailPageId(index),
        id: getRoomId(index),
        navigation_mode: "guided_hotspots" as const,
        placements: [
          {
            asset_id: getRoomAssetId(index),
            detail_page_id: getRoomDetailPageId(index),
            display_mode: "faithful" as const,
            id: `${getRoomId(index)}-placement`,
            label: block.title.trim() || "Room work",
            position: [0, 5.15, -15.91],
            rotation: [0, 0, 0],
            size: [8.2, 8.2],
          },
        ],
        poster_asset_id: getRoomAssetId(index),
        room_type: block.roomStyle,
        title: block.title.trim() || "3D room",
      },
    ];
  });
}

function createBuilderBlockFromCmsBlock(
  block: CmsBlockV1,
  cmsPackage: CmsPackageV1,
  index: number
): CmsBuilderBlock {
  const kind = isBuilderBlockKind(block.block_type)
    ? block.block_type
    : "rich_text";
  const room =
    block.block_type === "room_viewer"
      ? cmsPackage.payload.exhibition_rooms?.find(
          (item) => item.id === getStringField(block, "room_id")
        )
      : undefined;
  const roomPlacement = room?.placements[0];
  const asset = cmsPackage.payload.assets.find(
    (item) =>
      item.id === (getStringField(block, "asset_id") ?? roomPlacement?.asset_id)
  );

  return createBuilderBlock(kind, index, {
    id: block.id,
    title:
      getStringField(block, "title") ??
      getStringField(block, "caption") ??
      room?.title ??
      roomPlacement?.label ??
      getDefaultBlockTitle(kind),
    text:
      getStringField(block, "text") ??
      getStringField(block, "content") ??
      getStringField(block, "quote") ??
      getStringField(block, "label") ??
      (block.block_type === "room_viewer"
        ? "Preview a simple exhibition room."
        : undefined) ??
      "",
    url: getStringField(block, "href") ?? getStringField(block, "url") ?? "",
    assetUri: asset?.uri ?? "",
    altText: asset?.alt_text ?? "",
    roomStyle: normalizeRoomStyle(room?.room_type),
    tone: getStringField(block, "tone") ?? "",
    citation: getStringField(block, "citation") ?? "",
  });
}

function isBuilderBlockKind(value: string): value is CmsBuilderBlockKind {
  return [
    "heading",
    "rich_text",
    "button_link",
    "image",
    "callout",
    "quote",
    "room_viewer",
  ].includes(value);
}

function getStringField(
  record: Record<string, unknown>,
  field: string
): string | undefined {
  const value = record[field];
  return typeof value === "string" ? value : undefined;
}

function getImageAssetId(index: number): string {
  return `asset-image-${index + 1}`;
}

function getRoomId(index: number): string {
  return `room-builder-${index + 1}`;
}

function getRoomAssetId(index: number): string {
  return `asset-room-work-${index + 1}`;
}

function getRoomDetailPageId(index: number): string {
  return `page-room-work-${index + 1}`;
}

function getRoomDetailPath(handle: string, index: number): string {
  return `/${handle}/rooms/work-${index + 1}/index.html`;
}

function getDefaultBlockTitle(kind: CmsBuilderBlockKind): string {
  switch (kind) {
    case "heading":
      return "Heading";
    case "rich_text":
      return "Text";
    case "button_link":
      return "Button";
    case "image":
      return "Image";
    case "callout":
      return "Callout";
    case "quote":
      return "Quote";
    case "room_viewer":
      return "3D room";
  }
}

function getDefaultBlockText(kind: CmsBuilderBlockKind): string {
  switch (kind) {
    case "heading":
      return "New section";
    case "rich_text":
      return "Add body copy here.";
    case "button_link":
      return "Open link";
    case "image":
      return "";
    case "callout":
      return "Add a short callout.";
    case "quote":
      return "Add a quote.";
    case "room_viewer":
      return "Preview a simple exhibition room.";
  }
}

function normalizeHandle(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  return normalized || DEFAULT_HANDLE;
}

function normalizeId(value: string, fallback: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._:-]/g, "-");
  return normalized.length >= 2 ? normalized.slice(0, 128) : fallback;
}

function normalizeAccent(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : "#2f7df6";
}

function normalizeRoomStyle(value: string | undefined): CmsRoomPreset {
  return isCmsRoomPreset(value) ? value : DEFAULT_ROOM_STYLE;
}
