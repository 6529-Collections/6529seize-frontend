import { getAddress } from "ethers";
import type { ZodIssue } from "zod";

import {
  CMS_RESERVED_APP_ROUTE_ROOTS,
  CMS_SAFE_URI_PROTOCOLS,
  CMS_VALIDATION_RESULT_SCHEMA,
} from "./constants";
import {
  computeCmsPackageHash,
  computeCmsPayloadHash,
  isCmsSha256Hash,
} from "./hash";
import {
  cmsPackageSchema,
  validationResultSchema,
  type CmsAssetV1,
  type CmsBlockV1,
  type CmsNavigationItemV1,
  type CmsPackageV1,
  type CmsValidationIssueV1,
  type CmsValidationResultV1,
} from "./schemas";

interface CmsValidationOptions {
  checkedAt?: Date | string;
  validator?: string;
  validatorVersion?: string;
  allowFixtureSignatures?: boolean;
  allowFixtureStorage?: boolean;
  enforceHashes?: boolean;
}

interface IssueInput {
  severity?: CmsValidationIssueV1["severity"] | undefined;
  code: string;
  message: string;
  path: string;
  pageId?: string | undefined;
  blockId?: string | undefined;
  suggestedFix?: string | undefined;
}

type IdMap<T extends { id: string }> = Map<string, { value: T; index: number }>;
type CmsPageV1 = CmsPackageV1["payload"]["pages"][number];
type CmsNftMediaProfileV1 = NonNullable<
  CmsPackageV1["payload"]["nft_media_profiles"]
>[number];
type CmsDeepZoomManifestV1 = NonNullable<
  CmsPackageV1["payload"]["deep_zoom_manifests"]
>[number];
type CmsExhibitionRoomV1 = NonNullable<
  CmsPackageV1["payload"]["exhibition_rooms"]
>[number];
type CmsSourcePacketV1 = NonNullable<
  CmsPackageV1["payload"]["source_packets"]
>[number];

interface SemanticValidationContext {
  issues: CmsValidationIssueV1[];
  pageMap: IdMap<CmsPageV1>;
  assetMap: IdMap<CmsAssetV1>;
  nftProfileMap: IdMap<CmsNftMediaProfileV1>;
  deepZoomMap: IdMap<CmsDeepZoomManifestV1>;
  roomMap: IdMap<CmsExhibitionRoomV1>;
  sourcePacketMap: IdMap<CmsSourcePacketV1>;
}

interface PageValidationContext {
  pageId: string;
  pagePath: string;
}

interface BlockValidationContext extends PageValidationContext {
  blockId: string;
  blockPath: string;
}

const VALIDATOR_NAME = "6529-cms-protocol-v1";
const VALIDATOR_VERSION = "0.1.0";

const ASSET_REFERENCE_FIELDS = [
  "asset_id",
  "poster_asset_id",
  "fallback_asset_id",
  "source_asset_id",
  "thumbnail_asset_id",
  "social_image_asset_id",
] as const;

const ASSET_REFERENCE_ARRAY_FIELDS = [
  "asset_ids",
  "original_asset_ids",
  "featured_asset_ids",
] as const;

const PAGE_REFERENCE_FIELDS = [
  "page_id",
  "detail_page_id",
  "fallback_page_id",
] as const;

const PAGE_REFERENCE_ARRAY_FIELDS = ["page_ids", "featured_page_ids"] as const;

const NFT_PROFILE_REFERENCE_FIELDS = ["nft_media_profile_id"] as const;
const ROOM_REFERENCE_FIELDS = ["room_id"] as const;
const DEEP_ZOOM_REFERENCE_FIELDS = [
  "deep_zoom_id",
  "deep_zoom_manifest_id",
] as const;

const ALLOWED_BLOCK_URL_FIELDS = new Set(["url", "href", "src", "uri"]);
const URL_LIKE_FIELD = /(url|uri|href|src)$/i;
const HASH_FIELD_NAMES = new Set([
  "base_package_hash",
  "content_hash",
  "metadata_hash",
  "package_hash",
  "payload_hash",
]);

export function validateCmsPackageV1(
  input: unknown,
  options: CmsValidationOptions = {}
): CmsValidationResultV1 {
  const checkedAt = formatCheckedAt(options.checkedAt);
  const parsed = cmsPackageSchema.safeParse(input);

  if (!parsed.success) {
    const target = getTarget(input);
    return buildValidationResult({
      checkedAt,
      issues: parsed.error.issues.map(mapZodIssue),
      options,
      ...(target ? { target } : {}),
    });
  }

  const target = getTarget(parsed.data);
  return buildValidationResult({
    checkedAt,
    issues: validateSemantics(parsed.data, options),
    options,
    ...(target ? { target } : {}),
  });
}

