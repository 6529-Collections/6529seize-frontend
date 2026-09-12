import fixture from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/minimal-profile-homepage.package.json";
import {
  blockSchema,
  cmsPackageSchema,
  validateCmsPackageV1,
  withComputedCmsHashes,
  type CmsBlockV1,
  type CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";
import { applyCmsDocumentOperation } from "@/lib/profile-cms/studio/document";
import {
  cmsRecoveryFilePath,
  renderRecoveredCmsSite,
} from "@/lib/profile-cms/recovery/static-site";

function fields(block: CmsBlockV1): CmsBlockV1 & Record<string, unknown> {
  return block as CmsBlockV1 & Record<string, unknown>;
}

function nativeDocument(): CmsPackageV1 {
  const cmsPackage = cmsPackageSchema.parse(fixture);
  cmsPackage.site.theme.tokens = {
    studio_revision: 1,
    studio_design: "fund-v2",
  };
  const home = cmsPackage.payload.pages[0]!;
  const detail = {
    ...home,
    id: "page-work",
    path: "/punk6529/work/index.html",
    metadata: {
      ...home.metadata,
      title: "A work record",
      canonical_url: "https://6529.io/punk6529/work",
    },
    blocks: [
      {
        id: "work-description",
        block_type: "rich_text" as const,
        content: "An independently editable work record.",
      },
    ],
  };
  cmsPackage.payload.pages.push(detail);
  cmsPackage.payload.routes.push({
    kind: "page",
    page_id: detail.id,
    path: detail.path,
  });
  home.blocks = blockSchema.array().parse([
    {
      id: "collection-grid",
      block_type: "gallery",
      asset_ids: ["asset-og"],
      items: [
        {
          asset_id: "asset-og",
          title: "A <distinct> title",
          subtitle: "Artist & source",
          page_id: "page-work",
          category: "New work",
        },
      ],
      presentation: { variant: "gallery", span: "full", group: "collection" },
    },
    {
      id: "record-ledger",
      block_type: "callout",
      title: "Accession record",
      content: "Decision approved after review.",
      rows: [{ label: "Reference", value: "CC.26.001", page_id: "page-work" }],
      presentation: { variant: "ledger", span: "half", group: "notes" },
    },
    {
      id: "contact",
      block_type: "callout",
      title: "Contact",
      content: "Write about research or loans.",
      email: "hello@example.org",
      subject: "Loan enquiry",
      form: true,
      presentation: { variant: "contact", span: "half", group: "notes" },
    },
    {
      id: "readable-link",
      block_type: "button_link",
      label: "Read the work",
      href: "/punk6529/work?view=full#work-description",
    },
    {
      id: "canonical-link",
      block_type: "button_link",
      label: "Canonical work link",
      href: "https://6529.io/punk6529/work",
    },
  ]);
  return withComputedCmsHashes(cmsPackage);
}

it("rejects missing nested artwork and record targets before a native document can be saved", () => {
  const cmsPackage = nativeDocument();
  fields(cmsPackage.payload.pages[0]!.blocks[0]!)["items"] = [
    { asset_id: "missing-art", page_id: "missing-work" },
  ];
  fields(cmsPackage.payload.pages[0]!.blocks[1]!)["rows"] = [
    { label: "Decision", value: "Read", page_id: "missing-decision" },
  ];
  const result = validateCmsPackageV1(withComputedCmsHashes(cmsPackage), {
    enforceHashes: true,
  });
  expect(result.valid).toBe(false);
  expect(result.issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: "asset.reference_missing",
        path: "/payload/pages/0/blocks/0/items/0/asset_id",
      }),
      expect.objectContaining({
        code: "page.reference_missing",
        path: "/payload/pages/0/blocks/0/items/0/page_id",
      }),
      expect.objectContaining({
        code: "page.reference_missing",
        path: "/payload/pages/0/blocks/1/rows/0/page_id",
      }),
    ])
  );
});

it("does not reinterpret legacy catchall gallery data as a native extension", () => {
  const cmsPackage = nativeDocument();
  delete cmsPackage.site.theme.tokens;
  fields(cmsPackage.payload.pages[0]!.blocks[0]!)["items"] = {
    preserved: "legacy extension",
  };
  const original = withComputedCmsHashes(cmsPackage);
  expect(validateCmsPackageV1(original, { enforceHashes: true }).valid).toBe(
    true
  );
  expect(cmsPackageSchema.parse(original)).toEqual(original);
});

