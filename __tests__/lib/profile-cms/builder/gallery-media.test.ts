import {
  enrichWalletGalleryImageDimensions,
  measureWalletGalleryImage,
  type WalletGalleryImageMeasure,
} from "@/lib/profile-cms/builder/gallery-media";
import type {
  WalletGallerySnapshot,
  WalletGallerySnapshotAsset,
} from "@/lib/profile-cms/builder/gallery-source";

jest.mock("@/config/env", () => ({
  publicEnv: { MEDIA_RESOLVER_ENDPOINT: "https://media.6529.io" },
}));

function asset(
  id: string,
  changes: Partial<WalletGallerySnapshotAsset> = {}
): WalletGallerySnapshotAsset {
  return {
    id,
    title: id,
    collectionId: "collection",
    collectionName: "Collection",
    contract: "0x0000000000000000000000000000000000000001",
    tokenId: id,
    chainId: 1,
    owner: "0x0000000000000000000000000000000000000002",
    imageUri: `https://example.com/${id}.png`,
    mediaState: "ready",
    altText: id,
    flags: { spam: false, excluded: false },
    ...changes,
  };
}

function snapshot(
  assets: readonly WalletGallerySnapshotAsset[]
): WalletGallerySnapshot {
  return {
    snapshotId: "snapshot",
    source: "backend",
    wallets: [],
    capturedAt: "2026-09-10T00:00:00.000Z",
    assets,
    collections: [],
    excludedAssets: [],
    warnings: ["existing-warning"],
  };
}

