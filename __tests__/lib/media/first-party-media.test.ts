const mockPublicEnv: { NEXT_PUBLIC_CLOUDFRONT_DOMAIN?: string | undefined } =
  {};

jest.mock("@/config/env", () => ({
  publicEnv: mockPublicEnv,
}));

import {
  getMediaOrigin,
  isFirstPartyMediaOrigin,
  PROD_MEDIA_ORIGIN,
} from "@/lib/media/first-party-media";

describe("first-party media origins", () => {
  afterEach(() => {
    delete mockPublicEnv.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;
  });

  it("uses the prod CDN when no media host is configured", () => {
    expect(getMediaOrigin()).toBe(PROD_MEDIA_ORIGIN);
    expect(isFirstPartyMediaOrigin(PROD_MEDIA_ORIGIN)).toBe(true);
    expect(isFirstPartyMediaOrigin("https://media.staging.6529.io")).toBe(
      false
    );
  });

  it("uses the configured media host and keeps accepting the prod CDN", () => {
    mockPublicEnv.NEXT_PUBLIC_CLOUDFRONT_DOMAIN =
      "https://media.staging.6529.io/";
    expect(getMediaOrigin()).toBe("https://media.staging.6529.io");
    expect(isFirstPartyMediaOrigin("https://media.staging.6529.io")).toBe(true);
    expect(isFirstPartyMediaOrigin(PROD_MEDIA_ORIGIN)).toBe(true);
    expect(isFirstPartyMediaOrigin("https://example.com")).toBe(false);
  });

  it("ignores a configured value that is not an https URL", () => {
    mockPublicEnv.NEXT_PUBLIC_CLOUDFRONT_DOMAIN = "http://media.staging.6529.io";
    expect(getMediaOrigin()).toBe(PROD_MEDIA_ORIGIN);
    mockPublicEnv.NEXT_PUBLIC_CLOUDFRONT_DOMAIN =
      "https://media.staging.6529.io:8443";
    expect(getMediaOrigin()).toBe(PROD_MEDIA_ORIGIN);
    mockPublicEnv.NEXT_PUBLIC_CLOUDFRONT_DOMAIN = "not a url";
    expect(getMediaOrigin()).toBe(PROD_MEDIA_ORIGIN);
  });
});
