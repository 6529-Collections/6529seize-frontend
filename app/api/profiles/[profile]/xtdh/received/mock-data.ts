import {
  type XtdhGranter,
  type XtdhReceivedCollectionOption,
  type XtdhReceivedCollectionSummary,
  type XtdhReceivedNft,
  type XtdhReceivedToken,
} from "@/types/xtdh";

const AVATAR_BASE_URL = "https://i.pravatar.cc/120";
const IMAGE_BASE_URL = "https://picsum.photos/seed";

function avatarUrl(seed: string): string {
  return `${AVATAR_BASE_URL}?u=${encodeURIComponent(seed)}`;
}

function imageUrl(seed: string, size: number = 240): string {
  return `${IMAGE_BASE_URL}/${encodeURIComponent(seed)}/${size}/${size}`;
}

function createGranter(
  profileId: string,
  displayName: string,
  xtdhRateGranted: number
): XtdhGranter {
  return {
    profileId,
    displayName,
    profileImage: avatarUrl(profileId),
    xtdhRateGranted,
  };
}

interface BaseTokenData {
  readonly collectionId: string;
  readonly collectionName: string;
  readonly collectionImage: string;
  readonly tokenId: string;
  readonly tokenName: string;
  readonly tokenImage: string;
  readonly xtdhRate: number;
  readonly totalXtdhReceived: number;
  readonly granters: XtdhGranter[];
}

