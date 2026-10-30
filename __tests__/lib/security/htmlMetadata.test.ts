/**
 * @jest-environment node
 */
jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { loadHtmlMetadata } from "@/lib/security/htmlMetadata";

const MIB = 1024 * 1024;

// Generous bound: these inputs finish in milliseconds when the scan is linear.
const BOUNDED_WORK_MS = 5000;

function loadTimed(html: string, maxChars?: number) {
  const startedAt = performance.now();
  const $ = loadHtmlMetadata(html, { maxChars });
  return { $, elapsedMs: performance.now() - startedAt };
}

describe("loadHtmlMetadata", () => {
  it("keeps metadata elements from the head and body in source order", () => {
    const $ = loadHtmlMetadata(`<!doctype html>
      <html>
        <head>
          <TITLE>Fish &amp; Chips</TITLE>
          <meta property="og:title" content="First">
          <link rel="icon" href="/favicon.ico">
        </head>
        <body>
          <div><p><span>
            <script type="application/ld+json">{"headline":"Body JSON-LD"}</script>
            <meta name="twitter:title" content="Second">
          </span></p></div>
        </body>
      </html>`);

    expect($("title").text()).toBe("Fish & Chips");
    expect(
      $("meta")
        .map((_index, element) => $(element).attr("content"))
        .get()
    ).toEqual(["First", "Second"]);
    expect($('link[rel="icon"]').attr("href")).toBe("/favicon.ico");
    expect(JSON.parse($('script[type="application/ld+json"]').text())).toEqual({
      headline: "Body JSON-LD",
    });
    expect($("div, p, span")).toHaveLength(0);
  });

  it("follows the HTML tokenizer for comments, raw text, and quoted attributes", () => {
    const $ = loadHtmlMetadata(`
      <!-- <meta name="commented" content="no"> -->
      <noscript><meta name="noscript" content="no"></noscript>
      <style>.a::after { content: '<meta name="style" content="no">'; }</style>
      <textarea><meta name="textarea" content="no"></textarea>
      <script>document.write('<meta name="script" content="no">');</script>
      <meta name="description" content="1 < 2 > 0" data-note='"quoted"'>
      <meta name=unquoted content=value>
    `);

    expect(
      $("meta")
        .map((_index, element) => $(element).attr("name"))
        .get()
    ).toEqual(["description", "unquoted"]);
    expect($('meta[name="description"]').attr("content")).toBe("1 < 2 > 0");
    expect($('meta[name="description"]').attr("data-note")).toBe('"quoted"');
    expect($('meta[name="unquoted"]').attr("content")).toBe("value");
  });

  it("never turns copied attribute or script text into elements", () => {
    const $ = loadHtmlMetadata(`
      <meta name="a" content="<div><div><title>x</title>">
      <meta b==">"<div><div>">
      <script type="application/ld+json">{"text":"<!--<script>"}</script>
      <meta name="after" content="kept">
    `);

    expect($("div")).toHaveLength(0);
    expect($("title")).toHaveLength(0);
    expect($('meta[name="a"]').attr("content")).toBe(
      "<div><div><title>x</title>"
    );
    expect(JSON.parse($("script").text())).toEqual({ text: "<!--<script>" });
    expect($('meta[name="after"]').attr("content")).toBe("kept");
  });

  it("ends each copied script at its own end tag", () => {
    const backslash = String.fromCodePoint(92);
    const escapedCommentOpen = `${backslash}u003C!--`;
    const preEscapedJson = `{"note":"${escapedCommentOpen} kept"}`;
    const $ = loadHtmlMetadata(`
      <script>var a = 1;</script\t><meta name="after-tab" content="1">
      <script>var b = 2;</script/><link rel="icon" href="/after-slash.ico">
      <script>var s = "</scriptx>";</script><title>After string</title>
      <script>document.write("<!--<script>");</script><meta name="after-comment" content="2">
      <script type="application/ld+json">${preEscapedJson}</script><meta name="last" content="3">
    `);

    expect(
      $("script")
        .map((_index, element) => $(element).text())
        .get()
    ).toEqual([
      "var a = 1;",
      "var b = 2;",
      'var s = "</scriptx>";',
      `document.write("${escapedCommentOpen}<script>");`,
      preEscapedJson,
    ]);
    expect(JSON.parse($('script[type="application/ld+json"]').text())).toEqual({
      note: "<!-- kept",
    });
    expect(
      $("meta")
        .map((_index, element) => $(element).attr("name"))
        .get()
    ).toEqual(["after-tab", "after-comment", "last"]);
    expect($("link").attr("href")).toBe("/after-slash.ico");
    expect($("title").text()).toBe("After string");
    // html, head, and body, the five scripts, and the five later elements.
    expect($("*")).toHaveLength(13);
  });

  it("handles empty comments, end tag attributes, and plaintext", () => {
    const $ = loadHtmlMetadata(`
      <!--><meta name="after-empty-comment" content="1">
      <!---><meta name="after-short-comment" content="2">
      <title>Kept</title data-x=">"><meta name="after-title" content="3">
      <plaintext><meta name="plain" content="no">
    `);

    expect($("title").text()).toBe("Kept");
    expect(
      $("meta")
        .map((_index, element) => $(element).attr("name"))
        .get()
    ).toEqual(["after-empty-comment", "after-short-comment", "after-title"]);
  });

  it("stops at input that ends inside a tag", () => {
    const $ = loadHtmlMetadata(
      '<meta name="first" content="kept"><meta name="second" content="cut'
    );

    expect($("meta")).toHaveLength(1);
    expect($("meta").attr("name")).toBe("first");
    expect(
      loadHtmlMetadata('<title>Unfinished</title data-x="')("title")
    ).toHaveLength(0);
  });

  it("scans only the first 1 MiB unless asked for more", () => {
    const html = `${" ".repeat(MIB)}<meta name="late" content="found">`;

    expect(loadHtmlMetadata(html)("meta")).toHaveLength(0);
    expect(
      loadHtmlMetadata(html, { maxChars: html.length })("meta").attr("content")
    ).toBe("found");
  });

  it("caps the number of copied elements", () => {
    const $ = loadHtmlMetadata('<meta name="x" content="y">'.repeat(3000));

    expect($("meta")).toHaveLength(2048);
  });

  it.each([
    ["deeply nested elements", "<div>".repeat(400_000)],
    ["unterminated meta tags", "<meta ".repeat(300_000)],
    ["unterminated attributes", `<meta ${'a="b" '.repeat(300_000)}`],
    ["unclosed comments", "<!--".repeat(500_000)],
    ["unclosed raw text elements", "<title><script>".repeat(150_000)],
    ["bare angle brackets", "<".repeat(2 * MIB)],
  ])("handles very large documents of %s within bounds", (_label, body) => {
    const html = `<meta property="og:title" content="Title">${body}`;

    const { $, elapsedMs } = loadTimed(html, html.length);

    expect($("meta").attr("content")).toBe("Title");
    expect($("*").length).toBeLessThanOrEqual(4);
    expect(elapsedMs).toBeLessThan(BOUNDED_WORK_MS);
  });
});
