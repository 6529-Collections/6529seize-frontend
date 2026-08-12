import { selectMuseumStillMedia } from "@/lib/museum/publication/mediaSelection";
import type { MuseumMedia } from "@/lib/museum/publication/types";

function media(kind: "live" | "still", url: string): MuseumMedia {
  return {
    id: `media-${kind}`,
    artworkId: "6529NM-W-0001",
    kind,
    role: "source",
    mediaType: kind === "still" ? "image/png" : "text/html",
    width: kind === "still" ? 1200 : null,
    height: kind === "still" ? 1200 : null,
    altText: "A governed Casey Reas work.",
    credit: {
      creditLine: "Casey REAS, Work One.",
      licenseLabel: "CC BY-NC 4.0",
      licenseUrl: "/museum/network/research/rights/cc-by-nc-4.0",
      rightsExpressionId: "cc-by-nc-4.0",
      sourcePath: `records/entities/media-${kind}.json`,
    },
    sourcePath: `records/entities/media-${kind}.json`,
    custody: "upstream",
    url,
    preservationStatus: "not_retained",
    sha256: null,
    upstreamProvider: "art_blocks",
  };
}

describe("selectMuseumStillMedia", () => {
  it("selects the governed still when a live locator appears first", () => {
    const live = media("live", "https://generator.artblocks.io/1/0xabc/1");
    const still = media(
      "still",
      "https://media-proxy.artblocks.io/1/0xabc/1.png"
    );

    expect(selectMuseumStillMedia([live, still])).toBe(still);
  });

  it("fails closed when only live media is published", () => {
    expect(
      selectMuseumStillMedia([
        media("live", "https://generator.artblocks.io/1/0xabc/1"),
      ])
    ).toBeUndefined();
  });
});