const DEFAULT_TOKENS: BaseTokenData[] = [
  {
    collectionId: "memes",
    collectionName: "The Memes of Production",
    collectionImage: imageUrl("memes-collection", 320),
    tokenId: "memes-001",
    tokenName: "GM District #1",
    tokenImage: imageUrl("memes-001"),
    xtdhRate: 420,
    totalXtdhReceived: 12890,
    granters: [
      createGranter("punk6529", "punk6529", 120),
      createGranter("simo", "simo", 80),
      createGranter("artguy", "Art Blocksmith", 45),
      createGranter("test1234", "test1234", 60),
      createGranter("metaverse_monk", "Metaverse Monk", 30),
      createGranter("cryptofox", "Crypto Fox", 25),
      createGranter("zenwhale", "Zen Whale", 28),
      createGranter("pixelpioneer", "Pixel Pioneer", 36),
      createGranter("colorwave", "Colorwave", 22),
      createGranter("chainmage", "Chain Mage", 18),
      createGranter("futurefunk", "Future Funk", 12),
      createGranter("lumenloop", "Lumen Loop", 9),
    ],
  },
  {
    collectionId: "memes",
    collectionName: "The Memes of Production",
    collectionImage: imageUrl("memes-collection", 320),
    tokenId: "memes-002",
    tokenName: "Right Click Share #2",
    tokenImage: imageUrl("memes-002"),
    xtdhRate: 280,
    totalXtdhReceived: 9870,
    granters: [
      createGranter("punk6529", "punk6529", 75),
      createGranter("simo", "simo", 55),
      createGranter("pixelpioneer", "Pixel Pioneer", 30),
      createGranter("colorwave", "Colorwave", 32),
      createGranter("chainmage", "Chain Mage", 26),
      createGranter("frensforever", "Frens Forever", 18),
      createGranter("blockbard", "Block Bard", 20),
      createGranter("moonmath", "Moon Math", 24),
    ],
  },
  {
    collectionId: "memes",
    collectionName: "The Memes of Production",
    collectionImage: imageUrl("memes-collection", 320),
    tokenId: "memes-003",
    tokenName: "Open Edition Rally",
    tokenImage: imageUrl("memes-003"),
    xtdhRate: 150,
    totalXtdhReceived: 6275,
    granters: [
      createGranter("test1234", "test1234", 42),
      createGranter("colorwave", "Colorwave", 30),
      createGranter("data_degen", "Data Degen", 38),
      createGranter("memex", "Meme X", 40),
      createGranter("futurefunk", "Future Funk", 16),
    ],
  },
  {
    collectionId: "memes",
    collectionName: "The Memes of Production",
    collectionImage: imageUrl("memes-collection", 320),
    tokenId: "memes-004",
    tokenName: "Sink or Swim",
    tokenImage: imageUrl("memes-004"),
    xtdhRate: 90,
    totalXtdhReceived: 3240,
    granters: [
      createGranter("zenwhale", "Zen Whale", 30),
      createGranter("metaverse_monk", "Metaverse Monk", 22),
      createGranter("cryptofox", "Crypto Fox", 18),
    ],
  },
  {
    collectionId: "memes",
    collectionName: "The Memes of Production",
    collectionImage: imageUrl("memes-collection", 320),
    tokenId: "memes-005",
    tokenName: "Mfer Energy",
    tokenImage: imageUrl("memes-005"),
    xtdhRate: 510,
    totalXtdhReceived: 15430,
    granters: [
      createGranter("punk6529", "punk6529", 110),
      createGranter("simo", "simo", 80),
      createGranter("artguy", "Art Blocksmith", 50),
      createGranter("test1234", "test1234", 70),
      createGranter("metaverse_monk", "Metaverse Monk", 36),
      createGranter("cryptofox", "Crypto Fox", 34),
      createGranter("zenwhale", "Zen Whale", 44),
      createGranter("pixelpioneer", "Pixel Pioneer", 28),
      createGranter("colorwave", "Colorwave", 32),
      createGranter("chainmage", "Chain Mage", 27),
      createGranter("data_degen", "Data Degen", 22),
      createGranter("moonmath", "Moon Math", 25),
      createGranter("futurefunk", "Future Funk", 18),
      createGranter("lumenloop", "Lumen Loop", 14),
    ],
  },
  {
    collectionId: "memes",
    collectionName: "The Memes of Production",
    collectionImage: imageUrl("memes-collection", 320),
    tokenId: "memes-006",
    tokenName: "Seize Frens",
    tokenImage: imageUrl("memes-006"),
    xtdhRate: 75,
    totalXtdhReceived: 2100,
    granters: [
      createGranter("frensforever", "Frens Forever", 26),
      createGranter("colorwave", "Colorwave", 18),
      createGranter("chainmage", "Chain Mage", 12),
    ],
  },
  {
    collectionId: "gradients",
    collectionName: "6529 Gradient",
    collectionImage: imageUrl("gradients-collection", 320),
    tokenId: "gradients-101",
    tokenName: "Spectrum Pulse",
    tokenImage: imageUrl("gradients-101"),
    xtdhRate: 600,
    totalXtdhReceived: 18250,
    granters: [
      createGranter("test1234", "test1234", 140),
      createGranter("colorwave", "Colorwave", 120),
      createGranter("pixelpioneer", "Pixel Pioneer", 95),
      createGranter("moonmath", "Moon Math", 88),
      createGranter("chainmage", "Chain Mage", 65),
      createGranter("futurefunk", "Future Funk", 45),
      createGranter("blockbard", "Block Bard", 38),
      createGranter("lumenloop", "Lumen Loop", 36),
      createGranter("synth_slinger", "Synth Slinger", 32),
      createGranter("timekeeper", "Time Keeper", 28),
    ],
  },
  {
    collectionId: "gradients",
    collectionName: "6529 Gradient",
    collectionImage: imageUrl("gradients-collection", 320),
    tokenId: "gradients-102",
    tokenName: "Azure Horizon",
    tokenImage: imageUrl("gradients-102"),
    xtdhRate: 310,
    totalXtdhReceived: 8650,
    granters: [
      createGranter("test1234", "test1234", 90),
      createGranter("colorwave", "Colorwave", 72),
      createGranter("pixelpioneer", "Pixel Pioneer", 44),
      createGranter("moonmath", "Moon Math", 50),
      createGranter("timekeeper", "Time Keeper", 36),
      createGranter("lumenloop", "Lumen Loop", 28),
    ],
  },
  {
    collectionId: "gradients",
    collectionName: "6529 Gradient",
    collectionImage: imageUrl("gradients-collection", 320),
    tokenId: "gradients-103",
    tokenName: "Violet Drift",
    tokenImage: imageUrl("gradients-103"),
    xtdhRate: 270,
    totalXtdhReceived: 7430,
    granters: [
      createGranter("test1234", "test1234", 78),
      createGranter("pixelpioneer", "Pixel Pioneer", 54),
      createGranter("moonmath", "Moon Math", 38),
      createGranter("synth_slinger", "Synth Slinger", 36),
      createGranter("futurefunk", "Future Funk", 32),
      createGranter("lumenloop", "Lumen Loop", 24),
    ],
  },
  {
    collectionId: "gradients",
    collectionName: "6529 Gradient",
    collectionImage: imageUrl("gradients-collection", 320),
    tokenId: "gradients-104",
    tokenName: "Neon Cascade",
    tokenImage: imageUrl("gradients-104"),
    xtdhRate: 190,
    totalXtdhReceived: 5640,
    granters: [
      createGranter("test1234", "test1234", 62),
      createGranter("colorwave", "Colorwave", 41),
      createGranter("pixelpioneer", "Pixel Pioneer", 38),
      createGranter("futurefunk", "Future Funk", 30),
      createGranter("blockbard", "Block Bard", 24),
    ],
  },
  {
    collectionId: "gradients",
    collectionName: "6529 Gradient",
    collectionImage: imageUrl("gradients-collection", 320),
    tokenId: "gradients-105",
    tokenName: "Solar Fade",
    tokenImage: imageUrl("gradients-105"),
    xtdhRate: 120,
    totalXtdhReceived: 2980,
    granters: [
      createGranter("test1234", "test1234", 34),
      createGranter("colorwave", "Colorwave", 29),
      createGranter("futurefunk", "Future Funk", 22),
      createGranter("lumenloop", "Lumen Loop", 18),
    ],
  },
  {
    collectionId: "omtiles",
    collectionName: "Open Metaverse Tiles",
    collectionImage: imageUrl("omtiles-collection", 320),
    tokenId: "omtiles-201",
    tokenName: "Atlas Gateway",
    tokenImage: imageUrl("omtiles-201"),
    xtdhRate: 460,
    totalXtdhReceived: 13220,
    granters: [
      createGranter("metaverse_monk", "Metaverse Monk", 110),
      createGranter("zenwhale", "Zen Whale", 90),
      createGranter("cryptofox", "Crypto Fox", 74),
      createGranter("chainmage", "Chain Mage", 66),
      createGranter("data_degen", "Data Degen", 54),
      createGranter("timekeeper", "Time Keeper", 48),
      createGranter("futurefunk", "Future Funk", 38),
      createGranter("blockbard", "Block Bard", 32),
    ],
  },
  {
    collectionId: "omtiles",
    collectionName: "Open Metaverse Tiles",
    collectionImage: imageUrl("omtiles-collection", 320),
    tokenId: "omtiles-202",
    tokenName: "Connector Hub",
    tokenImage: imageUrl("omtiles-202"),
    xtdhRate: 340,
    totalXtdhReceived: 9250,
    granters: [
      createGranter("metaverse_monk", "Metaverse Monk", 96),
      createGranter("zenwhale", "Zen Whale", 80),
      createGranter("cryptofox", "Crypto Fox", 58),
      createGranter("chainmage", "Chain Mage", 44),
      createGranter("data_degen", "Data Degen", 40),
      createGranter("frensforever", "Frens Forever", 32),
    ],
  },
  {
    collectionId: "omtiles",
    collectionName: "Open Metaverse Tiles",
    collectionImage: imageUrl("omtiles-collection", 320),
    tokenId: "omtiles-203",
    tokenName: "Sky Transit",
    tokenImage: imageUrl("omtiles-203"),
    xtdhRate: 260,
    totalXtdhReceived: 6880,
    granters: [
      createGranter("metaverse_monk", "Metaverse Monk", 78),
      createGranter("zenwhale", "Zen Whale", 62),
      createGranter("cryptofox", "Crypto Fox", 48),
      createGranter("chainmage", "Chain Mage", 42),
      createGranter("timekeeper", "Time Keeper", 38),
    ],
  },
  {
    collectionId: "omtiles",
    collectionName: "Open Metaverse Tiles",
    collectionImage: imageUrl("omtiles-collection", 320),
    tokenId: "omtiles-204",
    tokenName: "Memetic Plaza",
    tokenImage: imageUrl("omtiles-204"),
    xtdhRate: 180,
    totalXtdhReceived: 5020,
    granters: [
      createGranter("metaverse_monk", "Metaverse Monk", 60),
      createGranter("zenwhale", "Zen Whale", 44),
      createGranter("cryptofox", "Crypto Fox", 38),
      createGranter("chainmage", "Chain Mage", 30),
    ],
  },
  {
    collectionId: "omtiles",
    collectionName: "Open Metaverse Tiles",
    collectionImage: imageUrl("omtiles-collection", 320),
    tokenId: "omtiles-205",
    tokenName: "VR Wharf",
    tokenImage: imageUrl("omtiles-205"),
    xtdhRate: 120,
    totalXtdhReceived: 3120,
    granters: [
      createGranter("metaverse_monk", "Metaverse Monk", 42),
      createGranter("zenwhale", "Zen Whale", 32),
      createGranter("chainmage", "Chain Mage", 24),
    ],
  },
  {
    collectionId: "synthwave",
    collectionName: "Synthwave Signal",
    collectionImage: imageUrl("synthwave-collection", 320),
    tokenId: "synthwave-301",
    tokenName: "Neon Rider",
    tokenImage: imageUrl("synthwave-301"),
    xtdhRate: 380,
    totalXtdhReceived: 11340,
    granters: [
      createGranter("synth_slinger", "Synth Slinger", 96),
      createGranter("futurefunk", "Future Funk", 88),
      createGranter("blockbard", "Block Bard", 64),
      createGranter("pixelpioneer", "Pixel Pioneer", 60),
      createGranter("moonmath", "Moon Math", 52),
      createGranter("colorwave", "Colorwave", 42),
      createGranter("timekeeper", "Time Keeper", 36),
    ],
  },
  {
    collectionId: "synthwave",
    collectionName: "Synthwave Signal",
    collectionImage: imageUrl("synthwave-collection", 320),
    tokenId: "synthwave-302",
    tokenName: "Night Drive",
    tokenImage: imageUrl("synthwave-302"),
    xtdhRate: 240,
    totalXtdhReceived: 6640,
    granters: [
      createGranter("synth_slinger", "Synth Slinger", 70),
      createGranter("futurefunk", "Future Funk", 64),
      createGranter("blockbard", "Block Bard", 46),
      createGranter("pixelpioneer", "Pixel Pioneer", 40),
      createGranter("moonmath", "Moon Math", 38),
    ],
  },
  {
    collectionId: "synthwave",
    collectionName: "Synthwave Signal",
    collectionImage: imageUrl("synthwave-collection", 320),
    tokenId: "synthwave-303",
    tokenName: "Laser Alley",
    tokenImage: imageUrl("synthwave-303"),
    xtdhRate: 180,
    totalXtdhReceived: 4920,
    granters: [
      createGranter("synth_slinger", "Synth Slinger", 52),
      createGranter("futurefunk", "Future Funk", 44),
      createGranter("blockbard", "Block Bard", 36),
      createGranter("timekeeper", "Time Keeper", 28),
    ],
  },
  {
    collectionId: "synthwave",
    collectionName: "Synthwave Signal",
    collectionImage: imageUrl("synthwave-collection", 320),
    tokenId: "synthwave-304",
    tokenName: "Signal Bloom",
    tokenImage: imageUrl("synthwave-304"),
    xtdhRate: 140,
    totalXtdhReceived: 3840,
    granters: [
      createGranter("synth_slinger", "Synth Slinger", 46),
      createGranter("futurefunk", "Future Funk", 38),
      createGranter("blockbard", "Block Bard", 28),
    ],
  },
  {
    collectionId: "pixelverse",
    collectionName: "Pixel Dreams",
    collectionImage: imageUrl("pixelverse-collection", 320),
    tokenId: "pixelverse-401",
    tokenName: "Dream Node",
    tokenImage: imageUrl("pixelverse-401"),
    xtdhRate: 260,
    totalXtdhReceived: 7420,
    granters: [
      createGranter("pixelpioneer", "Pixel Pioneer", 75),
      createGranter("artguy", "Art Blocksmith", 58),
      createGranter("cryptofox", "Crypto Fox", 40),
      createGranter("frensforever", "Frens Forever", 32),
      createGranter("memex", "Meme X", 28),
    ],
  },
  {
    collectionId: "pixelverse",
    collectionName: "Pixel Dreams",
    collectionImage: imageUrl("pixelverse-collection", 320),
    tokenId: "pixelverse-402",
    tokenName: "Voxel Bloom",
    tokenImage: imageUrl("pixelverse-402"),
    xtdhRate: 210,
    totalXtdhReceived: 6050,
    granters: [
      createGranter("pixelpioneer", "Pixel Pioneer", 62),
      createGranter("artguy", "Art Blocksmith", 48),
      createGranter("cryptofox", "Crypto Fox", 36),
      createGranter("frensforever", "Frens Forever", 28),
    ],
  },
  {
    collectionId: "pixelverse",
    collectionName: "Pixel Dreams",
    collectionImage: imageUrl("pixelverse-collection", 320),
    tokenId: "pixelverse-403",
    tokenName: "Neon Matrix",
    tokenImage: imageUrl("pixelverse-403"),
    xtdhRate: 150,
    totalXtdhReceived: 4020,
    granters: [
      createGranter("pixelpioneer", "Pixel Pioneer", 48),
      createGranter("artguy", "Art Blocksmith", 36),
      createGranter("frensforever", "Frens Forever", 26),
    ],
  },
  {
    collectionId: "pixelverse",
    collectionName: "Pixel Dreams",
    collectionImage: imageUrl("pixelverse-collection", 320),
    tokenId: "pixelverse-404",
    tokenName: "Stacks and Signals",
    tokenImage: imageUrl("pixelverse-404"),
    xtdhRate: 95,
    totalXtdhReceived: 2910,
    granters: [
      createGranter("pixelpioneer", "Pixel Pioneer", 34),
      createGranter("artguy", "Art Blocksmith", 28),
    ],
  },
];