function buildValidationResult({
  checkedAt,
  issues,
  options,
  target,
}: {
  checkedAt: string;
  issues: CmsValidationIssueV1[];
  options: CmsValidationOptions;
  target?: CmsValidationResultV1["target"] | undefined;
}): CmsValidationResultV1 {
  const result = {
    schema: CMS_VALIDATION_RESULT_SCHEMA,
    valid: !issues.some((issue) => issue.severity === "error"),
    checked_at: checkedAt,
    validator: options.validator ?? VALIDATOR_NAME,
    validator_version: options.validatorVersion ?? VALIDATOR_VERSION,
    ...(target ? { target } : {}),
    issues,
  };

  return validationResultSchema.parse(result);
}

function validateSemantics(
  cmsPackage: CmsPackageV1,
  options: CmsValidationOptions
): CmsValidationIssueV1[] {
  const issues: CmsValidationIssueV1[] = [];
  const payload = cmsPackage.payload;
  const pageMap = toIdMap(payload.pages, "/payload/pages", "page", issues);
  const assetMap = toIdMap(payload.assets, "/payload/assets", "asset", issues);
  const nftProfileMap = toIdMap(
    payload.nft_media_profiles ?? [],
    "/payload/nft_media_profiles",
    "nft_media_profile",
    issues
  );
  const deepZoomMap = toIdMap(
    payload.deep_zoom_manifests ?? [],
    "/payload/deep_zoom_manifests",
    "deep_zoom_manifest",
    issues
  );
  const roomMap = toIdMap(
    payload.exhibition_rooms ?? [],
    "/payload/exhibition_rooms",
    "exhibition_room",
    issues
  );
  const sourcePacketMap = toIdMap(
    payload.source_packets ?? [],
    "/payload/source_packets",
    "source_packet",
    issues
  );
  const context: SemanticValidationContext = {
    issues,
    pageMap,
    assetMap,
    nftProfileMap,
    deepZoomMap,
    roomMap,
    sourcePacketMap,
  };

  validateRoutes(cmsPackage, pageMap, issues);
  validateSiteManifest(cmsPackage, assetMap, issues);
  validatePages(cmsPackage, context);
  validateAssets(payload.assets, issues);
  validateNftMediaProfiles(payload.nft_media_profiles ?? [], assetMap, issues);
  validateDeepZoomManifests(
    payload.deep_zoom_manifests ?? [],
    assetMap,
    issues
  );
  validateExhibitionRooms(
    payload.exhibition_rooms ?? [],
    pageMap,
    assetMap,
    nftProfileMap,
    issues
  );
  validateNavigation(cmsPackage, pageMap, issues);
  validateTaxonomies(cmsPackage, pageMap, issues);
  validateSignatures(cmsPackage, options, issues);
  validateStorage(cmsPackage, options, issues);
  validateHashes(cmsPackage, options, issues);
  validateBuildManifest(cmsPackage, issues);

  return issues;
}

function validateRoutes(
  cmsPackage: CmsPackageV1,
  pageMap: IdMap<CmsPackageV1["payload"]["pages"][number]>,
  issues: CmsValidationIssueV1[]
): void {
  const routePaths = new Map<string, number>();
  const canonicalProfilePath = `/${cmsPackage.profile.handle}/index.html`;
  const routePathSet = new Set(
    cmsPackage.payload.routes.map((route) => route.path)
  );

  cmsPackage.payload.routes.forEach((route, index) => {
    if (routePaths.has(route.path)) {
      addIssue(issues, {
        code: "route.duplicate_path",
        message: `Route path '${route.path}' appears more than once.`,
        path: "/payload/routes",
        suggestedFix: "Keep exactly one route for each CMS path.",
      });
    } else {
      routePaths.set(route.path, index);
    }

    validateProfileNamespace(
      route.path,
      cmsPackage.profile.handle,
      `/payload/routes/${index}/path`,
      issues,
      "route.profile_namespace"
    );
    validateReservedRouteRoot(
      route.path,
      `/payload/routes/${index}/path`,
      issues
    );

    if (route.kind === "page") {
      if (!route.page_id) {
        addIssue(issues, {
          code: "route.page_id.required",
          message: "Page routes must include page_id.",
          path: `/payload/routes/${index}/page_id`,
        });
      } else if (!pageMap.has(route.page_id)) {
        addIssue(issues, {
          code: "route.page_missing",
          message: `Route references missing page '${route.page_id}'.`,
          path: `/payload/routes/${index}/page_id`,
        });
      }

      if (route.target) {
        addIssue(issues, {
          code: "route.target_forbidden",
          message: "Page routes cannot include target.",
          path: `/payload/routes/${index}/target`,
        });
      }
    } else {
      if (route.target) {
        validateRouteTarget(
          route.target,
          route.kind,
          cmsPackage.profile.handle,
          routePathSet,
          `/payload/routes/${index}/target`,
          issues
        );
      } else {
        addIssue(issues, {
          code: "route.target.required",
          message: `${route.kind} routes must include target.`,
          path: `/payload/routes/${index}/target`,
        });
      }

      if (route.page_id) {
        addIssue(issues, {
          code: "route.page_id_forbidden",
          message: `${route.kind} routes cannot include page_id.`,
          path: `/payload/routes/${index}/page_id`,
        });
      }
    }
  });

  if (!routePathSet.has(canonicalProfilePath)) {
    addIssue(issues, {
      code: "route.primary_missing",
      message: `Profile CMS package must include '${canonicalProfilePath}'.`,
      path: "/payload/routes",
      suggestedFix: `Add a page route for ${canonicalProfilePath}.`,
    });
  }

  if (!routePathSet.has(cmsPackage.site.base_path)) {
    addIssue(issues, {
      code: "site.base_path_route_missing",
      message: `Site base path '${cmsPackage.site.base_path}' has no route.`,
      path: "/site/base_path",
    });
  }
}

