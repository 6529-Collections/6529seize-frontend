export type SanitizeHtmlOptions = Readonly<{
  /**
   * Allow basic inline SVG for trusted-ish use cases (e.g. on-chain artist signatures).
   * Still strips scripts, event handlers, external URLs, and foreignObject.
   */
  allowSvg?: boolean;
  /**
   * Keeps `class` attributes to preserve styling of allowed tags.
   */
  allowClassAttribute?: boolean;
  /**
   * Keeps `style` attributes when they don't contain obviously dangerous constructs.
   * Prefer `false` when possible.
   */
  allowStyleAttribute?: boolean;
}>;

const DEFAULT_ALLOWED_TAGS = new Set([
  "a",
  "article",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "section",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

const SVG_ALLOWED_TAGS = new Set([
  "svg",
  "g",
  "path",
  "circle",
  "ellipse",
  "rect",
  "line",
  "polyline",
  "polygon",
  "defs",
  "lineargradient",
  "radialgradient",
  "stop",
  "clippath",
  "mask",
  "pattern",
  "title",
  "desc",
  "use",
]);

const SVG_ALLOWED_ATTRS = new Set([
  "clip-path",
  "clip-rule",
  "cx",
  "cy",
  "d",
  "fill",
  "fill-rule",
  "gradienttransform",
  "gradientunits",
  "height",
  "id",
  "mask",
  "opacity",
  "offset",
  "patterncontentunits",
  "patterntransform",
  "patternunits",
  "points",
  "preserveaspectratio",
  "r",
  "rx",
  "ry",
  "stop-color",
  "stop-opacity",
  "stroke",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke-width",
  "transform",
  "viewbox",
  "width",
  "x",
  "x1",
  "x2",
  "xmlns",
  "xmlns:xlink",
  "y",
  "y1",
  "y2",
]);

const URL_ATTRS = new Set(["href", "src", "srcset"]);

const DEFAULT_ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

const SAFE_IMG_DATA_PREFIXES = [
  "data:image/png",
  "data:image/jpeg",
  "data:image/jpg",
  "data:image/gif",
  "data:image/webp",
  "data:image/avif",
];

export function sanitizeUntrustedHtml(
  html: string,
  options: SanitizeHtmlOptions = {}
): string {
  if (!html) {
    return "";
  }

  const { allowSvg = false, allowClassAttribute = true, allowStyleAttribute = false } =
    options;

  const DOMParserCtor = globalThis.DOMParser;
  if (typeof DOMParserCtor === "undefined") {
    return "";
  }

  const parsed = new DOMParserCtor().parseFromString(html, "text/html");
  const container = parsed.createElement("div");

  const allowedTags = allowSvg
    ? new Set([...DEFAULT_ALLOWED_TAGS, ...SVG_ALLOWED_TAGS])
    : DEFAULT_ALLOWED_TAGS;

  const inputNodes = Array.from(parsed.body.childNodes);
  inputNodes.forEach((node) => {
    sanitizeNode(node, parsed, allowedTags, {
      allowClassAttribute,
      allowStyleAttribute,
      allowSvg,
    }).forEach((sanitized) => container.appendChild(sanitized));
  });

  return container.innerHTML;
}

type SanitizerRuntimeOptions = Readonly<{
  allowSvg: boolean;
  allowClassAttribute: boolean;
  allowStyleAttribute: boolean;
}>;

function sanitizeNode(
  node: ChildNode,
  doc: Document,
  allowedTags: ReadonlySet<string>,
  options: SanitizerRuntimeOptions
): Node[] {
  // TEXT_NODE = 3
  if (node.nodeType === 3) {
    return [doc.createTextNode(node.textContent ?? "")];
  }

  // ELEMENT_NODE = 1
  if (node.nodeType !== 1) {
    return [];
  }

  const element = node as Element;
  const rawTagName = element.tagName;
  const tag = rawTagName.toLowerCase();

  if (!allowedTags.has(tag)) {
    return sanitizeChildren(element, doc, allowedTags, options);
  }

  if (options.allowSvg && isBannedSvgElement(tag)) {
    return sanitizeChildren(element, doc, allowedTags, options);
  }

  const output =
    options.allowSvg && element.namespaceURI === "http://www.w3.org/2000/svg"
      ? doc.createElementNS("http://www.w3.org/2000/svg", rawTagName)
      : doc.createElement(tag);
  copySafeAttributes(element, output, tag, options);

  if (tag !== "img") {
    sanitizeChildren(element, doc, allowedTags, options).forEach((child) =>
      output.appendChild(child)
    );
  }

  return [output];
}

function sanitizeChildren(
  element: Element,
  doc: Document,
  allowedTags: ReadonlySet<string>,
  options: SanitizerRuntimeOptions
): Node[] {
  const result: Node[] = [];
  Array.from(element.childNodes).forEach((child) => {
    sanitizeNode(child as ChildNode, doc, allowedTags, options).forEach((node) =>
      result.push(node)
    );
  });
  return result;
}

function copySafeAttributes(
  input: Element,
  output: Element,
  tag: string,
  options: SanitizerRuntimeOptions
) {
  for (const attr of Array.from(input.attributes)) {
    const rawName = attr.name;
    const name = rawName.toLowerCase();
    const value = attr.value;

    if (name.startsWith("on")) {
      continue;
    }

    if (name.startsWith("data-") || name.startsWith("aria-")) {
      output.setAttribute(rawName, value);
      continue;
    }

    if (name === "class") {
      if (options.allowClassAttribute) {
        output.setAttribute(rawName, value);
      }
      continue;
    }

    if (name === "style") {
      if (!options.allowStyleAttribute) {
        continue;
      }
      const sanitized = sanitizeStyleAttribute(value);
      if (sanitized) {
        output.setAttribute(rawName, sanitized);
      }
      continue;
    }

    if (name === "id" || name === "title" || name === "role" || name === "dir" || name === "lang") {
      output.setAttribute(rawName, value);
      continue;
    }

    if (tag === "a") {
      if (name === "href") {
        const safeHref = sanitizeUrl(value, { allowDataImages: false });
        if (safeHref) {
          output.setAttribute("href", safeHref);
        }
        continue;
      }

      if (name === "target") {
        const safeTarget = sanitizeAnchorTarget(value);
        if (safeTarget) {
          output.setAttribute("target", safeTarget);
        }
        continue;
      }

      if (name === "rel") {
        const sanitized = sanitizeRel(value);
        if (sanitized) {
          output.setAttribute("rel", sanitized);
        }
        continue;
      }

      if (name === "name") {
        output.setAttribute(rawName, value);
        continue;
      }
    }

    if (tag === "img") {
      if (name === "src") {
        const safeSrc = sanitizeUrl(value, { allowDataImages: true });
        if (safeSrc) {
          output.setAttribute("src", safeSrc);
        }
        continue;
      }
      if (name === "srcset") {
        const safeSrcset = sanitizeSrcset(value);
        if (safeSrcset) {
          output.setAttribute("srcset", safeSrcset);
        }
        continue;
      }
      if (name === "sizes" || name === "alt" || name === "width" || name === "height" || name === "loading" || name === "decoding") {
        output.setAttribute(rawName, value);
        continue;
      }
    }

    if (tag === "td" || tag === "th") {
      if (name === "colspan" || name === "rowspan") {
        output.setAttribute(rawName, value);
        continue;
      }
    }

    if (options.allowSvg && SVG_ALLOWED_TAGS.has(tag)) {
      if (name === "href" || name === "xlink:href") {
        const safe = value.trim();
        if (safe.startsWith("#")) {
          output.setAttribute(rawName, safe);
        }
        continue;
      }

      if (URL_ATTRS.has(name)) {
        continue;
      }

      if (SVG_ALLOWED_ATTRS.has(name)) {
        output.setAttribute(rawName, value);
        continue;
      }
    }
  }

  if (tag === "a") {
    const target = output.getAttribute("target");
    if (target === "_blank") {
      output.setAttribute("rel", "noopener noreferrer");
    }
  }
}

function sanitizeUrl(
  raw: string,
  options: Readonly<{ allowDataImages: boolean }>
): string | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }

  if (value.startsWith("#") || value.startsWith("/")) {
    return value;
  }

  const lower = value.toLowerCase();
  if (lower.startsWith("javascript:")) {
    return null;
  }

  if (lower.startsWith("data:")) {
    if (!options.allowDataImages) {
      return null;
    }
    return SAFE_IMG_DATA_PREFIXES.some((prefix) => lower.startsWith(prefix))
      ? value
      : null;
  }

  try {
    const url = new URL(value);
    return DEFAULT_ALLOWED_PROTOCOLS.has(url.protocol) ? value : null;
  } catch {
    return null;
  }
}

