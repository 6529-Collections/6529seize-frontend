jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import type { NextRequest } from "next/server";

import { GET } from "@/app/api/public-reviews/[review]/declarations/route";
import {
  getStreamSolidityReferenceReader,
  resolveStreamSolidityReferenceVersion,
} from "@/lib/public-review/streamSolidityReference";
import { isStreamReviewPubliclyAvailable } from "@/lib/public-review/streamReviewRoutes";

jest.mock("@/lib/public-review/streamReviewRoutes", () => ({
  isStreamReviewPubliclyAvailable: jest.fn(),
}));
jest.mock("@/lib/public-review/streamSolidityReference", () => ({
  getStreamSolidityReferenceReader: jest.fn(),
  resolveStreamSolidityReferenceVersion: jest.fn(),
}));

const mockIsPubliclyAvailable =
  isStreamReviewPubliclyAvailable as jest.MockedFunction<
    typeof isStreamReviewPubliclyAvailable
  >;
const mockResolveVersion =
  resolveStreamSolidityReferenceVersion as jest.MockedFunction<
    typeof resolveStreamSolidityReferenceVersion
  >;
const mockGetReader = getStreamSolidityReferenceReader as jest.MockedFunction<
  typeof getStreamSolidityReferenceReader
>;

const VERSION = "2026-07-26.1";
const MANIFEST = {
  declarationIndex: [
    {
      canonicalSignature: "mint(address,uint256)",
      definitionId: "src/StreamCore.sol:StreamCore",
      definitionKey: "stream-core",
      displaySignature: "mint(address to, uint256 tokenId)",
      id: "src/StreamCore.sol:StreamCore#function:0x40c10f19",
      key: "mint",
      kind: "function",
      name: "mint",
      scope: "protocol",
      selector: "0x40c10f19",
      sourcePath: "src/StreamCore.sol",
      syntheticGetter: false,
      topLevel: false,
      topic0: null,
    },
  ],
  definitionIndex: [
    {
      id: "src/StreamCore.sol:StreamCore",
      name: "StreamCore",
    },
  ],
  reviewId: "6529-stream",
  reviewVersion: VERSION,
  source: {
    commit: "513bd7e079eafe109df6ae1ae21bfbca6fec6786",
  },
};

function createRequest(query: string): NextRequest {
  return {
    nextUrl: new URL(
      `https://staging.6529.io/api/public-reviews/6529-stream/declarations?${query}`
    ),
  } as unknown as NextRequest;
}

function createContext(review = "6529-stream") {
  return { params: Promise.resolve({ review }) };
}

describe("public review declaration route", () => {
  const originalResponse = globalThis.Response;

  beforeAll(() => {
    class TestResponse {
      readonly body: unknown;
      readonly headers: Headers;
      readonly status: number;

      constructor(body: unknown, init?: ResponseInit) {
        this.body = body;
        this.headers = new Headers(init?.headers);
        this.status = init?.status ?? 200;
      }

      static json(body: unknown, init?: ResponseInit): TestResponse {
        return new TestResponse(body, init);
      }

      async json(): Promise<unknown> {
        return this.body;
      }
    }
    Object.defineProperty(globalThis, "Response", {
      configurable: true,
      value: TestResponse,
      writable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(globalThis, "Response", {
      configurable: true,
      value: originalResponse,
      writable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPubliclyAvailable.mockReturnValue(true);
    mockResolveVersion.mockReturnValue(VERSION);
    mockGetReader.mockReturnValue({
      loadManifest: jest.fn().mockResolvedValue({ manifest: MANIFEST }),
    } as unknown as ReturnType<typeof getStreamSolidityReferenceReader>);
  });

  it("returns 404 without loading artifacts when public routes are gated", async () => {
    mockIsPubliclyAvailable.mockReturnValue(false);

    const response = await GET(
      createRequest(`version=${VERSION}`),
      createContext()
    );

    expect(response.status).toBe(404);
    expect(mockGetReader).not.toHaveBeenCalled();
  });

  it("rejects unbounded page sizes before loading the manifest", async () => {
    const response = await GET(
      createRequest(`version=${VERSION}&limit=101`),
      createContext()
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Declaration pagination parameter is out of range.",
    });
    expect(mockGetReader).not.toHaveBeenCalled();
  });

  it("returns a bounded page bound to the exact validated version", async () => {
    const response = await GET(
      createRequest(
        `version=${VERSION}&links=versioned&kind=function&limit=1&q=mint`
      ),
      createContext()
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      items: [
        {
          href: expect.stringContaining(
            `/versions/${VERSION}/reference/definitions/`
          ),
          signature: "mint(address,uint256)",
        },
      ],
      nextOffset: null,
      reviewId: "6529-stream",
      sourceCommit: "513bd7e079eafe109df6ae1ae21bfbca6fec6786",
      total: 1,
      version: VERSION,
    });
    expect(response.headers.get("x-robots-tag")).toBe("noindex, noarchive");
  });
});
