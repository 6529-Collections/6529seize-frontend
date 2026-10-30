jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });
jest.mock("next/server", () => ({
  connection: jest.fn(async () => undefined),
}));
jest.mock("@/lib/public-review/streamReviewFeedback.server", () => ({
  resolveConfiguredStreamReviewFeedbackDestination: jest.fn(),
}));
jest.mock("@/lib/public-review/streamReviewRoutes", () => ({
  isStreamReviewPubliclyAvailable: jest.fn(),
}));

import { GET } from "@/app/api/public-reviews/[review]/destination/route";
import { resolveConfiguredStreamReviewFeedbackDestination } from "@/lib/public-review/streamReviewFeedback.server";
import { isStreamReviewPubliclyAvailable } from "@/lib/public-review/streamReviewRoutes";

const mockResolve = jest.mocked(
  resolveConfiguredStreamReviewFeedbackDestination
);
const mockAvailable = jest.mocked(isStreamReviewPubliclyAvailable);

const DESTINATION = {
  environment: "staging",
  logicalKey: "stream-review",
  waveId: "22222222-2222-4222-8222-222222222222",
} as const;

function createContext(review = "6529-stream") {
  return { params: Promise.resolve({ review }) };
}

describe("public review destination route", () => {
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
    mockAvailable.mockReturnValue(true);
    mockResolve.mockReturnValue(DESTINATION);
  });

  it("serves the configured destination for a public review", async () => {
    const response = await GET({} as Request, createContext());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(DESTINATION);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, noarchive");
  });

  it("returns 404 for another review", async () => {
    const response = await GET({} as Request, createContext("another-review"));

    expect(response.status).toBe(404);
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it("returns 404 while the review is not public", async () => {
    mockAvailable.mockReturnValue(false);

    const response = await GET({} as Request, createContext());

    expect(response.status).toBe(404);
    expect(mockResolve).not.toHaveBeenCalled();
  });
});
