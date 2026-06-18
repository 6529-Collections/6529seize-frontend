import {
  buildCmsPackageCandidate,
  createBuilderBlock,
  createBuilderStateFromPackage,
  createDefaultCmsBuilderState,
  getBuilderFieldIdForIssuePath,
  parseCmsPackageCandidateJson,
  validateCmsBuilderState,
} from "@/lib/profile-cms/builder/package";

describe("profile CMS builder package helpers", () => {
  it("builds a hashed V1 homepage package that validates with fixture artifacts", () => {
    const state = createDefaultCmsBuilderState("Punk6529");
    const validation = validateCmsBuilderState(
      state,
      new Date("2026-06-17T00:00:00.000Z")
    );

    expect(validation.result.valid).toBe(true);
    expect(validation.cmsPackage.profile.handle).toBe("punk6529");
    expect(validation.cmsPackage.site.base_path).toBe("/punk6529/index.html");
    expect(validation.cmsPackage.payload.routes).toEqual([
      {
        path: "/punk6529/index.html",
        kind: "page",
        page_id: "page-home",
      },
    ]);
    expect(validation.cmsPackage.integrity.payload_hash).toMatch(
      /^sha256:[a-f0-9]{64}$/
    );
    expect(validation.cmsPackage.integrity.package_hash).toMatch(
      /^sha256:[a-f0-9]{64}$/
    );
  });

  it("surfaces validator errors for unsafe authored URLs", () => {
    const state = {
      ...createDefaultCmsBuilderState("punk6529"),
      blocks: [
        createBuilderBlock("button_link", 0, {
          text: "Bad link",
          url: "javascript:alert(1)",
        }),
      ],
    };

    const validation = validateCmsBuilderState(state);

    expect(validation.result.valid).toBe(false);
    expect(validation.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "block.unsafe_url",
          path: "/payload/pages/0/blocks/0/href",
        }),
      ])
    );
    expect(
      getBuilderFieldIdForIssuePath("/payload/pages/0/blocks/0/href")
    ).toBe("cms-builder-block-0");
  });

  it("round-trips exported package JSON back into editable state", () => {
    const original = {
      ...createDefaultCmsBuilderState("punk6529"),
      siteTitle: "A site",
      blocks: [
        createBuilderBlock("heading", 0, { text: "Hello" }),
        createBuilderBlock("callout", 1, {
          title: "Read this",
          text: "Important detail",
        }),
      ],
    };
    const cmsPackage = buildCmsPackageCandidate(
      original,
      new Date("2026-06-17T00:00:00.000Z")
    );

    const parsed = parseCmsPackageCandidateJson(JSON.stringify(cmsPackage));
    const imported = createBuilderStateFromPackage(parsed);

    expect(imported.siteTitle).toBe("A site");
    expect(imported.blocks).toHaveLength(2);
    expect(imported.blocks[1]).toEqual(
      expect.objectContaining({
        kind: "callout",
        title: "Read this",
        text: "Important detail",
      })
    );
  });
});
