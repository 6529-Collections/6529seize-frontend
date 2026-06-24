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

  it("serves the help index without staging access-control fetches", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("access control should not run"));

    const response = await proxy(createRequest("/help-index.json"));

    expect(response).toEqual({ kind: "next" });
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockRestore();
  });
});
