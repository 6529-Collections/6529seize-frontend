import {
  getProfileCmsAssetProxyUrl,
  isProfileCmsAssetProxyAllowedUrl,
} from "@/lib/profile-cms/runtime/mediaProxy";

describe("profile CMS media proxy helpers", () => {
  const allowedUrl =
    "https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x1000/0x33FD426905f149f8376e227d0C9D3340AaD17aF1/1.WEBP";

  it("allows first-party CloudFront image and emoji assets", () => {
    expect(isProfileCmsAssetProxyAllowedUrl(allowedUrl)).toBe(true);
    expect(
      isProfileCmsAssetProxyAllowedUrl(
        "https://d3lqz0a4bldqgf.cloudfront.net:443/images/test.webp"
      )
    ).toBe(true);
    expect(
      isProfileCmsAssetProxyAllowedUrl(
        "https://d3lqz0a4bldqgf.cloudfront.net/6529-emoji/emoji-list.json?t=1"
      )
    ).toBe(true);
  });

  it("rejects untrusted hosts, protocols, and paths", () => {
    expect(
      isProfileCmsAssetProxyAllowedUrl(
        "https://d3lqz0a4bldqgf.cloudfront.net.evil/images/test.webp"
      )
    ).toBe(false);
    expect(
      isProfileCmsAssetProxyAllowedUrl(
        `${["h", "ttp"].join("")}://d3lqz0a4bldqgf.cloudfront.net/images/test.webp`
      )
    ).toBe(false);
    expect(
      isProfileCmsAssetProxyAllowedUrl(
        "https://d3lqz0a4bldqgf.cloudfront.net:444/images/test.webp"
      )
    ).toBe(false);
    expect(
      isProfileCmsAssetProxyAllowedUrl(
        "https://d3lqz0a4bldqgf.cloudfront.net/private/test.webp"
      )
    ).toBe(false);
  });

  it("rewrites allowed assets to the same-origin proxy", () => {
    expect(getProfileCmsAssetProxyUrl(allowedUrl)).toBe(
      `/api/profile-cms/assets?url=${encodeURIComponent(allowedUrl)}`
    );
  });

  it("leaves unsupported and local URLs untouched", () => {
    expect(getProfileCmsAssetProxyUrl("/local/image.png")).toBe(
      "/local/image.png"
    );
    expect(getProfileCmsAssetProxyUrl("data:image/png;base64,abc")).toBe(
      "data:image/png;base64,abc"
    );
    expect(getProfileCmsAssetProxyUrl("https://example.com/image.png")).toBe(
      "https://example.com/image.png"
    );
  });
});