function validateRouteTarget(
  target: string,
  kind: CmsPackageV1["payload"]["routes"][number]["kind"],
  profileHandle: string,
  routePathSet: Set<string>,
  path: string,
  issues: CmsValidationIssueV1[]
): void {
  if (target.startsWith("/")) {
    validateProfileNamespace(
      target,
      profileHandle,
      path,
      issues,
      "route.profile_namespace"
    );
    validateReservedRouteRoot(target, path, issues);

    if (!routePathSet.has(target)) {
      addIssue(issues, {
        code: "route.target_missing",
        message: `${kind} route target '${target}' is not in the route manifest.`,
        path,
      });
    }
    return;
  }

  validateSafeUri(target, path, issues, "route.target_unsafe_uri", false);
}

function validateSiteManifest(
  cmsPackage: CmsPackageV1,
  assetMap: IdMap<CmsAssetV1>,
  issues: CmsValidationIssueV1[]
): void {
  validateProfileNamespace(
    cmsPackage.site.base_path,
    cmsPackage.profile.handle,
    "/site/base_path",
    issues,
    "site.profile_namespace"
  );
  validateReservedRouteRoot(
    cmsPackage.site.base_path,
    "/site/base_path",
    issues
  );

  if (
    cmsPackage.site.search?.manifest_asset_id &&
    !assetMap.has(cmsPackage.site.search.manifest_asset_id)
  ) {
    addIssue(issues, {
      code: "site.search_manifest_asset_missing",
      message: `Search manifest asset '${cmsPackage.site.search.manifest_asset_id}' does not exist.`,
      path: "/site/search/manifest_asset_id",
    });
  }

  if (
    !cmsPackage.payload.navigation.some(
      (navigation) => navigation.id === cmsPackage.site.navigation_id
    )
  ) {
    addIssue(issues, {
      code: "site.navigation_missing",
      message: `Site navigation '${cmsPackage.site.navigation_id}' does not exist.`,
      path: "/site/navigation_id",
    });
  }
}

function validatePages(
  cmsPackage: CmsPackageV1,
  context: SemanticValidationContext
): void {
  const { assetMap, issues, sourcePacketMap } = context;
  const routePaths = new Set(
    cmsPackage.payload.routes.map((route) => route.path)
  );

  cmsPackage.payload.pages.forEach((page, pageIndex) => {
    const pagePath = `/payload/pages/${pageIndex}`;

    validateProfileNamespace(
      page.path,
      cmsPackage.profile.handle,
      `${pagePath}/path`,
      issues,
      "page.profile_namespace"
    );
    validateReservedRouteRoot(page.path, `${pagePath}/path`, issues);
    validateSafeUri(
      page.metadata.canonical_url,
      `${pagePath}/metadata/canonical_url`,
      issues,
      "page.canonical_url_unsafe_uri",
      false
    );

    if (!routePaths.has(page.path)) {
      addIssue(issues, {
        code: "page.route_missing",
        message: `Page path '${page.path}' has no route.`,
        path: `${pagePath}/path`,
        pageId: page.id,
      });
    }

    validateOptionalAssetReference(
      page.metadata.social_image_asset_id,
      assetMap,
      `${pagePath}/metadata/social_image_asset_id`,
      issues,
      "asset.reference_missing",
      page.id
    );
    validateOptionalAssetReference(
      page.metadata.square_social_image_asset_id,
      assetMap,
      `${pagePath}/metadata/square_social_image_asset_id`,
      issues,
      "asset.reference_missing",
      page.id
    );

    if (
      page.source?.source_packet_id &&
      !sourcePacketMap.has(page.source.source_packet_id)
    ) {
      addIssue(issues, {
        code: "source_packet.reference_missing",
        message: `Page references missing source packet '${page.source.source_packet_id}'.`,
        path: `${pagePath}/source/source_packet_id`,
        pageId: page.id,
      });
    }

    validateBlocks(page.blocks, { pageId: page.id, pagePath }, context);
  });
}

