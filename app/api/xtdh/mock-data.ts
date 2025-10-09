import {
  type XtdhAllocationHolderSummary,
  type XtdhEcosystemCollection,
  type XtdhEcosystemCollectionsResponse,
  type XtdhEcosystemToken,
  type XtdhEcosystemTokensResponse,
  type XtdhGranter,
  type XtdhOverviewStats,
} from "@/types/xtdh";

const AVATAR_BASE_URL = "https://i.pravatar.cc/120";
const IMAGE_BASE_URL = "https://picsum.photos/seed";

function avatarUrl(seed: string): string {
  return `${AVATAR_BASE_URL}?u=${encodeURIComponent(seed)}`;
}

function imageUrl(seed: string, width = 320, height = 320): string {
  return `${IMAGE_BASE_URL}/${encodeURIComponent(seed)}/${width}/${height}`;
}

function daysAgoToIso(daysAgo: number): string {
  const msInDay = 86_400_000;
  const date = new Date(Date.now() - daysAgo * msInDay);
  return date.toISOString();
}

interface RawGranter {
  readonly profileId: string;
  readonly displayName: string;
  readonly rate: number;
}

interface RawHolder {
  readonly profileId: string;
  readonly displayName: string;
  readonly tokenCount: number;
  readonly xtdhEarned: number;
  readonly lastEarnedDaysAgo: number;
}

interface RawCollectionMeta {
  readonly collectionId: string;
  readonly collectionName: string;
  readonly collectionSlug: string;
  readonly description: string;
  readonly blockchain: "ethereum";
  readonly contractAddress: string;
  readonly tokenStandard: "ERC721" | "ERC1155";
  readonly tokenCount: number;
  readonly imageSeed: string;
}

interface RawTokenRecord {
  readonly tokenId: string;
  readonly tokenName: string;
  readonly tokenImageSeed: string;
  readonly xtdhRate: number;
  readonly totalAllocated: number;
  readonly lastAllocatedDaysAgo: number;
  readonly granters: RawGranter[];
  readonly holders: RawHolder[];
}

interface RawCollectionRecord extends RawCollectionMeta {
  readonly receivingTokens: RawTokenRecord[];
}

