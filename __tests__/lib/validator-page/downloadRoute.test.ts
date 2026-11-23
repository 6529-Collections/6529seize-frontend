/** @jest-environment node */
const mockResolve = jest.fn();

jest.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));
jest.mock("@/lib/validator-page/releaseDownload", () => ({
  resolveReleaseDownload: (path: readonly string[]) => mockResolve(path),
}));

import { GET } from "@/app/validator/download/[...path]/route";

function download(...path: string[]): Promise<Response> {
  return GET(
    new Request(`https://6529.io/validator/download/${path.join("/")}`),
    {
      params: Promise.resolve({ path }),
    }
  );
}

describe("GET /validator/download/<version>/<file>", () => {
  beforeEach(() => {
    mockResolve.mockReset();
    process.env["VALIDATOR_PAGE_PUBLIC"] = "true";
    delete process.env["VALIDATOR_PAGE_PASSWORD"];
  });

  afterAll(() => {
    delete process.env["VALIDATOR_PAGE_PUBLIC"];
    delete process.env["VALIDATOR_PAGE_PASSWORD"];
  });

  it("asks to try again in a minute while the release list is unavailable", async () => {
    mockResolve.mockResolvedValue({ state: "unavailable" });
    const response = await download("0.1.0-test.2", "x_amd64.deb");
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).toBe(
      "The release list is unavailable. Try again in a minute.\n"
    );
  });

  it("sends no Retry-After with a 404 or a redirect", async () => {
    mockResolve.mockResolvedValue({ state: "not-found" });
    const missing = await download("0.1.0-test.2", "nothing.deb");
    expect(missing.status).toBe(404);
    expect(missing.headers.get("retry-after")).toBeNull();

    mockResolve.mockResolvedValue({
      state: "found",
      url: "https://bucket.example/releases/0.1.0-test.2/x_amd64.deb",
    });
    const found = await download("0.1.0-test.2", "x_amd64.deb");
    expect(found.status).toBe(302);
    expect(found.headers.get("location")).toBe(
      "https://bucket.example/releases/0.1.0-test.2/x_amd64.deb"
    );
    expect(found.headers.get("retry-after")).toBeNull();
  });

  it("sends no Retry-After with the password gate's 401", async () => {
    delete process.env["VALIDATOR_PAGE_PUBLIC"];
    process.env["VALIDATOR_PAGE_PASSWORD"] = "test-only-password-4";
    const response = await download("0.1.0-test.2", "x_amd64.deb");
    expect(response.status).toBe(401);
    expect(response.headers.get("retry-after")).toBeNull();
    expect(mockResolve).not.toHaveBeenCalled();
  });
});
