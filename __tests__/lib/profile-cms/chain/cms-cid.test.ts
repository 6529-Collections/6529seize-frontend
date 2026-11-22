import { cmsCidFromHash } from "@/lib/profile-cms/chain/cms-cid";

// The same vectors as the ProfileDoc `cms` field text and the backend.
const VECTORS = [
  [
    "sha256:9d16300c9b4cb26caf95c7f40e725788c936353f3df77c4f4f1e925bcce0b94c",
    "bafkreie5cyyazg2mwjwk7foh6qhhev4ize3dkpz5656e6ty6sjn4zyfzjq",
  ],
  [
    "sha256:89dac234804050035efbcd648681b1530fa579ffdd1fe4a36a40545c6d4e7244",
    "bafkreiej3lbdjacakabv566nmsdidmktb6sxt765d7skg2sakrog2ttsiq",
  ],
  [
    "sha256:83c77eec1c68348348d63623f03c711c3515e86e67e87f6e6a5921c33f7f5333",
    "bafkreiedy57oyhdigsburvrwepydy4i4guk6q3th5b7w42szehbt672tgm",
  ],
] as const;

describe("profile site CIDs", () => {
  it.each(VECTORS)("names %s as %s", (hash, cid) => {
    expect(cmsCidFromHash(hash)).toBe(cid);
  });

  it.each([
    "sha256:abc",
    "sha512:" + "0".repeat(64),
    "SHA256:" + "0".repeat(64),
  ])("refuses %s", (hash) => {
    expect(() => cmsCidFromHash(hash)).toThrow("Not a CMS sha256 hash");
  });
});
