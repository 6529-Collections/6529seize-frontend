/**
 * "Copy this page as Markdown" (EXPLAINED.md §6.2): the page's own text, in
 * reading order, as Markdown. Figures keep their captions and accessible
 * names; controls, decoration and anything marked `data-ex-nocopy` are left
 * out.
 */
const SKIP = new Set([
  "SCRIPT",
  "STYLE",
  "BUTTON",
  "INPUT",
  "SELECT",
  "TEXTAREA",
  "NOSCRIPT",
  "TEMPLATE",
]);

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Laid out as its own box (a block, a flex or grid item, a cell): its text
 * is a separate word from its neighbours', even with no space in the HTML.
 */
function displayOf(element: Element): string {
  if (typeof getComputedStyle !== "function") {
    return "";
  }
  // A test DOM has no layout: its computed display is "" or missing, and
  // only an inline style says how an element is drawn.
  const computed = getComputedStyle(element).display ?? "";
  return computed || (element as HTMLElement).style?.display || "";
}

function boxed(element: Element): boolean {
  const display = displayOf(element);
  return (
    display !== "" && !display.startsWith("inline") && display !== "contents"
  );
}

/** A picture with a name: an SVG, or anything with role="img". */
function picture(element: Element): string | null {
  if (
    element.tagName.toLowerCase() === "svg" ||
    element.getAttribute("role") === "img"
  ) {
    return element.getAttribute("aria-label") ?? "";
  }
  return null;
}

function inline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }
  if (!(node instanceof Element) || skip(node)) {
    return "";
  }
  const named = picture(node);
  if (named !== null) {
    return ` ${named} `;
  }
  if (node.tagName === "BR") {
    return " ";
  }
  const inner = [...node.childNodes]
    .map((child) =>
      child instanceof Element && boxed(child)
        ? ` ${inline(child)} `
        : inline(child)
    )
    .join("");
  if (node.tagName === "B" || node.tagName === "STRONG") {
    const text = clean(inner);
    return text ? `**${text}**` : "";
  }
  if (node.tagName === "A") {
    const href = node.getAttribute("href");
    const text = clean(inner);
    return href && text && !href.startsWith("#") ? `[${text}](${href})` : text;
  }
  return inner;
}

/**
 * Not drawn at this width: a phone's inline label beside a table cell, a
 * desktop's column header on a phone.
 */
function undrawn(element: Element): boolean {
  return displayOf(element) === "none";
}

function skip(element: Element): boolean {
  return (
    SKIP.has(element.tagName) ||
    element.getAttribute("aria-hidden") === "true" ||
    element.hasAttribute("hidden") ||
    element.hasAttribute("data-ex-nocopy") ||
    element.classList.contains("tw-sr-only") ||
    undrawn(element)
  );
}

function table(element: Element): string {
  const rows = [...element.querySelectorAll("tr")].map((row) =>
    [...row.children].map((cell) => clean(inline(cell)).replace(/\|/g, "\\|"))
  );
  if (rows.length === 0) {
    return "";
  }
  const width = Math.max(...rows.map((row) => row.length));
  const line = (row: string[]) =>
    `| ${Array.from({ length: width }, (_, i) => row[i] ?? "").join(" | ")} |`;
  const [head, ...body] = rows;
  return [
    line(head ?? []),
    line(Array.from({ length: width }, () => "---")),
    ...body.map(line),
  ].join("\n");
}

function listBlock(list: Element, ordered: boolean): string {
  const bullet = (index: number) => (ordered ? `${index + 1}.` : "-");
  return [...list.children]
    .filter((item) => !skip(item))
    .map((item, index) => `${bullet(index)} ${clean(inline(item))}`)
    .filter((item) => item.length > 2)
    .join("\n");
}

/**
 * A code block's text, line by line: each line drawn as its own box (a
 * block span, as the kit's code blocks draw them) ends with a newline, so
 * the lines do not run together; controls and hidden parts are left out.
 */
function codeText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }
  if (!(node instanceof Element) || skip(node)) {
    return "";
  }
  return [...node.childNodes]
    .map((child) => {
      const text = codeText(child);
      return child instanceof Element && boxed(child) && !text.endsWith("\n")
        ? `${text}\n`
        : text;
    })
    .join("");
}

/** Words of its own beside its child elements: a sentence with live values in it. */
function hasOwnText(element: Element): boolean {
  return [...element.childNodes].some(
    (node) =>
      node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim() !== ""
  );
}

/** One element as Markdown ("" when empty), or null to walk into it. */
function blockOf(child: Element): string | null {
  const tag = child.tagName;
  const named = picture(child);
  if (named !== null) {
    return clean(named);
  }
  const level = /^H([1-6])$/.exec(tag)?.[1];
  if (level !== undefined) {
    const text = clean(inline(child));
    return text && `${"#".repeat(Number(level))} ${text}`;
  }
  switch (tag) {
    case "P":
    case "FIGCAPTION":
      return clean(inline(child));
    case "BLOCKQUOTE": {
      const text = clean(inline(child));
      return text && `> ${text}`;
    }
    case "UL":
    case "OL":
      return listBlock(child, tag === "OL");
    case "TABLE":
      return table(child);
    case "PRE":
      return `\`\`\`\n${codeText(child).replace(/\n+$/, "")}\n\`\`\``;
    default:
      // A leaf, or a run of text with values and marks inside it: one
      // paragraph. Anything else is walked into, so its parts keep their
      // own paragraphs.
      return child.children.length === 0 || hasOwnText(child)
        ? clean(inline(child))
        : null;
  }
}

function blocks(element: Element, out: string[]): void {
  for (const child of element.children) {
    if (skip(child)) {
      continue;
    }
    const block = blockOf(child);
    if (block === null) {
      blocks(child, out);
    } else if (block) {
      out.push(block);
    }
  }
}

export function pageToMarkdown(root: Element, url: string): string {
  const out: string[] = [];
  blocks(root, out);
  out.push(`Source: ${url}`);
  return `${out.join("\n\n")}\n`;
}
