import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import {
  matchesDocumentationSchema,
  documentationSchemaIssues,
  documentationOperationIssues,
  validDocumentationOperation,
} from "@/lib/artwork-documentation/validation";
import type { ApiArtworkDocumentationValueSchema } from "@/generated/models/ApiArtworkDocumentationValueSchema";
import type { ApiArtworkDocumentationOperation } from "@/generated/models/ApiArtworkDocumentationOperation";

it("requires an explanation when the canonical file changes after confirmation", () => {
  const context = documentationFixture();
  context.latest_revision_id = "confirmed";
  const artworkModule = context.profile.modules.find(
    (item) => item.id === "artwork"
  )!;
  artworkModule.fields.push({
    ...artworkModule.fields[0]!,
    id: "canonical_asset_id",
  });
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

function rightsOperationIsValid(
  field: string,
  value: unknown,
  valueSchema: ApiArtworkDocumentationValueSchema
): boolean {
  const context = documentationFixture();
  const template = context.profile.modules.find(
    (item) => item.id === "artwork"
  )!.fields[0]!;
  context.profile.modules
    .find((item) => item.id === "rights")!
    .fields.push({
      ...template,
      id: field,
      value_schema: valueSchema,
    });
  return validDocumentationOperation(context, "rights", {
    op: "set",
    field,
    answer: {
      status: "provided",
      intended_visibility: "public_record",
      value,
    },
  } as ApiArtworkDocumentationOperation);
}

describe("documentation URI validation", () => {
  it.each([
    ["https://creativecommons.org/publicdomain/zero/1.0/", true],
    ["ipfs://bafyexample/license.json", true],
    ["ar://example/license.json", true],
    ["CC0 1.0", false],
    ["creativecommons.org/publicdomain/zero/1.0/", false],
    ["http://example.org/license", false],
    ["javascript:alert(1)", false],
    ["https://user:password@example.org/license", false],
  ])("validates the nested intended-license URI %s", (uri, expected) => {
    expect(
      rightsOperationIsValid(
        "intended_license",
        { uri, label: "License" },
        {
          type: "object",
          required: ["uri", "label"],
          properties: {
            uri: { type: "string", format: "uri" },
            label: { type: "string", min_length: 1 },
          },
        }
      )
    ).toBe(expected);
  });

  it.each([
    ["http://vocab.getty.edu/aat/300033618", true],
    ["https://vocab.getty.edu/aat/300033618", true],
    ["ipfs://bafyexample/term", false],
    ["ar://example/term", false],
    ["Getty term", false],
    ["https://user@example.org/term", false],
  ])("validates authority URI %s separately", (value, expected) => {
    expect(
      matchesDocumentationSchema(value, {
        type: "string",
        format: "authority-uri",
      })
    ).toBe(expected);
  });
});

describe("documentation rights details", () => {
  const rightsBasisSchema: ApiArtworkDocumentationValueSchema = {
    type: "object",
    required: ["kind"],
    properties: {
      kind: {
        type: "string",
        _enum: [
          "artist_owned",
          "coauthored",
          "licensed_components",
          "other",
          "unknown",
        ],
      },
      detail: { type: "string", min_length: 1, max_length: 2000 },
    },
  };
  const thirdPartySchema: ApiArtworkDocumentationValueSchema = {
    type: "object",
    required: ["kind"],
    properties: {
      kind: { type: "string", _enum: ["none", "present", "unknown"] },
      details: { type: "string", min_length: 1, max_length: 4000 },
    },
  };

  it.each(["coauthored", "licensed_components", "other", "unknown"])(
    "requires details for the %s rights basis",
    (kind) => {
      expect(
        rightsOperationIsValid("rights_basis", { kind }, rightsBasisSchema)
      ).toBe(false);
      expect(
        rightsOperationIsValid(
          "rights_basis",
          {
            kind,
            detail: "The collaborating artist has approved this release.",
          },
          rightsBasisSchema
        )
      ).toBe(true);
    }
  );

  it("does not require a separate detail for artist-owned rights", () => {
    expect(
      rightsOperationIsValid(
        "rights_basis",
        { kind: "artist_owned" },
        rightsBasisSchema
      )
    ).toBe(true);
  });

  it("requires details when third-party material is present", () => {
    expect(
      rightsOperationIsValid(
        "third_party_material",
        { kind: "present" },
        thirdPartySchema
      )
    ).toBe(false);
    expect(
      rightsOperationIsValid(
        "third_party_material",
        {
          kind: "present",
          details:
            "The recorded composition is used with its composer's permission.",
        },
        thirdPartySchema
      )
    ).toBe(true);
  });

  it.each(["none", "unknown"])(
    "allows third-party status %s without details",
    (kind) => {
      expect(
        rightsOperationIsValid(
          "third_party_material",
          { kind },
          thirdPartySchema
        )
      ).toBe(true);
    }
  );
});

describe("documentation text normalization", () => {
  const declarationSchema: ApiArtworkDocumentationValueSchema = {
    type: "string",
    min_length: 1,
    max_length: 6000,
  };

  it.each([
    ["CRLF at the limit", "x".repeat(5999) + "\r\n", true],
    ["CRLF above the limit", "x".repeat(6000) + "\r\n", false],
    ["NFC at the limit", "e\u0301".repeat(6000), true],
    ["NFC above the limit", "e\u0301".repeat(6001), false],
  ])("validates %s after server normalization", (_name, value, expected) => {
    expect(
      rightsOperationIsValid("rights_declaration", value, declarationSchema)
    ).toBe(expected);
  });

  it("checks minimum lengths and enums after normalization", () => {
    expect(
      matchesDocumentationSchema("\r\n", { type: "string", min_length: 2 })
    ).toBe(false);
    expect(
      matchesDocumentationSchema("\r", { type: "string", _enum: ["\n"] })
    ).toBe(true);
    expect(
      matchesDocumentationSchema("e\u0301", {
        type: "string",
        _enum: ["\u00e9"],
      })
    ).toBe(true);
  });

  it("validates nested license strings without rewriting the answer", () => {
    const value = Object.freeze({
      uri: "https://example.org/" + "e\u0301".repeat(4),
      label: "e\u0301".repeat(160),
    });
    const original = { ...value };
    expect(
      rightsOperationIsValid("intended_license", value, {
        type: "object",
        required: ["uri", "label"],
        properties: {
          uri: { type: "string", format: "uri", max_length: 24 },
          label: { type: "string", min_length: 1, max_length: 160 },
        },
      })
    ).toBe(true);
    expect(value).toEqual(original);
  });
});

// These are real server constraints, including values the old browser validator
// accepted and then sent in a batch with otherwise valid artist writing.
function fieldContext(
  moduleId: string,
  fieldId: string,
  schema: ApiArtworkDocumentationValueSchema,
  version = 2
) {
  const context = documentationFixture();
  context.profile.version = version;
  const module = context.profile.modules.find((item) => item.id === moduleId)!;
  module.fields = module.fields.filter((field) => field.id !== fieldId);
  module.fields.push({
    id: fieldId,
    value_schema: schema,
    allowed_statuses: ["provided", "unknown"],
    default_visibility: "public_record",
    locked_restricted: false,
  });
  return context;
}
function provided(value: unknown): ApiArtworkDocumentationOperation {
  return {
    op: "set",
    field: "test",
    answer: { status: "provided", intended_visibility: "public_record", value },
  } as ApiArtworkDocumentationOperation;
}
const textSchema: ApiArtworkDocumentationValueSchema = { type: "string" };
const kindSchema: ApiArtworkDocumentationValueSchema = {
  type: "object",
  required: ["kind"],
  properties: {
    kind: textSchema,
    detail: textSchema,
    details: textSchema,
    explanation: textSchema,
    references: { type: "array", items: textSchema },
  },
};
const dateSchema: ApiArtworkDocumentationValueSchema = {
  type: "object",
  required: ["precision", "start", "approximate"],
  properties: {
    precision: { type: "string", _enum: ["day", "month", "year", "range"] },
    start: { type: "string", format: "partial-date" },
    end: { type: "string", format: "partial-date" },
    endpoint_precision: { type: "string", _enum: ["day", "month", "year"] },
    approximate: { type: "boolean" },
  },
};

describe("server schema parity", () => {
  it.each([
    ["en", true],
    ["en-GB", true],
    ["bn", true],
    ["zh-Hant-TW", true],
    // BCP47 syntax permits 5–8 letter language subtags; Intl also accepts these.
    ["English", true],
    ["French", true],
    ["en_US", false],
    ["English (UK)", false],
    ["Português", false],
    ["en, fr", false],
  ])(
    "checks language syntax without inventing stricter backend rules: %s",
    (value, valid) => {
      expect(
        matchesDocumentationSchema(value, { type: "string", format: "bcp47" })
      ).toBe(valid);
    }
  );
  it.each([
    ["2024-02-29", true],
    ["2026-02-29", false],
    ["1900-02-29", false],
    ["2000-02-29", true],
    ["2026-04-31", false],
    ["2026-13", false],
    ["0000", false],
    ["2026", true],
    ["2026-09", true],
    ["19/09/2026", false],
  ])("validates a real calendar date: %s", (value, valid) => {
    expect(
      matchesDocumentationSchema(value, {
        type: "string",
        format: "partial-date",
      })
    ).toBe(valid);
  });
  it.each([
    ["uuid", "11111111-1111-4111-8111-111111111111", true],
    ["uuid", "11111111-1111-1111-1111-111111111111", true],
    ["uuid", "not-an-asset", false],
    ["ethereum-address", "0x" + "a".repeat(40), true],
    ["ethereum-address", "0x1234", false],
    ["uint256-string", "0", true],
    ["uint256-string", "01", false],
    ["uint256-string", "-1", false],
    ["uint256-string", "1e3", false],
    [
      "uint256-string",
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
      true,
    ],
    [
      "uint256-string",
      "115792089237316195423570985008687907853269984665640564039457584007913129639936",
      false,
    ],
  ])("validates format %s", (format, value, valid) => {
    expect(matchesDocumentationSchema(value, { type: "string", format })).toBe(
      valid
    );
  });
  it("rejects duplicate normalized array entries for either schema spelling", () => {
    for (const schema of [
      { type: "array", items: textSchema, unique_items: true },
      { type: "array", items: textSchema, uniqueItems: true },
    ]) {
      expect(matchesDocumentationSchema(["e\u0301", "é"], schema)).toBe(false);
      expect(matchesDocumentationSchema(["en", "fr"], schema)).toBe(true);
    }
  });
  it("matches server defaults and rejects unexpected object keys", () => {
    expect(matchesDocumentationSchema("", textSchema)).toBe(false);
    expect(matchesDocumentationSchema("x".repeat(12001), textSchema)).toBe(
      false
    );
    expect(
      matchesDocumentationSchema(
        Array.from({ length: 31 }, () => "x"),
        { type: "array", items: textSchema }
      )
    ).toBe(false);
    expect(matchesDocumentationSchema({ extra: "x" }, { type: "object" })).toBe(
      false
    );
    expect(
      matchesDocumentationSchema(
        { extra: "x" },
        { type: "object", additional_properties: true }
      )
    ).toBe(true);
    expect(matchesDocumentationSchema("x", {})).toBe(false);
    expect(
      matchesDocumentationSchema(Number.MAX_SAFE_INTEGER + 1, {
        type: "number",
      })
    ).toBe(false);
  });
  it("rejects malformed unicode, non-JSON values, cycles and excessive depth without throwing", () => {
    for (const value of [
      "\ud800",
      "\udfff",
      undefined,
      NaN,
      Infinity,
      new Date(),
      { constructor: "unsafe" },
    ])
      expect(matchesDocumentationSchema(value, textSchema)).toBe(false);
    const cycle: Record<string, unknown> = {};
    cycle["value"] = cycle;
    expect(
      matchesDocumentationSchema(cycle, {
        type: "object",
        additional_properties: true,
      })
    ).toBe(false);
    expect(matchesDocumentationSchema("📷", textSchema)).toBe(true);
  });
  it("uses exactly one alternative and normalized enum values", () => {
    expect(
      matchesDocumentationSchema("a", { one_of: [textSchema, textSchema] })
    ).toBe(false);
    expect(
      matchesDocumentationSchema("a", {
        one_of: [textSchema, { type: "number" }],
      })
    ).toBe(true);
  });
});

describe("field-level semantic parity", () => {
  it.each([
    [{ precision: "day", start: "2026", approximate: false }, false],
    [{ precision: "year", start: "2026-09-19", approximate: false }, false],
    [{ precision: "day", start: "2026-09-19", approximate: false }, true],
    [
      {
        precision: "range",
        endpoint_precision: "year",
        start: "2025",
        end: "2026",
        approximate: false,
      },
      true,
    ],
    [
      {
        precision: "range",
        endpoint_precision: "year",
        start: "2026",
        end: "2025",
        approximate: false,
      },
      false,
    ],
    [
      { precision: "range", start: "2025", end: "2026", approximate: false },
      false,
    ],
    [
      { precision: "year", start: "2026", end: "2026", approximate: false },
      false,
    ],
  ])("honors date precision and range endpoints", (value, valid) => {
    const context = fieldContext("artwork", "capture_date", dateSchema);
    expect(
      validDocumentationOperation(context, "artwork", {
        ...provided(value),
        field: "capture_date",
      })
    ).toBe(valid);
  });
  it.each([
    ["artwork", "medium", "other", "detail"],
    ["process", "ai_use", "assistive", "detail"],
    ["process", "ai_use", "generative", "detail"],
    ["files", "master_availability", "unavailable", "explanation"],
    ["files", "source_availability", "retained_by_artist", "explanation"],
    ["files", "source_availability", "not_applicable", "explanation"],
    ["context", "prior_mint_status", "previously_minted", "explanation"],
  ])(
    "requires the backend's supporting detail for %s.%s",
    (moduleId, fieldId, kind, required) => {
      const context = fieldContext(moduleId, fieldId, kindSchema);
      const operation = { ...provided({ kind }), field: fieldId };
      expect(
        documentationOperationIssues(context, moduleId, operation)
      ).toContainEqual({
        code: "required_details",
        path: [required],
        kind: "incomplete",
      });
      expect(
        validDocumentationOperation(context, moduleId, {
          ...provided({ kind, [required]: "Artist's explanation" }),
          field: fieldId,
        })
      ).toBe(true);
    }
  );
  it("distinguishes missing coordinates from an invalid coordinate number", () => {
    const schema: ApiArtworkDocumentationValueSchema = {
      type: "object",
      properties: {
        latitude: { type: "number", minimum: -90, maximum: 90 },
        longitude: { type: "number", minimum: -180, maximum: 180 },
      },
    };
    const context = fieldContext("artwork", "place", schema, 3);
    expect(
      documentationOperationIssues(context, "artwork", {
        ...provided({ latitude: 35 }),
        field: "place",
      })
    ).toContainEqual({
      code: "incomplete_coordinates",
      path: ["longitude"],
      kind: "incomplete",
    });
    expect(
      documentationOperationIssues(context, "artwork", {
        ...provided({ latitude: 135, longitude: 20 }),
        field: "place",
      })
    ).toContainEqual({
      code: "out_of_range",
      path: ["latitude"],
      kind: "invalid",
    });
  });
  it("requires exactly one original translation and distinct languages including the primary language", () => {
    const schema: ApiArtworkDocumentationValueSchema = {
      type: "object",
      required: ["primary_language", "versions"],
      properties: {
        primary_language: textSchema,
        versions: {
          type: "array",
          items: {
            type: "object",
            properties: { language: textSchema, authorship: textSchema },
          },
        },
      },
    };
    const context = fieldContext("context", "caption", schema);
    const original = { language: "en", authorship: "original" };
    for (const value of [
      { primary_language: "fr", versions: [original] },
      { primary_language: "en", versions: [original, original] },
      {
        primary_language: "en",
        versions: [{ language: "en", authorship: "artist_translation" }],
      },
    ])
      expect(
        documentationOperationIssues(context, "context", {
          ...provided(value),
          field: "caption",
        })
      ).toContainEqual({
        code: "invalid_translations",
        path: ["versions"],
        kind: "invalid",
      });
    expect(
      validDocumentationOperation(context, "context", {
        ...provided({ primary_language: "en", versions: [original] }),
        field: "caption",
      })
    ).toBe(true);
  });
  it("rejects inconsistent entry modes and duplicate techniques", () => {
    const context = fieldContext("process", "contributors", {
      type: "object",
      properties: {
        kind: textSchema,
        entries: { type: "array", items: textSchema },
      },
    });
    for (const value of [
      { kind: "none", entries: ["x"] },
      { kind: "entries_supplied", entries: [] },
    ])
      expect(
        validDocumentationOperation(context, "process", {
          ...provided(value),
          field: "contributors",
        })
      ).toBe(false);
    const techniques = fieldContext("process", "techniques", {
      type: "object",
      properties: {
        kinds: { type: "array", items: textSchema },
        other_detail: textSchema,
      },
    });
    expect(
      validDocumentationOperation(techniques, "process", {
        ...provided({ kinds: ["single_capture", "single_capture"] }),
        field: "techniques",
      })
    ).toBe(false);
    expect(
      validDocumentationOperation(techniques, "process", {
        ...provided({ kinds: ["other"] }),
        field: "techniques",
      })
    ).toBe(false);
  });
  it("does not invent value data for unknown answers and validates capture explanations", () => {
    const context = fieldContext("process", "capture_method", kindSchema);
    const operation = {
      op: "set",
      field: "capture_method",
      answer: { status: "unknown", intended_visibility: "public_record" },
    } as ApiArtworkDocumentationOperation;
    expect(validDocumentationOperation(context, "process", operation)).toBe(
      false
    );
    expect(
      validDocumentationOperation(context, "process", {
        ...operation,
        answer: {
          ...operation.answer!,
          explanation: "The camera is no longer available.",
        },
      })
    ).toBe(true);
    expect(
      validDocumentationOperation(context, "process", {
        ...operation,
        answer: {
          ...operation.answer!,
          value: { kind: "other" },
          explanation: "Unknown.",
        },
      })
    ).toBe(false);
  });
  it("protects fixed program terms for set and unset", () => {
    const context = fieldContext("rights", "intended_license", textSchema, 3);
    context.profile.modules.find(
      (module) => module.id === "rights"
    )!.fields[0]!.read_only = true;
    for (const op of [provided("CC0"), { op: "unset" }])
      expect(
        documentationOperationIssues(context, "rights", {
          ...op,
          field: "intended_license",
        } as ApiArtworkDocumentationOperation)
      ).toEqual([{ code: "fixed_terms", path: [], kind: "invalid" }]);
  });
});

describe("nested museum validation and safe diagnostic paths", () => {
  it("reports the exact nested language field without exposing the answer", () => {
    const schema: ApiArtworkDocumentationValueSchema = {
      type: "array",
      items: {
        type: "object",
        required: ["language"],
        properties: { language: { type: "string", format: "bcp47" } },
      },
    };
    expect(
      documentationSchemaIssues([{ language: "English (UK)" }], schema)
    ).toEqual([
      { code: "invalid_language", path: [0, "language"], kind: "invalid" },
    ]);
    expect(documentationSchemaIssues([{}], schema)).toEqual([
      { code: "required", path: [0, "language"], kind: "incomplete" },
    ]);
  });
  it.each([
    [{ kind: "fixed" }, "required_details", ["seconds"], "incomplete"],
    [{ unit: "other" }, "required_details", ["unit_label"], "incomplete"],
    [
      { start_seconds: 20, end_seconds: 10 },
      "invalid_time_range",
      ["end_seconds"],
      "invalid",
    ],
    [
      { source_start_seconds: 20, source_end_seconds: 10 },
      "invalid_time_range",
      ["source_end_seconds"],
      "invalid",
    ],
    [
      {
        authority: "TGN",
        identifier: "123",
        uri: "https://vocab.getty.edu/tgn/123",
      },
      "invalid_authority",
      ["uri"],
      "invalid",
    ],
  ])("enforces nested server semantics", (value, code, path, kind) => {
    const context = fieldContext(
      "process",
      "video",
      { type: "object", additional_properties: true },
      3
    );
    expect(
      documentationOperationIssues(context, "process", {
        ...provided(value),
        field: "video",
      })
    ).toContainEqual({ code, path, kind });
  });
  it.each([
    "../index.html",
    "/index.html",
    "https://example.org",
    "folder\\index.html",
    "index.html?x=1",
    "folder//index.html",
  ])("rejects an unsafe HTML entry %s", (entry_document) => {
    const context = fieldContext(
      "process",
      "html",
      { type: "object", properties: { entry_document: textSchema } },
      3
    );
    expect(
      documentationOperationIssues(context, "process", {
        ...provided({ entry_document }),
        field: "html",
      })
    ).toContainEqual({
      code: "invalid_entry_document",
      path: ["entry_document"],
      kind: "invalid",
    });
  });
  it("accepts a relative HTML entry without rewriting it", () => {
    const value = Object.freeze({ entry_document: "folder/index.html" });
    const context = fieldContext(
      "process",
      "html",
      { type: "object", properties: { entry_document: textSchema } },
      3
    );
    expect(
      validDocumentationOperation(context, "process", {
        ...provided(value),
        field: "html",
      })
    ).toBe(true);
    expect(value.entry_document).toBe("folder/index.html");
  });
  it("validates scene time and pixel regions against the containing scene", () => {
    const schema: ApiArtworkDocumentationValueSchema = {
      type: "array",
      items: { type: "object", additional_properties: true },
    };
    const context = fieldContext(
      "preservation",
      "presentation_scenes",
      schema,
      3
    );
    const value = [
      {
        id: "scene",
        width: 100,
        height: 100,
        duration_seconds: 30,
        resources: [{ x: 90, width: 20, end_seconds: 31 }],
      },
    ];
    expect(
      documentationOperationIssues(context, "preservation", {
        ...provided(value),
        field: "presentation_scenes",
      })
    ).toContainEqual({
      code: "presentation_bounds",
      path: [0, "resources", 0],
      kind: "invalid",
    });
  });
  it("rejects collection IDs colliding with another entity while allowing edits to the same entity", () => {
    const context = fieldContext(
      "artwork",
      "places",
      {
        type: "array",
        items: { type: "object", properties: { id: textSchema } },
      },
      3
    );
    context.modules["artwork"]!.answers["places"] = provided([
      { id: "place-id" },
    ]).answer!;
    expect(
      validDocumentationOperation(context, "artwork", {
        ...provided([{ id: "place-id" }]),
        field: "places",
      })
    ).toBe(true);
    expect(
      documentationOperationIssues(context, "artwork", {
        ...provided([{ id: context.work_id }]),
        field: "places",
      })
    ).toContainEqual({
      code: "duplicate_item",
      path: [0, "id"],
      kind: "invalid",
    });
    expect(
      validDocumentationOperation(context, "artwork", {
        ...provided([{ id: "new" }, { id: "new" }]),
        field: "places",
      })
    ).toBe(false);
  });
});
