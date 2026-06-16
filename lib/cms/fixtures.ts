import { buildCmsPackage } from "./package-utils";
import {
  CMS_PAYLOAD_SCHEMA,
  type CmsPayload,
  type CmsPublishedPackage,
} from "./types";

const FIXTURE_TIMESTAMP = "2026-06-16T00:00:00.000Z";

const fixtureSignature = {
  signature_type: "fixture" as const,
  signing_wallet: "0x0000000000000000000000000000000000006529",
  signed_at: FIXTURE_TIMESTAMP,
  signature: "fixture-signature-profile-native-cms-v1",
};

const ownerProfile = {
  id: "profile-punk6529",
  handle: "punk6529",
  display_name: "punk6529",
  path: "/punk6529",
};

const baseSite = {
  id: "site-punk6529-primary",
  slug: "home",
  title: "punk6529",
  description: "A profile-native CMS site rendered from a signed package.",
  owner_profile: ownerProfile,
  theme: {
    mode: "dark" as const,
    accent_color: "#36d1dc",
  },
};

const baseStorage = [
  {
    provider: "fixture" as const,
    uri: "fixture://profile-native-cms/punk6529",
    pinned: true,
  },
];

const galleryPayload: CmsPayload = {
  schema: CMS_PAYLOAD_SCHEMA,
  site: baseSite,
  page: {
    id: "page-wallet-gallery",
    title: "Collected Signals",
    description:
      "A wallet-native gallery page composed from stable NFT snapshots and collection context.",
    slug_path: "",
    static_export_path: "/punk6529/index.html",
    canonical_url: "https://6529.io/punk6529/index.html",
    page_type: "gallery",
    social: {
      title: "Collected Signals by punk6529",
      description:
        "A profile-native gallery with package hashes, collection context, and share-ready media.",
      canonical_url: "https://6529.io/punk6529/index.html",
      open_graph_image: {
        url: "/nakamoto-card-og.png",
        width: 1200,
        height: 630,
        alt: "6529 Nakamoto card social preview",
      },
      square_image: {
        url: "/memes-preview.png",
        width: 1200,
        height: 1200,
        alt: "The Memes preview",
      },
    },
    created_at: FIXTURE_TIMESTAMP,
    updated_at: FIXTURE_TIMESTAMP,
  },
  assets: [
    {
      id: "asset-memes",
      kind: "image",
      src: "/memes-preview.png",
      alt: "The Memes collection preview",
      title: "The Memes",
      caption: "A 6529-native collection with cultural context packets.",
      width: 1200,
      height: 630,
      mime_type: "image/png",
    },
    {
      id: "asset-gradients",
      kind: "image",
      src: "/gradients-preview.png",
      alt: "6529 Gradient collection preview",
      title: "6529 Gradients",
      caption: "Color-native identity primitives.",
      width: 1200,
      height: 630,
      mime_type: "image/png",
    },
    {
      id: "asset-nextgen",
      kind: "image",
      src: "/nextgen.png",
      alt: "NextGen collection preview",
      title: "NextGen",
      caption: "Generative collections with first-party exhibition packs.",
      width: 1200,
      height: 630,
      mime_type: "image/png",
    },
    {
      id: "asset-nakamoto",
      kind: "image",
      src: "/nakamoto-card-og.png",
      alt: "Nakamoto Freedom card preview",
      title: "Nakamoto Freedom",
      width: 1200,
      height: 630,
      mime_type: "image/png",
    },
  ],
  blocks: [
    {
      id: "heading-hero",
      type: "heading",
      level: 2,
      eyebrow: "Profile-native CMS",
      text: "Portable gallery package",
    },
    {
      id: "intro",
      type: "rich_text",
      paragraphs: [
        "This page is rendered from a portable CMS package, not from mutable page-specific React code.",
        "The hosted site can accelerate it, but the package carries the page, assets, provenance, route, social metadata, hashes, and signature envelope that alternative clients need.",
      ],
    },
    {
      id: "wallet-gallery",
      type: "generated_wallet_gallery",
      title: "Wallet gallery snapshot",
      wallets: ["0x0000000000000000000000000000000000006529"],
      snapshot: {
        captured_at: FIXTURE_TIMESTAMP,
        block_number: 22500000,
      },
      stats: [
        { label: "Collections", value: "3" },
        { label: "Featured works", value: "48" },
        { label: "Storage", value: "Package-ready" },
      ],
      collections: [
        {
          title: "The Memes",
          count: 25,
          asset_id: "asset-memes",
          href: "/punk6529/collections/the-memes/index.html",
        },
        {
          title: "6529 Gradients",
          count: 12,
          asset_id: "asset-gradients",
          href: "/punk6529/collections/6529-gradients/index.html",
        },
        {
          title: "NextGen",
          count: 11,
          asset_id: "asset-nextgen",
          href: "/punk6529/collections/nextgen/index.html",
        },
      ],
    },
    {
      id: "collection-context",
      type: "collection_reference",
      chain_id: 1,
      contract: "0x33fd426905f149f8376e227d0c9d3340aaD17aF1",
      title: "The Memes",
      summary:
        "A collection page can include curated knowledge packet context while preserving the packet id, version, and hash used at publish time.",
      asset_id: "asset-memes",
      knowledge_packet: {
        id: "6529.collections.the-memes",
        version: "0.1.0",
        hash: "sha256:80970f50d80f6384c59929e9ac4587d7db904ec2b22580b589b6f44c807d4f85",
      },
    },
    {
      id: "featured-card",
      type: "nft_reference",
      chain_id: 1,
      contract: "0x33fd426905f149f8376e227d0c9d3340aaD17aF1",
      token_id: "1",
      title: "Nakamoto Freedom",
      collection: "The Memes",
      creator: "6529er",
      asset_id: "asset-nakamoto",
      snapshot: {
        owner: "0x0000000000000000000000000000000000006529",
        block_number: 22500000,
        captured_at: FIXTURE_TIMESTAMP,
      },
    },
    {
      id: "durability-callout",
      type: "callout",
      tone: "evidence",
      title: "Launch centralized, publish decentralized-shaped",
      body: "Authoring can start in the hosted app. Published pages should already be deterministic packages with storage receipts and stable hashes.",
    },
  ],
  provenance: {
    source: "fixture",
    builder_version: "profile-native-cms-fixture-0.1.0",
    notes: [
      "Fixture proves the renderer can work without authoring API state.",
      "Wallet gallery blocks are snapshot based so mirrors can render offline.",
    ],
  },
};