function sanitizeSrcset(value: string): string | null {
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const sanitized: string[] = [];
  for (const part of parts) {
    const [urlCandidate, descriptor] = part.split(/\s+/, 2);
    if (!urlCandidate) {
      continue;
    }
    const safeUrl = sanitizeUrl(urlCandidate, { allowDataImages: true });
    if (!safeUrl) {
      continue;
    }
    sanitized.push(descriptor ? `${safeUrl} ${descriptor}` : safeUrl);
  }

  return sanitized.length > 0 ? sanitized.join(", ") : null;
}

function sanitizeAnchorTarget(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "_blank" || normalized === "_self" || normalized === "_parent" || normalized === "_top") {
    return normalized;
  }
  return null;
}

function sanitizeRel(value: string): string | null {
  const tokens = value
    .split(/\s+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  const allowed = new Set(["noopener", "noreferrer", "ugc", "nofollow"]);
  const sanitized = tokens.filter((token) => allowed.has(token));
  return sanitized.length > 0 ? sanitized.join(" ") : null;
}

function sanitizeStyleAttribute(style: string): string | null {
  const value = style.trim();
  if (!value) {
    return null;
  }

  if (/(?:expression\s*\(|url\s*\(|@import)/i.test(value)) {
    return null;
  }

  return value;
}

function isBannedSvgElement(tag: string): boolean {
  return (
    tag === "script" ||
    tag === "foreignobject" ||
    tag === "iframe" ||
    tag === "audio" ||
    tag === "video" ||
    tag === "animate" ||
    tag === "set"
  );
}
