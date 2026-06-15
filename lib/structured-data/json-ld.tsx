import type { JsonLdObject } from "./types";

const JSON_LD_ESCAPES: Record<string, string> = {
  "<": String.raw`\u003c`,
  ">": String.raw`\u003e`,
  "\u2028": String.raw`\u2028`,
  "\u2029": String.raw`\u2029`,
};

export function serializeJsonLd(data: JsonLdObject): string {
  return JSON.stringify(data).replaceAll(
    /[<>\u2028\u2029]/g,
    (char) => JSON_LD_ESCAPES[char] ?? char
  );
}

export default function JsonLdScript({
  data,
}: {
  readonly data: JsonLdObject | null | undefined;
}) {
  if (!data) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
