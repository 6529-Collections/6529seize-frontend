import type { MuseumSha256 } from "./types";
import {
  PUBLICATION_CATALOG_POINTER_SCHEMA,
  assertExactKeys,
  assertKeccak,
  assertSha256,
  asRecord,
  type MuseumPublicationCatalogDocument,
  type MuseumPublicationCatalogPointer,
} from "./catalog-contract";
import { isExactGitCommit } from "./security";

export function parseMuseumPublicationJson(text: string): unknown {
  const parser = new UniqueJsonParser(text);
  const value = parser.parseValue();
  parser.assertEnd();
  return value;
}

/** JSON.parse with duplicate-object-key rejection for commitment material. */
class UniqueJsonParser {
  private index = 0;

  constructor(private readonly text: string) {}

  parseValue(): unknown {
    this.skipWhitespace();
    const character = this.text[this.index];
    if (character === "{") return this.parseObject();
    if (character === "[") return this.parseArray();
    if (character === '"') return this.parseString();
    if (this.text.startsWith("true", this.index)) {
      this.index += 4;
      return true;
    }
    if (this.text.startsWith("false", this.index)) {
      this.index += 5;
      return false;
    }
    if (this.text.startsWith("null", this.index)) {
      this.index += 4;
      return null;
    }
    return this.parseNumber();
  }

  assertEnd(): void {
    this.skipWhitespace();
    if (this.index !== this.text.length) {
      throw new Error("publication_catalog_json_invalid");
    }
  }

  private parseObject(): Record<string, unknown> {
    this.expect("{");
    const result: Record<string, unknown> = {};
    const keys = new Set<string>();
    this.skipWhitespace();
    if (this.consume("}")) return result;
    while (this.index <= this.text.length) {
      this.skipWhitespace();
      if (this.text[this.index] !== '"') {
        throw new Error("publication_catalog_json_invalid");
      }
      const key = this.parseString();
      if (typeof key !== "string" || keys.has(key)) {
        throw new Error("publication_catalog_duplicate_key");
      }
      keys.add(key);
      this.skipWhitespace();
      this.expect(":");
      result[key] = this.parseValue();
      this.skipWhitespace();
      if (this.consume("}")) return result;
      this.expect(",");
    }
    throw new Error("publication_catalog_json_invalid");
  }

  private parseArray(): unknown[] {
    this.expect("[");
    const result: unknown[] = [];
    this.skipWhitespace();
    if (this.consume("]")) return result;
    while (this.index <= this.text.length) {
      result.push(this.parseValue());
      this.skipWhitespace();
      if (this.consume("]")) return result;
      this.expect(",");
    }
    throw new Error("publication_catalog_json_invalid");
  }

  private parseString(): string {
    const start = this.index;
    this.expect('"');
    while (this.index < this.text.length) {
      const character = this.text[this.index];
      if (character === "\\") {
        this.index += 2;
        if (this.text[this.index - 1] === "u") this.index += 4;
        continue;
      }
      this.index += 1;
      if (character === '"') {
        const value = this.text.slice(start, this.index);
        try {
          return JSON.parse(value) as string;
        } catch {
          throw new Error("publication_catalog_json_invalid");
        }
      }
      if (character !== undefined && character < " ") {
        throw new Error("publication_catalog_json_invalid");
      }
    }
    throw new Error("publication_catalog_json_invalid");
  }

  private parseNumber(): number {
    const start = this.index;
    this.consume("-");
    this.consumeJsonInteger();
    this.consumeJsonFraction();
    this.consumeJsonExponent();
    const value = Number(this.text.slice(start, this.index));
    if (!Number.isFinite(value))
      throw new Error("publication_catalog_json_invalid");
    return value;
  }

  private consumeJsonInteger(): void {
    if (this.consume("0")) {
      if (isJsonDigit(this.text[this.index])) {
        throw new Error("publication_catalog_json_invalid");
      }
    } else {
      const first = this.text[this.index];
      if (first === undefined || first < "1" || first > "9") {
        throw new Error("publication_catalog_json_invalid");
      }
      this.index += 1;
      while (isJsonDigit(this.text[this.index])) this.index += 1;
    }
  }

  private consumeJsonFraction(): void {
    if (this.consume(".")) {
      const fractionStart = this.index;
      while (isJsonDigit(this.text[this.index])) this.index += 1;
      if (fractionStart === this.index) {
        throw new Error("publication_catalog_json_invalid");
      }
    }
  }

  private consumeJsonExponent(): void {
    if (this.text[this.index] === "e" || this.text[this.index] === "E") {
      this.index += 1;
      if (!this.consume("+")) this.consume("-");
      const exponentStart = this.index;
      while (isJsonDigit(this.text[this.index])) this.index += 1;
      if (exponentStart === this.index) {
        throw new Error("publication_catalog_json_invalid");
      }
    }
  }

