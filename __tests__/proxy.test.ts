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

function createRequest(
  pathname: string,
  nextUrlPathname: string = pathname
): NextRequest {
  const requestUrl = new URL(`https://staging.6529.io${pathname}`);
  const nextUrl = new URL(requestUrl);
  Object.assign(nextUrl, { clone: () => new URL(nextUrl) });
  nextUrl.pathname = nextUrlPathname;
  return {
    url: requestUrl.toString(),
    nextUrl,
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
    "",
    "tab=chat",
    "tab=leaderboard",
    "tab=winners&competition=older",
    "tab=configuration&competition=older",
    "serialNo=42&tab=leaderboard",
  ])(
    "preserves explicit wave destinations in the desktop alias (%s)",
    async (query) => {
      const request = createRequest("/my-stream");
      request.nextUrl.search = `?wave=wave${query ? `&${query}` : ""}`;
      jest
        .mocked(request.headers.get)
        .mockReturnValue("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
      await proxy(request);
      expect(mockRedirect).toHaveBeenCalledWith(
        new URL(`/waves/wave${query ? `?${query}` : ""}`, request.url)
      );
    }
  );

  it.each([
    ["drop=message///&tab=leaderboard", "drop=message&tab=leaderboard"],
    ["serialNo=42/&tab=leaderboard", "serialNo=42&tab=leaderboard"],
    [
      "drop=message///&serialNo=42/&entry=older&tab=leaderboard",
      "drop=message&serialNo=42&tab=leaderboard&entry=older",
    ],
  ])(
    "keeps normalized chat targets alongside explicit view keys (%s)",
    async (query, expected) => {
      const request = createRequest("/my-stream");
      request.nextUrl.search = `?wave=wave&${query}`;
      jest
        .mocked(request.headers.get)
        .mockReturnValue("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
      await proxy(request);
      expect(mockRedirect).toHaveBeenCalledWith(
        new URL(`/waves/wave?${expected}`, request.url)
      );
    }
  );

  it.each([
    "/pdfjs/5.4.296/pdf.worker.min.mjs",
    "/pdfjs/5.4.296/cmaps/Adobe-Japan1-UCS2.bcmap",
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

  it("keeps an encoded-slash request gated if Next exposes a decoded pathname", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ status: 200 } as Response);
    fetchMock.mockClear();

    const response = await proxy(
      createRequest(
        "/review-data/6529-stream%2Fversions/index.json",
        "/review-data/6529-stream/versions/index.json"
      )
    );

    expect(response).toEqual({ kind: "next" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