const PROFILE_DATASET: Record<string, BaseTokenData[]> = {
  simo: DEFAULT_TOKENS,
  test1234: DEFAULT_TOKENS,
  nogrants: [],
};

export interface TokenFilters {
  readonly collections?: string[];
  readonly minRate?: number;
  readonly minGrantors?: number;
}

export function getMockTokens(profile: string): BaseTokenData[] {
  const normalized = profile.trim().toLowerCase();
  return PROFILE_DATASET[normalized] ?? DEFAULT_TOKENS;
}

export function filterTokens(
  tokens: BaseTokenData[],
  filters: TokenFilters
): BaseTokenData[] {
  const { collections, minRate, minGrantors } = filters;

  return tokens.filter((token) => {
    if (collections && collections.length > 0) {
      if (!collections.includes(token.collectionId)) {
        return false;
      }
    }

    if (typeof minRate === "number" && token.xtdhRate < minRate) {
      return false;
    }

    if (
      typeof minGrantors === "number" &&
      token.granters.length < minGrantors
    ) {
      return false;
    }

    return true;
  });
}

interface CollectionAccumulator {
  readonly collectionId: string;
  readonly collectionName: string;
  readonly collectionImage: string;
  tokenCount: number;
  totalXtdhRate: number;
  totalXtdhReceived: number;
  tokens: XtdhReceivedToken[];
  granters: Map<string, XtdhGranter>;
}

