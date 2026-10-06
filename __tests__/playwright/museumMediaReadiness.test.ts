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
    onVisit?: () => void;
  } = {}
) {
  const source = `https://example.com/${encodeURIComponent(alt)}.png`;
  let loaded = options.loaded ?? false;
  let complete = loaded;
  return {
    alt,
    getAttribute: (name: string) => (name === "src" ? source : null),
    get complete() {
      return complete;
    },
    get naturalWidth() {
      return loaded ? 100 : 0;
    },
    scrollIntoView: jest.fn(() => {
      complete = true;
      loaded = options.decodeOnVisit ?? true;
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

  it("rejects a failed native decode", async () => {
    main.append(mediaImage("failed work", { decodeOnVisit: false }));

    await expect(
      expectNoUnresolvedMuseumMedia(mediaPage(main))
    ).rejects.toThrow("Image failed to decode: failed work");
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
