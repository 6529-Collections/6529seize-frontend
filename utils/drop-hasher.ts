import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { sha256 } from "js-sha256";

export class DropHasher {
  public hash({
    drop,
    termsOfService,
  }: {
    drop: ApiCreateDropRequest;
    termsOfService: string | null;
  }): string {
    const obj: Record<string, unknown> = {
      ...drop,
    };
    if (termsOfService) {
      obj["terms_of_service"] = termsOfService;
    }
    delete obj["signature"];
    delete obj["signature_message"];
    const serialisedObj = this.canonicalJSONStringify(obj);
    return sha256(serialisedObj);
  }

  private canonicalJSONStringify(obj: unknown): string {
    if (typeof obj !== "object" || obj === null) {
      return JSON.stringify(obj);
    }

    if (Array.isArray(obj)) {
      const items = obj.map((item) => this.canonicalJSONStringify(item));
      return `[${items.join(",")}]`;
    }

    const record = obj as Record<string, unknown>;
    // Deliberately locale-independent: this feeds drop signature hashing,
    // so key order must be stable across environments (UTF-16 code units,
    // same ordering the default Array#sort applies to strings).
    const keys = Object.keys(record).sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
    const keyValuePairs = keys
      .filter((key) => record[key] !== undefined)
      .map((key) => {
        const valueString = this.canonicalJSONStringify(record[key]);
        return `${JSON.stringify(key)}:${valueString}`;
      });
    return `{${keyValuePairs.join(",")}}`;
  }
}