function validateBlocks(
  blocks: CmsBlockV1[],
  pageContext: PageValidationContext,
  context: SemanticValidationContext
): void {
  const { assetMap, deepZoomMap, issues, nftProfileMap, pageMap, roomMap } =
    context;
  const blockIds = new Set<string>();

  blocks.forEach((block, blockIndex) => {
    const blockPath = `${pageContext.pagePath}/blocks/${blockIndex}`;
    const blockContext: BlockValidationContext = {
      ...pageContext,
      blockId: block.id,
      blockPath,
    };
    const record = block as Record<string, unknown>;

    if (blockIds.has(block.id)) {
      addIssue(issues, {
        code: "block.duplicate_id",
        message: `Block id '${block.id}' is duplicated on page '${pageContext.pageId}'.`,
        path: `${blockPath}/id`,
        pageId: pageContext.pageId,
        blockId: block.id,
      });
    }
    blockIds.add(block.id);

    validateBlockReferenceFields(
      record,
      ASSET_REFERENCE_FIELDS,
      assetMap,
      blockContext,
      issues,
      "asset.reference_missing"
    );
    validateBlockReferenceArrayFields(
      record,
      ASSET_REFERENCE_ARRAY_FIELDS,
      assetMap,
      blockContext,
      issues,
      "asset.reference_missing"
    );
    validateBlockReferenceFields(
      record,
      PAGE_REFERENCE_FIELDS,
      pageMap,
      blockContext,
      issues,
      "page.reference_missing"
    );
    validateBlockReferenceArrayFields(
      record,
      PAGE_REFERENCE_ARRAY_FIELDS,
      pageMap,
      blockContext,
      issues,
      "page.reference_missing"
    );
    validateBlockReferenceFields(
      record,
      NFT_PROFILE_REFERENCE_FIELDS,
      nftProfileMap,
      blockContext,
      issues,
      "nft_media_profile.reference_missing"
    );
    validateBlockReferenceFields(
      record,
      DEEP_ZOOM_REFERENCE_FIELDS,
      deepZoomMap,
      blockContext,
      issues,
      "deep_zoom.reference_missing"
    );
    validateBlockReferenceFields(
      record,
      ROOM_REFERENCE_FIELDS,
      roomMap,
      blockContext,
      issues,
      "room.reference_missing"
    );
    validateInteractivePolicyReferences(
      block,
      assetMap,
      blockPath,
      pageContext.pageId,
      issues
    );
    validateBlockUrls(record, blockPath, pageContext.pageId, block.id, issues);
    validateHeavyMediaBlock(
      block,
      assetMap,
      blockPath,
      pageContext.pageId,
      issues
    );
  });
}

function validateAssets(
  assets: CmsAssetV1[],
  issues: CmsValidationIssueV1[]
): void {
  assets.forEach((asset, index) => {
    const path = `/payload/assets/${index}`;
    validateSafeUri(
      asset.uri,
      `${path}/uri`,
      issues,
      "asset.unsafe_uri",
      false
    );

    if (
      ["image", "video", "social_image"].includes(asset.kind) &&
      (!asset.width || !asset.height)
    ) {
      addIssue(issues, {
        code: "asset.dimensions_required",
        message: `${asset.kind} asset '${asset.id}' must include width and height.`,
        path,
      });
    }
  });
}

function validateNftMediaProfiles(
  profiles: NonNullable<CmsPackageV1["payload"]["nft_media_profiles"]>,
  assetMap: IdMap<CmsAssetV1>,
  issues: CmsValidationIssueV1[]
): void {
  profiles.forEach((profile, profileIndex) => {
    const path = `/payload/nft_media_profiles/${profileIndex}`;
    validateEthereumAddress(
      profile.contract,
      `${path}/contract`,
      issues,
      "nft_media_profile.contract_invalid"
    );

    if (profile.metadata_uri) {
      validateSafeUri(
        profile.metadata_uri,
        `${path}/metadata_uri`,
        issues,
        "nft_media_profile.metadata_uri_unsafe",
        false
      );
    }

    profile.original_asset_ids?.forEach((assetId, assetIndex) => {
      validateOptionalAssetReference(
        assetId,
        assetMap,
        `${path}/original_asset_ids/${assetIndex}`,
        issues,
        "asset.reference_missing"
      );
    });

    validateOptionalAssetReference(
      profile.poster_asset_id,
      assetMap,
      `${path}/poster_asset_id`,
      issues,
      "asset.reference_missing"
    );

    profile.display_variants.forEach((variant, variantIndex) => {
      validateOptionalAssetReference(
        variant.asset_id,
        assetMap,
        `${path}/display_variants/${variantIndex}/asset_id`,
        issues,
        "asset.reference_missing"
      );
      validateOptionalAssetReference(
        variant.source_asset_id,
        assetMap,
        `${path}/display_variants/${variantIndex}/source_asset_id`,
        issues,
        "asset.reference_missing"
      );
    });

    if (profile.snapshot?.owner) {
      validateEthereumAddress(
        profile.snapshot.owner,
        `${path}/snapshot/owner`,
        issues,
        "nft_media_profile.owner_invalid"
      );
    }
  });
}

