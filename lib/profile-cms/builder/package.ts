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

export type CmsBuilderBlockKind =
  | "heading"
  | "rich_text"
  | "button_link"
  | "image"
  | "callout"
  | "quote";

export type CmsBuilderBlock = {
  readonly id: string;
  readonly kind: CmsBuilderBlockKind;
  readonly title: string;
  readonly text: string;
  readonly url: string;
  readonly assetUri: string;
  readonly altText: string;
  readonly tone: string;
  readonly citation: string;
};

export type CmsBuilderState = {
  readonly handle: string;
  readonly siteTitle: string;
  readonly siteDescription: string;
  readonly pageTitle: string;
  readonly pageDescription: string;
  readonly navigationLabel: string;
  readonly themeAccent: string;
  readonly socialImageAssetId: string;
  readonly blocks: readonly CmsBuilderBlock[];
};

export type CmsBuilderValidation = {
  readonly cmsPackage: CmsPackageV1;
  readonly page: CmsPackageV1["payload"]["pages"][number];
  readonly result: CmsValidationResultV1;
  readonly errors: readonly CmsValidationIssueV1[];
  readonly warnings: readonly CmsValidationIssueV1[];
};

const DEFAULT_HANDLE = "punk6529";
const FIXTURE_ZERO_HASH =
  "sha256:0000000000000000000000000000000000000000000000000000000000000000";

export function createDefaultCmsBuilderState(
  handle = DEFAULT_HANDLE
): CmsBuilderState {
  const normalizedHandle = normalizeHandle(handle);
  return {
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
  const path = `/${handle}/index.html`;
  const createdAt = now.toISOString();
  const blocks = state.blocks.map((block, index) => toCmsBlock(block, index));
  const assets = buildAssets(state);
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
      routes: [
        {
          path,
          kind: "page",
          page_id: "page-home",
        },
      ],
      pages: [
        {
          id: "page-home",
          type: "page",
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
            search: "include",
            robots: "index",
            last_updated: createdAt,
          },
          blocks,
        },
      ],
      assets,
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
        route_count: 1,
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
  const page = cmsPackage.payload.pages[0];
  return {
    handle: normalizeHandle(cmsPackage.profile.handle),
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
  }
}

function buildAssets(
  state: CmsBuilderState
): CmsPackageV1["payload"]["assets"] {
  return state.blocks.flatMap((block, index) => {
    if (block.kind !== "image") {
      return [];
    }

    return [
      {
        id: getImageAssetId(index),
        kind: "image" as const,
        uri:
          block.assetUri.trim() ||
          "https://media.6529.io/ipfs/bafy-builder-placeholder/image.png",
        content_hash: FIXTURE_ZERO_HASH,
        mime_type: "image/png",
        roles: ["detail" as const],
        alt_text: block.altText.trim() || block.title.trim() || "Image",
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
  const asset = cmsPackage.payload.assets.find(
    (item) => item.id === getStringField(block, "asset_id")
  );

  return createBuilderBlock(kind, index, {
    id: block.id,
    title:
      getStringField(block, "title") ??
      getStringField(block, "caption") ??
      getDefaultBlockTitle(kind),
    text:
      getStringField(block, "text") ??
      getStringField(block, "content") ??
      getStringField(block, "quote") ??
      getStringField(block, "label") ??
      "",
    url: getStringField(block, "href") ?? getStringField(block, "url") ?? "",
    assetUri: asset?.uri ?? "",
    altText: asset?.alt_text ?? "",
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
