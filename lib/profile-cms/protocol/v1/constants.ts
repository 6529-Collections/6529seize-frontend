export const CMS_PACKAGE_SCHEMA = "6529.cms.package.v1" as const;
export const CMS_PAYLOAD_SCHEMA = "6529.cms.payload.v1" as const;
export const CMS_AGENT_PATCH_SCHEMA = "6529.cms.agent_patch.v1" as const;
export const CMS_VALIDATION_RESULT_SCHEMA =
  "6529.cms.validation_result.v1" as const;

export const CMS_CANONICALIZATION = "jcs-rfc8785" as const;
export const CMS_HASH_ALGORITHM = "sha256" as const;

export const CMS_BLOCK_TYPES = [
  "heading",
  "rich_text",
  "image",
  "video",
  "audio",
  "gallery",
  "quote",
  "callout",
  "button_link",
  "nft_reference",
  "collection_reference",
  "transaction_reference",
  "generated_wallet_gallery",
  "lightbox_gallery",
  "deep_zoom",
  "html_embed",
  "object_viewer",
  "room_viewer",
] as const;

export const CMS_PAGE_TYPES = [
  "page",
  "post",
  "gallery",
  "collection",
  "nft_detail",
  "card_detail",
  "room",
  "transaction",
] as const;

export const CMS_ROUTE_KINDS = ["page", "redirect", "alias"] as const;

export const CMS_ASSET_KINDS = [
  "image",
  "video",
  "audio",
  "model",
  "document",
  "html",
  "social_image",
  "search_index",
  "build_manifest",
] as const;

export const CMS_ASSET_ROLES = [
  "original",
  "thumbnail",
  "grid",
  "detail",
  "fullscreen",
  "poster",
  "tile",
  "social",
  "fallback",
] as const;

export const CMS_SIGNATURE_TYPES = ["eip712", "fixture"] as const;
export const CMS_STORAGE_PROVIDERS = [
  "ipfs",
  "arweave",
  "s3",
  "fixture",
] as const;

export const CMS_HYDRATION_POLICIES = [
  "static",
  "client_island",
  "deferred_island",
  "sandboxed_embed",
] as const;

export const CMS_DISPLAY_VARIANT_ROLES = [
  "grid",
  "detail",
  "fullscreen",
  "poster",
  "social",
  "tile",
] as const;

export const CMS_SOURCE_PACKET_TYPES = [
  "wallet",
  "nft_metadata",
  "collection",
  "transaction",
  "profile",
  "import",
] as const;

export const CMS_SAFE_URI_PROTOCOLS = [
  "https:",
  "ipfs:",
  "ar:",
  "arweave:",
] as const;

export const CMS_RESERVED_APP_ROUTE_ROOTS = [
  "about",
  "admin",
  "api",
  "blog",
  "capital",
  "delegation",
  "education",
  "feed",
  "groups",
  "leaderboard",
  "museum",
  "my-stream",
  "network",
  "news",
  "om",
  "open-data",
  "tools",
  "waves",
] as const;