describe("wallet gallery image dimensions", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("measures the resolved image once while preserving source URIs, holdings and known dimensions", async () => {
    const original = snapshot([
      asset("1", { imageUri: "ipfs://bafy-example/art.png" }),
      asset("2", {
        imageUri: "ipfs://bafy-example/art.png",
        mediaState: "partial",
      }),
      asset("3", { width: 900, height: 600 }),
      asset("4", { imageUri: undefined, mediaState: "missing" }),
    ]);
    const measure = jest
      .fn<
        ReturnType<WalletGalleryImageMeasure>,
        Parameters<WalletGalleryImageMeasure>
      >()
      .mockResolvedValue({ width: 1600, height: 800 });
    const enriched = await enrichWalletGalleryImageDimensions(original, {
      measureImage: measure,
    });
    expect(measure).toHaveBeenCalledTimes(1);
    expect(measure).toHaveBeenCalledWith(
      "https://media.6529.io/ipfs/bafy-example/art.png",
      expect.any(AbortSignal)
    );
    expect(enriched.assets).toEqual([
      { ...original.assets[0], width: 1600, height: 800 },
      { ...original.assets[1], width: 1600, height: 800 },
      original.assets[2],
      original.assets[3],
    ]);
    expect(enriched.collections).toBe(original.collections);
    expect(enriched.excludedAssets).toBe(original.excludedAssets);
    expect(enriched.warnings).toEqual(original.warnings);
    expect(original.assets[0]?.width).toBeUndefined();
  });

  it("keeps unresolved media partial without fabricated dimensions or unsafe requests", async () => {
    const original = snapshot([
      asset("1"),
      asset("2", { width: 0, height: 100 }),
      asset("3", { imageUri: "javascript:alert(1)" }),
      asset("4", { imageUri: "https://user:password@example.com/image.png" }),
    ]);
    const measure = jest
      .fn<
        ReturnType<WalletGalleryImageMeasure>,
        Parameters<WalletGalleryImageMeasure>
      >()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ width: 10.5, height: 20 });
    const enriched = await enrichWalletGalleryImageDimensions(original, {
      measureImage: measure,
    });
    expect(measure).toHaveBeenCalledTimes(2);
    expect(enriched.assets).toEqual(
      original.assets.map((entry) => ({ ...entry, mediaState: "partial" }))
    );
    expect(enriched.warnings).toEqual([
      "existing-warning",
      "backend_snapshot_unmeasured_images",
    ]);
  });

  it("limits concurrency to four and stops all work at the total deadline", async () => {
    jest.useFakeTimers();
    const signals: AbortSignal[] = [];
    const measure = jest
      .fn<
        ReturnType<WalletGalleryImageMeasure>,
        Parameters<WalletGalleryImageMeasure>
      >()
      .mockImplementation((_url, signal) => {
        signals.push(signal);
        return new Promise(() => undefined);
      });
    const original = snapshot(
      Array.from({ length: 20 }, (_, index) => asset(String(index)))
    );
    const pending = enrichWalletGalleryImageDimensions(original, {
      measureImage: measure,
      perImageTimeoutMs: 100,
      totalTimeoutMs: 250,
    });
    await jest.advanceTimersByTimeAsync(0);
    expect(measure).toHaveBeenCalledTimes(4);
    await jest.advanceTimersByTimeAsync(100);
    expect(measure).toHaveBeenCalledTimes(8);
    expect(signals.slice(0, 4).every((signal) => signal.aborted)).toBe(true);
    await jest.advanceTimersByTimeAsync(150);
    const enriched = await pending;
    expect(measure).toHaveBeenCalledTimes(12);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
    expect(enriched.assets).toHaveLength(20);
    expect(
      enriched.assets.every((entry) => entry.mediaState === "partial")
    ).toBe(true);
  });

  it("does not accept results that arrive after a timeout", async () => {
    jest.useFakeTimers();
    const measure: WalletGalleryImageMeasure = () =>
      new Promise((resolve) => {
        setTimeout(() => resolve({ width: 123, height: 456 }), 200);
      });
    const pending = enrichWalletGalleryImageDimensions(snapshot([asset("1")]), {
      measureImage: measure,
      perImageTimeoutMs: 100,
    });
    await jest.advanceTimersByTimeAsync(100);
    const enriched = await pending;
    await jest.advanceTimersByTimeAsync(100);
    expect(enriched.assets[0]?.width).toBeUndefined();
    expect(enriched.assets[0]?.mediaState).toBe("partial");
  });

  it("clears only the stale measurement warning after a successful retry", async () => {
    const original = {
      ...snapshot([asset("1")]),
      warnings: ["existing-warning", "backend_snapshot_unmeasured_images"],
    };
    const enriched = await enrichWalletGalleryImageDimensions(original, {
      measureImage: async () => ({ width: 100, height: 200 }),
    });
    expect(enriched.warnings).toEqual(["existing-warning"]);
  });

  it("reads browser intrinsic dimensions and cleans up the image request", async () => {
    const element = document.createElement("img");
    Object.defineProperties(element, {
      naturalWidth: { value: 321 },
      naturalHeight: { value: 654 },
    });
    jest.spyOn(globalThis, "Image").mockImplementation(() => element);
    const controller = new AbortController();
    const pending = measureWalletGalleryImage(
      "https://example.com/image.png",
      controller.signal
    );
    expect(element.referrerPolicy).toBe("no-referrer");
    element.dispatchEvent(new Event("load"));
    await expect(pending).resolves.toEqual({ width: 321, height: 654 });
    expect(element.hasAttribute("src")).toBe(false);
    expect(element.onload).toBeNull();
    expect(element.onerror).toBeNull();
  });

  it("cancels a pending browser image and ignores later load events", async () => {
    const element = document.createElement("img");
    jest.spyOn(globalThis, "Image").mockImplementation(() => element);
    const controller = new AbortController();
    const pending = measureWalletGalleryImage(
      "https://example.com/image.png",
      controller.signal
    );
    controller.abort();
    element.dispatchEvent(new Event("load"));
    await expect(pending).resolves.toBeNull();
    expect(element.hasAttribute("src")).toBe(false);
    expect(element.onload).toBeNull();
  });
});
