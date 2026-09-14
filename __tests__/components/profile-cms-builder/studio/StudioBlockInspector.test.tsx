import { fireEvent, render, screen, within } from "@testing-library/react";

import StudioBlockInspector from "@/components/profile-cms-builder/studio/StudioBlockInspector";
import { ApprovedBlock } from "@/components/profile-cms/approved-renderer/Blocks";
import { createRendererContext } from "@/components/profile-cms/site-renderer/data";
import {
  cmsPackageSchema,
  validateCmsPackageV1,
  withComputedCmsHashes,
  type CmsBlockV1,
  type CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";
import { applyCmsDocumentOperation } from "@/lib/profile-cms/studio/document";
import roomFixture from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/exhibition-room.package.json";

it("edits gallery metadata and image order together without dropping item extensions", () => {
  const result = inspectBlock({
    id: "approved-gallery",
    block_type: "gallery",
    title: "My collection",
    asset_ids: ["asset-room-work", "asset-room-poster"],
    items: [
      {
        asset_id: "asset-room-work",
        title: "First work",
        subtitle: "Artist one",
        category: "Paintings",
        provenance: { note: "Preserve me" },
      },
      {
        asset_id: "asset-room-poster",
        title: "Second work",
        subtitle: "Artist two",
        category: "Prints",
      },
    ],
    categories: ["Paintings", "Prints"],
    presentation: { variant: "gallery", group: "collection", span: "full" },
  });
  const summaries = screen.getAllByText(/First work|Second work/);
  summaries.forEach((summary) => fireEvent.click(summary));
  fireEvent.change(screen.getAllByLabelText("Artwork title")[0]!, {
    target: { value: "Revised title" },
  });
  fireEvent.click(screen.getAllByRole("button", { name: "Move down" })[0]!);
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.block()?.["asset_ids"]).toEqual([
    "asset-room-poster",
    "asset-room-work",
  ]);
  expect(result.block()?.["items"]).toEqual([
    {
      asset_id: "asset-room-poster",
      title: "Second work",
      subtitle: "Artist two",
      category: "Prints",
    },
    {
      asset_id: "asset-room-work",
      title: "Revised title",
      subtitle: "Artist one",
      category: "Paintings",
      provenance: { note: "Preserve me" },
    },
  ]);
  expect(result.block()?.["presentation"]).toEqual({
    variant: "gallery",
    group: "collection",
    span: "full",
  });
});