it("recovers repeated artwork placements with their own annotations and an unannotated fallback", () => {
  const document = nativeDocument();
  const gallery = fields(document.payload.pages[0]!.blocks[0]!);
  gallery["asset_ids"] = ["asset-og", "asset-og", "asset-og"];
  gallery["items"] = [
    { asset_id: "asset-og", title: "First placement", page_id: "page-work" },
    { asset_id: "asset-og", title: "Second placement" },
  ];
  const source = withComputedCmsHashes(document);
  const html = renderRecoveredCmsSite(source).get(
    cmsRecoveryFilePath(source.payload.pages[0]!.path)
  )!;
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const recovered = parsed.getElementById("collection-grid")!;
  expect(recovered.querySelectorAll("img")).toHaveLength(3);
  expect(
    [...recovered.querySelectorAll(".cms-gallery-item h3")].map(
      (heading) => heading.textContent
    )
  ).toEqual(["First placement", "Second placement"]);
  expect(recovered.querySelectorAll(".cms-gallery-item h3 a")).toHaveLength(1);
  expect(gallery["items"]).toEqual([
    { asset_id: "asset-og", title: "First placement", page_id: "page-work" },
    { asset_id: "asset-og", title: "Second placement" },
  ]);
});

it("rejects extra annotations without a canonical artwork placement instead of silently dropping them", () => {
  const document = nativeDocument();
  const gallery = fields(document.payload.pages[0]!.blocks[0]!);
  gallery["items"] = [
    { asset_id: "asset-og", title: "First placement" },
    { asset_id: "asset-og", title: "An annotation without a placement" },
  ];
  const result = validateCmsPackageV1(withComputedCmsHashes(document));
  expect(result.valid).toBe(false);
  expect(result.issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: "block.gallery_item_unlisted",
        path: "/payload/pages/0/blocks/0/items/1/asset_id",
      }),
    ])
  );
});

it.each([
  ["mockup_style", "raw-html"],
  ["mockup_style", 1],
  ["mockup_heading", { html: "unsupported" }],
  ["mockup_footer", null],
  ["mockup_description", ["unsupported"]],
  ["mockup_period", false],
  ["mockup_kicker", 4],
] as const)("rejects malformed project mockup field %s", (key, value) => {
  const document = nativeDocument();
  fields(document.payload.pages[0]!.blocks[1]!)[key] = value;
  const result = validateCmsPackageV1(withComputedCmsHashes(document));
  expect(result.valid).toBe(false);
  expect(result.issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: "block.native_field_invalid",
        path: `/payload/pages/0/blocks/1/${key}`,
      }),
    ])
  );
});

it.each(["planner", "catalogue"])(
  "recovers current %s fields without contradicting them with obsolete fallback prose",
  (style) => {
    const document = nativeDocument();
    const block = fields(document.payload.pages[0]!.blocks[1]!);
    Object.assign(block, {
      title: "An edited project",
      content: "The obsolete project task and status.",
      presentation: { variant: "project", role: "card" },
      mockup_style: style,
      mockup_kicker: "Current workspace",
      mockup_heading: "Current heading",
      mockup_description: "A current description <as text>",
      mockup_period: "Next month",
      mockup_footer: "A current footer",
      rows: [{ label: "Edited task", value: "Ready", page_id: "page-work" }],
    });
    const source = withComputedCmsHashes(document);
    expect(validateCmsPackageV1(source).valid).toBe(true);
    const html = renderRecoveredCmsSite(source).get(
      cmsRecoveryFilePath(source.payload.pages[0]!.path)
    )!;
    const parsed = new DOMParser().parseFromString(html, "text/html");
    const recovered = parsed.getElementById(block.id)!;
    expect(recovered.textContent).not.toContain(block["content"]);
    for (const key of [
      "title",
      "mockup_kicker",
      "mockup_heading",
      "mockup_description",
      "mockup_period",
      "mockup_footer",
    ])
      expect(recovered.textContent).toContain(block[key]);
    expect(recovered.querySelector("dt")?.textContent).toBe("Edited task");
    expect(recovered.querySelector("dd a")?.textContent).toBe("Ready");
    expect(recovered.querySelector("as")).toBeNull();
    expect(block["content"]).toBe("The obsolete project task and status.");
  }
);

