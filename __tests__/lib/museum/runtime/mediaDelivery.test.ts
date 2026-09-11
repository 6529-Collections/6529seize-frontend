import {
  getMuseumMediaDeliverySrcSet,
  getMuseumMediaDeliveryUrl,
  isMuseumMediaProxyAllowedUrl,
} from "@/lib/museum/runtime/mediaDelivery";

const SOURCE =
  "https://d3lqz0a4bldqgf.cloudfront.net/museum/accessions/6529NM.2026.003/6529NM-W-0029/c1b6541832f2a237555adffae2f4870143a976549e591e2dbaa4d3d87f75d166/webp-v2-q82-m6-fixed-icc/640.webp";

describe("Museum media delivery", () => {
  it("accepts only governed accession derivative paths", () => {
    expect(isMuseumMediaProxyAllowedUrl(SOURCE)).toBe(true);
    expect(
      isMuseumMediaProxyAllowedUrl(SOURCE.replace("/640.webp", "/1280.webp"))
    ).toBe(true);
    expect(
      isMuseumMediaProxyAllowedUrl(SOURCE.replace("/640.webp", "/2400.webp"))
    ).toBe(true);

    for (const invalid of [
      SOURCE.replace("https://", "http://"),
      SOURCE.replace("d3lqz0a4bldqgf.cloudfront.net", "example.com"),
      SOURCE.replace("/museum/accessions/", "/private/"),
      SOURCE.replace("/640.webp", "/641.webp"),
      `${SOURCE}?redirect=https://example.com`,
      SOURCE.replace("https://", "https://user:pass@"),
    ]) {
      expect(isMuseumMediaProxyAllowedUrl(invalid)).toBe(false);
      expect(getMuseumMediaDeliveryUrl(invalid)).toBe(invalid);
    }
  });

  it("maps approved sources and responsive candidates to the same-origin endpoint", () => {
    const source1280 = SOURCE.replace("/640.webp", "/1280.webp");
    expect(getMuseumMediaDeliveryUrl(SOURCE)).toBe(
      `/api/museum/media?url=${encodeURIComponent(SOURCE)}`
    );
    expect(
      getMuseumMediaDeliverySrcSet(`${SOURCE} 640w, ${source1280} 1280w`)
    ).toBe(
      `/api/museum/media?url=${encodeURIComponent(SOURCE)} 640w, /api/museum/media?url=${encodeURIComponent(source1280)} 1280w`
    );
    expect(getMuseumMediaDeliverySrcSet(`${SOURCE}\t640w`)).toBe(
      `/api/museum/media?url=${encodeURIComponent(SOURCE)} 640w`
    );
  });
});
