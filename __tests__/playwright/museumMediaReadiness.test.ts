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