it.each([
  [0, "items", "title", 12],
  [0, "items", "subtitle", ["unsupported"]],
  [0, "items", "category", null],
  [1, "rows", "label", undefined],
  [1, "rows", "value", { text: "unsupported" }],
] as const)(
  "rejects malformed native block %i %s.%s rather than silently losing its content",
  (blockIndex, arrayKey, field, value) => {
    const document = nativeDocument();
    const entries = fields(document.payload.pages[0]!.blocks[blockIndex]!)[
      arrayKey
    ] as Record<string, unknown>[];
    if (value === undefined) delete entries[0]![field];
    else entries[0]![field] = value;
    const result = validateCmsPackageV1(withComputedCmsHashes(document));
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "block.native_field_invalid",
          path: `/payload/pages/0/blocks/${blockIndex}/${arrayKey}/0/${field}`,
        }),
      ])
    );
  }
);

it.each([
  ["email", []],
  ["subject", 99],
  ["form", "true"],
] as const)("rejects a malformed contact %s", (field, value) => {
  const document = nativeDocument();
  fields(document.payload.pages[0]!.blocks[2]!)[field] = value;
  expect(validateCmsPackageV1(withComputedCmsHashes(document)).issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: "block.native_field_invalid",
        path: `/payload/pages/0/blocks/2/${field}`,
      }),
    ])
  );
});

it("preserves unknown item extensions and every unannotated canonical artwork", () => {
  const document = nativeDocument();
  document.payload.assets.push({
    ...document.payload.assets[0]!,
    id: "asset-second",
    alt_text: "An unannotated second work",
  });
  const gallery = fields(document.payload.pages[0]!.blocks[0]!);
  gallery["asset_ids"] = ["asset-og", "asset-second"];
  (gallery["items"] as Record<string, unknown>[])[0]!["curatorial_extension"] =
    { reviewed: true, notes: ["Retain this"] };
  const original = withComputedCmsHashes(document);
  expect(validateCmsPackageV1(original, { enforceHashes: true }).valid).toBe(
    true
  );
  expect(cmsPackageSchema.parse(original)).toEqual(original);
  const html = renderRecoveredCmsSite(original).get(
    cmsRecoveryFilePath(original.site.base_path)
  )!;
  const parsed = new DOMParser().parseFromString(html, "text/html");
  expect(
    parsed.getElementById("collection-grid")!.querySelectorAll("img")
  ).toHaveLength(2);
  expect(parsed.getElementById("collection-grid")!.textContent).toContain(
    "An unannotated second work"
  );
});

it("validates a section target on its destination page and retains it in the archive", () => {
  const document = nativeDocument();
  const home = document.payload.pages[0]!;
  home.blocks = blockSchema.array().parse([
    {
      id: "section-link",
      block_type: "button_link",
      label: "Read the record",
      page_id: "page-work",
      block_id: "work-description",
    },
  ]);
  const valid = withComputedCmsHashes(document);
  expect(validateCmsPackageV1(valid, { enforceHashes: true }).valid).toBe(true);
  expect(
    renderRecoveredCmsSite(valid).get(cmsRecoveryFilePath(valid.site.base_path))
  ).toContain('href="cms-work/index.html#work-description"');
  const deletion = applyCmsDocumentOperation(
    valid,
    valid.integrity.package_hash,
    {
      type: "remove_block",
      pageId: "page-work",
      blockId: "work-description",
    }
  );
  expect(deletion).toMatchObject({
    ok: false,
    error: { code: "document.inbound_reference" },
  });
  fields(home.blocks[0]!)["block_id"] = "collection-grid";
  expect(validateCmsPackageV1(withComputedCmsHashes(document)).issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: "block.reference_missing",
        path: "/payload/pages/0/blocks/0/block_id",
      }),
    ])
  );
});

