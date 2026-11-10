import { mapMarkdownProse } from "@/helpers/waves/mapMarkdownProse";
import { normalizeDropMarkdownContent } from "@/components/drops/view/part/dropPartMarkdown/normalizeContent";

it.each(["```ts", "~~~ts", "````ts", "   ```ts"])(
  "leaves blank lines inside %s byte-for-byte",
  (opening) => {
    const delimiter = opening.trim().replace("ts", "");
    const code = `${opening}\nfirst\n\n\nlast\n${delimiter}`;
    const text = `Before\n\n\n${code}\n\n\nAfter`;
    const normalized = normalizeDropMarkdownContent(text);
    expect(normalized).toContain(code);
    expect(normalized).toContain("Before\n\n&nbsp;\n\n");
    expect(normalized).toContain("\n\n&nbsp;\n\nAfter");
  }
);

it("keeps short or mismatched markers inside longer fences literal", () => {
  const code = "````\n```\n\n\n~~~\n\n\nlast\n`````";
  expect(mapMarkdownProse(code, () => "changed")).toBe(`changed${code}changed`);
});

it("protects unclosed code and CRLF contents", () => {
  const code = "~~~ts\r\nfirst\r\n\r\n\r\nlast";
  expect(mapMarkdownProse(code, (text) => text.toUpperCase())).toBe(code);
});
