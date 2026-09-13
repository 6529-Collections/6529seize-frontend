/** @jest-environment node */

import { publicEnv } from "@/config/env";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { buildMemesSubmissionTypedData } from "@/services/wallet-signatures/memes-submission-signature";
import golden from "./fixtures/memes-submission-v1.json";

describe("Memes submission default origin and audience", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalBaseEndpoint = publicEnv.BASE_ENDPOINT;
  const originalApiEndpoint = publicEnv.API_ENDPOINT;

  beforeEach(() => {
    publicEnv.BASE_ENDPOINT = "https://staging.6529.io/waves";
    publicEnv.API_ENDPOINT = "https://api.staging.6529.io/api";
  });

  afterEach(() => {
    publicEnv.BASE_ENDPOINT = originalBaseEndpoint;
    publicEnv.API_ENDPOINT = originalApiEndpoint;
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  });

  it.each([
    [
      "HTTPS page",
      "https://community-client.example",
      "https://community-client.example",
    ],
    ["opaque WebView", "null", "https://staging.6529.io"],
    [
      "custom-scheme WebView",
      "capacitor://localhost",
      "https://staging.6529.io",
    ],
    ["no window", undefined, "https://staging.6529.io"],
  ])(
    "uses the canonical origin and API audience for %s",
    (_name, pageOrigin, expectedOrigin) => {
      if (pageOrigin === undefined) {
        Reflect.deleteProperty(globalThis, "window");
      } else {
        Object.defineProperty(globalThis, "window", {
          configurable: true,
          value: { location: { origin: pageOrigin } },
        });
      }

      const typedData = buildMemesSubmissionTypedData({
        drop: { ...golden.drop, drop_type: ApiDropType.Participatory },
        termsOfService: golden.terms,
        wave: golden.wave,
        issuedAt: new Date(golden.typedData.message.Verification.IssuedAt),
        nonce: golden.typedData.message.Verification.Nonce,
      });

      expect(typedData.message.Verification.Origin).toBe(expectedOrigin);
      expect(typedData.message.Verification.Audience).toBe(
        "api.staging.6529.io"
      );
    }
  );
});