const RAW_COLLECTIONS: RawCollectionRecord[] = [
  {
    collectionId: "memes",
    collectionName: "The Memes of Production",
    collectionSlug: "the-memes",
    description:
      "Community-curated cultural artifacts where holders experiment with decentralized coordination.",
    blockchain: "ethereum",
    contractAddress: "0x6529c5f88a2f5f0d8d1a2f2c0ab574b9d51a90ef",
    tokenStandard: "ERC721",
    tokenCount: 6529,
    imageSeed: "xtdh-memes",
    receivingTokens: [
      {
        tokenId: "1",
        tokenName: "GM District #1",
        tokenImageSeed: "xtdh-memes-1",
        xtdhRate: 540,
        totalAllocated: 540,
        lastAllocatedDaysAgo: 1,
        granters: [
          { profileId: "gm6529", displayName: "GM 6529", rate: 160 },
          { profileId: "punk3167", displayName: "punk3167", rate: 120 },
          { profileId: "gradientqueen", displayName: "Gradient Queen", rate: 95 },
          { profileId: "pixelpioneer", displayName: "Pixel Pioneer", rate: 70 },
          { profileId: "data_degen", displayName: "Data Degen", rate: 48 },
        ],
        holders: [
          {
            profileId: "artguy",
            displayName: "Art Blocksmith",
            tokenCount: 2,
            xtdhEarned: 420,
            lastEarnedDaysAgo: 1,
          },
          {
            profileId: "curation_station",
            displayName: "Curation Station",
            tokenCount: 1,
            xtdhEarned: 280,
            lastEarnedDaysAgo: 2,
          },
        ],
      },
      {
        tokenId: "2",
        tokenName: "Open Edition Rally",
        tokenImageSeed: "xtdh-memes-2",
        xtdhRate: 320,
        totalAllocated: 320,
        lastAllocatedDaysAgo: 4,
        granters: [
          { profileId: "gm6529", displayName: "GM 6529", rate: 100 },
          { profileId: "punk3167", displayName: "punk3167", rate: 70 },
          { profileId: "futurefunk", displayName: "Future Funk", rate: 55 },
          { profileId: "zenwhale", displayName: "Zen Whale", rate: 40 },
        ],
        holders: [
          {
            profileId: "curation_station",
            displayName: "Curation Station",
            tokenCount: 1,
            xtdhEarned: 160,
            lastEarnedDaysAgo: 3,
          },
          {
            profileId: "meme_federation",
            displayName: "Meme Federation",
            tokenCount: 3,
            xtdhEarned: 220,
            lastEarnedDaysAgo: 1,
          },
        ],
      },
      {
        tokenId: "6529",
        tokenName: "Decentralize or Die",
        tokenImageSeed: "xtdh-memes-6529",
        xtdhRate: 680,
        totalAllocated: 720,
        lastAllocatedDaysAgo: 0.4,
        granters: [
          { profileId: "gm6529", displayName: "GM 6529", rate: 220 },
          { profileId: "punk3167", displayName: "punk3167", rate: 120 },
          { profileId: "gradientqueen", displayName: "Gradient Queen", rate: 105 },
          { profileId: "chainmage", displayName: "Chain Mage", rate: 80 },
          { profileId: "lumenloop", displayName: "Lumen Loop", rate: 65 },
          { profileId: "futurefunk", displayName: "Future Funk", rate: 45 },
        ],
        holders: [
          {
            profileId: "alpha_vault",
            displayName: "Alpha Vault",
            tokenCount: 1,
            xtdhEarned: 520,
            lastEarnedDaysAgo: 0.3,
          },
        ],
      },
    ],
  },
  {
    collectionId: "gradient",
    collectionName: "6529 Gradient",
    collectionSlug: "6529-gradient",
    description:
      "A study in long-form gradients exploring color theory and collector collaboration.",
    blockchain: "ethereum",
    contractAddress: "0x6529b4ab815af9b55de5d65de7f39744f0bf1043",
    tokenStandard: "ERC721",
    tokenCount: 4000,
    imageSeed: "xtdh-gradient",
    receivingTokens: [
      {
        tokenId: "144",
        tokenName: "Spectrum Pulse",
        tokenImageSeed: "xtdh-gradient-144",
        xtdhRate: 460,
        totalAllocated: 480,
        lastAllocatedDaysAgo: 2,
        granters: [
          { profileId: "gradientqueen", displayName: "Gradient Queen", rate: 180 },
          { profileId: "colorwave", displayName: "Colorwave", rate: 110 },
          { profileId: "pixelpioneer", displayName: "Pixel Pioneer", rate: 75 },
          { profileId: "moonmath", displayName: "Moon Math", rate: 65 },
        ],
        holders: [
          {
            profileId: "chromaticdao",
            displayName: "Chromatic DAO",
            tokenCount: 2,
            xtdhEarned: 360,
            lastEarnedDaysAgo: 2,
          },
          {
            profileId: "gradientsyndicate",
            displayName: "Gradient Syndicate",
            tokenCount: 1,
            xtdhEarned: 120,
            lastEarnedDaysAgo: 1,
          },
        ],
      },
      {
        tokenId: "256",
        tokenName: "Azure Horizon",
        tokenImageSeed: "xtdh-gradient-256",
        xtdhRate: 300,
        totalAllocated: 300,
        lastAllocatedDaysAgo: 6,
        granters: [
          { profileId: "gradientqueen", displayName: "Gradient Queen", rate: 120 },
          { profileId: "colorwave", displayName: "Colorwave", rate: 90 },
          { profileId: "pixelpioneer", displayName: "Pixel Pioneer", rate: 60 },
        ],
        holders: [
          {
            profileId: "gradientsyndicate",
            displayName: "Gradient Syndicate",
            tokenCount: 1,
            xtdhEarned: 90,
            lastEarnedDaysAgo: 5,
          },
        ],
      },
    ],
  },
  {
    collectionId: "memelab",
    collectionName: "Meme Lab",
    collectionSlug: "meme-lab",
    description:
      "Experimental editions from emerging artists testing the edges of meme culture.",
    blockchain: "ethereum",
    contractAddress: "0x1ab476c23c95cb7563d5a6c54ce93cf96427f1f3",
    tokenStandard: "ERC1155",
    tokenCount: 420,
    imageSeed: "xtdh-memelab",
    receivingTokens: [
      {
        tokenId: "12",
        tokenName: "On-Chain Remix Pack",
        tokenImageSeed: "xtdh-memelab-12",
        xtdhRate: 210,
        totalAllocated: 210,
        lastAllocatedDaysAgo: 5,
        granters: [
          { profileId: "gm6529", displayName: "GM 6529", rate: 60 },
          { profileId: "remixer", displayName: "Remixer", rate: 55 },
          { profileId: "culturecraft", displayName: "Culture Craft", rate: 40 },
        ],
        holders: [
          {
            profileId: "remixer",
            displayName: "Remixer",
            tokenCount: 8,
            xtdhEarned: 120,
            lastEarnedDaysAgo: 3,
          },
          {
            profileId: "culturecraft",
            displayName: "Culture Craft",
            tokenCount: 5,
            xtdhEarned: 90,
            lastEarnedDaysAgo: 5,
          },
        ],
      },
      {
        tokenId: "77",
        tokenName: "Anatomy of a Meme",
        tokenImageSeed: "xtdh-memelab-77",
        xtdhRate: 180,
        totalAllocated: 180,
        lastAllocatedDaysAgo: 9,
        granters: [
          { profileId: "punk3167", displayName: "punk3167", rate: 60 },
          { profileId: "culturecraft", displayName: "Culture Craft", rate: 45 },
          { profileId: "futurefunk", displayName: "Future Funk", rate: 40 },
        ],
        holders: [
          {
            profileId: "culturecraft",
            displayName: "Culture Craft",
            tokenCount: 3,
            xtdhEarned: 96,
            lastEarnedDaysAgo: 7,
          },
          {
            profileId: "open_meme",
            displayName: "Open Meme Collective",
            tokenCount: 4,
            xtdhEarned: 102,
            lastEarnedDaysAgo: 8,
          },
        ],
      },
    ],
  },
  {
    collectionId: "glitchdreams",
    collectionName: "Glitch Dreams",
    collectionSlug: "glitch-dreams",
    description:
      "Early adopter curated set featuring cross-chain experimental glitch art collaborations.",
    blockchain: "ethereum",
    contractAddress: "0x934bd3af10bd8c75a785dcf4e0d4fd720c3d1ae1",
    tokenStandard: "ERC1155",
    tokenCount: 1024,
    imageSeed: "xtdh-glitch-dreams",
    receivingTokens: [
      {
        tokenId: "88",
        tokenName: "Prismatic Bloom",
        tokenImageSeed: "xtdh-glitch-88",
        xtdhRate: 260,
        totalAllocated: 260,
        lastAllocatedDaysAgo: 1.5,
        granters: [
          { profileId: "polygonpioneer", displayName: "Polygon Pioneer", rate: 120 },
          { profileId: "colorwave", displayName: "Colorwave", rate: 80 },
          { profileId: "futurefunk", displayName: "Future Funk", rate: 60 },
        ],
        holders: [
          {
            profileId: "glitchguild",
            displayName: "Glitch Guild",
            tokenCount: 12,
            xtdhEarned: 180,
            lastEarnedDaysAgo: 1,
          },
          {
            profileId: "polycollector",
            displayName: "Poly Collector",
            tokenCount: 6,
            xtdhEarned: 130,
            lastEarnedDaysAgo: 2,
          },
        ],
      },
      {
        tokenId: "205",
        tokenName: "Async Refraction",
        tokenImageSeed: "xtdh-glitch-205",
        xtdhRate: 190,
        totalAllocated: 210,
        lastAllocatedDaysAgo: 3,
        granters: [
          { profileId: "polygonpioneer", displayName: "Polygon Pioneer", rate: 95 },
          { profileId: "zenwhale", displayName: "Zen Whale", rate: 55 },
          { profileId: "culturecraft", displayName: "Culture Craft", rate: 40 },
        ],
        holders: [
          {
            profileId: "polycollector",
            displayName: "Poly Collector",
            tokenCount: 10,
            xtdhEarned: 140,
            lastEarnedDaysAgo: 2,
          },
          {
            profileId: "asyncdao",
            displayName: "Async DAO",
            tokenCount: 5,
            xtdhEarned: 90,
            lastEarnedDaysAgo: 3,
          },
        ],
      },
    ],
  },
];