function validateDeepZoomManifests(
  manifests: NonNullable<CmsPackageV1["payload"]["deep_zoom_manifests"]>,
  assetMap: IdMap<CmsAssetV1>,
  issues: CmsValidationIssueV1[]
): void {
  manifests.forEach((manifest, index) => {
    const path = `/payload/deep_zoom_manifests/${index}`;
    validateOptionalAssetReference(
      manifest.source_asset_id,
      assetMap,
      `${path}/source_asset_id`,
      issues,
      "asset.reference_missing"
    );

    if (manifest.tile_uri_template) {
      validateSafeUri(
        manifest.tile_uri_template,
        `${path}/tile_uri_template`,
        issues,
        "deep_zoom.tile_uri_unsafe",
        false
      );
    }
  });
}

function validateExhibitionRooms(
  rooms: NonNullable<CmsPackageV1["payload"]["exhibition_rooms"]>,
  pageMap: IdMap<CmsPackageV1["payload"]["pages"][number]>,
  assetMap: IdMap<CmsAssetV1>,
  nftProfileMap: IdMap<
    NonNullable<CmsPackageV1["payload"]["nft_media_profiles"]>[number]
  >,
  issues: CmsValidationIssueV1[]
): void {
  rooms.forEach((room, roomIndex) => {
    const path = `/payload/exhibition_rooms/${roomIndex}`;
    validateOptionalAssetReference(
      room.poster_asset_id,
      assetMap,
      `${path}/poster_asset_id`,
      issues,
      "asset.reference_missing"
    );
    validatePageReference(
      room.fallback_page_id,
      pageMap,
      `${path}/fallback_page_id`,
      issues,
      "page.reference_missing"
    );

    room.placements.forEach((placement, placementIndex) => {
      const placementPath = `${path}/placements/${placementIndex}`;
      validateOptionalAssetReference(
        placement.asset_id,
        assetMap,
        `${placementPath}/asset_id`,
        issues,
        "asset.reference_missing"
      );
      validateOptionalReference(
        placement.nft_media_profile_id,
        nftProfileMap,
        `${placementPath}/nft_media_profile_id`,
        issues,
        "nft_media_profile.reference_missing"
      );
      validatePageReference(
        placement.detail_page_id,
        pageMap,
        `${placementPath}/detail_page_id`,
        issues,
        "page.reference_missing"
      );
    });
  });
}

function validateNavigation(
  cmsPackage: CmsPackageV1,
  pageMap: IdMap<CmsPackageV1["payload"]["pages"][number]>,
  issues: CmsValidationIssueV1[]
): void {
  cmsPackage.payload.navigation.forEach((navigation, navigationIndex) => {
    navigation.items.forEach((item, itemIndex) => {
      validateNavigationItem(
        item,
        pageMap,
        `/payload/navigation/${navigationIndex}/items/${itemIndex}`,
        issues
      );
    });
  });
}

function validateNavigationItem(
  item: CmsNavigationItemV1,
  pageMap: IdMap<CmsPackageV1["payload"]["pages"][number]>,
  path: string,
  issues: CmsValidationIssueV1[]
): void {
  validateOptionalReference(
    item.page_id,
    pageMap,
    `${path}/page_id`,
    issues,
    "navigation.page_missing"
  );

  if (item.url) {
    validateSafeUri(
      item.url,
      `${path}/url`,
      issues,
      "navigation.unsafe_url",
      true
    );
  }

  if (!item.page_id && !item.url && !item.children?.length) {
    addIssue(issues, {
      code: "navigation.target_missing",
      message: `Navigation item '${item.label}' needs a page_id, url, or children.`,
      path,
    });
  }

  item.children?.forEach((child, childIndex) => {
    validateNavigationItem(
      child,
      pageMap,
      `${path}/children/${childIndex}`,
      issues
    );
  });
}

function validateTaxonomies(
  cmsPackage: CmsPackageV1,
  pageMap: IdMap<CmsPackageV1["payload"]["pages"][number]>,
  issues: CmsValidationIssueV1[]
): void {
  cmsPackage.payload.taxonomies?.forEach((taxonomy, taxonomyIndex) => {
    taxonomy.terms.forEach((term, termIndex) => {
      validateOptionalReference(
        term.page_id,
        pageMap,
        `/payload/taxonomies/${taxonomyIndex}/terms/${termIndex}/page_id`,
        issues,
        "taxonomy.page_missing"
      );
    });
  });
}

