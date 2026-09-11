import {
  cmsPackageSchema,
  validateCmsPackageV1,
  withComputedCmsHashes,
  type CmsPackageV1,
  type CmsPageV1,
  type CmsBlockV1,
} from "@/lib/profile-cms/protocol/v1";
import {
  applyCmsDocumentOperation,
  type CmsDocumentOperation,
} from "@/lib/profile-cms/studio/document";
import roomFixture from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/exhibition-room.package.json";

type TestPage = Omit<CmsPageV1, "blocks"> & {
  blocks: (CmsBlockV1 & Record<string, unknown>)[];
};
type TestDocument = Omit<CmsPackageV1, "payload"> & {
  payload: Omit<CmsPackageV1["payload"], "pages"> & { pages: TestPage[] };
};

function fixture(): TestDocument {
  const document = cmsPackageSchema.parse(roomFixture);
  const source: NonNullable<CmsPackageV1["payload"]["source_packets"]>[number] &
    Record<string, unknown> = {
    id: "source-curation",
    source_type: "import",
    captured_at: document.provenance.created_at,
    evidence: {
      original: ["Keep this unknown source data", { approved: true }],
    },
  };
  document.payload.source_packets = [source];
  return withComputedCmsHashes(document);
}

it("explicitly clears optional sharing images without changing other page metadata", () => {
  const document = fixture();
  const page = document.payload.pages[0]!;
  page.metadata.social_image_asset_id = document.payload.assets[0]!.id;
  const hashed = withComputedCmsHashes(document);
  const result = apply(hashed, {
    type: "update_page_metadata",
    pageId: page.id,
    patch: { robots: "noindex" },
    removeFields: ["social_image_asset_id"],
  });
  expect(result.payload.pages[0]!.metadata).not.toHaveProperty(
    "social_image_asset_id"
  );
  expect(result.payload.pages[0]!.metadata).toMatchObject({
    title: page.metadata.title,
    canonical_url: page.metadata.canonical_url,
    robots: "noindex",
  });
  expect(hashed.payload.pages[0]!.metadata.social_image_asset_id).toBe(
    document.payload.assets[0]!.id
  );
});

function page(id = "page-notes", slug = "notes"): TestPage {
  return {
    id,
    type: "page",
    path: `/punk6529/${slug}/index.html`,
    metadata: {
      title: "Notes",
      description: "Full source document",
      locale: "en",
      canonical_url: `https://6529.io/punk6529/${slug}`,
    },
    source: {
      source_packet_id: "source-curation",
      field_sources: { title: "original-title" },
    },
    blocks: [
      {
        id: "block-notes",
        block_type: "rich_text",
        content: "Preserved text",
        custom: { nested: [1, true, "extension"] },
      },
    ],
  };
}

function apply(
  document: CmsPackageV1,
  operation: CmsDocumentOperation
): TestDocument {
  const result = applyCmsDocumentOperation(
    document,
    document.integrity.package_hash,
    operation
  );
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  expect(
    validateCmsPackageV1(result.document, { enforceHashes: true }).valid
  ).toBe(true);
  return result.document;
}

it.each([
  "/punk6529/notes",
  "/punk6529/notes?view=all",
  "/punk6529/notes#block-notes",
])("rejects page deletion with live clean URL %s", (url) => {
  const document = apply(fixture(), { type: "create_page", page: page() });
  document.payload.navigation[0]!.items.push({ label: "Notes", url });
  const hashed = withComputedCmsHashes(document);
  expect(
    applyCmsDocumentOperation(hashed, hashed.integrity.package_hash, {
      type: "delete_page",
      pageId: "page-notes",
    })
  ).toMatchObject({ ok: false, error: { code: "document.inbound_reference" } });
  expect(hashed.payload.pages.some((item) => item.id === "page-notes")).toBe(
    true
  );
});

it.each(["remove", "move"])(
  "rejects %s of a block with clean URL fragment references",
  (action) => {
    const document = apply(fixture(), { type: "create_page", page: page() });
    document.payload.navigation[0]!.items.push({
      label: "Note section",
      url: "/punk6529/notes?view=all#block-notes",
    });
    const hashed = withComputedCmsHashes(document);
    const operation: CmsDocumentOperation =
      action === "remove"
        ? { type: "remove_block", pageId: "page-notes", blockId: "block-notes" }
        : {
            type: "move_block",
            pageId: "page-notes",
            blockId: "block-notes",
            targetPageId: document.payload.pages[0]!.id,
            index: 0,
          };
    expect(
      applyCmsDocumentOperation(
        hashed,
        hashed.integrity.package_hash,
        operation
      )
    ).toMatchObject({
      ok: false,
      error: { code: "document.inbound_reference" },
    });
  }
);

