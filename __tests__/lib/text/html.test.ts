import {
  decodeHtmlEntities,
  replaceHtmlBreaksWithNewlines,
  sanitizeHtmlToText,
  stripHtmlTags,
} from "@/lib/text/html";

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

  it("preserves text around decoded angle brackets", () => {
    const input = "Value &lt; without closing";
    expect(sanitizeHtmlToText(input)).toBe("Value  without closing");
  });

  it("removes long sequences of decoded brackets", () => {
    const input = "&lt;".repeat(128);
    expect(sanitizeHtmlToText(input)).toBe("");
  });
});

describe("replaceHtmlBreaksWithNewlines", () => {
  it("converts common break tags to newlines", () => {
    const input = "First<br>Second</p>Third";
    expect(replaceHtmlBreaksWithNewlines(input)).toBe("First\nSecond\nThird");
  });

  it("ignores unrelated tags and preserves them for follow-up sanitizers", () => {
    const input = "<div>Start</div><br />Middle<span>End</span>";
    expect(replaceHtmlBreaksWithNewlines(input)).toBe("<div>Start</div>\nMiddle<span>End</span>");
  });

  it("handles tags with attributes and mixed casing", () => {
    const input = "<BR class=\"foo\">Alpha</P >Beta";
    expect(replaceHtmlBreaksWithNewlines(input)).toBe("\nAlpha\nBeta");
  });

  it("leaves partial tags untouched", () => {
    const input = "Broken<br";
    expect(replaceHtmlBreaksWithNewlines(input)).toBe("Broken<br");
  });
});
