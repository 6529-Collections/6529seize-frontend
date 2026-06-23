import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { BaseNFT } from "@/entities/INFT";
import { serializeJsonLd } from "@/lib/structured-data/json-ld";
import { buildNftPageJsonLd } from "@/lib/structured-data/nft";
import { buildProfilePageJsonLd } from "@/lib/structured-data/profile";
import type { JsonLdObject } from "@/lib/structured-data/types";
import { CC0_LICENSE_URL } from "@/lib/structured-data/utils";

describe("structured data helpers", () => {
  it("serializes JSON-LD with script-breaking characters escaped", () => {
    const serialized = serializeJsonLd({
      "@context": "https://schema.org",
      name: `</script><script>alert(1)</script>>${String.fromCodePoint(
        0x2028
      )}${String.fromCodePoint(0x2029)}`,
    });

    expect(serialized).toContain(String.raw`\u003c/script\u003e`);
    expect(serialized).toContain(String.raw`\u2028`);
    expect(serialized).toContain(String.raw`\u2029`);
    expect(serialized).not.toContain("</script>");
  });

  it("uses CC0 by default for NFT pages and can omit license metadata", () => {
    const nft = buildBaseNft();

    const memesGraph = graph(
      buildNftPageJsonLd({
        nft,
        path: "/the-memes/1",
        fallbackName: "The Memes #1",
        collectionName: "The Memes by 6529",
        collectionPath: "/the-memes",
      })
    );
    const memesArtwork = findGraphNode(memesGraph, "VisualArtwork");
    expect(memesArtwork?.["license"]).toBe(CC0_LICENSE_URL);

    const gradientGraph = graph(
      buildNftPageJsonLd({
        nft,
        path: "/6529-gradient/1",
        fallbackName: "6529 Gradient #1",
        collectionName: "6529 Gradient",
        collectionPath: "/6529-gradient",
        license: null,
      })
    );
    const gradientArtwork = findGraphNode(gradientGraph, "VisualArtwork");
    expect(gradientArtwork).not.toHaveProperty("license");
  });

  it("maps profile classifications without overstating AI/bot profiles as people", () => {
    const personGraph = graph(
      buildProfilePageJsonLd({
        profile: buildProfile(ApiProfileClassification.Pseudonym),
        path: "/6529er",
      })
    );

    expect(findGraphNode(personGraph, "ProfilePage")).toBeDefined();
    expect(findGraphNode(personGraph, "Person")).toMatchObject({
      name: "6529er",
    });

    const aiGraph = graph(
      buildProfilePageJsonLd({
        profile: buildProfile(ApiProfileClassification.Ai),
        path: "/ai-agent",
      })
    );

    expect(findGraphNode(aiGraph, "ProfilePage")).toBeUndefined();
    expect(findGraphNode(aiGraph, "Thing")).toMatchObject({
      additionalType: ApiProfileClassification.Ai,
    });
  });
});

function graph(data: JsonLdObject): readonly JsonLdObject[] {
  return data["@graph"] as readonly JsonLdObject[];
}

function findGraphNode(
  graphNodes: readonly JsonLdObject[],
  type: string
): JsonLdObject | undefined {
  return graphNodes.find((node) => {
    const nodeType = node["@type"];
    return Array.isArray(nodeType)
      ? nodeType.includes(type)
      : nodeType === type;
  });
}

function buildBaseNft(): BaseNFT {
  return {
    id: 1,
    contract: "0x0000000000000000000000000000000000000001",
    created_at: new Date("2024-01-01T00:00:00.000Z"),
    mint_date: new Date("2024-01-01T00:00:00.000Z"),
    mint_price: 0,
    supply: 6529,
    name: "Seize the Memes",
    collection: "The Memes",
    token_type: "ERC1155",
    description: "Test artwork",
    artist: "6529",
    artist_seize_handle: "6529er",
    uri: "ipfs://token",
    icon: "/icon.png",
    thumbnail: "/thumb.png",
    scaled: "/scaled.png",
    image: "/image.png",
    animation: "",
    market_cap: 0,
    floor_price: 0,
    total_volume_last_24_hours: 0,
    total_volume_last_7_days: 0,
    total_volume_last_1_month: 0,
    total_volume: 0,
    highest_offer: 0,
  };
}

function buildProfile(classification: ApiProfileClassification): ApiIdentity {
  return {
    id: "identity-id",
    handle: "6529er",
    normalised_handle: "6529er",
    pfp: "/pfp.png",
    cic: 1,
    rep: 2,
    level: 3,
    tdh: 4,
    tdh_rate: 0,
    xtdh: 0,
    xtdh_rate: 0,
    consolidation_key: "6529er",
    display: "6529er",
    primary_wallet: "0x0000000000000000000000000000000000000001",
    banner1: null,
    banner2: null,
    classification,
    sub_classification: null,
    active_main_stage_submission_ids: [],
    winner_main_stage_drop_ids: [],
    artist_of_prevote_cards: [],
    profile_wave_id: null,
    is_wave_creator: false,
  };
}
