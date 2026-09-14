import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import {
  matchesDocumentationSchema,
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
