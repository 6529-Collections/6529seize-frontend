import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { meebits445Headers } from "@/config/meebits445Headers";
import {
  isMeebits445ViewerRepair,
  MEEBITS_445_ORIGINAL_URL,
} from "@/lib/media/meebits-445";

const nft = {
  id: 445,
  contract: "0x33FD426905F149f8376e227d0C9D3340AaD17aF1",
};

describe("Meebits #445 compatibility scope", () => {
  it("requires the exact card, collection, and published source", () => {
    expect(isMeebits445ViewerRepair(nft, MEEBITS_445_ORIGINAL_URL)).toBe(true);
    expect(
      isMeebits445ViewerRepair({ ...nft, id: 444 }, MEEBITS_445_ORIGINAL_URL)
    ).toBe(false);
    expect(
      isMeebits445ViewerRepair(
        { ...nft, contract: "0xother" },
        MEEBITS_445_ORIGINAL_URL
      )
    ).toBe(false);
    expect(
      isMeebits445ViewerRepair(nft, "https://example.com/new-art.html")
    ).toBe(false);
    expect(isMeebits445ViewerRepair(nft, undefined)).toBe(false);
  });

  it("permits the exact bundled script and isolates direct navigation", () => {
    const html = readFileSync(
      join(process.cwd(), "public/artwork/the-memes/445.html"),
      "utf8"
    ).replaceAll("\r\n", "\n");
    const script = html
      .split('<script type="module">')[1]
      ?.split("</script>")[0];
    expect(script).toBeDefined();
    const hash = createHash("sha256")
      .update(script ?? "")
      .digest("base64");
    const csp = meebits445Headers.headers.find(
      (header) => header.key === "Content-Security-Policy"
    )?.value;
    expect(csp).toContain(`'sha256-${hash}'`);
    expect(csp).toContain("sandbox allow-scripts allow-downloads");
    expect(csp).not.toContain("allow-same-origin");
    expect(csp).toContain("frame-ancestors 'self'");
  });
});