  private skipWhitespace(): void {
    while (/\s/u.test(this.text[this.index] ?? "")) this.index += 1;
  }

  private consume(value: string): boolean {
    if (this.text[this.index] !== value) return false;
    this.index += 1;
    return true;
  }

  private expect(value: string): void {
    if (!this.consume(value))
      throw new Error("publication_catalog_json_invalid");
  }
}

function isJsonDigit(value: string | undefined): boolean {
  return value !== undefined && value >= "0" && value <= "9";
}

export function requiredString(
  record: Record<string, unknown>,
  key: string,
  code: string
): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) throw new Error(code);
  return value;
}

export function requiredSha(
  record: Record<string, unknown>,
  key: string,
  code: string
): MuseumSha256 {
  const value = requiredString(record, key, code);
  assertSha256(value as MuseumSha256, code);
  return value as MuseumSha256;
}

export function requiredKeccak(
  record: Record<string, unknown>,
  key: string,
  code: string
): `0x${string}` {
  const value = requiredString(record, key, code);
  assertKeccak(value, code);
  return value;
}

export function requiredCommit(
  record: Record<string, unknown>,
  key: string,
  code: string
): string {
  const value = requiredString(record, key, code);
  if (!isExactGitCommit(value)) throw new Error(code);
  return value;
}

export function decodeCatalogDocumentRecord(
  value: unknown,
  code = "publication_catalog_document_shape"
): MuseumPublicationCatalogDocument {
  const record = asRecord(value, code);
  assertExactKeys(
    record,
    [
      "path",
      "file_size",
      "byte_mode",
      "sha256",
      "jcs_keccak256",
      "immutable_source_url",
      "immutable_raw_url",
    ],
    code
  );
  const size = record.file_size;
  if (
    !Number.isSafeInteger(size) ||
    (size as number) < 0 ||
    (record.byte_mode !== "raw" && record.byte_mode !== "lf-normalized")
  ) {
    throw new Error(code);
  }
  const jcsValue = record.jcs_keccak256;
  if (jcsValue !== null && typeof jcsValue !== "string") {
    throw new Error(code);
  }
  if (typeof jcsValue === "string") assertKeccak(jcsValue, code);
  return {
    path: requiredString(record, "path", code),
    size: size as number,
    byteMode: record.byte_mode,
    sha256: requiredSha(record, "sha256", code),
    ...(jcsValue === null
      ? {}
      : {
          jcsKeccak: jcsValue,
        }),
    sourceUrl: requiredString(record, "immutable_source_url", code),
    rawUrl: requiredString(record, "immutable_raw_url", code),
  };
}

export function decodeCatalogDocumentArray(
  value: unknown,
  code: string
): readonly MuseumPublicationCatalogDocument[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error(code);
  return value.map((item) => decodeCatalogDocumentRecord(item, code));
}

export function decodePublicationCatalogPointer(
  value: unknown
): MuseumPublicationCatalogPointer {
  const record = asRecord(value, "publication_catalog_pointer_shape");
  assertExactKeys(
    record,
    [
      "$schema",
      "pointer_version",
      "catalog_path",
      "catalog_file_sha256",
      "catalog_envelope_content_hash",
      "source_commit",
      "activation",
    ],
    "publication_catalog_pointer_shape"
  );
  const activation = asRecord(
    record.activation,
    "publication_catalog_pointer_activation"
  );
  assertExactKeys(
    activation,
    ["actor_id", "activated_at", "mode", "prior_catalog_id"],
    "publication_catalog_pointer_activation"
  );
  if (
    record.$schema !== PUBLICATION_CATALOG_POINTER_SCHEMA ||
    record.pointer_version !== "1.0.0" ||
    typeof activation.actor_id !== "string" ||
    activation.actor_id.length === 0 ||
    typeof activation.activated_at !== "string" ||
    !Number.isFinite(Date.parse(activation.activated_at)) ||
    (activation.mode !== "activate" && activation.mode !== "rollback") ||
    (activation.prior_catalog_id !== null &&
      typeof activation.prior_catalog_id !== "string")
  ) {
    throw new Error("publication_catalog_pointer_shape");
  }
  return {
    catalogPath: requiredString(
      record,
      "catalog_path",
      "publication_catalog_pointer_shape"
    ),
    catalogSha256: requiredSha(
      record,
      "catalog_file_sha256",
      "publication_catalog_pointer_shape"
    ),
    catalogEnvelopeContentHash: requiredKeccak(
      record,
      "catalog_envelope_content_hash",
      "publication_catalog_pointer_shape"
    ),
    sourceCommit: requiredCommit(
      record,
      "source_commit",
      "publication_catalog_pointer_shape"
    ),
  };
}
