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
    const keys = Object.keys(record).sort();
    const keyValuePairs = keys
      .filter((key) => record[key] !== undefined)
      .map((key) => {
        const valueString = this.canonicalJSONStringify(record[key]);
        return `${JSON.stringify(key)}:${valueString}`;
      });
    return `{${keyValuePairs.join(",")}}`;
  }
}
