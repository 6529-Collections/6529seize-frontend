import { load } from "cheerio/slim";

type HtmlNode = Exclude<
  Parameters<typeof load>[0],
  string | Buffer | unknown[]
>;

type HtmlPart =
  | { readonly type: "text"; readonly text: string; readonly level?: number }
  | { readonly type: "link"; readonly href: string; readonly label: string }
  | {
      readonly type: "unsupported";
      readonly tag: string;
      readonly uri: string;
    };

const MEDIA_TAGS = new Set([
  "img",
  "video",
  "audio",
  "iframe",
  "object",
  "embed",
  "script",
  "style",
  "hr",
]);
const PARAGRAPH_TAGS = new Set([
  "p",
  "div",
  "section",
  "article",
  "li",
  "ul",
  "ol",
  "blockquote",
  "table",
  "tr",
  "td",
]);

/** Walk the parsed DOM once, preserving text/media order without overlapping regex matches. */
export function extractHtmlParts(html: string): HtmlPart[] {
  const $ = load(html, {}, false);
  const parts: HtmlPart[] = [];
  let text = "";
  let links: Array<Extract<HtmlPart, { type: "link" }>> = [];
  const flush = (level?: number) => {
    const cleaned = text
      .replace(/[^\S\n]+/g, " ")
      .replace(/ ?\n ?/g, "\n")
      .trim();
    if (cleaned)
      parts.push({
        type: "text",
        text: cleaned,
        ...(level === undefined ? {} : { level }),
      });
    parts.push(...links);
    text = "";
    links = [];
  };
  const visit = (node: HtmlNode): void => {
    if (node.nodeType === 3 && "data" in node) {
      text += node.data;
      return;
    }
    if (!("name" in node) || !("children" in node)) return;
    const tag = node.name.toLowerCase();
    if (MEDIA_TAGS.has(tag)) {
      flush();
      parts.push({
        type: "unsupported",
        tag,
        uri: $(node).attr("src") ?? $(node).attr("data") ?? "",
      });
      return;
    }
    if (tag === "br") {
      text += "\n";
      return;
    }
    const heading = /^h[1-6]$/.test(tag) ? Number(tag[1]) : undefined;
    const boundary = PARAGRAPH_TAGS.has(tag) || heading !== undefined;
    if (boundary) flush();
    for (const child of node.children) visit(child);
    if (tag === "a") {
      const href = $(node).attr("href");
      if (href)
        links.push({
          type: "link",
          href,
          label: $(node).text().replace(/\s+/g, " ").trim() || href,
        });
    }
    if (boundary) flush(heading);
  };
  for (const node of $.root().contents().toArray()) visit(node);
  flush();
  return parts;
}

/** Accept HTTPS and same-origin paths; reject network-path references and backslash normalization. */
export function safeMigrationLink(value: string): string | undefined {
  if (value !== value.trim() || /[\u0000-\u0020\u007f\\]/.test(value))
    return undefined;
  if (value.startsWith("//")) return undefined;
  try {
    const url = new URL(value, "https://6529.io");
    if (url.protocol !== "https:" || url.username || url.password)
      return undefined;
    if (value.startsWith("/") || value.startsWith("#")) return value;
    return /^https:\/\//i.test(value) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** Keep a bounded metadata value intentional, without cutting a word or surrogate pair. */
export function boundedMetadata(value: string, limit: number): string {
  if (value.length <= limit) return value;
  let prefix = "";
  for (const char of value) {
    if (prefix.length + char.length > limit - 1) break;
    prefix += char;
  }
  const wordEnd = prefix.lastIndexOf(" ");
  return `${(wordEnd > 0 ? prefix.slice(0, wordEnd) : prefix).trimEnd()}…`;
}
