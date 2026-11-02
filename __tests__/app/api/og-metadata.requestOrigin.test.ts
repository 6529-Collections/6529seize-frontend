jest.mock("@/config/env", () => ({
  publicEnv: {
    BASE_ENDPOINT: "https://staging.6529.test",
    NODE_ENV: "development",
  },
}));

import { getOgImageRequestOrigin } from "@/app/api/og-metadata/_lib/requestOrigin";
import { publicEnv } from "@/config/env";

const requestFor = (url: string): Request => ({ url }) as Request;

describe("getOgImageRequestOrigin", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("in local development", () => {
    it.each(["development", "local"] as const)(
      "uses the request origin for localhost previews (%s)",
      (nodeEnv) => {
        jest.replaceProperty(publicEnv, "NODE_ENV", nodeEnv);
        expect(
          getOgImageRequestOrigin(
            requestFor("http://localhost:3001/api/og-metadata/waves/wave-1")
          )
        ).toBe("http://localhost:3001");
      }
    );

    it("uses the request origin for loopback previews", () => {
      expect(
        getOgImageRequestOrigin(
          requestFor("http://127.0.0.1:3001/api/og-metadata/profiles/alice")
        )
      ).toBe("http://127.0.0.1:3001");
      expect(
        getOgImageRequestOrigin(
          requestFor("http://[::1]:3001/api/og-metadata/profiles/alice")
        )
      ).toBe("http://[::1]:3001");
    });

    it.each([
      "https://0.0.0.0:3001/api/og-metadata/profiles/alice",
      "https://localhost.attacker.test/api/og-metadata/profiles/alice",
      "https://attacker.test/api/og-metadata/profiles/alice",
      "http://192.168.1.10:3001/api/og-metadata/profiles/alice",
    ])("falls back to BASE_ENDPOINT for non-loopback host %s", (url) => {
      expect(getOgImageRequestOrigin(requestFor(url))).toBe(
        "https://staging.6529.test"
      );
    });

    it("falls back to BASE_ENDPOINT when the request URL is invalid", () => {
      expect(getOgImageRequestOrigin(requestFor("not a url"))).toBe(
        "https://staging.6529.test"
      );
    });
  });

  describe.each(["production", "test", undefined] as const)(
    "when the environment is %s",
    (nodeEnv) => {
      beforeEach(() => {
        jest.replaceProperty(publicEnv, "NODE_ENV", nodeEnv);
      });

      it.each([
        "http://localhost:3001/api/og-metadata/waves/wave-1",
        "https://localhost/api/og-metadata/waves/wave-1",
        "http://127.0.0.1:3001/api/og-metadata/profiles/alice",
        "http://[::1]:3001/api/og-metadata/profiles/alice",
      ])("ignores client-controlled loopback host %s", (url) => {
        expect(getOgImageRequestOrigin(requestFor(url))).toBe(
          "https://staging.6529.test"
        );
      });

      it("keeps using BASE_ENDPOINT for ordinary hosts", () => {
        expect(
          getOgImageRequestOrigin(
            requestFor("https://6529.io/api/og-metadata/waves/wave-1")
          )
        ).toBe("https://staging.6529.test");
      });
    }
  );
});
