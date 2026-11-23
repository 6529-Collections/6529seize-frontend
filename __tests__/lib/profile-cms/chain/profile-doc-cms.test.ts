import { withProfileSitePointer } from "@/lib/profile-cms/chain/profile-doc-cms";

const POINTER = {
  publication: "bafkreie5cyyazg2mwjwk7foh6qhhev4ize3dkpz5656e6ty6sjn4zyfzjq",
  package: "bafkreiej3lbdjacakabv566nmsdidmktb6sxt765d7skg2sakrog2ttsiq",
};
const ARCHIVE = "bafkreiedy57oyhdigsburvrwepydy4i4guk6q3th5b7w42szehbt672tgm";

describe("withProfileSitePointer", () => {
  it("sets the two site keys and keeps every other field and the archive", () => {
    const current = new Map([
      ["bio", "unchanged"],
      ["cms.archive", ARCHIVE],
      ["cms.primary.package", "old"],
      ["cms.primary.publication", "old"],
      ["website", "example.test"],
    ]);
    expect(
      Object.fromEntries(withProfileSitePointer(current, POINTER))
    ).toEqual({
      bio: "unchanged",
      "cms.archive": ARCHIVE,
      "cms.primary.package": POINTER.package,
      "cms.primary.publication": POINTER.publication,
      website: "example.test",
    });
    expect(current.get("cms.primary.publication")).toBe("old");
  });

  it("unpublishes by removing both site keys and keeps the archive", () => {
    const current = new Map([
      ["cms.archive", ARCHIVE],
      ["cms.primary.package", POINTER.package],
      ["cms.primary.publication", POINTER.publication],
    ]);
    expect(Object.fromEntries(withProfileSitePointer(current, null))).toEqual({
      "cms.archive": ARCHIVE,
    });
  });

  it("starts the fields when there is no document", () => {
    expect(Object.fromEntries(withProfileSitePointer(null, POINTER))).toEqual({
      "cms.primary.package": POINTER.package,
      "cms.primary.publication": POINTER.publication,
    });
  });
});