function validateSignatures(
  cmsPackage: CmsPackageV1,
  options: CmsValidationOptions,
  issues: CmsValidationIssueV1[]
): void {
  cmsPackage.signatures.forEach((signature, index) => {
    if (
      signature.type === "fixture" &&
      options.allowFixtureSignatures === false
    ) {
      addIssue(issues, {
        code: "signature.fixture_not_allowed",
        message: "Fixture signatures are not valid for production publish.",
        path: `/signatures/${index}/type`,
      });
    }

    if (signature.type === "eip712") {
      validateEthereumAddress(
        signature.signer,
        `/signatures/${index}/signer`,
        issues,
        "signature.signer_invalid"
      );
    }
  });

  if (cmsPackage.profile.primary_wallet) {
    validateEthereumAddress(
      cmsPackage.profile.primary_wallet,
      "/profile/primary_wallet",
      issues,
      "profile.primary_wallet_invalid"
    );
  }
}

function validateStorage(
  cmsPackage: CmsPackageV1,
  options: CmsValidationOptions,
  issues: CmsValidationIssueV1[]
): void {
  let hasDecentralizedReceipt = false;

  cmsPackage.storage.forEach((receipt, index) => {
    const path = `/storage/${index}`;
    validateSafeUri(
      receipt.uri,
      `${path}/uri`,
      issues,
      "storage.unsafe_uri",
      false
    );

    if (
      receipt.provider === "fixture" &&
      options.allowFixtureStorage === false
    ) {
      addIssue(issues, {
        code: "storage.fixture_not_allowed",
        message:
          "Fixture storage receipts are not valid for production publish.",
        path: `${path}/provider`,
      });
    }

    if (receipt.provider === "s3" && receipt.canonical) {
      addIssue(issues, {
        code: "storage.s3_cannot_be_canonical",
        message:
          "S3 may accelerate delivery, but it cannot be canonical storage.",
        path: `${path}/canonical`,
      });
    }

    if (receipt.provider === "ipfs" || receipt.provider === "arweave") {
      hasDecentralizedReceipt = true;
    }
  });

  if (options.allowFixtureStorage === false && !hasDecentralizedReceipt) {
    addIssue(issues, {
      code: "storage.decentralized_receipt_required",
      message: "Production publish requires IPFS or Arweave storage.",
      path: "/storage",
    });
  }
}

function validateHashes(
  cmsPackage: CmsPackageV1,
  options: CmsValidationOptions,
  issues: CmsValidationIssueV1[]
): void {
  if (!options.enforceHashes) {
    return;
  }

  const actualPayloadHash = computeCmsPayloadHash(cmsPackage.payload);
  if (cmsPackage.integrity.payload_hash !== actualPayloadHash) {
    addIssue(issues, {
      code: "integrity.payload_hash_mismatch",
      message: "Payload hash does not match the canonical payload.",
      path: "/integrity/payload_hash",
      suggestedFix: `Expected ${actualPayloadHash}.`,
    });
  }

  const actualPackageHash = computeCmsPackageHash(cmsPackage);
  if (cmsPackage.integrity.package_hash !== actualPackageHash) {
    addIssue(issues, {
      code: "integrity.package_hash_mismatch",
      message: "Package hash does not match the canonical package hash input.",
      path: "/integrity/package_hash",
      suggestedFix: `Expected ${actualPackageHash}.`,
    });
  }
}

function validateBuildManifest(
  cmsPackage: CmsPackageV1,
  issues: CmsValidationIssueV1[]
): void {
  const buildManifest = cmsPackage.payload.build_manifest;
  if (!buildManifest) {
    return;
  }

  if (
    buildManifest.route_count !== undefined &&
    buildManifest.route_count !== cmsPackage.payload.routes.length
  ) {
    addIssue(issues, {
      severity: "warning",
      code: "build_manifest.route_count_mismatch",
      message: "Build manifest route_count does not match the route manifest.",
      path: "/payload/build_manifest/route_count",
    });
  }

  if (
    buildManifest.asset_count !== undefined &&
    buildManifest.asset_count !== cmsPackage.payload.assets.length
  ) {
    addIssue(issues, {
      severity: "warning",
      code: "build_manifest.asset_count_mismatch",
      message: "Build manifest asset_count does not match the asset manifest.",
      path: "/payload/build_manifest/asset_count",
    });
  }
}

function validateInteractivePolicyReferences(
  block: CmsBlockV1,
  assetMap: IdMap<CmsAssetV1>,
  blockPath: string,
  pageId: string,
  issues: CmsValidationIssueV1[]
): void {
  if (!block.interactive_policy?.fallback_asset_id) {
    return;
  }

  validateOptionalAssetReference(
    block.interactive_policy.fallback_asset_id,
    assetMap,
    `${blockPath}/interactive_policy/fallback_asset_id`,
    issues,
    "asset.reference_missing",
    pageId,
    block.id
  );
}