function toGranter(raw: RawGranter): XtdhGranter {
  return {
    profileId: raw.profileId,
    displayName: raw.displayName,
    profileImage: avatarUrl(raw.profileId),
    xtdhRateGranted: raw.rate,
  };
}

function toHolder(raw: RawHolder): XtdhAllocationHolderSummary {
  return {
    profileId: raw.profileId,
    displayName: raw.displayName,
    profileImage: avatarUrl(raw.profileId),
    tokenCount: raw.tokenCount,
    xtdhEarned: raw.xtdhEarned,
    lastEarnedAt: daysAgoToIso(raw.lastEarnedDaysAgo),
  };
}

const ECOSYSTEM_TOKENS: XtdhEcosystemToken[] = RAW_COLLECTIONS.flatMap(
  (collection) =>
    collection.receivingTokens.map((token) => {
      const granters = token.granters.map(toGranter);
      const topGrantors = [...granters].sort(
        (a, b) => b.xtdhRateGranted - a.xtdhRateGranted
      );

      return {
        collectionId: collection.collectionId,
        collectionName: collection.collectionName,
        collectionImage: imageUrl(collection.imageSeed),
        collectionSlug: collection.collectionSlug,
        blockchain: collection.blockchain,
        contractAddress: collection.contractAddress,
        tokenStandard: collection.tokenStandard,
        tokenId: token.tokenId,
        tokenName: token.tokenName,
        tokenImage: imageUrl(token.tokenImageSeed, 240, 240),
        xtdhRate: token.xtdhRate,
        totalXtdhAllocated: token.totalAllocated,
        grantorCount: granters.length,
        topGrantors: topGrantors.slice(0, 3),
        granters,
        holderSummaries: token.holders.map(toHolder),
        lastAllocatedAt: daysAgoToIso(token.lastAllocatedDaysAgo),
      } satisfies XtdhEcosystemToken;
    })
);

