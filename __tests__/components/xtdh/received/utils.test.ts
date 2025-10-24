import {
  getCollectionActivitySnapshot,
  getUpdatedRelativeMetadata,
  formatUpdatedRelativeLabel,
} from "@/components/xtdh/received/utils";
import type { XtdhReceivedCollectionSummary } from "@/types/xtdh";

const baseCollection: XtdhReceivedCollectionSummary = {
  collectionId: "collection-1",
  collectionName: "Sample Collection",
  collectionImage: "/image.png",
  tokenCount: 70,
  totalXtdhRate: 1_540,
  totalXtdhReceived: 1_600,
  granters: [],
  tokens: [],
};

describe("getCollectionActivitySnapshot", () => {
  it("builds snapshot strings with totals and pluralization", () => {
    const snapshot = getCollectionActivitySnapshot({
      ...baseCollection,
      receivingTokenCount: 3,
    });

    expect(snapshot.desktop).toBe("3 / 70 tokens receiving xTDH");
    expect(snapshot.tablet).toBe("3/70 tokens w/ xTDH");
    expect(snapshot.mobile).toBe("3/70 active");
    expect(snapshot.screenReader).toBe(
      "3 out of 70 tokens are currently receiving xTDH.",
    );
    expect(snapshot.activeReceiving).toBe(3);
    expect(snapshot.totalSupply).toBe(70);
  });

  it("uses singular token label when only one token is active", () => {
    const snapshot = getCollectionActivitySnapshot({
      ...baseCollection,
      tokenCount: 8,
      receivingTokenCount: 1,
    });

    expect(snapshot.desktop).toBe("1 / 8 token receiving xTDH");
    expect(snapshot.tablet).toBe("1/8 token w/ xTDH");
    expect(snapshot.mobile).toBe("1/8 active");
    expect(snapshot.screenReader).toBe(
      "1 out of 8 tokens is currently receiving xTDH.",
    );
  });

  it("falls back when total supply is unavailable", () => {
    const snapshot = getCollectionActivitySnapshot({
      ...baseCollection,
      tokenCount: Number.NaN,
      receivingTokenCount: 4,
    });

    expect(snapshot.desktop).toBe("4 tokens receiving xTDH");
    expect(snapshot.tablet).toBe("4 tokens w/ xTDH");
    expect(snapshot.mobile).toBe("4 active");
    expect(snapshot.screenReader).toBe(
      "4 tokens are currently receiving xTDH.",
    );
    expect(snapshot.totalSupply).toBeUndefined();
  });
});

describe("getUpdatedRelativeMetadata", () => {
  it("computes relative labels for recent updates", () => {
    const reference = new Date("2024-01-01T01:00:00Z").getTime();
    const metadata = getUpdatedRelativeMetadata(
      "2024-01-01T00:30:00Z",
      reference,
    );

    expect(metadata).toMatchObject({
      label: "Updated 30m ago",
      timeAgo: "30m ago",
      datetime: "2024-01-01T00:30:00.000Z",
    });
    expect(metadata?.tooltip).toContain("2024");
  });

  it("uses calendar date for older updates", () => {
    const reference = new Date("2024-03-01T00:00:00Z").getTime();
    const metadata = getUpdatedRelativeMetadata(
      "2024-01-15T12:00:00Z",
      reference,
    );

    expect(metadata).toMatchObject({
      label: "Updated Jan 15",
      timeAgo: "Jan 15",
      datetime: "2024-01-15T12:00:00.000Z",
    });
    expect(metadata?.tooltip).toContain("January");
  });

  it("returns undefined for invalid timestamps", () => {
    expect(getUpdatedRelativeMetadata("invalid-date")).toBeUndefined();
    expect(getUpdatedRelativeMetadata(undefined)).toBeUndefined();
  });
});

describe("formatUpdatedRelativeLabel", () => {
  it("maintains backwards compatibility by returning the label string", () => {
    const reference = new Date("2024-01-01T01:00:00Z").getTime();
    const label = formatUpdatedRelativeLabel(
      "2024-01-01T00:40:00Z",
      reference,
    );

    expect(label).toBe("Updated 20m ago");
  });
});
