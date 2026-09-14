import { createHash } from "node:crypto";
import type { ApiArtworkDocumentationProfile } from "@/generated/models/ApiArtworkDocumentationProfile";
import profileJson from "@/__tests__/fixtures/artwork-documentation-profile-v3.json";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import {
  documentationFields,
  documentationSections,
  editorForSchema,
  fieldAppliesToMedia,
} from "@/lib/artwork-documentation/catalogue";
import {
  AN_ALTERATION_TEXT,
  AN_ALTERATION_SECTIONS,
  anAlterationExcerpt,
} from "@/lib/artwork-documentation/an-alteration";

const profile = profileJson as unknown as ApiArtworkDocumentationProfile;

describe("generic museum catalogue", () => {
  it("renders all ten composable forms from the actual backend catalogue", () => {
    const media = documentationFields(profile, "artwork").find(
      (field) => field.id === "media_profiles"
    );
    expect(media?.editor.kind).toBe("multi_choice");
    if (media?.editor.kind !== "multi_choice")
      throw new Error("Missing media selector");
    expect(media.editor.options).toHaveLength(10);
    const selected = ["photography", "html", "audio"];
    const specialized = documentationFields(profile, "process").filter(
      (field) =>
        field.mediaProfiles?.length && fieldAppliesToMedia(field, selected)
    );
    expect(specialized.map((field) => field.id)).toEqual(
      expect.arrayContaining(selected)
    );
    expect(specialized.some((field) => field.id === "video")).toBe(false);
    expect(documentationSections(profile)).toEqual([
      "artwork",
      "story",
      "materials",
      "conversation",
      "preservation",
      "rights",
      "review",
    ]);
    expect(documentationSections(documentationFixture().profile)).toHaveLength(
      6
    );
  });
  it("uses full document limits and hides internal IDs while preserving labels and numerical bounds", () => {
    const documents = documentationFields(profile, "context").find(
      (field) => field.id === "documents"
    )?.editor;
    if (documents?.kind !== "list" || documents.item.kind !== "object")
      throw new Error("Missing document collection");
    expect(documents.item.fields["id"]?.kind).toBe("identity");
    expect(documents.item.fields["text"]).toMatchObject({
      kind: "text",
      max: 500000,
      multiline: true,
      label: "Text",
    });
    expect(
      editorForSchema(
        { type: "number", minimum: -180, maximum: 180 },
        "longitude"
      )
    ).toMatchObject({ kind: "number", min: -180, max: 180 });
  });
  it("preserves the complete supplied example bytes and shows precise excerpts", () => {
    expect(
      createHash("sha256").update(AN_ALTERATION_TEXT, "utf8").digest("hex")
    ).toBe("51348533f11d1b27381f07971ea9a9aeff024ede39b02ad6b8509ebb3810447e");
    expect(AN_ALTERATION_SECTIONS).toHaveLength(8);
    expect(anAlterationExcerpt("artwork", "title")).toBe("AN ALTERATION");
    expect(anAlterationExcerpt("process", "video")).toBeUndefined();
    const allText = AN_ALTERATION_SECTIONS.flatMap(
      (section) => section.paragraphs
    ).join("\n");
    for (const line of AN_ALTERATION_TEXT.split(/\r?\n/)
      .slice(3)
      .filter(
        (value) =>
          value.trim() && !/^_+$/.test(value.trim()) && !/^\d+\. /.test(value)
      ))
      expect(allText).toContain(line);
  });
  it("uses artist-facing names for existing file fields and linked entities", () => {
    expect(
      documentationFields(profile, "artwork").find(
        (field) => field.id === "canonical_asset_id"
      )?.label
    ).toBe("Final artwork file");
    expect(
      documentationFields(profile, "files").find(
        (field) => field.id === "master_availability"
      )?.label
    ).toBe("Preservation master");
    expect(
      editorForSchema(
        { type: "string", format: "uuid", title: "Speaker agent id" } as never,
        "speaker_agent_id"
      ).label
    ).toBe("Speaker");
    expect(
      editorForSchema(
        { type: "string", title: "The account in full" } as never,
        "text"
      ).label
    ).toBe("The account in full");
  });
});