function mergeHolders(
  base: Map<string, XtdhAllocationHolderSummary>,
  holders: XtdhAllocationHolderSummary[]
) {
  for (const holder of holders) {
    const existing = base.get(holder.profileId);
    if (!existing) {
      base.set(holder.profileId, { ...holder });
      continue;
    }

    const combinedTokens = existing.tokenCount + holder.tokenCount;
    const combinedEarned = existing.xtdhEarned + holder.xtdhEarned;
    const latestEarned =
      new Date(holder.lastEarnedAt).getTime() >
      new Date(existing.lastEarnedAt).getTime()
        ? holder.lastEarnedAt
        : existing.lastEarnedAt;

    base.set(holder.profileId, {
      ...existing,
      tokenCount: combinedTokens,
      xtdhEarned: combinedEarned,
      lastEarnedAt: latestEarned,
    });
  }
}

function aggregateCollections(
  tokens: XtdhEcosystemToken[]
): XtdhEcosystemCollection[] {
  const grouped = new Map<string, XtdhEcosystemToken[]>();

  for (const token of tokens) {
    const existing = grouped.get(token.collectionId);
    if (existing) {
      existing.push(token);
    } else {
      grouped.set(token.collectionId, [token]);
    }
  }

  return Array.from(grouped.entries()).map(([collectionId, collectionTokens]) => {
    const meta = RAW_COLLECTIONS.find((item) => item.collectionId === collectionId);
    if (!meta) {
      throw new Error(`Missing metadata for collection ${collectionId}`);
    }

    let totalRate = 0;
    let totalAllocated = 0;
    let grantCount = 0;
    let latestAllocation = collectionTokens[0]?.lastAllocatedAt ?? daysAgoToIso(365);

    const granterAggregate = new Map<string, XtdhGranter>();
    const holderAggregate = new Map<string, XtdhAllocationHolderSummary>();

    for (const token of collectionTokens) {
      totalRate += token.xtdhRate;
      totalAllocated += token.totalXtdhAllocated;
      grantCount += token.granters.length;

      if (
        new Date(token.lastAllocatedAt).getTime() >
        new Date(latestAllocation).getTime()
      ) {
        latestAllocation = token.lastAllocatedAt;
      }

      for (const granter of token.granters) {
        const existing = granterAggregate.get(granter.profileId);
        if (!existing) {
          granterAggregate.set(granter.profileId, { ...granter });
        } else {
          granterAggregate.set(granter.profileId, {
            ...existing,
            xtdhRateGranted: existing.xtdhRateGranted + granter.xtdhRateGranted,
          });
        }
      }

      mergeHolders(holderAggregate, token.holderSummaries);
    }

    const granters = Array.from(granterAggregate.values()).sort(
      (a, b) => b.xtdhRateGranted - a.xtdhRateGranted
    );

    const holders = Array.from(holderAggregate.values()).sort(
      (a, b) => b.xtdhEarned - a.xtdhEarned
    );

    const receivingTokenCount = collectionTokens.length;

    return {
      collectionId: meta.collectionId,
      collectionName: meta.collectionName,
      collectionImage: imageUrl(meta.imageSeed),
      collectionSlug: meta.collectionSlug,
      description: meta.description,
      blockchain: meta.blockchain,
      contractAddress: meta.contractAddress,
      tokenStandard: meta.tokenStandard,
      tokenCount: meta.tokenCount,
      receivingTokenCount,
      totalXtdhRate: totalRate,
      totalXtdhAllocated: totalAllocated,
      grantorCount: granters.length,
      grantCount,
      topGrantors: granters.slice(0, 5),
      granters,
      holderSummaries: holders,
      tokens: collectionTokens.sort(
        (a, b) => b.xtdhRate - a.xtdhRate || a.tokenName.localeCompare(b.tokenName)
      ),
      lastAllocatedAt: latestAllocation,
      lastUpdatedAt: latestAllocation,
    } satisfies XtdhEcosystemCollection;
  });
}

