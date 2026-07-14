import { CMS_VALIDATION_RESULT_SCHEMA } from "./constants";
import {
  cmsPackageSchema,
  validationResultSchema,
  type CmsAssetV1,
  type CmsBlockV1,
  type CmsPackageV1,
  type CmsValidationIssueV1,
  type CmsValidationResultV1,
} from "./schemas";
import {
  addIssue,
  formatCheckedAt,
  getTarget,
  mapZodIssue,
  toIdMap,
  validateBlockReferenceArrayFields,
  validateBlockReferenceFields,
  validateBlockUrls,
  validateBuildManifest,
  validateEthereumAddress,
  validateHashes,
  validateHeavyMediaBlock,
  validateInteractivePolicyReferences,
  validateNavigation,
  validateOptionalAssetReference,
  validateOptionalReference,
  validatePageReference,
  validateProfileNamespace,
  validateReservedRouteRoot,
  validateSafeUri,
  validateSignatures,
  validateStorage,
  validateTaxonomies,
  type IdMap,
} from "./validation-helpers";

interface CmsValidationOptions {
  checkedAt?: Date | string;
  validator?: string;
  validatorVersion?: string;
  allowFixtureSignatures?: boolean;
  allowFixtureStorage?: boolean;
  enforceHashes?: boolean;
}

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
