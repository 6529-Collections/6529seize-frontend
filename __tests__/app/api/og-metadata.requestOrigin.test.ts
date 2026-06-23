jest.mock("@/config/env", () => ({
  publicEnv: {
    BASE_ENDPOINT: "https://staging.6529.test",
  },
}));

import { getOgImageRequestOrigin } from "@/app/api/og-metadata/_lib/requestOrigin";

describe("getOgImageRequestOrigin", () => {
  it("uses the request origin for localhost previews", () => {
    expect(
      getOgImageRequestOrigin({
        url: "http://localhost:3001/api/og-metadata/waves/wave-1",
      } as Request)
    ).toBe("http://localhost:3001");
  });

  it("uses the request origin for loopback previews", () => {
    expect(
      getOgImageRequestOrigin({
        url: "http://127.0.0.1:3001/api/og-metadata/profiles/alice",
      } as Request)
    ).toBe("http://127.0.0.1:3001");
  });

  it("falls back to BASE_ENDPOINT for non-local request URLs", () => {
    expect(
      getOgImageRequestOrigin({
        url: "https://0.0.0.0:3001/api/og-metadata/profiles/alice",
      } as Request)
    ).toBe("https://staging.6529.test");
  });
});
