import type { Page, Response } from "@playwright/test";

jest.mock("../../tests/testHelpers", () => ({
  expect: global.expect,
  expectNoHorizontalOverflow: jest.fn(),
  waitForRouteReady: jest.fn(),
}));

import { gotoDocumentWithTransientRetry } from "../../tests/support/routeReadiness";

function mockResponse(status: number) {
  return { status: () => status } as Response;
}

function mockPageWithResponses(
  responses: Array<Response | null>,
  titles: string[] = []
) {
  const goto = jest.fn(async () => responses.shift() ?? null);
  const title = jest.fn(async () => titles.shift() ?? "Ready");
  const waitForTimeout = jest.fn(async () => undefined);

  return {
    goto,
    page: { goto, title, waitForTimeout } as unknown as Page,
    title,
    waitForTimeout,
  };
}

describe("Playwright route readiness navigation", () => {
  it("returns successful document responses without retrying", async () => {
    const response = mockResponse(200);
    const { goto, page, waitForTimeout } = mockPageWithResponses([response]);

    await expect(gotoDocumentWithTransientRetry(page, "/waves")).resolves.toBe(
      response
    );
    expect(goto).toHaveBeenCalledTimes(1);
    expect(waitForTimeout).not.toHaveBeenCalled();
  });

  it("returns non-transient document responses without retrying", async () => {
    const response = mockResponse(404);
    const { goto, page, waitForTimeout } = mockPageWithResponses([response]);

    await expect(
      gotoDocumentWithTransientRetry(page, "/missing")
    ).resolves.toBe(response);
    expect(goto).toHaveBeenCalledTimes(1);
    expect(waitForTimeout).not.toHaveBeenCalled();
  });

  it("retries once after a transient document response", async () => {
    const response = mockResponse(200);
    const { goto, page, waitForTimeout } = mockPageWithResponses([
      mockResponse(502),
      response,
    ]);

    await expect(
      gotoDocumentWithTransientRetry(page, "/rememes")
    ).resolves.toBe(response);
    expect(goto).toHaveBeenCalledTimes(2);
    expect(waitForTimeout).toHaveBeenCalledTimes(1);
  });

  it("throws when the retry still returns a transient document response", async () => {
    const { page } = mockPageWithResponses([
      mockResponse(502),
      mockResponse(503),
    ]);

    await expect(
      gotoDocumentWithTransientRetry(page, "/education")
    ).rejects.toThrow(
      "Document navigation to /education returned transient HTTP 503 after retry."
    );
  });

  it("returns null when the retry produces no document response", async () => {
    const { goto, page, waitForTimeout } = mockPageWithResponses([
      mockResponse(504),
      null,
    ]);

    await expect(
      gotoDocumentWithTransientRetry(page, "/network")
    ).resolves.toBeNull();
    expect(goto).toHaveBeenCalledTimes(2);
    expect(waitForTimeout).toHaveBeenCalledTimes(1);
  });

  it.each(["6529 Error", "404 | PAGE NOT FOUND"])(
    "retries once after the app renders the transient %s document",
    async (transientTitle) => {
      const response = mockResponse(200);
      const { goto, page, title, waitForTimeout } = mockPageWithResponses(
        [mockResponse(200), response],
        [transientTitle, "NextGen"]
      );

      await expect(
        gotoDocumentWithTransientRetry(page, "/nextgen")
      ).resolves.toBe(response);
      expect(goto).toHaveBeenCalledTimes(2);
      expect(title).toHaveBeenCalledTimes(2);
      expect(waitForTimeout).toHaveBeenCalledTimes(1);
    }
  );

  it("throws when the app renders a soft failure after the retry", async () => {
    const { page } = mockPageWithResponses(
      [mockResponse(200), mockResponse(200)],
      ["404 | PAGE NOT FOUND", "404 | PAGE NOT FOUND"]
    );

    await expect(
      gotoDocumentWithTransientRetry(page, "/nextgen/collection/pebbles/art")
    ).rejects.toThrow(
      "Document navigation to /nextgen/collection/pebbles/art remained on the application 404 page after retry."
    );
  });

  it("reports a persistent application error shell clearly", async () => {
    const { page } = mockPageWithResponses(
      [mockResponse(200), mockResponse(200)],
      ["6529 Error", "6529 Error"]
    );

    await expect(
      gotoDocumentWithTransientRetry(page, "/nextgen")
    ).rejects.toThrow(
      "Document navigation to /nextgen remained on the application error shell after retry."
    );
  });
});