function expectError(
  document: CmsPackageV1,
  operation: CmsDocumentOperation,
  code: string
): void {
  const before = JSON.stringify(document);
  expect(
    applyCmsDocumentOperation(
      document,
      document.integrity.package_hash,
      operation
    )
  ).toEqual({ ok: false, error: expect.objectContaining({ code }) });
  expect(JSON.stringify(document)).toBe(before);
}

function notesDocument(): TestDocument {
  return apply(fixture(), { type: "create_page", page: page() });
}

describe("full CMS studio document operations", () => {
  it("selects a homepage by retargeting the root alias and ordering the chosen page first", () => {
    const document = notesDocument();
    const root = document.payload.routes[0]!;
    root.kind = "alias";
    root.target = "/punk6529/studio/index.html";
    delete root.page_id;
    document.payload.pages[0]!.path = "/punk6529/studio/index.html";
    document.payload.routes.push({
      kind: "page",
      page_id: "page-room",
      path: "/punk6529/studio/index.html",
    });
    document.payload.build_manifest!.route_count =
      document.payload.routes.length;
    const current = withComputedCmsHashes(document);
    const selected = apply(current, {
      type: "set_home_page",
      pageId: "page-notes",
    });
    expect(selected.payload.pages.map((entry) => entry.id)).toEqual([
      "page-notes",
      "page-room",
      "page-nft",
    ]);
    expect(selected.payload.routes[0]).toEqual({
      kind: "alias",
      path: "/punk6529/index.html",
      target: "/punk6529/notes/index.html",
    });
    expect(selected.site.base_path).toBe("/punk6529/index.html");
    expect(selected.payload.navigation).toEqual(current.payload.navigation);
    expect(selected.payload.assets).toEqual(current.payload.assets);
    expectError(
      notesDocument(),
      { type: "set_home_page", pageId: "page-notes" },
      "document.required_page"
    );
  });

  it("rejects a new path that collides after case-insensitive handle normalization", () => {
    const document = notesDocument();
    const existing = document.payload.pages.at(-1)!;
    existing.path = "/PUNK6529/notes/index.html";
    document.payload.routes.at(-1)!.path = existing.path;
    expectError(
      withComputedCmsHashes(document),
      { type: "create_page", page: page("page-collision") },
      "document.duplicate_path"
    );
  });

  it("rejects moving an anchored block to a different page without retargeting author links", () => {
    const document = notesDocument();
    document.payload.pages.at(-1)!.blocks.push({
      id: "block-anchor-link",
      block_type: "button_link",
      href: "#block-notes",
      label: "Read",
    });
    expectError(
      withComputedCmsHashes(document),
      {
        type: "move_block",
        pageId: "page-notes",
        blockId: "block-notes",
        targetPageId: "page-room",
        index: 0,
      },
      "document.inbound_reference"
    );
  });

  it("adds media and its image block atomically, edits alt text, and rejects referenced removal", () => {
    const document = notesDocument();
    const asset = {
      ...document.payload.assets[0]!,
      id: "asset-new",
      kind: "image" as const,
      uri: "https://example.com/new.png",
      mime_type: "image/png",
      width: 640,
      height: 480,
      alt_text: "A new artwork",
    };
    const updated = apply(document, {
      type: "batch",
      operations: [
        {
          type: "add_block",
          pageId: "page-notes",
          block: {
            id: "block-new-image",
            block_type: "image",
            asset_id: asset.id,
          },
        },
        { type: "add_asset", asset },
      ],
    });
    expect(updated.payload.build_manifest?.asset_count).toBe(3);
    const edited = apply(updated, {
      type: "update_asset",
      assetId: asset.id,
      patch: { alt_text: "Reviewed alt text", rights: "Creator approved" },
    });
    expect(edited.payload.assets.at(-1)).toEqual({
      ...asset,
      alt_text: "Reviewed alt text",
      rights: "Creator approved",
    });
    expectError(
      edited,
      { type: "remove_asset", assetId: asset.id },
      "document.inbound_reference"
    );
    const removed = apply(edited, {
      type: "batch",
      operations: [
        { type: "remove_asset", assetId: asset.id },
        {
          type: "remove_block",
          pageId: "page-notes",
          blockId: "block-new-image",
        },
      ],
    });
    expect(removed.payload.assets).toEqual(document.payload.assets);
    expect(removed.payload.build_manifest?.asset_count).toBe(2);
    expectError(
      updated,
      { type: "add_asset", asset },
      "document.duplicate_asset_id"
    );
    expectError(
      updated,
      {
        type: "update_asset",
        assetId: asset.id,
        patch: { uri: "javascript:alert(1)" },
      },
      "document.invalid_result"
    );
    expectError(
      updated,
      { type: "update_asset", assetId: asset.id, patch: { width: 0 } },
      "document.invalid_asset_patch"
    );
  });

  it("renames a page URL and known references, retaining IDs, suffixes, and authored content", () => {
    const document = notesDocument();
    document.payload.routes.push({
      kind: "alias",
      path: "/punk6529/alias/index.html",
      target: "/punk6529/notes/index.html",
    });
    document.payload.build_manifest!.route_count =
      document.payload.routes.length;
    document.payload.navigation[0]!.items.push({
      label: "Notes",
      children: [
        { label: "By ID", page_id: "page-notes" },
        { label: "By URL", url: "/punk6529/notes?from=menu#intro" },
      ],
    });
    document.payload.pages[0]!.blocks.push({
      id: "block-notes-button",
      block_type: "button_link",
      label: "Read",
      href: "https://6529.io/punk6529/notes/index.html?source=home#intro",
    });
    const current = withComputedCmsHashes(document);
    const renamed = apply(current, {
      type: "rename_page_route",
      pageId: "page-notes",
      slug: "notes-new",
    });
    expect(renamed.payload.pages.at(-1)).toEqual({
      ...document.payload.pages.at(-1),
      path: "/punk6529/notes-new/index.html",
      metadata: {
        ...document.payload.pages.at(-1)?.metadata,
        canonical_url: "https://6529.io/punk6529/notes-new",
      },
    });
    expect(renamed.payload.routes.at(-1)?.target).toBe(
      "/punk6529/notes-new/index.html"
    );
    expect(renamed.payload.navigation[0]?.items[1]?.children).toEqual([
      { label: "By ID", page_id: "page-notes" },
      { label: "By URL", url: "/punk6529/notes-new?from=menu#intro" },
    ]);
    expect(renamed.payload.pages[0]?.blocks.at(-1)?.["href"]).toBe(
      "https://6529.io/punk6529/notes-new/index.html?source=home#intro"
    );
    expect(
      apply(renamed, {
        type: "rename_page_route",
        pageId: "page-notes",
        slug: "notes-new",
      })
    ).toEqual(renamed);
  });

  it("rejects route renames that would silently break unknown source or Markdown references", () => {
    const document = notesDocument();
    document.payload.pages[0]!.blocks.push({
      id: "block-read-notes",
      block_type: "rich_text",
      content: "Read [the notes](/punk6529/notes).",
    });
    expectError(
      withComputedCmsHashes(document),
      { type: "rename_page_route", pageId: "page-notes", slug: "journal" },
      "document.inbound_reference"
    );
    expectError(
      document,
      { type: "rename_page_route", pageId: "page-notes", slug: "cms" },
      "document.stale_base"
    );
    expectError(
      notesDocument(),
      { type: "rename_page_route", pageId: "page-notes", slug: "cms" },
      "document.invalid_page_path"
    );
  });

  it("makes a newly created page discoverable by adding a navigation item in the same batch", () => {
    const document = fixture();
    const updated = apply(document, {
      type: "batch",
      operations: [
        {
          type: "add_navigation_item",
          navigationId: "nav-main",
          item: { label: "Notes", page_id: "page-notes" },
          index: 0,
        },
        { type: "create_page", page: page() },
      ],
    });
    expect(
      updated.payload.navigation[0]?.items.map((item) => item.label)
    ).toEqual(["Notes", "Room"]);
    expectError(
      document,
      {
        type: "add_navigation_item",
        navigationId: "nav-main",
        item: { label: "Unsafe", url: "javascript:alert(1)" },
      },
      "document.invalid_result"
    );
  });

  it("edits a legacy nested page without losing rooms, sources, assets, envelopes, or IDs", () => {
    const document = fixture();
    const before = JSON.stringify(document);
    const updated = apply(document, {
      type: "update_page_metadata",
      pageId: "page-nft",
      patch: { title: "Changed title", robots: "noindex" },
    });
    expect(JSON.stringify(document)).toBe(before);
    expect(updated.payload.pages[1]).toEqual({
      ...document.payload.pages[1],
      metadata: {
        ...document.payload.pages[1]?.metadata,
        title: "Changed title",
        robots: "noindex",
      },
    });
    expect({ ...updated.payload, pages: [] }).toEqual({
      ...document.payload,
      pages: [],
    });
    expect(updated.signatures).toEqual(document.signatures);
    expect(updated.storage).toEqual(document.storage);
    expect(updated.provenance).toEqual(document.provenance);
    expect(updated.integrity.package_hash).not.toBe(
      document.integrity.package_hash
    );
    expect(updated.payload.exhibition_rooms).not.toBe(
      document.payload.exhibition_rooms
    );
  });

  it("rejects a stale hash and detects unhashed changes to the current document", () => {
    const document = fixture();
    const operation: CmsDocumentOperation = {
      type: "update_site",
      patch: { title: "New" },
    };
    expect(
      applyCmsDocumentOperation(document, `sha256:${"0".repeat(64)}`, operation)
    ).toEqual({ ok: false, error: { code: "document.stale_base" } });
    document.site.title = "Unhashed edit";
    expectError(document, operation, "document.stale_base");
  });

  it("adds a page route and only updates the existing build route count", () => {
    const document = fixture();
    const input = page();
    const updated = apply(document, { type: "create_page", page: input });
    expect(updated.payload.pages.at(-1)).toEqual(input);
    expect(updated.payload.routes.at(-1)).toEqual({
      kind: "page",
      path: input.path,
      page_id: input.id,
    });
    expect(updated.payload.build_manifest).toEqual({
      ...document.payload.build_manifest,
      route_count: 3,
    });
    expect(updated.payload.navigation).toEqual(document.payload.navigation);
    input.blocks[0]!["content"] = "Input changed later";
    expect(updated.payload.pages.at(-1)?.blocks[0]?.["content"]).toBe(
      "Preserved text"
    );
    expectError(
      updated,
      { type: "create_page", page: page() },
      "document.duplicate_page_id"
    );
    expectError(
      updated,
      { type: "create_page", page: page("page-other") },
      "document.duplicate_path"
    );
  });

  it.each([
    "../escape",
    "cms",
    "brain",
    "%2e%2e",
    "Upper",
    "double//path",
    "a".repeat(81),
  ])("rejects unsafe or reserved new page slug %s", (slug) => {
    expectError(
      fixture(),
      { type: "create_page", page: page("page-invalid", slug) },
      "document.invalid_page_path"
    );
  });

  it("duplicates complete page content with deterministic unique block IDs", () => {
    const document = notesDocument();
    const operation: CmsDocumentOperation = {
      type: "duplicate_page",
      pageId: "page-notes",
      newPageId: "page-copy",
      path: "/punk6529/copy/index.html",
      canonicalUrl: "https://6529.io/punk6529/copy",
    };
    const updated = apply(document, operation);
    const duplicate = updated.payload.pages.at(-1)!;
    expect(duplicate.id).toBe("page-copy");
    expect(duplicate.blocks[0]?.id).not.toBe("block-notes");
    expect(duplicate.blocks[0]).toEqual({
      ...document.payload.pages.at(-1)?.blocks[0],
      id: duplicate.blocks[0]?.id,
    });
    expect(duplicate.source).toEqual(document.payload.pages.at(-1)?.source);
    expect(apply(document, operation)).toEqual(updated);
    const allBlockIds = updated.payload.pages.flatMap((entry) =>
      entry.blocks.map((block) => block.id)
    );
    expect(new Set(allBlockIds).size).toBe(allBlockIds.length);
  });

  it.each([
    "block-notes",
    "#block-notes",
    "/punk6529/notes/index.html#block-notes",
  ])(
    "refuses to guess how to retarget copied extension reference %s",
    (target) => {
      const document = notesDocument();
      document.payload.pages.at(-1)!.blocks[0]!["custom"] = { target };
      expectError(
        withComputedCmsHashes(document),
        {
          type: "duplicate_page",
          pageId: "page-notes",
          newPageId: "page-copy",
          path: "/punk6529/copy/index.html",
          canonicalUrl: "https://6529.io/punk6529/copy",
        },
        "document.duplicate_references"
      );
    }
  );

  it("reorders pages without retargeting navigation or archive routes", () => {
    const document = notesDocument();
    const updated = apply(document, {
      type: "reorder_pages",
      pageIds: ["page-notes", "page-room", "page-nft"],
    });
    expect(updated.payload.pages.map((entry) => entry.id)).toEqual([
      "page-notes",
      "page-room",
      "page-nft",
    ]);
    expect(updated.payload.routes).toEqual(document.payload.routes);
    expect(updated.payload.navigation).toEqual(document.payload.navigation);
    expectError(
      document,
      {
        type: "reorder_pages",
        pageIds: ["page-notes", "page-room", "page-room"],
      },
      "document.invalid_order"
    );
    expectError(
      document,
      { type: "reorder_pages", pageIds: ["page-room"] },
      "document.invalid_order"
    );
  });

  it("protects required home pages and pages referenced by exhibition rooms", () => {
    const document = fixture();
    expectError(
      document,
      { type: "delete_page", pageId: "page-room" },
      "document.required_page"
    );
    expectError(
      document,
      { type: "delete_page", pageId: "page-nft" },
      "document.inbound_reference"
    );
  });

  it("allows deliberate navigation removal and page deletion in one atomic batch, in either order", () => {
    const document = notesDocument();
    document.payload.navigation[0]!.items.push({
      label: "Notes",
      page_id: "page-notes",
    });
    const current = withComputedCmsHashes(document);
    const removeNavigation: CmsDocumentOperation = {
      type: "remove_navigation_item",
      navigationId: "nav-main",
      itemPath: [1],
    };
    const removePage: CmsDocumentOperation = {
      type: "delete_page",
      pageId: "page-notes",
    };
    expectError(current, removePage, "document.inbound_reference");
    const updated = apply(current, {
      type: "batch",
      operations: [removePage, removeNavigation],
    });
    expect(
      apply(current, {
        type: "batch",
        operations: [removeNavigation, removePage],
      })
    ).toEqual(updated);
    expect(updated.payload.pages).toHaveLength(2);
    expect(updated.payload.routes).toHaveLength(2);
    expect(updated.payload.assets).toEqual(document.payload.assets);
    expect(updated.payload.source_packets).toEqual(
      document.payload.source_packets
    );
  });

  it.each([
    "/punk6529/notes/index.html",
    "https://6529.io/punk6529/notes?source=nav",
    "Read [notes](/punk6529/notes/index.html#section)",
  ])(
    "blocks deletion with an inbound URL or Markdown reference: %s",
    (value) => {
      const document = notesDocument();
      document.payload.pages[0]!.blocks.push({
        id: "block-link",
        block_type: "rich_text",
        content: value,
      });
      expectError(
        withComputedCmsHashes(document),
        { type: "delete_page", pageId: "page-notes" },
        "document.inbound_reference"
      );
    }
  );

  it("rejects block deletion when an extension still refers to its stable ID", () => {
    const document = notesDocument();
    document.payload.pages[0]!.blocks.push({
      id: "block-related",
      block_type: "rich_text",
      references: { selected: "block-notes" },
    });
    const current = withComputedCmsHashes(document);
    expectError(
      current,
      { type: "remove_block", pageId: "page-notes", blockId: "block-notes" },
      "document.inbound_reference"
    );
    const updated = apply(current, {
      type: "batch",
      operations: [
        { type: "remove_block", pageId: "page-notes", blockId: "block-notes" },
        { type: "remove_block", pageId: "page-room", blockId: "block-related" },
      ],
    });
    expect(updated.payload.pages.at(-1)?.blocks).toEqual([]);
  });

  it("updates only requested block fields and explicitly clears internal link targets", () => {
    const document = notesDocument();
    const updated = apply(document, {
      type: "update_block",
      pageId: "page-notes",
      blockId: "block-notes",
      patch: { content: "Edited" },
    });
    expect(updated.payload.pages.at(-1)?.blocks[0]).toEqual({
      ...document.payload.pages.at(-1)?.blocks[0],
      content: "Edited",
    });
    const withButton = apply(updated, {
      type: "add_block",
      pageId: "page-notes",
      block: {
        id: "block-button",
        block_type: "button_link",
        label: "Read",
        page_id: "page-nft",
        extra: { preserve: true },
      },
    });
    const external = apply(withButton, {
      type: "update_block",
      pageId: "page-notes",
      blockId: "block-button",
      patch: { href: "https://example.com" },
      removeFields: ["page_id"],
    });
    expect(external.payload.pages.at(-1)?.blocks.at(-1)).toEqual({
      id: "block-button",
      block_type: "button_link",
      label: "Read",
      href: "https://example.com",
      extra: { preserve: true },
    });
    expectError(
      document,
      {
        type: "update_block",
        pageId: "page-notes",
        blockId: "block-notes",
        patch: { id: "block-replacement" },
      },
      "document.block_identity"
    );
    expectError(
      document,
      {
        type: "update_block",
        pageId: "page-notes",
        blockId: "block-notes",
        patch: {},
        removeFields: ["block_type"],
      },
      "document.block_identity"
    );
  });

  it("duplicates and moves blocks while preserving their unknown fields and stable identity", () => {
    const document = notesDocument();
    const duplicate = apply(document, {
      type: "duplicate_block",
      pageId: "page-notes",
      blockId: "block-notes",
      newBlockId: "block-copy",
      index: 0,
    });
    expect(
      duplicate.payload.pages.at(-1)?.blocks.map((block) => block.id)
    ).toEqual(["block-copy", "block-notes"]);
    const reordered = apply(duplicate, {
      type: "move_block",
      pageId: "page-notes",
      blockId: "block-copy",
      targetPageId: "page-notes",
      index: 1,
    });
    expect(
      reordered.payload.pages.at(-1)?.blocks.map((block) => block.id)
    ).toEqual(["block-notes", "block-copy"]);
    const moved = apply(reordered, {
      type: "move_block",
      pageId: "page-notes",
      blockId: "block-copy",
      targetPageId: "page-nft",
      index: 0,
    });
    expect(moved.payload.pages[1]?.blocks[0]).toEqual(
      duplicate.payload.pages.at(-1)?.blocks[0]
    );
    expectError(
      document,
      {
        type: "duplicate_block",
        pageId: "page-notes",
        blockId: "block-notes",
        newBlockId: "block-notes",
      },
      "document.duplicate_block_id"
    );
    expectError(
      document,
      {
        type: "move_block",
        pageId: "page-notes",
        blockId: "block-notes",
        targetPageId: "page-nft",
        index: -1,
      },
      "document.invalid_index"
    );
  });

  it("rolls back a whole batch if a later operation fails validation", () => {
    const document = notesDocument();
    expectError(
      document,
      {
        type: "batch",
        operations: [
          { type: "update_site", patch: { title: "Should not escape" } },
          {
            type: "update_page_metadata",
            pageId: "page-notes",
            patch: { canonical_url: "javascript:alert(1)" },
          },
        ],
      },
      "document.invalid_result"
    );
  });

  it("edits nested navigation labels and order without replacing destinations or children", () => {
    const document = notesDocument();
    document.payload.navigation[0]!.items.push({
      label: "Read",
      children: [
        { label: "Notes", page_id: "page-notes" },
        { label: "External", url: "https://example.com" },
      ],
    });
    const current = withComputedCmsHashes(document);
    const updated = apply(current, {
      type: "batch",
      operations: [
        {
          type: "update_navigation_label",
          navigationId: "nav-main",
          itemPath: [1, 0],
          label: "Journal",
        },
        {
          type: "reorder_navigation",
          navigationId: "nav-main",
          parentPath: [1],
          indices: [1, 0],
        },
      ],
    });
    expect(updated.payload.navigation[0]?.items[1]?.children).toEqual([
      { label: "External", url: "https://example.com" },
      { label: "Journal", page_id: "page-notes" },
    ]);
    expectError(
      current,
      {
        type: "reorder_navigation",
        navigationId: "nav-main",
        parentPath: [1],
        indices: [0, 0],
      },
      "document.invalid_order"
    );
    expectError(
      current,
      {
        type: "update_navigation_label",
        navigationId: "nav-main",
        itemPath: [1, 0],
        label: " ",
      },
      "document.navigation_label"
    );
  });

  it("limits authorable presentation tokens while retaining unknown existing tokens", () => {
    const document = fixture();
    document.site.theme.tokens = {
      imported_style: "untouched",
      studio_palette: "ink",
    };
    const current = withComputedCmsHashes(document);
    const updated = apply(current, {
      type: "update_site",
      patch: {
        title: "Publication",
        description: "Description",
        theme: {
          mode: "light",
          accent: "#AABBCC",
          tokens: {
            studio_revision: 1,
            studio_layout: "journal",
            studio_palette: "paper",
          },
        },
      },
    });
    expect(updated.site.theme.tokens).toEqual({
      imported_style: "untouched",
      studio_revision: 1,
      studio_layout: "journal",
      studio_palette: "paper",
    });
    const unsupported = {
      type: "update_site",
      patch: {
        theme: { tokens: { arbitrary_css: "url(https://example.com)" } },
      },
    } as unknown as CmsDocumentOperation;
    expectError(current, unsupported, "document.invalid_site_patch");
  });
});
