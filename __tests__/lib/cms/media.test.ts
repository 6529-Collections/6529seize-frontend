import {
  getSafeCmsMediaUrl,
  resolveCmsLinkUrl,
  resolveCmsMediaUrl,
} from "@/lib/cms/media";

describe("CMS media URL helpers", () => {
  it("allows profile-relative, http, https, ipfs, and arweave URLs", () => {
    expect(resolveCmsLinkUrl("/punk6529/index.html")).toBe(
      "/punk6529/index.html"
    );
    expect(resolveCmsLinkUrl("https://6529.io/punk6529/index.html")).toBe(
      "https://6529.io/punk6529/index.html"
    );
    expect(resolveCmsLinkUrl("http://localhost:3001/punk6529")).toBe(
      "http://localhost:3001/punk6529"
    );
    expect(resolveCmsMediaUrl("ipfs://bafy-test/image.png")).toContain(
      "/ipfs/bafy-test/image.png"
    );
    expect(resolveCmsMediaUrl("ar://arweave-tx")).toBe(
      "https://arweave.net/arweave-tx"
    );
  });

  it("rejects executable or ambiguous URLs", () => {
    expect(resolveCmsLinkUrl("javascript:alert(1)")).toBeNull();
    expect(resolveCmsMediaUrl("data:image/svg+xml,<svg />")).toBeNull();
    expect(resolveCmsLinkUrl("//evil.example/path")).toBeNull();
    expect(resolveCmsLinkUrl("https://6529.io/\nnext")).toBeNull();
    expect(getSafeCmsMediaUrl("javascript:alert(1)")).toBe("/6529io.png");
  });
});
