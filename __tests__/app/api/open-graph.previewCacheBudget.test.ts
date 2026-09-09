import {
  copyPreviewCacheEntry,
  isPreviewCacheEntryWithinBudget,
  PREVIEW_CACHE_MAX_ENTRY_BYTES,
} from "@/app/api/open-graph/previewCacheBudget";
import { serialize } from "node:v8";

jest.mock("node:v8", () => {
  const actual = jest.requireActual<typeof import("node:v8")>("node:v8");
  return { ...actual, serialize: jest.fn(actual.serialize) };
});

describe("preview cache retention", () => {
  beforeEach(() => jest.clearAllMocks());

  it("copies accepted data and keys while preserving optional undefined fields", () => {
    const image = { url: "https://images.example/art.png" };
    const preview = {
      title: "Artwork",
      author: undefined,
      image,
      images: [image],
    };
    const entry = copyPreviewCacheEntry("preview", preview);

    expect(entry).toEqual({ key: "preview", data: preview });
    expect(entry?.data).not.toBe(preview);
    expect(entry?.data.image).not.toBe(image);
    expect(Object.hasOwn(entry?.data ?? {}, "author")).toBe(true);
    expect(serialize).toHaveBeenCalledTimes(1);

    preview.title = "Changed";
    image.url = "https://images.example/changed.png";
    expect(entry?.data.title).toBe("Artwork");
    expect(entry?.data.image.url).toBe("https://images.example/art.png");
  });

  it("does not copy oversized entries", () => {
    const preview = { image: "x".repeat(512) };

    expect(copyPreviewCacheEntry("preview", preview, 512)).toBeNull();
    expect(serialize).not.toHaveBeenCalled();
  });

  it("skips caching if an accepted entry cannot be copied", () => {
    jest.mocked(serialize).mockImplementationOnce(() => {
      throw new Error("Copy failed");
    });

    expect(copyPreviewCacheEntry("preview", { title: "Artwork" })).toBeNull();
  });

  it("accepts ordinary previews with optional undefined fields and shared media", () => {
    const image = { url: "https://images.example/art.png", alt: undefined };
    const preview = {
      title: "Artwork",
      description: null,
      image,
      images: [image],
      width: 1200,
      available: true,
    };

    expect(isPreviewCacheEntryWithinBudget("preview", preview, 4096)).toBe(
      true
    );
  });

  it("counts UTF-16 strings and the cache key at the exact small-budget boundary", () => {
    // Entry (64), key string (64 + 2), and surrogate-pair string (64 + 4).
    expect(isPreviewCacheEntryWithinBudget("k", "😀", 198)).toBe(true);
    expect(isPreviewCacheEntryWithinBudget("k", "😀", 197)).toBe(false);
    expect(isPreviewCacheEntryWithinBudget("kk", "😀", 198)).toBe(false);
  });

  it("charges undefined values without excluding normal optional fields", () => {
    expect(isPreviewCacheEntryWithinBudget("k", undefined, 146)).toBe(true);
    expect(isPreviewCacheEntryWithinBudget("k", undefined, 145)).toBe(false);
  });

  it.each(["title", "description", "image"])(
    "rejects an oversized %s without copying its string",
    (property) => {
      const preview = { [property]: "x".repeat(PREVIEW_CACHE_MAX_ENTRY_BYTES) };
      expect(isPreviewCacheEntryWithinBudget("preview", preview)).toBe(false);
    }
  );

  it("counts property names and many small collection members", () => {
    expect(
      isPreviewCacheEntryWithinBudget("preview", { ["x".repeat(256)]: 1 }, 512)
    ).toBe(false);
    expect(
      isPreviewCacheEntryWithinBudget(
        "preview",
        { images: Array(32).fill("") },
        512
      )
    ).toBe(false);
  });

  it("rejects a sparse collection before inspecting its elements", () => {
    const read = jest.fn();
    const images = new Array(1_000_000);
    Object.defineProperty(images, "0", { enumerable: true, get: read });

    expect(isPreviewCacheEntryWithinBudget("preview", { images }, 512)).toBe(
      false
    );
    expect(read).not.toHaveBeenCalled();
  });

  it("stops traversal as soon as the budget is exhausted", () => {
    const read = jest.fn();
    const preview = { title: "x".repeat(512) };
    Object.defineProperty(preview, "image", { enumerable: true, get: read });

    expect(isPreviewCacheEntryWithinBudget("preview", preview, 512)).toBe(
      false
    );
    expect(read).not.toHaveBeenCalled();
  });

  it("refuses cycles and excessive nesting", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic["self"] = cyclic;
    expect(isPreviewCacheEntryWithinBudget("preview", cyclic)).toBe(false);

    let nested: unknown = "leaf";
    for (let depth = 0; depth < 65; depth += 1) nested = { nested };
    expect(isPreviewCacheEntryWithinBudget("preview", nested)).toBe(false);
  });

  it("refuses hidden and symbol properties that are outside plain JSON data", () => {
    const hidden = Object.defineProperty({}, "image", { value: "art" });
    const symbol = { [Symbol("image")]: "art" };
    expect(isPreviewCacheEntryWithinBudget("preview", hidden)).toBe(false);
    expect(isPreviewCacheEntryWithinBudget("preview", symbol)).toBe(false);
  });

  it("refuses accessors without executing them", () => {
    const read = jest.fn(() => "art");
    const preview = Object.defineProperty({}, "image", {
      enumerable: true,
      get: read,
    });

    expect(isPreviewCacheEntryWithinBudget("preview", preview)).toBe(false);
    expect(read).not.toHaveBeenCalled();
  });

  it.each([new Date(0), new Map(), new Set(), () => "art", 1n, Symbol("art")])(
    "refuses unsupported retained values",
    (preview) => {
      expect(isPreviewCacheEntryWithinBudget("preview", preview)).toBe(false);
    }
  );

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, 1.5])(
    "rejects invalid budget %s",
    (budget) => {
      expect(isPreviewCacheEntryWithinBudget("preview", {}, budget)).toBe(
        false
      );
    }
  );
});