function validateBlockUrls(
  block: Record<string, unknown>,
  blockPath: string,
  pageId: string,
  blockId: string,
  issues: CmsValidationIssueV1[]
): void {
  Object.entries(block).forEach(([key, value]) => {
    if (!URL_LIKE_FIELD.test(key)) {
      return;
    }

    const path = `${blockPath}/${escapePointerSegment(key)}`;
    if (!ALLOWED_BLOCK_URL_FIELDS.has(key)) {
      addIssue(issues, {
        code: "block.unknown_url_field",
        message: `URL-like block field '${key}' is not part of V1's safe URL contract.`,
        path,
        pageId,
        blockId,
      });
      return;
    }

    if (typeof value === "string") {
      validateSafeUri(
        value,
        path,
        issues,
        "block.unsafe_url",
        true,
        pageId,
        blockId
      );
    }
  });
}

function validateHeavyMediaBlock(
  block: CmsBlockV1,
  assetMap: IdMap<CmsAssetV1>,
  blockPath: string,
  pageId: string,
  issues: CmsValidationIssueV1[]
): void {
  const record = block as Record<string, unknown>;
  const assetId = getString(record["asset_id"]);
  const asset = assetId ? assetMap.get(assetId)?.value : undefined;
  const isHeavyBlock =
    ["video", "html_embed", "object_viewer"].includes(block.block_type) ||
    asset?.kind === "video" ||
    asset?.kind === "html" ||
    asset?.kind === "model";

  if (!isHeavyBlock) {
    return;
  }

  const hasPoster = typeof record["poster_asset_id"] === "string";
  const hasFallback = !!block.interactive_policy?.fallback_asset_id;

  if (!hasPoster && !hasFallback) {
    addIssue(issues, {
      code: "media.fallback_required",
      message:
        "Heavy media blocks need a poster_asset_id or fallback_asset_id.",
      path: blockPath,
      pageId,
      blockId: block.id,
    });
  }
}

function validateBlockReferenceFields<T extends { id: string }>(
  block: Record<string, unknown>,
  fields: readonly string[],
  referenceMap: IdMap<T>,
  blockContext: BlockValidationContext,
  issues: CmsValidationIssueV1[],
  code: string
): void {
  fields.forEach((field) => {
    validateOptionalReference(
      getString(block[field]),
      referenceMap,
      `${blockContext.blockPath}/${field}`,
      issues,
      code,
      blockContext.pageId,
      blockContext.blockId
    );
  });
}

function validateBlockReferenceArrayFields<T extends { id: string }>(
  block: Record<string, unknown>,
  fields: readonly string[],
  referenceMap: IdMap<T>,
  blockContext: BlockValidationContext,
  issues: CmsValidationIssueV1[],
  code: string
): void {
  fields.forEach((field) => {
    const value = block[field];
    if (!Array.isArray(value)) {
      return;
    }

    value.forEach((item, index) => {
      validateOptionalReference(
        getString(item),
        referenceMap,
        `${blockContext.blockPath}/${field}/${index}`,
        issues,
        code,
        blockContext.pageId,
        blockContext.blockId
      );
    });
  });
}

function validateOptionalAssetReference(
  assetId: string | undefined,
  assetMap: IdMap<CmsAssetV1>,
  path: string,
  issues: CmsValidationIssueV1[],
  code: string,
  pageId?: string,
  blockId?: string
): void {
  validateOptionalReference(
    assetId,
    assetMap,
    path,
    issues,
    code,
    pageId,
    blockId
  );
}

function validatePageReference(
  pageId: string,
  pageMap: IdMap<CmsPackageV1["payload"]["pages"][number]>,
  path: string,
  issues: CmsValidationIssueV1[],
  code: string
): void {
  validateOptionalReference(pageId, pageMap, path, issues, code);
}

function validateOptionalReference<T extends { id: string }>(
  id: string | undefined,
  referenceMap: IdMap<T>,
  path: string,
  issues: CmsValidationIssueV1[],
  code: string,
  pageId?: string,
  blockId?: string
): void {
  if (!id || referenceMap.has(id)) {
    return;
  }

  addIssue(issues, {
    code,
    message: `Reference '${id}' does not exist.`,
    path,
    pageId,
    blockId,
  });
}

function validateProfileNamespace(
  pathValue: string,
  profileHandle: string,
  path: string,
  issues: CmsValidationIssueV1[],
  code: string
): void {
  const expectedPrefix = `/${profileHandle.toLowerCase()}/`;
  if (!pathValue.toLowerCase().startsWith(expectedPrefix)) {
    addIssue(issues, {
      code,
      message: `CMS path '${pathValue}' must stay under /${profileHandle}/.`,
      path,
    });
  }
}

function validateReservedRouteRoot(
  pathValue: string,
  path: string,
  issues: CmsValidationIssueV1[]
): void {
  const routeRoot = pathValue.split("/")[1]?.toLowerCase();
  if (!routeRoot) {
    return;
  }

  if ((CMS_RESERVED_APP_ROUTE_ROOTS as readonly string[]).includes(routeRoot)) {
    addIssue(issues, {
      code: "route.reserved_root",
      message: `Route root '/${routeRoot}' is reserved by the application.`,
      path,
    });
  }
}

