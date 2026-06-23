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

function mockPageWithResponses(responses: Array<Response | null>) {
  const goto = jest.fn(async () => responses.shift() ?? null);
  const waitForTimeout = jest.fn(async () => undefined);

  return {
    goto,
    page: { goto, waitForTimeout } as unknown as Page,
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
});
