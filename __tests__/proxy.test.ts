import proxy from "@/proxy";
import type { NextRequest } from "next/server";

const mockNext = jest.fn(() => ({ kind: "next" }));
const mockRedirect = jest.fn((url: URL) => ({
  kind: "redirect",
  url: url.toString(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    next: () => mockNext(),
    redirect: (url: URL) => mockRedirect(url),
  },
}));

function createRequest(pathname: string): NextRequest {
  const url = new URL(`https://staging.6529.io${pathname}`);
  return {
    url: url.toString(),
    nextUrl: url,
    headers: {
      get: jest.fn(() => ""),
    },
    cookies: {
      get: jest.fn(),
    },
  } as unknown as NextRequest;
}

describe("proxy", () => {
  beforeEach(() => {
    mockNext.mockClear();
    mockRedirect.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    "/help-index.json",
    "/llms.txt",
    "/glossary.json",
    "/review-data/6529-stream/index.json",
    "/review-data/6529-stream/versions/2026-07-27.1/reference-manifest.json",
    "/review-data/6529-stream/versions/2026-07-27.1/definitions/record-shard.json",
    "/review-data/6529-stream/versions/2026-07-27.1/sources/smart-contracts/StreamCore.sol",
  ])("serves %s without staging access-control fetches", async (path) => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("access control should not run"));

    const response = await proxy(createRequest(path));

    expect(response).toEqual({ kind: "next" });
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    "/review-data/6529-stream",
    "/review-data/6529-stream-evil/index.json",
    "/review-data/6529-streaming/index.json",
    "/review-data/other-review/index.json",
    "/review-data//6529-stream/index.json",
    "/review-data/6529-stream%2Fversions/index.json",
    "/reviews/6529-stream",
    "/reviews/6529-stream/reference",
  ])("keeps %s behind staging access control", async (path) => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ status: 200 } as Response);
    fetchMock.mockClear();

    const response = await proxy(createRequest(path));

    expect(response).toEqual({ kind: "next" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
