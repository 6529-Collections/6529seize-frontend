/** @jest-environment node */
import type { Page } from "@playwright/test";
import { expectNoUnresolvedMuseumMedia } from "../../tests/support/museumReleaseAcceptance";

jest.mock("../../tests/testHelpers", () => {
  const playwright =
    jest.requireActual<typeof import("@playwright/test")>("@playwright/test");
  const boundedExpect = playwright.expect.configure({ timeout: 300 });
  const poll = boundedExpect.poll;
  boundedExpect.poll = (callback, options) => {
    const messageOptions =
      typeof options === "string" ? { message: options } : options;
    return poll(callback, { ...messageOptions, timeout: 300, intervals: [10] });
  };
  return { expect: boundedExpect };
});

function mediaImage(
  alt: string,
  options: {
    loaded?: boolean;
    decodeOnVisit?: boolean;
    visitsBeforeDecode?: number;
    onVisit?: () => void;
    attributes?: Record<string, string>;
    currentSrc?: string;
  } = {}
) {
  const source = `https://example.com/${encodeURIComponent(alt)}.png`;
  let loaded = options.loaded ?? false;
  let complete = loaded;
  let visits = 0;
  return {
    alt,
    getAttribute: (name: string) =>
      options.attributes?.[name] ?? (name === "src" ? source : null),
    currentSrc: options.currentSrc ?? source,
    get complete() {
      return complete;
    },
    get naturalWidth() {
      return loaded ? 100 : 0;
    },
    scrollIntoView: jest.fn(() => {
      visits += 1;
      complete = visits >= (options.visitsBeforeDecode ?? 1);
      loaded = complete && (options.decodeOnVisit ?? true);
      options.onVisit?.();
    }),
  };
}

function mediaDocument() {
  const images: ReturnType<typeof mediaImage>[] = [];
  return {
    images,
    append: (...items: typeof images) => images.push(...items),
    remove: (image: (typeof images)[number]) => {
      const index = images.indexOf(image);
      if (index !== -1) images.splice(index, 1);
    },
  };
}

function mediaPage(
  main: ReturnType<typeof mediaDocument>,
  readProblems: () => Promise<string[]> = () => Promise.resolve([]),
  beforeInventory?: () => void
) {
  const page = {
    locator: (selector: string) => ({
      evaluateAll: (
        evaluate: (elements: Element[], argument?: unknown) => unknown,
        argument?: unknown
      ) => {
        if (selector !== "main img") return readProblems();
        if (argument === undefined) beforeInventory?.();
        return Promise.resolve(
          evaluate(main.images as unknown as Element[], argument)
        );
      },
    }),
    evaluate: jest.fn((evaluate: () => unknown) => Promise.resolve(evaluate())),
  };
  return page as unknown as Page;
}

