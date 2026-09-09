export const MODULE_IDS = [
  "identity",
  "artwork",
  "files",
  "context",
  "process",
  "rights",
  "preservation",
  "interview",
] as const;
export type ModuleId = (typeof MODULE_IDS)[number];
export const SECTIONS = [
  "artwork",
  "story",
  "artist",
  "rights",
  "preservation",
  "review",
] as const;
export type DocumentationSection = (typeof SECTIONS)[number];
export type FieldValue =
  | string
  | number
  | boolean
  | null
  | FieldValue[]
  | { [key: string]: FieldValue };
export type ValueEditor =
  | { kind: "text"; multiline?: boolean; max?: number }
  | { kind: "number" }
  | { kind: "boolean" }
  | { kind: "choice"; options: readonly string[] }
  | { kind: "object"; fields: Readonly<Record<string, ValueEditor>> }
  | { kind: "list"; item: ValueEditor; max: number }
  | { kind: "localized"; max: number }
  | { kind: "date" }
  | { kind: "asset"; multiple?: boolean };
export interface DocumentationField {
  readonly id: string;
  readonly editor: ValueEditor;
  readonly section?: DocumentationSection;
  readonly help?:
    | "captionHelp"
    | "captureHelp"
    | "locationHelp"
    | "changesHelp"
    | "masterHelp"
    | "sourceFilesHelp"
    | "interviewEvidenceHelp";
}
const text = (max = 1000, multiline = false): ValueEditor => ({
  kind: "text",
  max,
  multiline,
});
const choice = (...options: string[]): ValueEditor => ({
  kind: "choice",
  options,
});
const object = (
  fields: Readonly<Record<string, ValueEditor>>
): ValueEditor => ({ kind: "object", fields });
const list = (item: ValueEditor, max = 30): ValueEditor => ({
  kind: "list",
  item,
  max,
});
const kindDetail = (options: string[], max = 1000): ValueEditor =>
  object({ kind: choice(...options), detail: text(max, true) });
const kindExplanation = (options: string[]): ValueEditor =>
  object({ kind: choice(...options), explanation: text(1000, true) });
const localized = (max: number): ValueEditor => ({ kind: "localized", max });
const date: ValueEditor = { kind: "date" };
const sourceReference = object({
  label: text(160),
  url: text(2048),
  note: text(1000, true),
});
const field = (
  id: string,
  editor: ValueEditor,
  extra: Omit<DocumentationField, "id" | "editor"> = {}
): DocumentationField => ({ id, editor, ...extra });

export const MODULE_FIELDS: Readonly<
  Record<ModuleId, readonly DocumentationField[]>
