import { decodeHtmlEntities, sanitizeHtmlToText, stripHtmlTags } from "@/lib/text/html";

describe("stripHtmlTags", () => {
  it("removes script tags even across multiple lines", () => {
    const input = "<div>Hello<script>\nalert(1)</script>World</div>";
    const result = stripHtmlTags(input, { preserveTagSpacing: true });
    expect(result).not.toMatch(/[<>]/);
    expect(result).toContain("Hello");
    expect(result).toContain("World");
  });

  it("preserves spacing between tags when requested", () => {
    const input = "<p>Alpha</p><span>Beta</span>";
    const result = stripHtmlTags(input, { preserveTagSpacing: true });
    expect(result).toBe("Alpha Beta");
  });

  it("respects the maxLength option to avoid pathological inputs", () => {
    const input = `<div>${"x".repeat(10)}<span>${"y".repeat(10)}</span></div>`;
    const result = stripHtmlTags(input, { maxLength: 15 });
    expect(result).toBe("xxxxxxxxxx");
  });
});

describe("decodeHtmlEntities", () => {
  it("decodes numeric and named entities", () => {
    const input = "Fish &amp; Chips &#x41; &#65;";
    expect(decodeHtmlEntities(input)).toBe("Fish & Chips A A");
  });

  it("strips unknown entities", () => {
    const input = "foo &madeup; bar";
    expect(decodeHtmlEntities(input)).toBe("foo  bar");
  });
});

describe("sanitizeHtmlToText", () => {
  it("removes tags and decodes entities in a single step", () => {
    const input = "<strong>Safe &amp; Sound</strong>";
    expect(sanitizeHtmlToText(input, { preserveTagSpacing: true })).toBe("Safe & Sound");
  });
});
