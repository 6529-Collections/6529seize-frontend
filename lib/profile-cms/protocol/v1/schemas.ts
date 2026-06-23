import { z } from "zod";

import {
  CMS_AGENT_PATCH_SCHEMA,
  CMS_ASSET_KINDS,
  CMS_ASSET_ROLES,
  CMS_BLOCK_TYPES,
  CMS_CANONICALIZATION,
  CMS_DISPLAY_VARIANT_ROLES,
  CMS_HASH_ALGORITHM,
  CMS_HYDRATION_POLICIES,
  CMS_PACKAGE_SCHEMA,
  CMS_PAGE_TYPES,
  CMS_PAYLOAD_SCHEMA,
  CMS_ROUTE_KINDS,
  CMS_SIGNATURE_TYPES,
  CMS_SOURCE_PACKET_TYPES,
  CMS_STORAGE_PROVIDERS,
  CMS_VALIDATION_RESULT_SCHEMA,
} from "./constants";

const idSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]{1,127}$/);
const slugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,127}$/);
const cmsPathSchema = z
  .string()
  .regex(/^\/[a-zA-Z0-9._~!$&'()*+,;=:@/-]+\/index\.html$/);
const uriSchema = z.string().min(1).max(2048);
const hashSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const localeSchema = z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/);
const ethereumAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const dateTimeSchema = z.string().datetime({ offset: true });

const blockValueSchema: z.ZodType<
  string | number | boolean | null | unknown[] | Record<string, unknown>
> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(blockValueSchema),
    z.record(blockValueSchema),
  ])
);

const profileRefSchema = z
  .object({
    handle: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$/),
    profile_id: z.string().optional(),
    primary_wallet: ethereumAddressSchema.optional(),
  })
  .strict();

const themeSchema = z
  .object({
    mode: z.enum(["light", "dark", "system"]),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    tokens: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  })
  .strict();

const pageMetadataPartialSchema = z
  .object({
    title: z.string().min(1).max(160).optional(),
    description: z.string().max(300).optional(),
    locale: localeSchema.optional(),
    canonical_url: uriSchema.optional(),
    social_image_asset_id: idSchema.optional(),
    square_social_image_asset_id: idSchema.optional(),
    navigation_label: z.string().max(80).optional(),
    search: z.enum(["include", "exclude"]).optional(),
    robots: z.enum(["index", "noindex"]).optional(),
    last_updated: dateTimeSchema.optional(),
  })
  .strict();

const pageMetadataSchema = pageMetadataPartialSchema
  .extend({
    title: z.string().min(1).max(160),
    description: z.string().max(300),
    locale: localeSchema,
    canonical_url: uriSchema,
  })
  .strict();

const metadataDefaultSchema = z
  .object({
    scope: z
      .object({
        collection: z.string().optional(),
        path_prefix: z.string().optional(),
        page_type: z.string().optional(),
      })
      .strict(),
    values: pageMetadataPartialSchema,
  })
  .strict();

const searchConfigSchema = z
  .object({
    enabled: z.boolean().optional(),
    manifest_asset_id: idSchema.optional(),
  })
  .strict();

const siteManifestSchema = z
  .object({
    title: z.string().min(1).max(160),
    description: z.string().max(300).optional(),
    base_path: cmsPathSchema,
    default_locale: localeSchema,
    direction: z.enum(["ltr", "rtl"]).optional(),
    theme: themeSchema,
    navigation_id: idSchema,
    metadata_defaults: z.array(metadataDefaultSchema).optional(),
    search: searchConfigSchema.optional(),
    required_renderer_capabilities: z.array(z.string()).optional(),
  })
  .strict();

const interactivePolicySchema = z
  .object({
    hydration: z.enum(CMS_HYDRATION_POLICIES),
    requires_user_activation: z.boolean().optional(),
    fallback_asset_id: idSchema.optional(),
    sandbox_permissions: z.array(z.string()).optional(),
    performance_budget: z.record(z.union([z.number(), z.string()])).optional(),
  })
  .strict();

export const blockSchema = z
  .object({
    id: idSchema,
    block_type: z.enum(CMS_BLOCK_TYPES),
    interactive_policy: interactivePolicySchema.optional(),
  })
  .catchall(blockValueSchema);

const sourceRefSchema = z
  .object({
    source_packet_id: idSchema.optional(),
    field_sources: z.record(z.string()).optional(),
  })
  .strict();

export const pageSchema = z
  .object({
    id: idSchema,
    type: z.enum(CMS_PAGE_TYPES),
    path: cmsPathSchema,
    metadata: pageMetadataSchema,
    blocks: z.array(blockSchema),
    source: sourceRefSchema.optional(),
  })
  .strict();

const routeSchema = z
  .object({
    path: cmsPathSchema,
    kind: z.enum(CMS_ROUTE_KINDS),
    page_id: idSchema.optional(),
    target: z.string().optional(),
  })
  .strict();