const transactionPayload: CmsPayload = {
  ...galleryPayload,
  page: {
    ...galleryPayload.page,
    id: "page-transaction-explainer",
    title: "Transaction That Reads Like English",
    description:
      "A block explorer style CMS page that explains what happened before showing raw chain facts.",
    slug_path: "transaction-explainer",
    static_export_path: "/punk6529/transaction-explainer/index.html",
    canonical_url: "https://6529.io/punk6529/transaction-explainer/index.html",
    page_type: "page",
    social: {
      ...galleryPayload.page.social,
      title: "Transaction That Reads Like English",
      description:
        "A human-readable transaction page with immutable chain snapshot data.",
      canonical_url:
        "https://6529.io/punk6529/transaction-explainer/index.html",
    },
  },
  blocks: [
    {
      id: "heading-transaction",
      type: "heading",
      level: 2,
      eyebrow: "Chain evidence block",
      text: "A transaction page should explain the event first",
    },
    {
      id: "tx-intro",
      type: "rich_text",
      paragraphs: [
        "Block explorers show facts but rarely explain meaning. CMS transaction blocks should keep raw facts visible while giving readers the plain-English story.",
      ],
    },
    {
      id: "tx-ref",
      type: "transaction_reference",
      chain_id: 1,
      hash: "0x6529652965296529652965296529652965296529652965296529652965296529",
      block_number: 22500000,
      timestamp: FIXTURE_TIMESTAMP,
      summary:
        "The wallet transferred a 6529 Meme Card to a new collecting wallet and paid normal Ethereum gas.",
      from: "0x0000000000000000000000000000000000006529",
      to: "0x0000000000000000000000000000000000000001",
      value_eth: "0",
      actions: [
        "Confirmed the sender wallet.",
        "Transferred The Memes token #1.",
        "Recorded block number, timestamp, and chain id in the package.",
      ],
    },
    {
      id: "raw-facts",
      type: "callout",
      tone: "note",
      title: "Snapshot, not live dependency",
      body: "A live overlay can refresh status later, but the published page must still render from the captured chain snapshot.",
    },
  ],
  provenance: {
    source: "fixture",
    builder_version: "profile-native-cms-fixture-0.1.0",
    notes: ["Transaction fixture keeps explanation and raw evidence together."],
  },
};

export const cmsFixturePackages = {
  gallery: buildCmsPackage({
    payload: galleryPayload,
    signature: fixtureSignature,
    storage: baseStorage,
  }),
  transaction: buildCmsPackage({
    payload: transactionPayload,
    signature: fixtureSignature,
    storage: [
      {
        provider: "fixture",
        uri: "fixture://profile-native-cms/transaction",
        pinned: true,
      },
    ],
  }),
} satisfies Record<string, CmsPublishedPackage>;

export type CmsFixtureSlug = keyof typeof cmsFixturePackages;

export const cmsFixtureSlugs = Object.keys(
  cmsFixturePackages
) as CmsFixtureSlug[];

function isCmsFixtureSlug(slug: string): slug is CmsFixtureSlug {
  return Object.prototype.hasOwnProperty.call(cmsFixturePackages, slug);
}

export function getCmsFixturePackage(slug: string): CmsPublishedPackage | null {
  return isCmsFixtureSlug(slug) ? cmsFixturePackages[slug] : null;
}