describe("Museum rendered media readiness", () => {
  let main: ReturnType<typeof mediaDocument>;
  const previousFrame = globalThis.requestAnimationFrame;

  beforeEach(() => {
    main = mediaDocument();
    let elapsed = 0;
    jest.spyOn(Date, "now").mockImplementation(() => {
      elapsed += 100;
      return elapsed;
    });
    globalThis.requestAnimationFrame = jest.fn((frame) => {
      frame(0);
      return 1;
    });
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = previousFrame;
    jest.restoreAllMocks();
  });

  it.each([0, 1])(
    "settles an image added after an unchanged recount of %i images",
    async (initialCount) => {
      if (initialCount === 1) main.append(mediaImage("initial work"));
      const lateImage = mediaImage("streamed work");
      let inventories = 0;
      const page = mediaPage(main, undefined, () => {
        inventories += 1;
        if (inventories === 3) main.append(lateImage);
      });

      await expect(
        expectNoUnresolvedMuseumMedia(page)
      ).resolves.toBeUndefined();
      expect(lateImage.scrollIntoView).toHaveBeenCalledTimes(1);
      expect(lateImage.complete && lateImage.naturalWidth > 0).toBe(true);
      expect(page.evaluate).toHaveBeenCalled();
    }
  );

  it("settles lazy images added while the initial batch is loading", async () => {
    const lateImage = mediaImage("streamed work");
    main.append(
      mediaImage("initial work", { onVisit: () => main.append(lateImage) })
    );

    await expect(
      expectNoUnresolvedMuseumMedia(mediaPage(main))
    ).resolves.toBeUndefined();
    expect(lateImage.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(lateImage.complete && lateImage.naturalWidth > 0).toBe(true);
  });

  it("rejects a disappeared image when the next image takes its index", async () => {
    const first = mediaImage("first work", {
      onVisit: () => main.remove(first),
    });
    main.append(first, mediaImage("second work"));

    await expect(
      expectNoUnresolvedMuseumMedia(mediaPage(main))
    ).rejects.toThrow("Media disappeared or was replaced: first work");
  });

  it("keeps a pending lazy image in view instead of leaving it behind after one visit", async () => {
    const pending = mediaImage("responsive work", { visitsBeforeDecode: 3 });
    const next = mediaImage("next work");
    main.append(pending, next);
    await expect(
      expectNoUnresolvedMuseumMedia(mediaPage(main))
    ).resolves.toBeUndefined();
    expect(pending.scrollIntoView).toHaveBeenCalledTimes(3);
    expect(next.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(pending.complete && pending.naturalWidth > 0).toBe(true);
  });

  it("rejects a failed native decode", async () => {
    main.append(mediaImage("failed work", { decodeOnVisit: false }));

    await expect(
      expectNoUnresolvedMuseumMedia(mediaPage(main))
    ).rejects.toThrow("Image failed to decode: failed work");
  });

  it.each([
    "data:image/png;base64,PRIVATE_INLINE_PAYLOAD 1x, /museum/other.webp 2x",
    "/museum/work.webp 1x, data:image/svg+xml,<svg>PRIVATE_INLINE_PAYLOAD</svg> 2x",
    "DATA:image/png;base64,PRIVATE_INLINE_PAYLOAD,WITH_COMMAS 1x",
  ])(
    "redacts inline srcset payloads before diagnostic candidate parsing: %s",
    async (srcset) => {
      main.append(
        mediaImage("failed work", {
          decodeOnVisit: false,
          attributes: { srcset },
        })
      );
      const failure = await expectNoUnresolvedMuseumMedia(
        mediaPage(main)
      ).catch((error: unknown) => error);
      expect(failure).toBeInstanceOf(Error);
      expect((failure as Error).message).toContain("[inline srcset redacted]");
      expect((failure as Error).message).not.toContain(
        "PRIVATE_INLINE_PAYLOAD"
      );
      expect((failure as Error).message).not.toContain("WITH_COMMAS");
    }
  );

  it.each([
    "data:image/png;base64,PRIVATE_CURRENT_SOURCE",
    "blob:https://example.com/PRIVATE_CURRENT_SOURCE",
    "file:///PRIVATE_CURRENT_SOURCE",
  ])(
    "rejects non-HTTP selected sources in diagnostics: %s",
    async (currentSrc) => {
      main.append(
        mediaImage("failed work", { decodeOnVisit: false, currentSrc })
      );
      const failure = await expectNoUnresolvedMuseumMedia(
        mediaPage(main)
      ).catch((error: unknown) => error);
      expect(failure).toBeInstanceOf(Error);
      expect((failure as Error).message).toContain("[non-HTTP URL]");
      expect((failure as Error).message).not.toContain(
        "PRIVATE_CURRENT_SOURCE"
      );
    }
  );

  it("retains HTTP responsive candidates with credentials, queries and fragments removed", async () => {
    main.append(
      mediaImage("failed work", {
        decodeOnVisit: false,
        attributes: {
          srcset:
            "https://user:PRIVATE_PASSWORD@example.com/work.webp?sig=PRIVATE_QUERY#PRIVATE_FRAGMENT 1x, /museum/large.webp?key=PRIVATE_QUERY 2x",
        },
        currentSrc:
          "https://user:PRIVATE_PASSWORD@example.com/work.webp?sig=PRIVATE_QUERY#PRIVATE_FRAGMENT",
      })
    );
    const failure = await expectNoUnresolvedMuseumMedia(mediaPage(main)).catch(
      (error: unknown) => error
    );
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toContain(
      '"url":"https://example.com/work.webp","descriptor":"1x"'
    );
    expect((failure as Error).message).toContain('"descriptor":"2x"');
    expect((failure as Error).message).not.toContain("PRIVATE_");
  });

  it("requires both occurrences of the same source and alternative text", async () => {
    const first = mediaImage("repeated work", {
      onVisit: () => main.remove(first),
    });
    main.append(first, mediaImage("repeated work"));

    await expect(
      expectNoUnresolvedMuseumMedia(mediaPage(main))
    ).rejects.toThrow("Media disappeared or was replaced: repeated work");
  });

  it.each(["signed work", ""])(
    "redacts a failed image's original src in the poll error and its cause: %s",
    async (alt) => {
      main.append(
        mediaImage(alt, {
          decodeOnVisit: false,
          attributes: {
            src: "https://user:PRIVATE_PASSWORD@example.com/work.webp?sig=PRIVATE_QUERY#PRIVATE_FRAGMENT",
          },
        })
      );
      const failure = await expectNoUnresolvedMuseumMedia(
        mediaPage(main)
      ).catch((error: unknown) => error);
      expect(failure).toBeInstanceOf(Error);
      const error = failure as Error;
      expect(error.message).toContain("Image failed to decode:");
      expect(error.message).toContain('"src":"https://example.com/work.webp"');
      expect(error.message).not.toContain("PRIVATE_");
      expect(String(error.cause)).not.toContain("PRIVATE_");
    }
  );

  it("waits for loading text to clear after the native image has loaded", async () => {
    main.append(mediaImage("loaded work", { loaded: true }));
    const readProblems = jest
      .fn()
      .mockResolvedValueOnce(["Loading image."])
      .mockResolvedValue([]);

    await expect(
      expectNoUnresolvedMuseumMedia(mediaPage(main, readProblems))
    ).resolves.toBeUndefined();
    expect(readProblems).toHaveBeenCalledTimes(2);
  });

  it.each([
    "Loading image.",
    "This image is temporarily unavailable.",
    "unresolved image: Collection work",
  ])("still rejects a persistent media problem: %s", async (problem) => {
    main.append(mediaImage("loaded work", { loaded: true }));
    await expect(
      expectNoUnresolvedMuseumMedia(
        mediaPage(main, () => Promise.resolve([problem]))
      )
    ).rejects.toThrow(problem);
  });
});
