import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import { validDocumentationOperation } from "@/lib/artwork-documentation/validation";
import type { ApiArtworkDocumentationOperation } from "@/generated/models/ApiArtworkDocumentationOperation";

it("requires an explanation when the canonical file changes after confirmation", () => {
  const context = documentationFixture();
  context.latest_revision_id = "confirmed";
  const module = context.profile.modules.find((item) => item.id === "artwork")!;
  module.fields.push({ ...module.fields[0]!, id: "canonical_asset_id" });
  context.modules["artwork"]!.answers["canonical_asset_id"] = {
    status: "provided",
    intended_visibility: "restricted",
    value: "original-file",
  } as never;
  const operation = {
    op: "set",
    field: "canonical_asset_id",
    answer: {
      status: "provided",
      intended_visibility: "restricted",
      value: "replacement-file",
    },
  } as ApiArtworkDocumentationOperation;
  expect(validDocumentationOperation(context, "artwork", operation)).toBe(
    false
  );
  expect(
    validDocumentationOperation(context, "artwork", {
      ...operation,
      replacementReason: "Corrected the original export's color profile.",
    } as ApiArtworkDocumentationOperation)
  ).toBe(true);
  expect(
    validDocumentationOperation(context, "artwork", {
      ...operation,
      answer: { ...operation.answer, value: "original-file" },
    } as ApiArtworkDocumentationOperation)
  ).toBe(true);
});