export const assetSchema = z
  .object({
    id: idSchema,
    kind: z.enum(CMS_ASSET_KINDS),
    uri: uriSchema,
    content_hash: hashSchema,
    mime_type: z.string(),
    width: z.number().int().min(1).optional(),
    height: z.number().int().min(1).optional(),
    duration_seconds: z.number().min(0).optional(),
    file_size_bytes: z.number().int().min(0).optional(),
    roles: z.array(z.enum(CMS_ASSET_ROLES)).optional(),
    alt_text: z.string().optional(),
    decorative: z.boolean().optional(),
    rights: z.string().optional(),
  })
  .strict();

const displayVariantSchema = z
  .object({
    asset_id: idSchema,
    role: z.enum(CMS_DISPLAY_VARIANT_ROLES),
    crop_mode: z.enum(["preserve", "cover", "contain"]).optional(),
    background: z.string().optional(),
    source_asset_id: idSchema.optional(),
  })
  .strict();

const snapshotSchema = z
  .object({
    owner: z.string().optional(),
    block_number: z.number().int().min(0).optional(),
    captured_at: dateTimeSchema.optional(),
  })
  .strict();

const nftMediaProfileSchema = z
  .object({
    id: idSchema,
    chain_id: z.number().int().min(1),
    contract: ethereumAddressSchema,
    token_id: z.string().min(1),
    metadata_uri: uriSchema.optional(),
    metadata_hash: hashSchema.optional(),
    original_asset_ids: z.array(idSchema).optional(),
    display_variants: z.array(displayVariantSchema),
    poster_asset_id: idSchema.optional(),
    snapshot: snapshotSchema.optional(),
  })
  .strict();

const deepZoomManifestSchema = z
  .object({
    id: idSchema,
    source_asset_id: idSchema,
    tile_size: z.number().int().min(128),
    levels: z.number().int().min(1),
    format: z.enum(["jpg", "png", "webp", "avif"]),
    tile_uri_template: uriSchema.optional(),
    content_hash: hashSchema.optional(),
  })
  .strict();

const artworkPlacementSchema = z
  .object({
    id: idSchema,
    asset_id: idSchema,
    nft_media_profile_id: idSchema.optional(),
    detail_page_id: idSchema,
    position: z.tuple([z.number(), z.number(), z.number()]).optional(),
    rotation: z.tuple([z.number(), z.number(), z.number()]).optional(),
    size: z.tuple([z.number().positive(), z.number().positive()]).optional(),
    display_mode: z.enum(["faithful", "gallery"]),
    label: z.string().optional(),
  })
  .strict();

const exhibitionRoomSchema = z
  .object({
    id: idSchema,
    title: z.string().min(1),
    room_type: z.enum(["wall", "salon", "white_cube", "dark_room"]),
    poster_asset_id: idSchema.optional(),
    fallback_page_id: idSchema,
    navigation_mode: z.enum(["orbit", "guided_hotspots", "walk"]).optional(),
    placements: z.array(artworkPlacementSchema),
  })
  .strict();

interface CmsNavigationItemShape {
  label: string;
  page_id?: string | undefined;
  url?: string | undefined;
  children?: CmsNavigationItemShape[] | undefined;
}

export const navigationItemSchema: z.ZodType<CmsNavigationItemShape> = z.lazy(
  () =>
    z
      .object({
        label: z.string(),
        page_id: idSchema.optional(),
        url: uriSchema.optional(),
        children: z.array(navigationItemSchema).optional(),
      })
      .strict()
);

const navigationSchema = z
  .object({
    id: idSchema,
    items: z.array(navigationItemSchema),
  })
  .strict();

const taxonomySchema = z
  .object({
    id: idSchema,
    name: z.string(),
    terms: z.array(
      z
        .object({
          slug: slugSchema,
          label: z.string(),
          page_id: idSchema.optional(),
        })
        .strict()
    ),
  })
  .strict();

const sourcePacketSchema = z
  .object({
    id: idSchema,
    source_type: z.enum(CMS_SOURCE_PACKET_TYPES),
    captured_at: dateTimeSchema,
    content_hash: hashSchema.optional(),
  })
  .catchall(blockValueSchema);

const buildManifestSchema = z
  .object({
    renderer: z.string().optional(),
    renderer_version: z.string().optional(),
    route_count: z.number().int().min(0).optional(),
    asset_count: z.number().int().min(0).optional(),
    warnings: z.array(z.string()).optional(),
  })
  .strict();

