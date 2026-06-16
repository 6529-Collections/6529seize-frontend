export const CMS_PACKAGE_SCHEMA = "6529.cms.package.v1" as const;
export const CMS_PAYLOAD_SCHEMA = "6529.cms.payload.v1" as const;

export type CmsJsonPrimitive = string | number | boolean | null;
export type CmsJsonValue =
  | CmsJsonPrimitive
  | readonly CmsJsonValue[]
  | { readonly [key: string]: CmsJsonValue };

export type CmsHash = `sha256:${string}`;

export type CmsProfileRef = {
  readonly id: string;
  readonly handle: string;
  readonly display_name: string;
  readonly path: string;
};

export type CmsTheme = {
  readonly mode: "light" | "dark" | "system";
  readonly accent_color: string;
};

export type CmsSite = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly owner_profile: CmsProfileRef;
  readonly theme: CmsTheme;
};

export type CmsSocialImage = {
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly content_hash?: CmsHash;
};

export type CmsPageSocial = {
  readonly title: string;
  readonly description: string;
  readonly canonical_url: string;
  readonly open_graph_image: CmsSocialImage;
  readonly square_image?: CmsSocialImage;
};

export type CmsPage = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly slug_path: string;
  readonly static_export_path: string;
  readonly canonical_url: string;
  readonly page_type:
    | "page"
    | "post"
    | "gallery"
    | "collection"
    | "nft_detail"
    | "card_detail"
    | "room";
  readonly social: CmsPageSocial;
  readonly created_at: string;
  readonly updated_at: string;
};

export type CmsAsset = {
  readonly id: string;
  readonly kind: "image" | "video" | "model" | "document" | "social_image";
  readonly src: string;
  readonly alt: string;
  readonly title?: string;
  readonly caption?: string;
  readonly width?: number;
  readonly height?: number;
  readonly mime_type?: string;
  readonly content_hash?: CmsHash;
};

export type CmsBaseBlock = {
  readonly id: string;
  readonly type: string;
};

export type CmsHeadingBlock = CmsBaseBlock & {
  readonly type: "heading";
  readonly level: 1 | 2 | 3;
  readonly text: string;
  readonly eyebrow?: string;
};

export type CmsRichTextBlock = CmsBaseBlock & {
  readonly type: "rich_text";
  readonly paragraphs: readonly string[];
};

export type CmsImageBlock = CmsBaseBlock & {
  readonly type: "image";
  readonly asset_id: string;
  readonly caption?: string;
};

export type CmsGalleryBlock = CmsBaseBlock & {
  readonly type: "gallery";
  readonly title?: string;
  readonly items: readonly {
    readonly asset_id: string;
    readonly title?: string;
    readonly caption?: string;
    readonly href?: string;
  }[];
};

export type CmsQuoteBlock = CmsBaseBlock & {
  readonly type: "quote";
  readonly quote: string;
  readonly attribution?: string;
};

export type CmsCalloutBlock = CmsBaseBlock & {
  readonly type: "callout";
  readonly tone: "note" | "evidence" | "warning";
  readonly title: string;
  readonly body: string;
};

export type CmsButtonLinkBlock = CmsBaseBlock & {
  readonly type: "button_link";
  readonly label: string;
  readonly href: string;
};

export type CmsNftReferenceBlock = CmsBaseBlock & {
  readonly type: "nft_reference";
  readonly chain_id: number;
  readonly contract: string;
  readonly token_id: string;
  readonly title: string;
  readonly collection: string;
  readonly creator?: string;
  readonly asset_id: string;
  readonly snapshot: {
    readonly owner?: string;
    readonly block_number?: number;
    readonly captured_at: string;
  };
};

export type CmsCollectionReferenceBlock = CmsBaseBlock & {
  readonly type: "collection_reference";
  readonly chain_id: number;
  readonly contract: string;
  readonly title: string;
  readonly summary: string;
  readonly asset_id: string;
  readonly knowledge_packet?: {
    readonly id: string;
    readonly version: string;
    readonly hash: CmsHash;
  };
};

export type CmsTransactionReferenceBlock = CmsBaseBlock & {
  readonly type: "transaction_reference";
  readonly chain_id: number;
  readonly hash: string;
  readonly block_number: number;
  readonly timestamp: string;
  readonly summary: string;
  readonly from: string;
  readonly to: string;
  readonly value_eth: string;
  readonly actions: readonly string[];
};

export type CmsWalletGalleryBlock = CmsBaseBlock & {
  readonly type: "generated_wallet_gallery";
  readonly title: string;
  readonly wallets: readonly string[];
  readonly snapshot: {
    readonly captured_at: string;
    readonly block_number?: number;
  };
  readonly stats: readonly {
    readonly label: string;
    readonly value: string;
  }[];
  readonly collections: readonly {
    readonly title: string;
    readonly count: number;
    readonly asset_id: string;
    readonly href?: string;
  }[];
};

export type CmsKnownBlock =
  | CmsHeadingBlock
  | CmsRichTextBlock
  | CmsImageBlock
  | CmsGalleryBlock
  | CmsQuoteBlock
  | CmsCalloutBlock
  | CmsButtonLinkBlock
  | CmsNftReferenceBlock
  | CmsCollectionReferenceBlock
  | CmsTransactionReferenceBlock
  | CmsWalletGalleryBlock;

export type CmsUnknownBlock = CmsBaseBlock & {
  readonly type: "unknown";
  readonly data: CmsJsonValue;
};

export type CmsBlock = CmsKnownBlock | CmsUnknownBlock;

export type CmsProvenance = {
  readonly source: "manual" | "wallet_gallery" | "import" | "fixture";
  readonly builder_version: string;
  readonly source_snapshot_hash?: CmsHash;
  readonly notes?: readonly string[];
};

export type CmsPayload = {
  readonly schema: typeof CMS_PAYLOAD_SCHEMA;
  readonly site: CmsSite;
  readonly page: CmsPage;
  readonly assets: readonly CmsAsset[];
  readonly blocks: readonly CmsBlock[];
  readonly provenance: CmsProvenance;
};

export type CmsSignatureEnvelope = {
  readonly signature_type: "eip191" | "eip712" | "fixture";
  readonly signing_wallet: string;
  readonly signed_at: string;
  readonly signature: string;
};

export type CmsStorageLocation = {
  readonly provider: "ipfs" | "arweave" | "s3" | "fixture";
  readonly uri: string;
  readonly content_hash?: CmsHash;
  readonly pinned?: boolean;
};

export type CmsPublishedPackage = {
  readonly schema: typeof CMS_PACKAGE_SCHEMA;
  readonly payload_hash: CmsHash;
  readonly package_hash: CmsHash;
  readonly payload: CmsPayload;
  readonly signature: CmsSignatureEnvelope;
  readonly storage: readonly CmsStorageLocation[];
};
