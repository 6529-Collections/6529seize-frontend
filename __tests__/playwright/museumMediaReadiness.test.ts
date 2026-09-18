/** @jest-environment node */
import type { Page } from "@playwright/test";
import { expectNoUnresolvedMuseumMedia } from "../../tests/support/museumReleaseAcceptance";

jest.mock("../../tests/testHelpers", () => ({
  expect: jest.requireActual("@playwright/test").expect.configure({
    timeout: 300,
  }),
}));

function mediaPage(readProblems: () => Promise<string[]>) {
  const image = {
    scrollIntoViewIfNeeded: jest.fn().mockResolvedValue(undefined),
    evaluate: jest.fn().mockResolvedValue(true),
  };
  const page = {
    locator: (selector: string) =>
      selector === "main img"
        ? { count: async () => 1, nth: () => image }
        : { evaluateAll: readProblems },
  };
  return page as unknown as Page;
}

describe("Museum rendered media readiness", () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([0, 1])(
    "settles an image added after an unchanged recount of %i images",
    async (initialCount) => {
      let elapsed = 0;
      jest.spyOn(Date, "now").mockImplementation(() => {
        elapsed += 100;
        return elapsed;
      });
      const initialImage = {
        scrollIntoViewIfNeeded: jest.fn().mockResolvedValue(undefined),
        evaluate: jest.fn().mockResolvedValue(true),
      };
      let lateImageRevealed = false;
      const lateImage = {
        scrollIntoViewIfNeeded: jest.fn().mockImplementation(async () => {
          lateImageRevealed = true;
        }),
        evaluate: jest.fn().mockImplementation(async () => lateImageRevealed),
      };
      const count = jest
        .fn()
        .mockResolvedValueOnce(initialCount)
        .mockResolvedValueOnce(initialCount)
        .mockResolvedValue(initialCount + 1);
      const page = {
        locator: (selector: string) =>
          selector === "main img"
            ? {
                count,
                nth: (index: number) =>
                  index < initialCount ? initialImage : lateImage,
              }
            : { evaluateAll: async () => [] },
      } as unknown as Page;

      await expect(
        expectNoUnresolvedMuseumMedia(page)
      ).resolves.toBeUndefined();
      expect(lateImage.scrollIntoViewIfNeeded).toHaveBeenCalledTimes(1);
      expect(lateImage.evaluate).toHaveBeenCalled();
    }
  );

  it("settles lazy images added while the initial batch is loading", async () => {
    let imageCount = 1;
    let lateImageRevealed = false;
    const initialImage = {
      scrollIntoViewIfNeeded: jest.fn().mockResolvedValue(undefined),
      evaluate: jest.fn().mockImplementation(async () => {
        imageCount = 2;
        return true;
      }),
    };
    const lateImage = {
      scrollIntoViewIfNeeded: jest.fn().mockImplementation(async () => {
        lateImageRevealed = true;
      }),
      evaluate: jest.fn().mockImplementation(async () => lateImageRevealed),
    };
    const page = {
      locator: (selector: string) =>
        selector === "main img"
          ? {
              count: async () => imageCount,
              nth: (index: number) => (index === 0 ? initialImage : lateImage),
            }
          : {
              evaluateAll: async () =>
                lateImageRevealed ? [] : ["unresolved image: streamed work"],
            },
    } as unknown as Page;

    await expect(expectNoUnresolvedMuseumMedia(page)).resolves.toBeUndefined();
    expect(lateImage.scrollIntoViewIfNeeded).toHaveBeenCalledTimes(1);
    expect(lateImage.evaluate).toHaveBeenCalled();
  });

  it("waits for loading text to clear after the native image has loaded", async () => {
    const readProblems = jest
      .fn()
      .mockResolvedValueOnce(["Loading image."])
      .mockResolvedValue([]);

    await expect(
      expectNoUnresolvedMuseumMedia(mediaPage(readProblems))
    ).resolves.toBeUndefined();
    expect(readProblems).toHaveBeenCalledTimes(2);
  });

  it.each([
    "Loading image.",
    "This image is temporarily unavailable.",
    "unresolved image: Collection work",
  ])("still rejects a persistent media problem: %s", async (problem) => {
    await expect(
      expectNoUnresolvedMuseumMedia(mediaPage(async () => [problem]))
    ).rejects.toThrow(problem);
  });
});