export const cmsPayloadSchema = z
  .object({
    schema: z.literal(CMS_PAYLOAD_SCHEMA),
    routes: z.array(routeSchema),
    pages: z.array(pageSchema),
    assets: z.array(assetSchema),
    nft_media_profiles: z.array(nftMediaProfileSchema).optional(),
    deep_zoom_manifests: z.array(deepZoomManifestSchema).optional(),
    exhibition_rooms: z.array(exhibitionRoomSchema).optional(),
    navigation: z.array(navigationSchema),
    taxonomies: z.array(taxonomySchema).optional(),
    source_packets: z.array(sourcePacketSchema).optional(),
    build_manifest: buildManifestSchema.optional(),
  })
  .strict();

const integritySchema = z
  .object({
    canonicalization: z.literal(CMS_CANONICALIZATION),
    hash_algorithm: z.literal(CMS_HASH_ALGORITHM),
    payload_hash: hashSchema,
    package_hash: hashSchema,
    note: z.string().optional(),
  })
  .strict();

const signatureEnvelopeSchema = z
  .object({
    type: z.enum(CMS_SIGNATURE_TYPES),
    signer: z.string(),
    signature: z.string(),
    signed_at: dateTimeSchema,
    domain: z.record(z.unknown()).optional(),
  })
  .strict();

const storageReceiptSchema = z
  .object({
    provider: z.enum(CMS_STORAGE_PROVIDERS),
    uri: uriSchema,
    content_hash: hashSchema,
    provider_content_id: z.string().optional(),
    pinned: z.boolean().optional(),
    canonical: z.boolean().optional(),
    recorded_at: dateTimeSchema,
  })
  .strict();

const packageProvenanceSchema = z
  .object({
    builder: z.string(),
    builder_version: z.string().optional(),
    created_at: dateTimeSchema,
    notes: z.string().optional(),
  })
  .strict();

export const cmsPackageSchema = z
  .object({
    schema: z.literal(CMS_PACKAGE_SCHEMA),
    package_id: idSchema,
    profile: profileRefSchema,
    site: siteManifestSchema,
    payload: cmsPayloadSchema,
    integrity: integritySchema,
    signatures: z.array(signatureEnvelopeSchema).min(1),
    storage: z.array(storageReceiptSchema).min(1),
    provenance: packageProvenanceSchema,
  })
  .strict();

export const validationIssueSchema = z
  .object({
    severity: z.enum(["error", "warning", "note"]),
    code: z.string(),
    message: z.string(),
    path: z.string(),
    page_id: z.string().optional(),
    block_id: z.string().optional(),
    suggested_fix: z.string().optional(),
  })
  .strict();

export const validationResultSchema = z
  .object({
    schema: z.literal(CMS_VALIDATION_RESULT_SCHEMA),
    valid: z.boolean(),
    checked_at: dateTimeSchema,
    validator: z.string().optional(),
    validator_version: z.string().optional(),
    target: z
      .object({
        package_hash: hashSchema.optional(),
        draft_id: z.string().optional(),
        package_id: z.string().optional(),
      })
      .strict()
      .optional(),
    issues: z.array(validationIssueSchema),
  })
  .strict();

const agentPatchOperationSchema = z
  .object({
    op: z.enum([
      "add_page",
      "remove_page",
      "update_page_metadata",
      "add_block",
      "update_block",
      "remove_block",
      "reorder_blocks",
      "update_navigation",
      "update_theme",
      "update_share_metadata",
      "attach_source_packet",
      "set_taxonomy_terms",
    ]),
    path: z.string().min(1),
    value: z.unknown().optional(),
    reason: z.string().optional(),
    source_packet_ids: z.array(z.string()).optional(),
  })
  .strict();

export const agentPatchSchema = z
  .object({
    schema: z.literal(CMS_AGENT_PATCH_SCHEMA),
    patch_id: z.string().min(1),
    target: z
      .object({
        draft_id: z.string(),
        base_version: z.number().int().min(0),
        base_package_hash: hashSchema.optional(),
      })
      .strict(),
    operations: z.array(agentPatchOperationSchema).min(1),
    provenance: z
      .object({
        created_at: dateTimeSchema,
        author_type: z.enum(["user_agent", "local_tool", "human"]),
        agent_name: z.string().optional(),
        agent_version: z.string().optional(),
        notes: z.string().optional(),
      })
      .strict(),
  })
  .strict();

export type CmsPackageV1 = z.infer<typeof cmsPackageSchema>;
export type CmsPayloadV1 = z.infer<typeof cmsPayloadSchema>;
export type CmsPageV1 = z.infer<typeof pageSchema>;
export type CmsBlockV1 = z.infer<typeof blockSchema>;
export type CmsAssetV1 = z.infer<typeof assetSchema>;
export type CmsNavigationItemV1 = z.infer<typeof navigationItemSchema>;
export type CmsValidationIssueV1 = z.infer<typeof validationIssueSchema>;
export type CmsValidationResultV1 = z.infer<typeof validationResultSchema>;
export type CmsAgentPatchV1 = z.infer<typeof agentPatchSchema>;
