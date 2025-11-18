import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { getAuthJwt, getStagingAuth } from "@/services/auth/auth.utils";

jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: jest.fn(),
  getStagingAuth: jest.fn(),
}));

describe("commonApiPostWithoutBodyAndResponse", () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
    (getAuthJwt as jest.Mock).mockReturnValue(null);
    (getStagingAuth as jest.Mock).mockReturnValue("s");
  });

  it("posts and resolves when ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    await commonApiPostWithoutBodyAndResponse({ endpoint: "e" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/e",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-6529-auth": "s" },
        body: "",
      }
    );
  });

  it("rejects with error body", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "x",
      json: async () => ({ error: "err" }),
    });
    await expect(
      commonApiPostWithoutBodyAndResponse({ endpoint: "e" })
    ).rejects.toThrow("HTTP 400 x: err");
  });
});
