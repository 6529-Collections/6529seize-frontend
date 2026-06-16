import { z } from "zod";

import { CMS_PACKAGE_SCHEMA, CMS_PAYLOAD_SCHEMA } from "./types";

const hashSchema = z.custom<`sha256:${string}`>(
  (value) => typeof value === "string" && /^sha256:[0-9a-f]{64}$/i.test(value),
  "Expected sha256:<64 hex chars>"
);

const jsonSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(jsonSchema),
  ])
);

const profileRefSchema = z.object({
  id: z.string().min(1),
  handle: z.string().min(1),
  display_name: z.string().min(1),
  path: z.string().min(1),
});

const assetSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["image", "video", "model", "document", "social_image"]),
  src: z.string().min(1),
  alt: z.string().min(1),
  title: z.string().optional(),
  caption: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  mime_type: z.string().optional(),
  content_hash: hashSchema.optional(),
});

const socialImageSchema = z.object({
  url: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().min(1),
  content_hash: hashSchema.optional(),
});

const baseBlockSchema = z.object({
  id: z.string().min(1),
});

const headingBlockSchema = baseBlockSchema.extend({
  type: z.literal("heading"),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  text: z.string().min(1),
  eyebrow: z.string().optional(),
});

const richTextBlockSchema = baseBlockSchema.extend({
  type: z.literal("rich_text"),
  paragraphs: z.array(z.string().min(1)).min(1),
});

const imageBlockSchema = baseBlockSchema.extend({
  type: z.literal("image"),
  asset_id: z.string().min(1),
  caption: z.string().optional(),
});

const galleryBlockSchema = baseBlockSchema.extend({
  type: z.literal("gallery"),
  title: z.string().optional(),
  items: z
    .array(
      z.object({
        asset_id: z.string().min(1),
        title: z.string().optional(),
        caption: z.string().optional(),
        href: z.string().optional(),
      })
    )
    .min(1),
});

const quoteBlockSchema = baseBlockSchema.extend({
  type: z.literal("quote"),
  quote: z.string().min(1),
  attribution: z.string().optional(),
});

const calloutBlockSchema = baseBlockSchema.extend({
  type: z.literal("callout"),
  tone: z.enum(["note", "evidence", "warning"]),
  title: z.string().min(1),
  body: z.string().min(1),
});

const buttonLinkBlockSchema = baseBlockSchema.extend({
  type: z.literal("button_link"),
  label: z.string().min(1),
  href: z.string().min(1),
});

const nftReferenceBlockSchema = baseBlockSchema.extend({
  type: z.literal("nft_reference"),
  chain_id: z.number().int().positive(),
  contract: z.string().min(1),
  token_id: z.string().min(1),
  title: z.string().min(1),
  collection: z.string().min(1),
  creator: z.string().optional(),
  asset_id: z.string().min(1),
  snapshot: z.object({
    owner: z.string().optional(),
    block_number: z.number().int().positive().optional(),
    captured_at: z.string().min(1),
  }),
});

const collectionReferenceBlockSchema = baseBlockSchema.extend({
  type: z.literal("collection_reference"),
  chain_id: z.number().int().positive(),
  contract: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  asset_id: z.string().min(1),
  knowledge_packet: z
    .object({
      id: z.string().min(1),
      version: z.string().min(1),
      hash: hashSchema,
    })
    .optional(),
});

const transactionReferenceBlockSchema = baseBlockSchema.extend({
  type: z.literal("transaction_reference"),
  chain_id: z.number().int().positive(),
  hash: z.string().min(1),
  block_number: z.number().int().positive(),
  timestamp: z.string().min(1),
  summary: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  value_eth: z.string().min(1),
  actions: z.array(z.string().min(1)).min(1),
});

const walletGalleryBlockSchema = baseBlockSchema.extend({
  type: z.literal("generated_wallet_gallery"),
  title: z.string().min(1),
  wallets: z.array(z.string().min(1)).min(1),
  snapshot: z.object({
    captured_at: z.string().min(1),
    block_number: z.number().int().positive().optional(),
  }),
  stats: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().min(1),
      })
    )
    .min(1),
  collections: z
    .array(
      z.object({
        title: z.string().min(1),
        count: z.number().int().nonnegative(),
        asset_id: z.string().min(1),
        href: z.string().optional(),
      })
    )
    .min(1),
});

const unknownBlockSchema = baseBlockSchema.extend({
  type: z.literal("unknown"),
  data: jsonSchema,
});

const blockSchema = z.discriminatedUnion("type", [
  headingBlockSchema,
  richTextBlockSchema,
  imageBlockSchema,
  galleryBlockSchema,
  quoteBlockSchema,
  calloutBlockSchema,
  buttonLinkBlockSchema,
  nftReferenceBlockSchema,
  collectionReferenceBlockSchema,
  transactionReferenceBlockSchema,
  walletGalleryBlockSchema,
  unknownBlockSchema,
]);

export const cmsPayloadSchema = z.object({
  schema: z.literal(CMS_PAYLOAD_SCHEMA),
  site: z.object({
    id: z.string().min(1),
    slug: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    owner_profile: profileRefSchema,
    theme: z.object({
      mode: z.enum(["light", "dark", "system"]),
      accent_color: z.string().min(1),
    }),
  }),
  page: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    slug_path: z.string(),
    static_export_path: z.string().min(1),
    canonical_url: z.string().min(1),
    page_type: z.enum([
      "page",
      "post",
      "gallery",
      "collection",
      "nft_detail",
      "card_detail",
      "room",
    ]),
    social: z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      canonical_url: z.string().min(1),
      open_graph_image: socialImageSchema,
      square_image: socialImageSchema.optional(),
    }),
    created_at: z.string().min(1),
    updated_at: z.string().min(1),
  }),
  assets: z.array(assetSchema),
  blocks: z.array(blockSchema).min(1),
  provenance: z.object({
    source: z.enum(["manual", "wallet_gallery", "import", "fixture"]),
    builder_version: z.string().min(1),
    source_snapshot_hash: hashSchema.optional(),
    notes: z.array(z.string().min(1)).optional(),
  }),
});

export const cmsPackageSchema = z.object({
  schema: z.literal(CMS_PACKAGE_SCHEMA),
  payload_hash: hashSchema,
  package_hash: hashSchema,
  payload: cmsPayloadSchema,
  signature: z.object({
    signature_type: z.enum(["eip191", "eip712", "fixture"]),
    signing_wallet: z.string().min(1),
    signed_at: z.string().min(1),
    signature: z.string().min(1),
  }),
  storage: z.array(
    z.object({
      provider: z.enum(["ipfs", "arweave", "s3", "fixture"]),
      uri: z.string().min(1),
      content_hash: hashSchema.optional(),
      pinned: z.boolean().optional(),
    })
  ),
});
