import { fireEvent, render, screen } from "@testing-library/react";

import StudioBlockInspector from "@/components/profile-cms-builder/studio/StudioBlockInspector";
import {
  cmsPackageSchema,
  validateCmsPackageV1,
  withComputedCmsHashes,
  type CmsBlockV1,
  type CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";
import { applyCmsDocumentOperation } from "@/lib/profile-cms/studio/document";
import roomFixture from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/exhibition-room.package.json";

function inspector(content: unknown) {
  return inspectBlock({
    id: "block-imported-text",
    block_type: "rich_text",
    ...(content === undefined ? {} : { content }),
  }).block;
}

function inspectBlock(blockInput: CmsBlockV1 & Record<string, unknown>) {
  const source = cmsPackageSchema.parse(roomFixture);
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