function validateSafeUri(
  value: string,
  path: string,
  issues: CmsValidationIssueV1[],
  code: string,
  allowRelative: boolean,
  pageId?: string,
  blockId?: string
): void {
  if (isSafeUri(value, allowRelative)) {
    return;
  }

  addIssue(issues, {
    code,
    message: `Unsafe or unsupported URI '${value}'.`,
    path,
    pageId,
    blockId,
  });
}

function isSafeUri(value: string, allowRelative: boolean): boolean {
  if (allowRelative && value.startsWith("/")) {
    return isSafeRelativeUri(value);
  }

  try {
    const protocol = new URL(value).protocol.toLowerCase();
    return (CMS_SAFE_URI_PROTOCOLS as readonly string[]).includes(protocol);
  } catch {
    return false;
  }
}

function isSafeRelativeUri(value: string): boolean {
  if (value.startsWith("//")) {
    return false;
  }

  if (/[\\\u0000-\u001f\u007f]/.test(value)) {
    return false;
  }

  const lowercaseValue = value.toLowerCase();
  return (
    !lowercaseValue.startsWith("/%2f") && !lowercaseValue.startsWith("/%5c")
  );
}

function validateEthereumAddress(
  value: string,
  path: string,
  issues: CmsValidationIssueV1[],
  code: string
): void {
  try {
    getAddress(value);
  } catch {
    addIssue(issues, {
      code,
      message: `Invalid Ethereum address '${value}'.`,
      path,
    });
  }
}

function toIdMap<T extends { id: string }>(
  items: T[],
  path: string,
  label: string,
  issues: CmsValidationIssueV1[]
): IdMap<T> {
  const map: IdMap<T> = new Map();

  items.forEach((item, index) => {
    if (map.has(item.id)) {
      addIssue(issues, {
        code: `${label}.duplicate_id`,
        message: `${label} id '${item.id}' appears more than once.`,
        path: `${path}/${index}/id`,
      });
    } else {
      map.set(item.id, { value: item, index });
    }
  });

  return map;
}

function mapZodIssue(issue: ZodIssue): CmsValidationIssueV1 {
  const path = toJsonPointer(issue.path);

  if (issue.path[0] === "signatures") {
    return issueFromInput({
      code: "signature.required",
      message: "At least one signature is required.",
      path: "/signatures",
    });
  }

  if (
    issue.code === "invalid_enum_value" &&
    issue.path[issue.path.length - 1] === "block_type"
  ) {
    return issueFromInput({
      code: "block.unknown_type",
      message: "Unknown block type. V1 CMS packages fail closed.",
      path,
    });
  }

  const lastPathSegment = issue.path[issue.path.length - 1];
  if (
    issue.code === "invalid_string" &&
    issue.validation === "regex" &&
    typeof lastPathSegment === "string" &&
    HASH_FIELD_NAMES.has(lastPathSegment)
  ) {
    return issueFromInput({
      code: "hash.invalid",
      message: issue.message,
      path,
    });
  }

  return issueFromInput({
    code: "schema.invalid",
    message: issue.message,
    path,
  });
}

function addIssue(issues: CmsValidationIssueV1[], input: IssueInput): void {
  issues.push(issueFromInput(input));
}

function issueFromInput(input: IssueInput): CmsValidationIssueV1 {
  return {
    severity: input.severity ?? "error",
    code: input.code,
    message: input.message,
    path: input.path,
    ...(input.pageId ? { page_id: input.pageId } : {}),
    ...(input.blockId ? { block_id: input.blockId } : {}),
    ...(input.suggestedFix ? { suggested_fix: input.suggestedFix } : {}),
  };
}

function formatCheckedAt(value: Date | string | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function toJsonPointer(path: ZodIssue["path"]): string {
  if (!path.length) {
    return "/";
  }

  return `/${path.map((segment) => escapePointerSegment(String(segment))).join("/")}`;
}

function escapePointerSegment(segment: string): string {
  return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}

function getTarget(
  input: unknown
): CmsValidationResultV1["target"] | undefined {
  if (!isRecord(input)) {
    return undefined;
  }

  const inputIntegrity = input["integrity"];
  const integrity = isRecord(inputIntegrity) ? inputIntegrity : undefined;
  const target: NonNullable<CmsValidationResultV1["target"]> = {};
  const packageHash = integrity?.["package_hash"];
  const packageId = input["package_id"];

  if (typeof packageHash === "string" && isCmsSha256Hash(packageHash)) {
    target.package_hash = packageHash;
  }

  if (typeof packageId === "string") {
    target.package_id = packageId;
  }

  return Object.keys(target).length ? target : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