> = {
  identity: [
    field("display_name", text(160)),
    field("preferred_credit", text(300)),
    field("record_language", text(35)),
    field("biography", localized(4000)),
    field("links", list(object({ label: text(100), url: text(2048) }), 10)),
    field("languages", list(text(35), 10)),
    field("private_contact", text(320)),
  ],
  artwork: [
    field("title", text(255)),
    field("title_language", text(35)),
    field(
      "alternate_titles",
      list(object({ language: text(35), text: text(255) }), 10)
    ),
    field("capture_date", date, { help: "captureHelp" }),
    field("completion_date", date),
    field("location", text(300), { help: "locationHelp" }),
    field(
      "medium",
      kindDetail(
        [
          "digital_photograph",
          "analogue_photograph",
          "photographic_composite",
          "other",
        ],
        500
      )
    ),
    field("edition_statement", text(500)),
    field("visual_description", text(1500, true)),
    field("series_title", text(255)),
    field("canonical_asset_id", { kind: "asset" }),
    field(
      "declared_dimensions",
      object({ width: { kind: "number" }, height: { kind: "number" } })
    ),
    field(
      "work_relationships",
      list(
        object({
          work_id: text(100),
          source_url: text(2048),
          relation: choice("version_of", "part_of_series", "related_work"),
        })
      )
    ),
  ],
  files: [
    field(
      "master_availability",
      kindExplanation(["supplied", "same_as_final", "unavailable"]),
      { help: "masterHelp" }
    ),
    field(
      "source_availability",
      kindExplanation([
        "supplied",
        "retained_by_artist",
        "unavailable",
        "not_applicable",
      ]),
      { help: "sourceFilesHelp" }
    ),
  ],
  context: [
    field("caption", localized(3000), { help: "captionHelp" }),
    field("artist_statement", localized(12000)),
    field("making_context", text(6000, true)),
    field(
      "theme_connection",
      object({
        kind: choice("text", "caption_reference"),
        text: text(4000, true),
      })
    ),
    field("misunderstandings", text(4000, true)),
    field(
      "history",
      object({
        kind: choice("entries_supplied", "none_known", "unknown"),
        entries: list(
          object({
            kind: choice(
              "publication",
              "exhibition",
              "award",
              "print_edition",
              "nft_mint",
              "other"
            ),
            scope: choice("this_work", "series", "artist"),
            title: text(300),
            date,
            venue: text(300),
            url: text(2048),
            note: text(1000, true),
          }),
          50
        ),
      })
    ),
    field(
      "prior_mint_status",
      object({
        kind: choice("never_minted", "previously_minted", "unknown"),
        references: list(sourceReference),
        explanation: text(1000, true),
      })
    ),
    field("references", list(sourceReference)),
  ],
  process: [
    field(
      "capture_method",
      kindDetail(
        ["digital_camera", "phone", "drone", "film_scan", "other"],
        500
      )
    ),
    field("camera", text(300)),
    field("lens", text(300)),
    field("exposure_note", text(500)),
    field(
      "techniques",
      object({
        kinds: list(
          choice(
            "single_capture",
            "staged",
            "composite",
            "collage",
            "focus_stack",
            "long_exposure",
            "miniature",
            "other"
          ),
          8
        ),
        other_detail: text(500),
      })
    ),
    field(
      "editing_tools",
      list(object({ name: text(160), version: text(100) }), 20)
    ),
    field("process_description", text(8000, true)),
    field("material_changes", text(4000, true), { help: "changesHelp" }),
    field(
      "ai_use",
      kindDetail(["none", "assistive", "generative", "unknown"], 4000)
    ),
    field(
      "ingredients",
      object({
        kind: choice("entries_supplied", "unavailable"),
        entries: list(
          object({
            asset_id: { kind: "asset" },
            source_url: text(2048),
            creator: text(160),
            role: text(300),
            rights_note: text(1000, true),
          })
        ),
        explanation: text(1000, true),
      })
    ),
    field(
      "contributors",
      object({
        kind: choice("entries_supplied", "none"),
        entries: list(
          object({
            name: text(160),
            profile_id: text(100),
            role: text(300),
            authorship_claim: { kind: "boolean" },
            credit: text(500),
          })
        ),
      }),
      { section: "artist" }
    ),
    field("construction_note", text(4000, true)),
  ],
  rights: [
    field(
      "rights_basis",
      kindDetail(
        [
          "artist_owned",
          "coauthored",
          "licensed_components",
          "other",
          "unknown",
        ],
        2000
      )
    ),
    field("intended_license", object({ uri: text(2048), label: text(160) })),
    field("rights_declaration", text(6000, true)),
    field(
      "declaration_effect",
      choice("proposed", "conditional", "already_effective", "unknown")
    ),
    field(
      "third_party_material",
      object({
        kind: choice("none", "present", "unknown"),
        details: text(4000, true),
        references: list(sourceReference),
      })
    ),
    field(
      "people_depicted",
      choice("none", "self_only", "adults", "includes_minors", "uncertain")
    ),
    field(
      "consent_status",
      choice(
        "not_applicable",
        "documents_supplied",
        "exists_not_supplied",
        "not_available",
        "uncertain"
      )
    ),
    field("consent_asset_ids", { kind: "asset", multiple: true }),
    field("identifiability_note", text(2000, true)),
    field("sensitive_context_note", text(4000, true)),
    field("publication_notes", text(2000, true)),
  ],
  preservation: [
    field("significant_properties", text(6000, true)),
    field("display_orientation_crop", text(2000, true)),
    field("color_and_tone", text(2000, true)),
    field("screen_preferences", text(2000, true)),
    field("print_preferences", text(3000, true)),
    field("acceptable_changes", text(4000, true)),
    field("avoid_changes", text(4000, true)),
    field("physical_materials", text(2000, true)),
  ],
  interview: [
    field("mode", choice("written", "recording", "declined", "not_yet")),
    field("date", date),
    field("participants", list(object({ name: text(160), role: text(300) }))),
    field("languages", list(text(35), 10)),
    field("q1", localized(8000)),
    field("q2", localized(8000)),
    field("q3", localized(8000)),
    field("q4", localized(8000)),
    field("q5", localized(8000)),
    field("q6", localized(8000)),
    field("q7", localized(8000)),
    field("q8", localized(8000)),
    field(
      "recording_asset_id",
      { kind: "asset" },
      { help: "interviewEvidenceHelp" }
    ),
    field(
      "transcript_asset_id",
      { kind: "asset" },
      { help: "interviewEvidenceHelp" }
    ),
    field(
      "recording_permission",
      choice("not_requested", "private_review", "intended_public_record")
    ),
    field(
      "transcript_permission",
      choice("not_requested", "private_review", "intended_public_record")
    ),
    field("correction_note", text(4000, true)),
  ],
};

const MODULE_SECTIONS: Readonly<Record<ModuleId, DocumentationSection>> = {
  identity: "artist",
  artwork: "artwork",
  files: "artwork",
  context: "story",
  process: "story",
  rights: "rights",
  preservation: "preservation",
  interview: "preservation",
};

export function parseSection(
  section: string | undefined
): DocumentationSection {
  return SECTIONS.find((candidate) => candidate === section) ?? "artwork";
}

export function recordValue(value: unknown): Record<string, FieldValue> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, FieldValue>)
    : {};
}

export function fieldSection(
  moduleId: ModuleId,
  fieldId: string
): DocumentationSection {
  return (
    MODULE_FIELDS[moduleId].find((entry) => entry.id === fieldId)?.section ??
    MODULE_SECTIONS[moduleId]
  );
}

export function initialValue(editor: ValueEditor): FieldValue {
  switch (editor.kind) {
    case "list":
      return [];
    case "object":
      return Object.fromEntries(
        Object.entries(editor.fields)
          .filter(([, nestedEditor]) => nestedEditor.kind === "boolean")
          .map(([key]) => [key, false])
      );
    case "localized":
      return {
        primary_language: "en",
        versions: [
          {
            language: "en",
            text: "",
            authorship: "original",
            approved_by_artist: false,
          },
        ],
      };
    case "date":
      return { precision: "year", start: "", approximate: false };
    case "boolean":
      return false;
    case "number":
      return 0;
    case "asset":
      return editor.multiple ? [] : "";
    case "text":
    case "choice":
      return "";
  }
}