it("retains the artwork enquiry subject in an archival email fallback", () => {
  const document = nativeDocument();
  document.payload.pages[1]!.blocks.push(
    blockSchema.parse({
      id: "inquiry-email",
      block_type: "callout",
      email: "loans@example.org",
      subject: "General enquiry",
      presentation: { variant: "contact" },
    })
  );
  document.payload.pages[0]!.blocks.push(
    blockSchema.parse({
      id: "inquiry-link",
      block_type: "button_link",
      page_id: "page-work",
      subject: "Work: Blue & Red\r\nBcc: nobody",
      label: "Enquire",
    })
  );
  const html = renderRecoveredCmsSite(document).get(
    cmsRecoveryFilePath(document.site.base_path)
  )!;
  expect(html).toContain(
    'href="mailto:loans@example.org?subject=Work%3A%20Blue%20%26%20Red%20%20Bcc%3A%20nobody"'
  );
  expect(html).not.toContain("%0D");
  expect(html).not.toContain("%0A");
});

it("keeps nested page references when routes change and prevents deleting referenced pages or media", () => {
  const original = nativeDocument();
  const renamed = applyCmsDocumentOperation(
    original,
    original.integrity.package_hash,
    { type: "rename_page_route", pageId: "page-work", slug: "the-work" }
  );
  expect(renamed.ok).toBe(true);
  if (!renamed.ok) throw new Error("Expected route rename");
  expect(
    fields(renamed.document.payload.pages[0]!.blocks[0]!)["items"]
  ).toEqual(fields(original.payload.pages[0]!.blocks[0]!)["items"]);
  expect(fields(renamed.document.payload.pages[0]!.blocks[3]!)["href"]).toBe(
    "/punk6529/the-work?view=full#work-description"
  );
  expect(original.payload.pages[1]!.path).toBe("/punk6529/work/index.html");
  for (const operation of [
    { type: "delete_page" as const, pageId: "page-work" },
    { type: "remove_asset" as const, assetId: "asset-og" },
  ]) {
    expect(
      applyCmsDocumentOperation(
        original,
        original.integrity.package_hash,
        operation
      )
    ).toMatchObject({ ok: false });
  }
});

it.each([0, 1])(
  "protects a page referenced only by native block %i",
  (blockIndex) => {
    const original = nativeDocument();
    const home = original.payload.pages[0]!;
    home.blocks = [home.blocks[blockIndex]!];
    const document = withComputedCmsHashes(original);
    const result = applyCmsDocumentOperation(
      document,
      document.integrity.package_hash,
      {
        type: "delete_page",
        pageId: "page-work",
      }
    );
    expect(result).toMatchObject({ ok: false });
    if (result.ok) throw new Error("Expected a referenced page to be retained");
    expect(result.error.code).toBe("document.inbound_reference");
  }
);

it("recovers complete artwork cards, linked records and readable URLs as local archive pages", () => {
  const original = nativeDocument();
  const files = renderRecoveredCmsSite(original);
  const html = files.get(cmsRecoveryFilePath(original.site.base_path))!;
  expect(html).toContain('data-design="fund-v2"');
  expect(html).toContain("cms-variant-ledger");
  expect(html).toContain("A &lt;distinct&gt; title");
  expect(html).toContain("Artist &amp; source");
  expect(html).toContain("CC.26.001");
  expect(html).toContain(
    'href="cms-work/index.html?view=full#work-description"'
  );
  expect(html).toContain('href="cms-work/index.html"');
  expect(html).toContain(
    'href="mailto:hello@example.org?subject=Loan%20enquiry"'
  );
  expect(html).not.toContain("<form");
  expect(html).not.toContain("<script");
  expect(html).not.toContain("api.6529.io");
  expect(
    files.get(cmsRecoveryFilePath(original.payload.pages[1]!.path))
  ).toContain("An independently editable work record.");
});

it("never turns author presentation values or contact fields into executable archive content", () => {
  const cmsPackage = nativeDocument();
  const home = cmsPackage.payload.pages[0]!;
  fields(home.blocks[0]!)["presentation"] = {
    variant: '\"><script>alert(1)</script>',
    span: 'full" onclick="alert(1)',
    group: "unsafe",
  };
  fields(home.blocks[2]!)["email"] = 'hello@example.org\" onclick=\"alert(1)';
  fields(home.blocks[2]!)["content"] = '<img src=x onerror="alert(1)">';
  const html = renderRecoveredCmsSite(cmsPackage).get(
    cmsRecoveryFilePath(cmsPackage.site.base_path)
  )!;
  expect(html).not.toContain("<script");
  expect(html).not.toContain(' onclick="');
  expect(html).not.toContain('href="mailto:');
  expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
});