it("removes an artwork image's optional page link explicitly", () => {
  const result = inspectBlock({
    id: "linked-image",
    block_type: "image",
    asset_id: "asset-room-work",
    page_id: "page-nft",
  });
  fireEvent.change(screen.getByLabelText("Destination"), {
    target: { value: "" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.block()).not.toHaveProperty("page_id");
  expect(result.block()?.["asset_id"]).toBe("asset-room-work");
});

it.each([true, false])(
  "only toggles the list mode while preserving imported gallery values (enabled: %s)",
  (enabled) => {
    const imported = [
      "filmstrip",
      { layout: "future-mode" },
      "grid",
      "filmstrip",
      42,
    ];
    const result = inspectBlock({
      id: "imported-modes",
      block_type: "gallery",
      asset_ids: ["asset-room-work"],
      items: [{ asset_id: "asset-room-work", title: "A work" }],
      display_modes: enabled ? [...imported, "list", "list"] : imported,
    });
    fireEvent.click(screen.getByLabelText("Offer gallery and list views"));
    fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
    expect(result.block()?.["display_modes"]).toEqual(
      enabled ? imported : [...imported, "list"]
    );
  }
);

it("preserves unannotated artworks and duplicate placements when editing one gallery caption", () => {
  const result = inspectBlock({
    id: "partial-captions",
    block_type: "gallery",
    title: "Collection",
    asset_ids: ["asset-room-work", "asset-room-work", "asset-room-poster"],
    items: [{ asset_id: "asset-room-work", title: "A work" }],
  });
  fireEvent.click(screen.getByText(/1\. A work/));
  fireEvent.change(screen.getByLabelText("Artwork title"), {
    target: { value: "New caption" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.block()?.["asset_ids"]).toEqual([
    "asset-room-work",
    "asset-room-work",
    "asset-room-poster",
  ]);
  expect(result.block()?.["items"]).toEqual([
    { asset_id: "asset-room-work", title: "New caption" },
  ]);
});

const MIXED_GALLERY_ORDER = [
  "unannotated-before",
  "asset-room-work",
  "unannotated-between",
  "asset-room-poster",
  "unannotated-after",
];
const UNANNOTATED_IMAGES = [
  "unannotated-before",
  "unannotated-between",
  "unannotated-after",
];

function inspectMixedGallery() {
  return inspectBlock(
    {
      id: "mixed-gallery",
      block_type: "gallery",
      asset_ids: MIXED_GALLERY_ORDER,
      categories: ["Imported category"],
      items: [
        {
          asset_id: "asset-room-work",
          title: "Annotated work",
          imported: { keep: true },
        },
        { asset_id: "asset-room-poster", title: "Annotated poster" },
      ],
    },
    UNANNOTATED_IMAGES
  );
}

it("leaves unannotated artwork before, between and after annotated entries when only a title changes", () => {
  const result = inspectMixedGallery();
  fireEvent.click(screen.getByText(/1\. Annotated work/));
  fireEvent.change(screen.getAllByLabelText("Artwork title")[0]!, {
    target: { value: "Updated work" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.block()?.["asset_ids"]).toEqual(MIXED_GALLERY_ORDER);
  expect(result.block()?.["categories"]).toEqual(["Imported category"]);
  expect(result.block()?.["items"]).toEqual([
    {
      asset_id: "asset-room-work",
      title: "Updated work",
      imported: { keep: true },
    },
    { asset_id: "asset-room-poster", title: "Annotated poster" },
  ]);
});

it.each([
  {
    action: "move",
    expected: [
      "unannotated-before",
      "asset-room-poster",
      "unannotated-between",
      "asset-room-work",
      "unannotated-after",
    ],
  },
  {
    action: "remove",
    expected: [
      "unannotated-before",
      "unannotated-between",
      "asset-room-poster",
      "unannotated-after",
    ],
  },
  {
    action: "replace",
    expected: [
      "unannotated-before",
      "asset-room-poster",
      "unannotated-between",
      "asset-room-poster",
      "unannotated-after",
    ],
  },
  {
    action: "add",
    expected: [
      "unannotated-before",
      "asset-room-work",
      "unannotated-between",
      "asset-room-poster",
      "asset-room-poster",
      "unannotated-after",
    ],
  },
])(
  "preserves unannotated placements during an explicit artwork $action",
  ({ action, expected }) => {
    const result = inspectMixedGallery();
    fireEvent.click(screen.getByText(/1\. Annotated work/));
    if (action === "replace")
      fireEvent.change(screen.getAllByLabelText("Choose image")[0]!, {
        target: { value: "asset-room-poster" },
      });
    if (action === "move")
      fireEvent.click(screen.getAllByRole("button", { name: "Move down" })[0]!);
    if (action === "remove")
      fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]!);
    if (action === "add")
      fireEvent.click(screen.getByRole("button", { name: /Add artwork/ }));
    fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
    expect(result.block()?.["asset_ids"]).toEqual(expected);
  }
);

it("edits contact email and schedule entries through ordinary fields", () => {
  const result = inspectBlock({
    id: "contact",
    block_type: "callout",
    title: "Visit",
    content: "Open by appointment.",
    email: "studio@example.com",
    subject: "Studio visit",
    rows: [{ label: "Friday", value: "10:00–18:00", custom: true }],
  });
  fireEvent.change(screen.getByLabelText("Contact email"), {
    target: { value: "hello@example.com" },
  });
  fireEvent.click(screen.getByText(/1\. Friday/));
  fireEvent.change(screen.getByLabelText("Value"), {
    target: { value: "11:00–19:00" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.block()).toMatchObject({
    email: "hello@example.com",
    subject: "Studio visit",
    rows: [{ label: "Friday", value: "11:00–19:00", custom: true }],
  });
});

function inspector(content: unknown) {
  return inspectBlock({
    id: "block-imported-text",
    block_type: "rich_text",
    ...(content === undefined ? {} : { content }),
  }).block;
}

it.each(["Friday: 10:00", "Visits are by appointment."])(
  "keeps derived row text current and preserves independent narrative: %s",
  (content) => {
    const result = inspectBlock({
      id: "hours",
      block_type: "callout",
      title: "Hours",
      content,
      rows: [{ label: "Friday", value: "10:00" }],
    });
    fireEvent.click(screen.getByText(/1\. Friday/));
    fireEvent.change(screen.getByLabelText("Value"), {
      target: { value: "11:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
    expect(result.block()?.["content"]).toBe(
      content.startsWith("Friday:") ? "Friday: 11:00" : content
    );
  }
);

it("clears a structured row label without rendering its value twice", () => {
  const result = inspectBlock({
    id: "hours",
    block_type: "callout",
    title: "Hours",
    content: "Friday: 10:00",
    rows: [{ label: "Friday", value: "10:00" }],
  });
  fireEvent.click(screen.getByText(/1\. Friday/));
  fireEvent.change(screen.getByLabelText("Label"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.block()?.["content"]).toBe("10:00");
  const rendered = render(
    <ApprovedBlock
      block={result.block()!}
      context={createRendererContext(result.document()!, "en-US")}
    />
  );
  expect(within(rendered.container).getAllByText("10:00")).toHaveLength(1);
  expect(
    within(rendered.container).queryByText(": 10:00")
  ).not.toBeInTheDocument();
});

it("updates the canonical fallback of a reopened unlabeled row", () => {
  const result = inspectBlock({
    id: "hours",
    block_type: "callout",
    title: "Hours",
    content: "10:00",
    rows: [{ label: "", value: "10:00" }],
  });
  fireEvent.change(screen.getByLabelText("Value"), {
    target: { value: "11:00" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.block()?.["content"]).toBe("11:00");
});

it("clears a section target when changing a link's destination and edits enquiry subjects", () => {
  const result = inspectBlock({
    id: "enquiry",
    block_type: "button_link",
    label: "Enquire",
    page_id: "page-nft",
    block_id: "old-section",
    subject: "A work",
  });
  fireEvent.change(screen.getByLabelText("Destination"), {
    target: { value: "external" },
  });
  fireEvent.change(screen.getByLabelText("Web address"), {
    target: { value: "https://example.com/contact" },
  });
  fireEvent.change(screen.getByLabelText("Subject"), {
    target: { value: "My work" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.block()).not.toHaveProperty("block_id");
  expect(result.block()).toMatchObject({
    href: "https://example.com/contact",
    subject: "My work",
  });
});

function inspectBlock(
  blockInput: CmsBlockV1 & Record<string, unknown>,
  extraImageIds: readonly string[] = []
) {
  const source = cmsPackageSchema.parse(roomFixture);
  source.payload.assets.push(
    ...extraImageIds.map((id) => ({ ...source.payload.assets[0]!, id }))
  );
  source.payload.pages[0]!.blocks.push(blockInput);
  const document = withComputedCmsHashes(source);
  expect(validateCmsPackageV1(document, { enforceHashes: true }).valid).toBe(
    true
  );
  const page = document.payload.pages[0]!;
  const block = page.blocks.at(-1)!;
  let updated: CmsPackageV1 | undefined;
  render(
    <StudioBlockInspector
      document={document}
      page={page}
      block={block}
      locale="en-US"
      formState={{
        pending: false,
        onPendingChange: jest.fn(),
        onDiscard: jest.fn(),
      }}
      onOperation={(operation) => {
        const result = applyCmsDocumentOperation(
          document,
          document.integrity.package_hash,
          operation
        );
        expect(result.ok).toBe(true);
        if (result.ok) updated = result.document;
        return result.ok;
      }}
    />
  );
  return {
    block: () =>
      updated?.payload.pages[0]!.blocks.at(-1) as
        | (CmsBlockV1 & Record<string, unknown>)
        | undefined,
    document: () => updated,
    original: document,
  };
}

it.each([
  { format: "imported-editor-v2", nodes: [{ text: "Preserve imported text" }] },
  ["Imported paragraph", { text: "Keep this structure" }],
  null,
  42,
  false,
])(
  "preserves imported non-text content when applying only width: %j",
  (value) => {
    const result = inspector(value);
    expect(
      screen.queryByRole("textbox", { name: "Text" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/This imported value cannot be edited here/)
    ).toBeVisible();
    const summary = screen.getByText("View imported value");
    const details = summary.closest("details")!;
    expect(details.open).toBe(false);
    expect(details.querySelector("pre")).toHaveTextContent(
      JSON.stringify(value, null, 2).replace(/\s+/g, " ")
    );
    fireEvent.change(screen.getByLabelText("Width"), {
      target: { value: "half" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
    expect(result()?.["content"]).toEqual(value);
    expect(result()?.["presentation"]).toMatchObject({ span: "half" });
  }
);

it.each([undefined, "   \n  "])(
  "preserves untouched missing or whitespace content: %j",
  (value) => {
    const result = inspector(value);
    fireEvent.change(screen.getByLabelText("Width"), {
      target: { value: "half" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
    expect(result()?.["content"]).toBe(value);
  }
);

it("applies an intentional plain-text change", () => {
  const result = inspector("Original text");
  fireEvent.change(screen.getByRole("textbox", { name: "Text" }), {
    target: { value: "Edited text" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result()?.["content"]).toBe("Edited text");
});

it("preserves unknown presentation fields and role when changing only width", () => {
  const result = inspectBlock({
    id: "block-imported-heading",
    block_type: "heading",
    text: "A heading",
    presentation: {
      role: "imported-display-heading",
      animation: { duration: 250, keyframes: [0, 1] },
    },
  });
  expect(screen.queryByLabelText("Treatment")).not.toBeInTheDocument();
  expect(
    screen.getByText(/This imported value cannot be edited here/)
  ).toBeVisible();
  fireEvent.change(screen.getByLabelText("Width"), {
    target: { value: "half" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.block()?.["presentation"]).toEqual({
    role: "imported-display-heading",
    animation: { duration: 250, keyframes: [0, 1] },
    span: "half",
  });
});

it.each(["imported-layout", ["half", "float"], null])(
  "preserves opaque presentation while editing text: %j",
  (presentation) => {
    const result = inspectBlock({
      id: "block-imported-heading",
      block_type: "heading",
      text: "Original",
      presentation,
    });
    expect(screen.queryByLabelText("Width")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Heading" }), {
      target: { value: "Edited" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
    expect(result.block()).toMatchObject({ text: "Edited", presentation });
  }
);

it("does not add presentation defaults when editing a heading", () => {
  const result = inspectBlock({
    id: "block-heading",
    block_type: "heading",
    text: "Original",
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Heading" }), {
    target: { value: "Edited" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.block()).not.toHaveProperty("presentation");
});

it("preserves the legacy button URL and alternate target when only its label changes", () => {
  const original = {
    id: "block-link",
    block_type: "button_link" as const,
    label: "Original",
    page_id: "page-nft",
    url: "https://example.com/alternate?keep=1#fragment",
    custom_target: { legacy: true },
  };
  const result = inspectBlock(original);
  fireEvent.change(screen.getByRole("textbox", { name: "Label" }), {
    target: { value: "Edited" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.block()).toEqual({ ...original, label: "Edited" });
});

it("updates only an explicitly changed button destination and removes conflicting legacy targets", () => {
  const result = inspectBlock({
    id: "block-link",
    block_type: "button_link",
    label: "Visit",
    page_id: "page-nft",
    url: "https://example.com/old",
  });
  fireEvent.change(screen.getByLabelText("Destination"), {
    target: { value: "external" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Web address" }), {
    target: { value: "https://example.com/new" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.block()).toEqual({
    id: "block-link",
    block_type: "button_link",
    label: "Visit",
    href: "https://example.com/new",
  });
});

it("keeps a structured gallery source read-only and unchanged while changing the title", () => {
  const assetIds = { collection: "imported-feed", filter: [1, 2] };
  const result = inspectBlock({
    id: "block-gallery",
    block_type: "gallery",
    title: "Original",
    asset_ids: assetIds,
  });
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  expect(
    screen.getByText(/This imported value cannot be edited here/)
  ).toBeVisible();
  fireEvent.change(screen.getByRole("textbox", { name: "Heading" }), {
    target: { value: "Edited" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.block()).toMatchObject({
    title: "Edited",
    asset_ids: assetIds,
  });
});

it("preserves gallery order and duplicates when changing unrelated text, and supports explicit image edits", () => {
  const result = inspectBlock({
    id: "block-gallery",
    block_type: "gallery",
    title: "Original",
    asset_ids: ["asset-room-work", "asset-room-work"],
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Heading" }), {
    target: { value: "Edited" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.block()?.["asset_ids"]).toEqual([
    "asset-room-work",
    "asset-room-work",
  ]);
  fireEvent.click(
    screen.getByRole("checkbox", {
      name: "Poster for a simple 3D exhibition room",
    })
  );
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.block()?.["asset_ids"]).toEqual([
    "asset-room-work",
    "asset-room-work",
    "asset-room-poster",
  ]);
});

it("does not fill missing asset metadata while editing an image caption", () => {
  const result = inspectBlock({
    id: "block-image",
    block_type: "image",
    asset_id: "asset-room-work",
    caption: "Original",
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Caption" }), {
    target: { value: "Edited" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.document()?.payload.assets).toEqual(
    result.original.payload.assets
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Image description" }), {
    target: { value: "Updated description" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.document()?.payload.assets[1]).toEqual({
    ...result.original.payload.assets[1],
    alt_text: "Updated description",
  });
});

it("preserves a structured button destination without offering a blank editable target", () => {
  const target = { resolver: "custom", value: "collection" };
  const result = inspectBlock({
    id: "block-link",
    block_type: "button_link",
    label: "Original",
    href: target,
  });
  expect(screen.queryByLabelText("Destination")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Web address")).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("textbox", { name: "Label" }), {
    target: { value: "Edited" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.block()).toEqual({
    id: "block-link",
    block_type: "button_link",
    label: "Edited",
    href: target,
  });
});

it("edits project mockup fields without discarding its rows or extension data", () => {
  const rows = [{ label: "Type study", value: "In review" }];
  const result = inspectBlock({
    id: "block-mockup",
    block_type: "callout",
    title: "Fieldwork",
    content: "Project planner",
    mockup_style: "planner",
    mockup_heading: "This week",
    mockup_footer: "Thursday review",
    rows,
    extension: { preserved: true },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Mockup heading" }), {
    target: { value: "The library" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Mockup style" }), {
    target: { value: "catalogue" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.block()).toMatchObject({
    mockup_heading: "The library",
    mockup_style: "catalogue",
    mockup_footer: "Thursday review",
    rows,
    extension: { preserved: true },
  });
});

it("preserves an imported structured media source while editing its caption", () => {
  const source = { resolver: "imported", key: "artwork" };
  const result = inspectBlock({
    id: "block-image",
    block_type: "image",
    asset_id: source,
    caption: "Original",
  });
  expect(
    screen.queryByRole("combobox", { name: "Image source" })
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(/This imported value cannot be edited here/)
  ).toBeVisible();
  fireEvent.change(screen.getByRole("textbox", { name: "Caption" }), {
    target: { value: "Edited" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
  expect(result.block()).toEqual({
    id: "block-image",
    block_type: "image",
    asset_id: source,
    caption: "Edited",
  });
});