const ECOSYSTEM_COLLECTIONS = aggregateCollections(ECOSYSTEM_TOKENS);

function buildGrantorDirectory(): XtdhGranter[] {
  const map = new Map<string, XtdhGranter>();

  for (const collection of ECOSYSTEM_COLLECTIONS) {
    for (const granter of collection.granters) {
      const existing = map.get(granter.profileId);
      if (existing) {
        map.set(granter.profileId, {
          ...existing,
          xtdhRateGranted: existing.xtdhRateGranted + granter.xtdhRateGranted,
        });
      } else {
        map.set(granter.profileId, granter);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
}

const AVAILABLE_GRANTORS = buildGrantorDirectory();
const NETWORK_ALLOWLIST = new Set(["ethereum"]);
const AVAILABLE_NETWORKS = (() => {
  const derived = Array.from(
    new Set(ECOSYSTEM_COLLECTIONS.map((collection) => collection.blockchain))
  ).filter((network) => NETWORK_ALLOWLIST.has(network.toLowerCase()));

  if (derived.length > 0) {
    return derived.sort();
  }

  return Array.from(NETWORK_ALLOWLIST);
})();

export interface CollectionQueryOptions {
  readonly page: number;
  readonly pageSize: number;
  readonly sort: "total_rate" | "total_allocated" | "grantors";
  readonly dir: "asc" | "desc";
  readonly networks: string[];
  readonly minRate?: number;
  readonly minGrantors?: number;
  readonly grantorProfileId?: string | null;
  readonly holderProfileId?: string | null;
}

export interface TokenQueryOptions {
  readonly page: number;
  readonly pageSize: number;
  readonly sort: "rate" | "total_allocated" | "grantors";
  readonly dir: "asc" | "desc";
  readonly networks: string[];
  readonly minRate?: number;
  readonly minGrantors?: number;
  readonly grantorProfileId?: string | null;
  readonly holderProfileId?: string | null;
}

function filterCollections(
  items: XtdhEcosystemCollection[],
  options: CollectionQueryOptions
): XtdhEcosystemCollection[] {
  return items
    .filter((collection) => {
      if (
        options.networks.length > 0 &&
        !options.networks.includes(collection.blockchain)
      ) {
        return false;
      }

      if (
        typeof options.minRate === "number" &&
        collection.totalXtdhRate < options.minRate
      ) {
        return false;
      }

      if (
        typeof options.minGrantors === "number" &&
        collection.grantorCount < options.minGrantors
      ) {
        return false;
      }

      if (
        options.grantorProfileId &&
        !collection.granters.some(
          (granter) =>
            granter.profileId.toLowerCase() ===
            options.grantorProfileId?.toLowerCase()
        )
      ) {
        return false;
      }

      if (
        options.holderProfileId &&
        !collection.holderSummaries.some(
          (holder) =>
            holder.profileId.toLowerCase() ===
            options.holderProfileId?.toLowerCase()
        )
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const direction = options.dir === "asc" ? 1 : -1;

      switch (options.sort) {
        case "grantors":
          if (a.grantorCount === b.grantorCount) {
            return (
              (a.totalXtdhRate - b.totalXtdhRate) * direction ||
              a.collectionName.localeCompare(b.collectionName) * direction
            );
          }
          return (a.grantorCount - b.grantorCount) * direction;
        case "total_allocated":
          if (a.totalXtdhAllocated === b.totalXtdhAllocated) {
            return (
              (a.totalXtdhRate - b.totalXtdhRate) * direction ||
              a.collectionName.localeCompare(b.collectionName) * direction
            );
          }
          return (a.totalXtdhAllocated - b.totalXtdhAllocated) * direction;
        case "total_rate":
        default:
          if (a.totalXtdhRate === b.totalXtdhRate) {
            return (
              (new Date(a.lastAllocatedAt).getTime() -
                new Date(b.lastAllocatedAt).getTime()) *
                direction ||
              a.collectionName.localeCompare(b.collectionName) * direction
            );
          }
          return (a.totalXtdhRate - b.totalXtdhRate) * direction;
      }
    });
}

function filterTokens(
  items: XtdhEcosystemToken[],
  options: TokenQueryOptions
): XtdhEcosystemToken[] {
  return items
    .filter((token) => {
      if (options.networks.length > 0 && !options.networks.includes(token.blockchain)) {
        return false;
      }

      if (
        typeof options.minRate === "number" &&
        token.xtdhRate < options.minRate
      ) {
        return false;
      }

      if (
        typeof options.minGrantors === "number" &&
        token.grantorCount < options.minGrantors
      ) {
        return false;
      }

      if (
        options.grantorProfileId &&
        !token.granters.some(
          (granter) =>
            granter.profileId.toLowerCase() ===
            options.grantorProfileId?.toLowerCase()
        )
      ) {
        return false;
      }

      if (
        options.holderProfileId &&
        !token.holderSummaries.some(
          (holder) =>
            holder.profileId.toLowerCase() ===
            options.holderProfileId?.toLowerCase()
        )
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const direction = options.dir === "asc" ? 1 : -1;

      switch (options.sort) {
        case "grantors":
          if (a.grantorCount === b.grantorCount) {
            return (
              (a.xtdhRate - b.xtdhRate) * direction ||
              a.tokenName.localeCompare(b.tokenName) * direction
            );
          }
          return (a.grantorCount - b.grantorCount) * direction;
        case "total_allocated":
          if (a.totalXtdhAllocated === b.totalXtdhAllocated) {
            return (
              (a.xtdhRate - b.xtdhRate) * direction ||
              a.tokenName.localeCompare(b.tokenName) * direction
            );
          }
          return (a.totalXtdhAllocated - b.totalXtdhAllocated) * direction;
        case "rate":
        default:
          if (a.xtdhRate === b.xtdhRate) {
            return (
              (new Date(a.lastAllocatedAt).getTime() -
                new Date(b.lastAllocatedAt).getTime()) *
                direction ||
              a.tokenName.localeCompare(b.tokenName) * direction
            );
          }
          return (a.xtdhRate - b.xtdhRate) * direction;
      }
    });
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function getCollectionsResponse(
  options: CollectionQueryOptions
): XtdhEcosystemCollectionsResponse {
  const filtered = filterCollections(ECOSYSTEM_COLLECTIONS, options);
  const paged = paginate(filtered, options.page, options.pageSize);

  return {
    collections: paged,
    totalCount: filtered.length,
    page: options.page,
    pageSize: options.pageSize,
    availableFilters: {
      networks: AVAILABLE_NETWORKS,
      grantors: AVAILABLE_GRANTORS,
    },
  };
}

export function getTokensResponse(
  options: TokenQueryOptions
): XtdhEcosystemTokensResponse {
  const filtered = filterTokens(ECOSYSTEM_TOKENS, options);
  const paged = paginate(filtered, options.page, options.pageSize);

  return {
    tokens: paged,
    totalCount: filtered.length,
    page: options.page,
    pageSize: options.pageSize,
    availableFilters: {
      networks: AVAILABLE_NETWORKS,
      grantors: AVAILABLE_GRANTORS,
    },
  };
}

export function getOverviewStats(): XtdhOverviewStats {
  const totalCollections = ECOSYSTEM_COLLECTIONS.length;
  const totalTokens = ECOSYSTEM_TOKENS.length;

  const totalGrantors = new Set(
    ECOSYSTEM_TOKENS.flatMap((token) =>
      token.granters.map((granter) => granter.profileId)
    )
  ).size;

  const totalXtdhRate = ECOSYSTEM_TOKENS.reduce(
    (sum, token) => sum + token.xtdhRate,
    0
  );

  const totalXtdhAllocated = ECOSYSTEM_TOKENS.reduce(
    (sum, token) => sum + token.totalXtdhAllocated,
    0
  );

  const totalActiveAllocations = ECOSYSTEM_TOKENS.reduce(
    (sum, token) => sum + token.granters.length,
    0
  );

  const currentMultiplier = 0.1;
  const totalBaseTdhRate =
    currentMultiplier > 0 ? totalXtdhRate / currentMultiplier : 0;

  const totalAvailableCapacity = Math.max(totalXtdhRate - totalXtdhAllocated, 0);

  const totalNetworkXtdh = ECOSYSTEM_TOKENS.reduce((sum, token) => {
    const tokenTotal = token.holderSummaries.reduce(
      (holderSum, holder) => holderSum + holder.xtdhEarned,
      0
    );
    return sum + tokenTotal;
  }, 0);

  const multiplierNextValue = 0.12;
  const multiplierNextIncreaseDate = "in 30 days";
  const multiplierMilestones = [
    { percentage: 30, timeframe: "36 months" },
    { percentage: 100, timeframe: "120 months" },
  ] as const;

  const lastUpdatedAt = ECOSYSTEM_TOKENS.reduce((latest, token) => {
    const current = new Date(token.lastAllocatedAt).getTime();
    return current > latest ? current : latest;
  }, 0);

  return {
    network: {
      totalDailyCapacity: totalXtdhRate,
      totalAllocated: totalXtdhAllocated,
      totalAvailable: totalAvailableCapacity,
      baseTdhRate: totalBaseTdhRate,
      activeAllocations: totalActiveAllocations,
      grantors: totalGrantors,
      collections: totalCollections,
      tokens: totalTokens,
      totalXtdh: totalNetworkXtdh,
    },
    multiplier: {
      current: currentMultiplier,
      nextValue: multiplierNextValue,
      nextIncreaseDate: multiplierNextIncreaseDate,
      milestones: multiplierMilestones,
    },
    lastUpdatedAt: new Date(lastUpdatedAt).toISOString(),
  };
}