export function buildCollections(
  tokens: BaseTokenData[]
): XtdhReceivedCollectionSummary[] {
  const collectionMap = new Map<string, CollectionAccumulator>();

  for (const token of tokens) {
    if (!collectionMap.has(token.collectionId)) {
      collectionMap.set(token.collectionId, {
        collectionId: token.collectionId,
        collectionName: token.collectionName,
        collectionImage: token.collectionImage,
        tokenCount: 0,
        totalXtdhRate: 0,
        totalXtdhReceived: 0,
        tokens: [],
        granters: new Map<string, XtdhGranter>(),
      });
    }

    const entry = collectionMap.get(token.collectionId);
    if (!entry) continue;

    entry.tokenCount += 1;
    entry.totalXtdhRate += token.xtdhRate;
    entry.totalXtdhReceived += token.totalXtdhReceived;

    for (const granter of token.granters) {
      const existing = entry.granters.get(granter.profileId);
      if (existing) {
        entry.granters.set(granter.profileId, {
          ...existing,
          xtdhRateGranted: existing.xtdhRateGranted + granter.xtdhRateGranted,
        });
      } else {
        entry.granters.set(granter.profileId, granter);
      }
    }

    entry.tokens.push({
      tokenId: token.tokenId,
      tokenName: token.tokenName,
      tokenImage: token.tokenImage,
      xtdhRate: token.xtdhRate,
      totalXtdhReceived: token.totalXtdhReceived,
      granters: token.granters,
    });
  }

  return Array.from(collectionMap.values()).map((entry) => ({
    collectionId: entry.collectionId,
    collectionName: entry.collectionName,
    collectionImage: entry.collectionImage,
    tokenCount: entry.tokenCount,
    totalXtdhRate: entry.totalXtdhRate,
    totalXtdhReceived: entry.totalXtdhReceived,
    granters: Array.from(entry.granters.values()),
    tokens: entry.tokens,
  }));
}

export function buildCollectionOptions(
  tokens: BaseTokenData[]
): XtdhReceivedCollectionOption[] {
  const entries = new Map<
    string,
    { collectionId: string; collectionName: string; tokenCount: number }
  >();

  for (const token of tokens) {
    const existing = entries.get(token.collectionId);
    if (existing) {
      existing.tokenCount += 1;
    } else {
      entries.set(token.collectionId, {
        collectionId: token.collectionId,
        collectionName: token.collectionName,
        tokenCount: 1,
      });
    }
  }

  return Array.from(entries.values()).sort((a, b) =>
    a.collectionName.localeCompare(b.collectionName)
  );
}

export function buildNfts(tokens: BaseTokenData[]): XtdhReceivedNft[] {
  return tokens.map((token) => ({
    collectionId: token.collectionId,
    collectionName: token.collectionName,
    collectionImage: token.collectionImage,
    tokenId: token.tokenId,
    tokenName: token.tokenName,
    tokenImage: token.tokenImage,
    xtdhRate: token.xtdhRate,
    totalXtdhReceived: token.totalXtdhReceived,
    granters: token.granters,
  }));
}
