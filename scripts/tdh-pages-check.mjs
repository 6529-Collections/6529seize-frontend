#!/usr/bin/env node
/**
 * Layout and legibility gate for the TDH pages.
 *
 * Renders every TDH route in headless Chromium at 1440 and 1280 px (desktop),
 * 768 px (a tablet), 390 px (a phone: touch, mobile user agent), and 390 and
 * 320 px with a desktop user agent (narrow desktop windows; 320 is 400% zoom
 * on a 1280 screen, WCAG 1.4.10 Reflow). Each view is inspected twice, first
 * as it loads, with every <details> closed, then with every <details> open,
 * and fails on:
 *
 * - horizontal page overflow, and elements that reach past the viewport;
 * - text that escapes its frame (the nearest ancestor with a border or a
 *   background), is cut off by an overflow-hidden ancestor, or runs past the
 *   edge of its SVG;
 * - SVG text that is not at least 4 px inside the box drawn around it (the
 *   smallest rect of its SVG that holds the text's centre);
 * - sideways-scrolling regions that are not marked `data-tdh-scroll` (the
 *   shared scroll frame, which shows an edge fade and a hint);
 * - text collisions: two pieces of text drawn over each other, in HTML or
 *   SVG;
 * - one word per line: a text block of three or more words wrapped so that
 *   most of its lines hold a single word;
 * - text rendered under 12 px, SVG text included (its font size times the
 *   SVG's scale on screen); 10 and 9 px in the 360 and 320 px windows, which
 *   stand for zoom;
 * - WCAG 2.2 AA failures found by axe-core (colour contrast among them), and
 *   SVG text whose contrast with what is drawn under it is below AA;
 * - broken table layouts: a <caption> taken out of flow (the sr-only
 *   caption that adds an anonymous column), or rows that do not span their
 *   table;
 * - controls too small to hit: a button, switch, select, summary or text
 *   field under 24 x 24 px (WCAG 2.2 AA 2.5.8), and a text field or select
 *   under 40 px tall, or 44 px in the phone view;
 * - SVG text that a drawn line crosses: a path, line or polyline whose stroke
 *   runs through the text's box, or an arrowhead (marker) drawn inside it;
 * - case-significant text set in capitals by `text-transform`: a commit or
 *   hash, a 0x value, a domain such as 6529.io, or TDH-v1 and tdh-v1.0
 *   (wrap it in the kit's CaseSafe, components/explained/marks/CaseSafe.tsx,
 *   which keeps its case);
 * - a word split across two lines by `word-break: break-all` (apply it to
 *   the hash alone, never to the sentence around it);
 * - prose set wider than 80 characters a line: a paragraph or list item of
 *   running text (240 characters or more, no blocks inside it) whose text
 *   box holds more than 80 of its own characters, at their average width
 *   in its own font;
 * - a heading set smaller than the text under it: an h1 to h4 whose font
 *   size is below that of the paragraph that follows it;
 * - a wrapped code line: on a desktop (1280 px and wider) any line of a rule
 *   block's code (`[data-tdh-code-cell]`) that takes more than one line on
 *   screen; on a phone, a wrapped code line whose continuation does not
 *   hang to the right of its first line, and any wrapped line whose columns
 *   are aligned with runs of spaces (`data:   useCase, allTokens`): such a
 *   block must scroll sideways in the shared frame on a phone, since its
 *   wrap reads as a staircase with orphan tokens;
 * - cards too close: two bordered, rounded cards of at least 120 x 48 px,
 *   neither inside the other, side by side or one above the other with
 *   less than 8 px between them (a margin lost at a CSS column break);
 * - an SVG label that outranks the type around it: SVG text set larger on
 *   screen than the heading of its section, or larger than 1.15 times body
 *   text (18.4 px), the most a drawing is ever scaled (`MAX_SVG_SCALE`);
 * - an empty card: on a desktop, a bordered card at least 480 px wide whose
 *   content stops more than 30% of its width (and at least 220 px) short of
 *   its right edge, so the card should snap to the measure or be filled;
 * - the H1 too far down on a phone: in the phone view, the page's H1 must
 *   start within the first 200 px, app banner and site header included;
 * - an error in the browser console or an uncaught page error. On the 404
 *   views two are expected and allowed: the browser's line for the 404
 *   itself, and the wallet SDK's check of the page's
 *   Cross-Origin-Opener-Policy, which fetches the page and reports the 404
 *   it is meant to get.
 *
 * Routes that must answer 404 (a day permalink that names no day) must do so
 * inside the site: a <main>, the viewport meta and the TDH section links,
 * never a bare text body.
 *
 * A view whose page or browser crashes, or that does not finish within its
 * time, fails at once with an error instead of stopping the run; a crashed
 * browser is started again for the next view.
 *
 * Usage (a dev server or `next start` must be running):
 *
 *   6529 run tdh-pages:check -- --base http://localhost:3001
 *
 * Options: --base URL, --routes /a,/b, --widths 1440,1280,768,390,390d,320d
 * (also 1024 and 360d),
 * --out DIR (report.json and screenshots of failing views), --timeout MS
 * (per navigation), --channel chrome (use the installed Chrome instead of
 * Playwright's Chromium), --no-axe.
 *
 * Elements can opt out of one check with data-tdh-check-ignore="<check>"
 * (space-separated). Use it only with a comment saying why.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "playwright";

/**
 * Day permalinks that cannot name a published day, and an address in the
 * chapter that names no page: each must answer 404 with the TDH pages' own
 * not-found view, inside the site.
 */
const NOT_FOUND_ROUTES = [
  "/network/tdh/verification/20739",
  "/network/tdh/verification/abc",
  "/network/tdh/no-such-page",
];

const DEFAULT_ROUTES = [
  "/explained",
  "/network/tdh",
  "/network/tdh/how-it-works",
  "/network/tdh/specification",
  "/network/tdh/formal",
  "/network/tdh/proofs",
  "/network/tdh/implementations",
  "/network/tdh/verification",
  "/network/tdh/verification/{latestDay}",
  "/network/tdh/consolidation",
  "/network/tdh/consolidation/design",
  "/network/tdh/historic-boosts",
  "/network/tdh/glossary",
  ...NOT_FOUND_ROUTES,
];

const VIEWS = {
  1440: {
    label: "1440",
    viewport: { width: 1440, height: 900 },
    isMobile: false,
    hasTouch: false,
  },
  390: {
    label: "390",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  },
  "390d": {
    label: "390-desktop",
    viewport: { width: 390, height: 844 },
    isMobile: false,
    hasTouch: false,
  },
  1280: {
    label: "1280",
    viewport: { width: 1280, height: 800 },
    isMobile: false,
    hasTouch: false,
  },
  768: {
    label: "768",
    viewport: { width: 768, height: 1024 },
    isMobile: false,
    hasTouch: false,
  },
  // A 360 and a 320 px desktop window stand for 350% and 400% zoom of a
  // 1,280 px screen (WCAG 1.4.10 Reflow): nothing may scroll sideways, be
  // cut off or collide there. Zoom also magnifies the text, so 9 and 10 CSS
  // px render at 36 and 35 device px; the size floor is lowered to match.
  "360d": {
    label: "360-desktop",
    viewport: { width: 360, height: 800 },
    isMobile: false,
    hasTouch: false,
    minFontPx: 10,
  },
  "320d": {
    label: "320-desktop",
    viewport: { width: 320, height: 800 },
    isMobile: false,
    hasTouch: false,
    minFontPx: 9,
  },
  // Not in the default set.
  1024: {
    label: "1024",
    viewport: { width: 1024, height: 800 },
    isMobile: false,
    hasTouch: false,
  },
};

function parseArgs(argv) {
  const args = {
    base: process.env.TDH_CHECK_BASE ?? "http://localhost:3001",
    routes: null,
    widths: ["1440", "1280", "768", "390", "390d", "320d"],
    out: path.join("test-results", "tdh-pages-check"),
    timeout: 180_000,
    channel: undefined,
    axe: true,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) {
        throw new Error(`${arg} needs a value`);
      }
      return argv[i];
    };
    if (arg === "--") continue;
    else if (arg === "--base") args.base = next();
    // A route may be given without its leading slash ("network/tdh"), so a
    // shell that rewrites "/..." arguments into file paths leaves it alone.
    else if (arg === "--routes")
      args.routes = next()
        .split(",")
        .map((route) => (route.startsWith("/") ? route : `/${route}`));
    else if (arg === "--widths") args.widths = next().split(",");
    else if (arg === "--out") args.out = next();
    else if (arg === "--timeout") args.timeout = Number(next());
    else if (arg === "--channel") args.channel = next();
    else if (arg === "--no-axe") args.axe = false;
    else throw new Error(`Unknown argument ${arg}`);
  }
  for (const width of args.widths) {
    if (!(width in VIEWS)) {
      throw new Error(
        `Unknown width ${width}; use ${Object.keys(VIEWS).join(", ")}`
      );
    }
  }
  return args;
}

/**
 * Runs in the page. Returns every violation of the geometric and type checks
 * inside <main>, plus the page-level overflow.
 */
function inspectPage(limits) {
  const MIN_FONT_PX = limits?.minFontPx ?? 12;
  const MIN_FIELD_PX = limits?.minFieldPx ?? 40;
  const MIN_TARGET_PX = 24;
  const DESKTOP = limits?.desktop ?? false;
  const PHONE = limits?.phone ?? false;
  const violations = [];
  const root = document.querySelector("main") ?? document.body;
  const vw = document.documentElement.clientWidth;

  const ignored = (el, check) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const list = n.getAttribute?.("data-tdh-check-ignore");
      if (list && list.split(/\s+/).includes(check)) return true;
    }
    return false;
  };

  const describe = (el) => {
    const parts = [];
    for (
      let n = el;
      n && n !== root && n.nodeType === 1 && parts.length < 5;
      n = n.parentElement
    ) {
      let part = n.tagName.toLowerCase();
      if (n.id) {
        part += `#${n.id}`;
        parts.unshift(part);
        break;
      }
      const label = n.getAttribute("aria-label");
      if (label) part += `[aria-label="${label.slice(0, 40)}"]`;
      parts.unshift(part);
    }
    return parts.join(" > ");
  };

  const snippet = (el) =>
    (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 90);

  const add = (check, el, detail) => {
    if (ignored(el, check)) return;
    violations.push({
      check,
      where: describe(el),
      text: snippet(el),
      detail,
    });
  };

  const styleCache = new Map();
  const style = (el) => {
    let cs = styleCache.get(el);
    if (!cs) {
      cs = getComputedStyle(el);
      styleCache.set(el, cs);
    }
    return cs;
  };

  const isScreenReaderOnly = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const cs = style(n);
      if (cs.position === "absolute" || cs.position === "fixed") {
        if (
          cs.clip === "rect(0px, 0px, 0px, 0px)" ||
          cs.clipPath.includes("inset(50%)")
        ) {
          return true;
        }
        const r = n.getBoundingClientRect();
        if (r.width <= 1 && r.height <= 1) return true;
      }
    }
    return false;
  };

  const isShown = (el) => {
    if (!el.isConnected) return false;
    if (
      typeof el.checkVisibility === "function" &&
      !el.checkVisibility({
        opacityProperty: true,
        visibilityProperty: true,
        contentVisibilityAuto: true,
      })
    ) {
      return false;
    }
    return !isScreenReaderOnly(el);
  };

  /** The part of a rect that its clipping ancestors leave visible. */
  // A label cut with an ellipsis clips itself: it draws only inside its own
  // box, however long its text runs.
  const clipRect = (el, rect) => {
    let { left, top, right, bottom } = rect;
    const first = style(el).textOverflow === "ellipsis" ? el : el.parentElement;
    for (let n = first; n && n !== document.body; n = n.parentElement) {
      const cs = style(n);
      const clipsX = cs.overflowX !== "visible";
      const clipsY = cs.overflowY !== "visible";
      if (clipsX || clipsY || n.tagName === "svg") {
        const r = n.getBoundingClientRect();
        if (clipsX || n.tagName === "svg") {
          left = Math.max(left, r.left);
          right = Math.min(right, r.right);
        }
        if (clipsY || n.tagName === "svg") {
          top = Math.max(top, r.top);
          bottom = Math.min(bottom, r.bottom);
        }
      }
    }
    return { left, top, right, bottom };
  };

  const area = (r) =>
    Math.max(0, r.right - r.left) * Math.max(0, r.bottom - r.top);

  // 1. Page-level horizontal overflow.
  const pageWidth = document.documentElement.scrollWidth;
  if (pageWidth > vw + 1) {
    violations.push({
      check: "page-overflow",
      where: "document",
      text: "",
      detail: `scrollWidth ${pageWidth} > viewport ${vw}`,
    });
  }

  // 2. Elements past the viewport, and sideways-scrolling regions.
  const flaggedOutside = new Set();
  for (const el of root.querySelectorAll("*")) {
    if (el.closest("svg") && el.tagName !== "svg") continue;
    const cs = style(el);
    if (cs.display === "none" || cs.position === "fixed") continue;
    const scrollsX =
      (cs.overflowX === "auto" || cs.overflowX === "scroll") &&
      el.scrollWidth > el.clientWidth + 1;
    if (scrollsX && !el.closest("[data-tdh-scroll]") && isShown(el)) {
      add(
        "unexpected-scroll",
        el,
        `scrolls sideways: ${el.scrollWidth} in ${el.clientWidth}`
      );
    }
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right <= vw + 1 && r.left >= -1) continue;
    let inside = false;
    for (const f of flaggedOutside) {
      if (f.contains(el)) {
        inside = true;
        break;
      }
    }
    if (inside) continue;
    const visible = clipRect(el, r);
    if (visible.right <= vw + 1 && visible.left >= -1) continue;
    if (!isShown(el)) continue;
    flaggedOutside.add(el);
    add(
      "outside-viewport",
      el,
      `spans ${Math.round(r.left)}..${Math.round(r.right)} in a ${vw} px viewport`
    );
  }

  // 3. Text: size, frame, clipping, collisions, one word per line.
  const frameOf = (el) => {
    for (let n = el; n && n !== root; n = n.parentElement) {
      const cs = style(n);
      if (cs.display === "inline" || cs.display === "contents") continue;
      const bg = cs.backgroundColor;
      const hasBg = bg && bg !== "transparent" && !/rgba\(.*,\s*0\)$/.test(bg);
      const hasBorder =
        ["Left", "Right"].every(
          (side) => Number.parseFloat(cs[`border${side}Width`]) > 0
        ) && cs.borderLeftStyle !== "none";
      if (hasBg || hasBorder) return n;
    }
    return null;
  };

  /** Inside a sideways-scrolling region, which clips by design. */
  const inScroller = (el) => {
    for (let n = el.parentElement; n && n !== root; n = n.parentElement) {
      const o = style(n).overflowX;
      if (o === "auto" || o === "scroll") return true;
    }
    return false;
  };

  const boxes = [];
  const smallFlagged = new Set();
  const nodeFlagged = new Set();
  const frameFlagged = new Set();
  const clipFlagged = new Set();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.data.trim()) continue;
    const parent = node.parentElement;
    if (!parent) continue;
    const tag = parent.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") continue;
    if (parent.closest("[hidden], template")) continue;
    const svgText = parent.closest("text");
    const isSvg = Boolean(parent.closest("svg"));
    if (isSvg && !svgText) continue; // <title>, <desc>
    const owner = isSvg ? svgText : parent;
    if (!isShown(owner)) continue;
    const cs = style(owner);

    let rects;
    let fontPx = Number.parseFloat(cs.fontSize);
    if (isSvg) {
      const ctm = owner.getScreenCTM();
      const scale = ctm ? Math.hypot(ctm.a, ctm.b) : 1;
      fontPx *= scale;
      rects = [owner.getBoundingClientRect()];
    } else {
      // Measure the words, not the white space between them: preserved
      // spaces (white-space: pre-wrap) hang past the line's end, unseen.
      rects = [];
      for (const match of node.data.matchAll(/\S+(?: \S+)*/g)) {
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        for (const r of range.getClientRects()) {
          if (r.width > 0.5 && r.height > 0.5) rects.push(r);
        }
      }
    }
    if (rects.length === 0) continue;

    const visibleRects = rects
      .map((r) => ({ full: r, clip: clipRect(owner, r) }))
      .filter((r) => area(r.clip) > 0);
    if (visibleRects.length === 0) continue;

    if (fontPx < MIN_FONT_PX - 0.05 && !smallFlagged.has(owner)) {
      smallFlagged.add(owner);
      add("small-text", owner, `${fontPx.toFixed(1)} px`);
    }

    if (isSvg) {
      const svg = owner.ownerSVGElement;
      const sr = svg?.getBoundingClientRect();
      const r = rects[0];
      if (
        sr &&
        (r.left < sr.left - 1 ||
          r.right > sr.right + 1 ||
          r.top < sr.top - 1 ||
          r.bottom > sr.bottom + 1)
      ) {
        add(
          "svg-text-clipped",
          owner,
          `text ${Math.round(r.left)}..${Math.round(r.right)} x ${Math.round(r.top)}..${Math.round(r.bottom)} outside its SVG ${Math.round(sr.left)}..${Math.round(sr.right)} x ${Math.round(sr.top)}..${Math.round(sr.bottom)}`
        );
      }
      // The box drawn around the text: the smallest rect of the SVG that
      // holds the text's centre. The text must sit 4 px inside it.
      if (svg && !nodeFlagged.has(owner)) {
        const cx = (r.left + r.right) / 2;
        const cy = (r.top + r.bottom) / 2;
        let node = null;
        let nodeArea = Number.POSITIVE_INFINITY;
        for (const rect of svg.querySelectorAll("rect")) {
          const b = rect.getBoundingClientRect();
          if (cx < b.left || cx > b.right || cy < b.top || cy > b.bottom) {
            continue;
          }
          const a = b.width * b.height;
          if (a < nodeArea && a < sr.width * sr.height * 0.9) {
            node = b;
            nodeArea = a;
          }
        }
        const PAD = 4;
        if (
          node &&
          (r.left < node.left + PAD ||
            r.right > node.right - PAD ||
            r.top < node.top + 1 ||
            r.bottom > node.bottom - 1)
        ) {
          nodeFlagged.add(owner);
          add(
            "svg-text-in-node",
            owner,
            `text ${Math.round(r.left)}..${Math.round(r.right)} in a box ${Math.round(node.left)}..${Math.round(node.right)}; needs ${PAD} px inside`
          );
        }
      }
    } else {
      for (const { full, clip } of visibleRects) {
        if (
          !clipFlagged.has(parent) &&
          area(clip) < area(full) * 0.97 &&
          cs.textOverflow !== "ellipsis" &&
          !parent.closest("[data-tdh-scroll]")
        ) {
          clipFlagged.add(parent);
          add(
            "text-clipped",
            parent,
            `only ${Math.round((100 * area(clip)) / area(full))}% visible`
          );
        }
        const frame = inScroller(parent) ? null : frameOf(parent);
        if (frame && !frameFlagged.has(parent)) {
          const fr = frame.getBoundingClientRect();
          if (
            full.left < fr.left - 1 ||
            full.right > fr.right + 1 ||
            full.top < fr.top - 2 ||
            full.bottom > fr.bottom + 2
          ) {
            frameFlagged.add(parent);
            add(
              "text-escapes-frame",
              parent,
              `text ${Math.round(full.left)}..${Math.round(full.right)} vs frame ${Math.round(fr.left)}..${Math.round(fr.right)} (${describe(frame)})`
            );
          }
        }
      }
    }

    for (const { clip } of visibleRects) {
      boxes.push({ node, owner, rect: clip });
    }
  }

  // Collisions: overlapping text drawn by different nodes.
  const BUCKET = 48;
  const buckets = new Map();
  for (const [index, box] of boxes.entries()) {
    const from = Math.floor(box.rect.top / BUCKET);
    const to = Math.floor(box.rect.bottom / BUCKET);
    for (let b = from; b <= to; b += 1) {
      if (!buckets.has(b)) buckets.set(b, []);
      buckets.get(b).push(index);
    }
  }
  const seenPairs = new Set();
  const collided = new Set();
  for (const list of buckets.values()) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = boxes[list[i]];
        const b = boxes[list[j]];
        if (a.node === b.node) continue;
        const key = `${list[i]}:${list[j]}`;
        if (seenPairs.has(key)) continue;
        seenPairs.add(key);
        const w =
          Math.min(a.rect.right, b.rect.right) -
          Math.max(a.rect.left, b.rect.left);
        const h =
          Math.min(a.rect.bottom, b.rect.bottom) -
          Math.max(a.rect.top, b.rect.top);
        if (w <= 2 || h <= 0) continue;
        const minHeight = Math.min(
          a.rect.bottom - a.rect.top,
          b.rect.bottom - b.rect.top
        );
        if (h < minHeight * 0.4) continue;
        const pairKey = a.owner === b.owner ? null : [a.owner, b.owner];
        if (!pairKey) continue;
        if (collided.has(a.owner) || collided.has(b.owner)) continue;
        collided.add(a.owner);
        collided.add(b.owner);
        add(
          "text-collision",
          a.owner,
          `"${snippet(a.owner).slice(0, 40)}" overlaps "${snippet(b.owner).slice(0, 40)}" by ${Math.round(w)}x${Math.round(h)} px (${describe(b.owner)})`
        );
      }
    }
  }

  // One word per line.
  const inlineTextNodes = (el, out) => {
    for (const child of el.childNodes) {
      if (child.nodeType === 3) {
        if (child.data.trim()) out.push(child);
      } else if (child.nodeType === 1) {
        const d = style(child).display;
        if (d === "inline" || d === "contents") inlineTextNodes(child, out);
      }
    }
    return out;
  };
  for (const el of root.querySelectorAll("*")) {
    if (el.closest("svg")) continue;
    const cs = style(el);
    if (
      cs.display === "inline" ||
      cs.display === "contents" ||
      cs.display === "none"
    )
      continue;
    if (cs.whiteSpace.startsWith("pre")) continue;
    const nodes = inlineTextNodes(el, []);
    if (nodes.length === 0) continue;
    const text = nodes.map((n) => n.data).join(" ");
    const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
    if (words.length < 3) continue;
    if (!isShown(el)) continue;
    const tops = [];
    for (const n of nodes) {
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) {
        if (r.width < 0.5 || r.height < 0.5) continue;
        const mid = (r.top + r.bottom) / 2;
        if (!tops.some((t) => Math.abs(t - mid) < r.height * 0.5)) {
          tops.push(mid);
        }
      }
    }
    const lines = tops.length;
    if (lines >= 3 && words.length / lines < 1.5) {
      add(
        "one-word-lines",
        el,
        `${words.length} words on ${lines} lines (${Math.round(el.getBoundingClientRect().width)} px wide)`
      );
    }
  }

  // 4. Tables.
  for (const table of root.querySelectorAll("table")) {
    if (!isShown(table) || style(table).display !== "table") continue;
    const caption = table.querySelector(":scope > caption");
    if (caption) {
      const pos = style(caption).position;
      if (pos === "absolute" || pos === "fixed") {
        add(
          "table-caption-out-of-flow",
          table,
          "an absolutely positioned <caption> adds an anonymous column; label the table with aria-labelledby or a visible caption"
        );
      }
    }
    const tr = table.getBoundingClientRect();
    for (const row of table.querySelectorAll("tr")) {
      if (style(row).display !== "table-row") continue;
      const cells = Array.from(row.children).filter(
        (c) =>
          style(c).display === "table-cell" &&
          c.getBoundingClientRect().width > 0
      );
      if (cells.length === 0) continue;
      const left = Math.min(
        ...cells.map((c) => c.getBoundingClientRect().left)
      );
      const right = Math.max(
        ...cells.map((c) => c.getBoundingClientRect().right)
      );
      if (left - tr.left > 3 || tr.right - right > 3) {
        add(
          "table-row-offset",
          table,
          `a row spans ${Math.round(left)}..${Math.round(right)} in a table ${Math.round(tr.left)}..${Math.round(tr.right)}`
        );
        break;
      }
    }
  }

  // 5. Controls too small to hit (WCAG 2.5.8), and short text fields.
  const FIELD =
    'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), select, textarea';
  const TARGET = `button, [role="button"], [role="switch"], summary, ${FIELD}`;
  for (const el of root.querySelectorAll(TARGET)) {
    if (!isShown(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.width < MIN_TARGET_PX - 0.5 || r.height < MIN_TARGET_PX - 0.5) {
      add(
        "small-target",
        el,
        `${Math.round(r.width)} x ${Math.round(r.height)} px, under ${MIN_TARGET_PX} x ${MIN_TARGET_PX}`
      );
      continue;
    }
    if (el.matches(FIELD) && r.height < MIN_FIELD_PX - 0.5) {
      add(
        "short-field",
        el,
        `${Math.round(r.height)} px tall, under ${MIN_FIELD_PX}`
      );
    }
  }

  // 6. SVG text crossed by a drawn line or arrowhead. The text's box is
  // shrunk by a margin, so a leader line that ends at its label passes.
  const lineOpacity = (el) => {
    let o = 1;
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      o *= Number.parseFloat(style(n).opacity);
    }
    return o;
  };
  /** A fill's alpha, or null when the shape paints no fill. */
  const parseFill = (value) => {
    if (!value || value === "none") return null;
    const m = /rgba?\(([^)]+)\)/.exec(value);
    if (!m) return 1;
    const parts = m[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    return parts.length > 3 ? parts[3] : 1;
  };
  const strokeOf = (el) => {
    const cs = style(el);
    return (
      cs.stroke &&
      cs.stroke !== "none" &&
      Number.parseFloat(cs.strokeWidth) > 0 &&
      Number.parseFloat(cs.strokeOpacity) * lineOpacity(el) > 0.05
    );
  };
  for (const svg of root.querySelectorAll("svg")) {
    if (!isShown(svg)) continue;
    const texts = [...svg.querySelectorAll("text")].filter(
      (text) =>
        text.textContent.trim() &&
        isShown(text) &&
        !ignored(text, "svg-text-crossing")
    );
    if (texts.length === 0) continue;
    // Gridlines (`data-tdh-grid`) are background: haloed labels sit on them.
    const lines = [...svg.querySelectorAll("path, line, polyline")].filter(
      (el) =>
        !el.closest("defs, marker, clipPath, mask, pattern, symbol") &&
        !el.hasAttribute("data-tdh-grid") &&
        isShown(el)
    );
    // Opaque shapes: a line drawn under one of them, where the text sits,
    // is hidden there (a link under a wallet's disc, a badge on its line).
    const covers = [
      ...svg.querySelectorAll("circle, ellipse, rect, polygon, path"),
    ].filter((el) => {
      if (el.closest("defs, marker, clipPath, mask, pattern, symbol")) {
        return false;
      }
      const cs = style(el);
      const fill = parseFill(cs.fill);
      return (
        fill !== null &&
        fill * Number.parseFloat(cs.fillOpacity) * lineOpacity(el) >= 0.9
      );
    });
    const coveredAt = (line, screenPoint) =>
      covers.some((cover) => {
        if (
          cover === line ||
          !(
            line.compareDocumentPosition(cover) &
            Node.DOCUMENT_POSITION_FOLLOWING
          )
        ) {
          return false;
        }
        const ctm = cover.getScreenCTM?.();
        return (
          ctm &&
          typeof cover.isPointInFill === "function" &&
          cover.isPointInFill(screenPoint.matrixTransform(ctm.inverse()))
        );
      });
    for (const text of texts) {
      const r = text.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const mx = Math.min(4, r.width * 0.12);
      const my = r.height * 0.28;
      const box = {
        left: r.left + mx,
        right: r.right - mx,
        top: r.top + my,
        bottom: r.bottom - my,
      };
      let hit = null;
      for (const el of lines) {
        if (hit) break;
        const ctm = el.getScreenCTM?.();
        if (!ctm) continue;
        const inverse = ctm.inverse();
        if (strokeOf(el) && typeof el.isPointInStroke === "function") {
          const point = svg.createSVGPoint();
          for (let i = 0; i <= 6 && !hit; i += 1) {
            for (let j = 0; j <= 2 && !hit; j += 1) {
              point.x = box.left + ((box.right - box.left) * i) / 6;
              point.y = box.top + ((box.bottom - box.top) * j) / 2;
              if (
                el.isPointInStroke(point.matrixTransform(inverse)) &&
                !coveredAt(el, point)
              ) {
                hit = `a ${el.tagName} crosses it`;
              }
            }
          }
        }
        // An arrowhead sits on the end (or start) of its line.
        const markers = ["markerEnd", "markerStart"].filter((key) => {
          const value = style(el)[key];
          return value && value !== "none";
        });
        if (
          !hit &&
          markers.length > 0 &&
          typeof el.getTotalLength === "function"
        ) {
          const length = el.getTotalLength();
          for (const key of markers) {
            const local = el.getPointAtLength(key === "markerEnd" ? length : 0);
            const point = svg.createSVGPoint();
            point.x = local.x;
            point.y = local.y;
            const screen = point.matrixTransform(ctm);
            if (
              screen.x > box.left &&
              screen.x < box.right &&
              screen.y > box.top &&
              screen.y < box.bottom &&
              !coveredAt(el, screen)
            ) {
              hit = "an arrowhead sits on it";
            }
          }
        }
      }
      if (hit) {
        add("svg-text-crossing", text, hit);
      }
    }
  }

  // 7. Case-significant text in capitals, and words split by break-all.
  const CASE_SIGNIFICANT =
    /\b(?:0x[0-9a-fA-F…]+|(?=[0-9a-f]*\d)[0-9a-f]{7,64}|TDH-v1|tdh-v\d+\.\d+|tdh-v\d+|[a-z0-9-]+\.(?:io|eth|com|net|org))\b/;
  const caseWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const caseFlagged = new Set();
  for (let node = caseWalker.nextNode(); node; node = caseWalker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || caseFlagged.has(parent)) continue;
    if (parent.closest("script, style, noscript, [hidden], template")) continue;
    const cs = style(parent);
    const match = CASE_SIGNIFICANT.exec(node.data);
    if (
      match &&
      (cs.textTransform === "uppercase" || cs.textTransform === "lowercase") &&
      isShown(parent)
    ) {
      caseFlagged.add(parent);
      add(
        "case-mangled",
        parent,
        `"${match[0]}" is set in ${cs.textTransform}; keep its case (CaseSafe)`
      );
      continue;
    }
    // Only sentences: a hash or a signature with no space may break anywhere.
    if (
      cs.wordBreak === "break-all" &&
      /\s/.test(node.data.trim()) &&
      isShown(parent)
    ) {
      for (const word of node.data.matchAll(/[A-Za-z’']{2,24}/g)) {
        range.setStart(node, word.index);
        range.setEnd(node, word.index + word[0].length);
        const tops = new Set(
          [...range.getClientRects()]
            .filter((rect) => rect.width > 0.5)
            .map((rect) => Math.round(rect.top))
        );
        if (tops.size > 1) {
          caseFlagged.add(parent);
          add(
            "word-split",
            parent,
            `"${word[0]}" breaks across lines; apply break-all to the hash alone`
          );
          break;
        }
      }
    }
  }

  // 8. SVG text contrast against what is drawn under it.
  const parseColor = (value) => {
    const m = /rgba?\(([^)]+)\)/.exec(value ?? "");
    if (!m) return null;
    const parts = m[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: parts.length > 3 ? parts[3] : 1,
    };
  };
  const blend = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  });
  const luminance = (c) => {
    const ch = (v) => {
      const s = v / 255;
      return s <= 0.039_28 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
  };
  const ratio = (a, b) => {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };
  const opacityOf = (el) => {
    let o = 1;
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      o *= Number.parseFloat(style(n).opacity);
    }
    return o;
  };
  const pageBg = parseColor(style(document.body).backgroundColor) ?? {
    r: 0,
    g: 0,
    b: 0,
    a: 1,
  };
  for (const text of root.querySelectorAll("svg text")) {
    if (!isShown(text) || !text.textContent.trim()) continue;
    if (ignored(text, "svg-contrast")) continue;
    const cs = style(text);
    const fill = parseColor(cs.fill);
    if (!fill) continue;
    fill.a *= Number.parseFloat(cs.fillOpacity) * opacityOf(text);
    const r = text.getBoundingClientRect();
    if (r.width === 0) continue;
    const cx = Math.min(vw - 1, Math.max(0, r.left + r.width / 2));
    const cy = r.top + r.height / 2;
    if (cy < 0 || cy > window.innerHeight) continue;
    const layers = [];
    for (const under of document.elementsFromPoint(cx, cy)) {
      if (under === text || text.contains(under)) continue;
      const us = style(under);
      let color = null;
      if (under instanceof SVGElement && under.tagName !== "svg") {
        // Shapes paint their fill; groups, text and the rest paint nothing
        // under this point.
        if (
          ["rect", "circle", "ellipse", "path", "polygon"].includes(
            under.tagName
          )
        ) {
          color = parseColor(us.fill);
          if (color)
            color.a *= Number.parseFloat(us.fillOpacity) * opacityOf(under);
        }
      } else {
        color = parseColor(us.backgroundColor);
        if (color) color.a *= opacityOf(under);
      }
      if (color && color.a > 0.01) {
        layers.push(color);
        if (color.a >= 0.99) break;
      }
    }
    let bg = pageBg;
    for (const layer of layers.reverse()) bg = blend(layer, bg);
    const fg = blend(fill, bg);
    const px = Number.parseFloat(cs.fontSize) * (text.getScreenCTM()?.a ?? 1);
    const bold = Number.parseInt(cs.fontWeight, 10) >= 700;
    const large = px >= 24 || (bold && px >= 18.66);
    const need = large ? 3 : 4.5;
    const got = ratio(fg, bg);
    if (got < need - 0.01) {
      add("svg-contrast", text, `contrast ${got.toFixed(2)} < ${need}`);
    }
  }

  // 9. Prose measure: running text wider than 80 characters a line,
  // counted with the element's own text in its own font (a `0` is wider
  // than the average letter, so `ch` would undercount).
  const canvas = document.createElement("canvas").getContext("2d");
  const averageCharWidth = (cs, text) => {
    canvas.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const sample = text.slice(0, 600);
    return (
      canvas.measureText(sample).width / sample.length ||
      Number.parseFloat(cs.fontSize) * 0.5
    );
  };
  for (const el of root.querySelectorAll("p, li, dd")) {
    if (!isShown(el)) continue;
    if (el.closest("table, svg, pre, [role='img']")) continue;
    if (el.querySelector("p, ul, ol, dl, div, table, figure, pre")) continue;
    if (
      [...el.children].some((child) => {
        const display = style(child).display;
        return (
          !display.startsWith("inline") &&
          display !== "contents" &&
          display !== "none"
        );
      })
    ) {
      continue;
    }
    const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    if (text.length < 240) continue;
    const cs = style(el);
    // Running text only: a row of chips or a grid of label and value is
    // not a line of prose.
    if (
      cs.display === "contents" ||
      cs.display.startsWith("inline") ||
      cs.display.includes("flex") ||
      cs.display.includes("grid")
    ) {
      continue;
    }
    const r = el.getBoundingClientRect();
    const width =
      r.width -
      Number.parseFloat(cs.paddingLeft) -
      Number.parseFloat(cs.paddingRight);
    const chars = width / averageCharWidth(cs, text);
    if (chars > 80.5) {
      add(
        "prose-measure",
        el,
        `${Math.round(chars)} characters a line at ${cs.fontSize}`
      );
    }
  }

  // 10. A heading smaller than the paragraph under it.
  for (const heading of root.querySelectorAll("h1, h2, h3, h4")) {
    if (!isShown(heading)) continue;
    let next = heading.nextElementSibling;
    while (next && !isShown(next)) next = next.nextElementSibling;
    if (!next || next.tagName !== "P") continue;
    if (!(next.textContent ?? "").trim()) continue;
    const own = Number.parseFloat(style(heading).fontSize);
    const body = Number.parseFloat(style(next).fontSize);
    if (own + 0.25 < body) {
      add("heading-size", heading, `heading ${own}px under ${body}px text`);
    }
  }

  // 11. Wrapped code lines. A rule block's code cell is one line on a
  // desktop; on a phone a wrapped line hangs: its continuation starts to
  // the right of its first line, so it never reads as a line of its own.
  const lineBoxes = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const lines = [];
    for (const rect of range.getClientRects()) {
      if (rect.width < 1 || rect.height < 1) continue;
      const line = lines.find((l) => Math.abs(l.top - rect.top) < 3);
      if (line) {
        line.left = Math.min(line.left, rect.left);
      } else {
        lines.push({ top: rect.top, left: rect.left });
      }
    }
    return lines.sort((a, b) => a.top - b.top);
  };
  for (const cell of root.querySelectorAll("[data-tdh-code-cell]")) {
    if (!isShown(cell)) continue;
    const r = cell.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    // A clamped block hides its last lines: only the visible ones count.
    const seen = clipRect(cell, r);
    if (seen.bottom - seen.top < 2) continue;
    const lines = lineBoxes(cell);
    if (lines.length < 2) continue;
    if (DESKTOP) {
      add("code-wrap", cell, `${lines.length} lines at ${vw}px`);
    } else if (PHONE) {
      if (/\S {2,}\S/.test(cell.textContent ?? "")) {
        add(
          "code-columnar-wrap",
          cell,
          `a column-aligned line wraps into ${lines.length} lines`
        );
        continue;
      }
      const first = lines[0].left;
      const ch = Number.parseFloat(style(cell).fontSize) * 0.6;
      if (lines.slice(1).some((line) => line.left < first + ch * 0.9)) {
        add("code-hang", cell, "a wrapped line does not hang");
      }
    }
  }

  // 12. SVG labels never outrank the type around them: no larger than the
  // heading of their section, and no larger than 1.15 times body text.
  const headings = [...root.querySelectorAll("h1, h2, h3")].filter(isShown);
  const sectionHeading = (el) => {
    let found = null;
    for (const heading of headings) {
      // The last heading before the element, in document order.
      if (
        heading.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING
      ) {
        found = heading;
      } else {
        break;
      }
    }
    return found;
  };
  const MAX_LABEL_PX = 18.4;
  for (const text of root.querySelectorAll("svg text")) {
    if (!isShown(text) || !(text.textContent ?? "").trim()) continue;
    const px =
      Number.parseFloat(style(text).fontSize) *
      Math.abs(text.getScreenCTM()?.a ?? 1);
    const heading = sectionHeading(text);
    const headingPx = heading
      ? Number.parseFloat(style(heading).fontSize)
      : Infinity;
    if (px > MAX_LABEL_PX + 0.05) {
      add(
        "svg-label-size",
        text,
        `${px.toFixed(1)}px, above ${MAX_LABEL_PX}px`
      );
    } else if (px > headingPx - 0.5) {
      add(
        "svg-label-size",
        text,
        `${px.toFixed(1)}px against a ${headingPx}px heading`
      );
    }
  }

  // 13. Empty cards: a bordered card whose content stops far short of its
  // right edge at desktop widths. It should snap to the reading measure,
  // or its content should fill it (a second column, a right-hand figure).
  if (DESKTOP) {
    const contentRight = (card) => {
      let right = -Infinity;
      const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!(node.textContent ?? "").trim()) continue;
        const owner = node.parentElement;
        if (!owner || !isShown(owner) || owner.closest("svg")) continue;
        range.selectNodeContents(node);
        for (const rect of range.getClientRects()) {
          if (rect.width > 0) right = Math.max(right, rect.right);
        }
      }
      for (const el of card.querySelectorAll(
        "svg, img, canvas, video, input, select, textarea, button, table, [role='img'], [role='progressbar'], meter, progress, pre"
      )) {
        if (!isShown(el)) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width > 0) right = Math.max(right, rect.right);
      }
      // Blocks drawn with a background but no text (bars, meters, tiles).
      for (const el of card.querySelectorAll("*")) {
        const cs = style(el);
        if (el.children.length > 0 || (el.textContent ?? "").trim()) continue;
        if (parseColor(cs.backgroundColor)?.a > 0.05) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0)
            right = Math.max(right, rect.right);
        }
      }
      return right;
    };
    for (const card of root.querySelectorAll(
      "div, section, article, aside, figure, li, a, details, ul, ol, dl, p"
    )) {
      if (!isShown(card) || card.closest("table, svg, pre")) continue;
      const cs = style(card);
      const bordered =
        Number.parseFloat(cs.borderLeftWidth) >= 1 &&
        Number.parseFloat(cs.borderRightWidth) >= 1 &&
        cs.borderLeftStyle !== "none" &&
        cs.borderRightStyle !== "none";
      if (!bordered) continue;
      const r = card.getBoundingClientRect();
      const inner =
        r.width -
        Number.parseFloat(cs.paddingLeft) -
        Number.parseFloat(cs.paddingRight) -
        Number.parseFloat(cs.borderLeftWidth) -
        Number.parseFloat(cs.borderRightWidth);
      if (r.width < 480 || r.height < 40) continue;
      const right = contentRight(card);
      if (!Number.isFinite(right)) continue;
      const innerRight =
        r.right -
        Number.parseFloat(cs.paddingRight) -
        Number.parseFloat(cs.borderRightWidth);
      const empty = innerRight - right;
      if (empty > Math.max(220, inner * 0.3)) {
        add(
          "empty-card",
          card,
          `${Math.round(empty)}px of ${Math.round(inner)}px empty at the right`
        );
      }
    }
  }

  // 13b. Cards too close: two bordered, rounded cards that sit side by side
  // or one above the other with less than 8 px between them. Chips, pills
  // and calendar cells are smaller than a card and are not counted.
  {
    const cards = [];
    for (const el of root.querySelectorAll(
      "div, section, article, aside, figure, li, a, details, ul, ol, dl"
    )) {
      if (!isShown(el) || el.closest("table, svg, pre")) continue;
      // A card that opts out (an open menu floating over the page) is not
      // measured against the cards around it, whichever comes first.
      if (ignored(el, "card-gap")) continue;
      const cs = style(el);
      const sides = ["Top", "Right", "Bottom", "Left"];
      const bordered = sides.every(
        (side) =>
          Number.parseFloat(cs[`border${side}Width`]) >= 1 &&
          cs[`border${side}Style`] !== "none"
      );
      if (!bordered || Number.parseFloat(cs.borderTopLeftRadius) < 4) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 120 || r.height < 48) continue;
      cards.push({ el, r });
    }
    const GAP = 8;
    for (let i = 0; i < cards.length; i += 1) {
      for (let j = i + 1; j < cards.length; j += 1) {
        const a = cards[i];
        const b = cards[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const overlapX =
          Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
        const overlapY =
          Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        let gap = null;
        if (overlapX > 1 && overlapY <= 1) {
          gap = Math.max(a.r.top, b.r.top) - Math.min(a.r.bottom, b.r.bottom);
        } else if (overlapY > 1 && overlapX <= 1) {
          gap = Math.max(a.r.left, b.r.left) - Math.min(a.r.right, b.r.right);
        } else if (overlapX > 1 && overlapY > 1) {
          gap = -Math.min(overlapX, overlapY);
        }
        if (gap !== null && gap < GAP - 0.5) {
          add("card-gap", b.el, `${Math.round(gap)}px from another card`);
        }
      }
    }
  }

  // 14. On a phone the H1 starts within the first 200 px of the page.
  if (PHONE) {
    const h1 = root.querySelector("h1");
    if (h1 && isShown(h1)) {
      const top = h1.getBoundingClientRect().top + window.scrollY;
      if (top > 200.5) {
        add("h1-offset", h1, `H1 starts at ${Math.round(top)}px`);
      }
    }
  }

  return violations;
}

/**
 * The one console error a view may log: the wallet SDK checks its page's
 * Cross-Origin-Opener-Policy by fetching the page, and on a 404 view it
 * reports the 404 the view is meant to answer.
 */
const ALLOWED_NOT_FOUND_CONSOLE = [
  /^Error checking Cross-Origin-Opener-Policy: HTTP error! status: 404/,
  // The browser's own line for the 404 the view answers.
  /^Failed to load resource: the server responded with a status of 404/,
];

async function settle(page, open) {
  await page.evaluate(async (openDetails) => {
    if (openDetails) {
      for (const details of document.querySelectorAll("main details")) {
        details.open = true;
      }
    }
    await document.fonts.ready;
    const step = Math.max(400, window.innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  }, open);
}

async function latestDay(context, base, timeout) {
  const page = await context.newPage();
  try {
    await page.goto(new URL("/network/tdh/verification", base).toString(), {
      waitUntil: "domcontentloaded",
      timeout,
    });
    await page
      .locator('main a[href^="/network/tdh/verification/"]')
      .first()
      .waitFor({ timeout: 30_000 });
    const days = await page.$$eval(
      'main a[href^="/network/tdh/verification/"]',
      (links) =>
        links
          .map((link) => Number(link.getAttribute("href")?.split("/").pop()))
          .filter((day) => Number.isSafeInteger(day))
    );
    return days.length > 0 ? String(Math.max(...days)) : null;
  } catch {
    return null;
  } finally {
    await page.close();
  }
}

async function checkView(browser, args, route, widthKey) {
  const view = VIEWS[widthKey];
  const context = await browser.newContext({
    viewport: view.viewport,
    deviceScaleFactor: view.deviceScaleFactor ?? 1,
    isMobile: view.isMobile,
    hasTouch: view.hasTouch,
    userAgent: view.userAgent,
    reducedMotion: "reduce",
    colorScheme: "dark",
  });
  const page = await context.newPage();
  const url = new URL(route, args.base).toString();
  const result = { route, width: view.label, violations: [], error: null };
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(`uncaught: ${String(error?.message ?? error)}`);
  });
  let crashed = null;
  const crash = new Promise((_, reject) => {
    page.on("crash", () => {
      crashed = new Error("page crashed");
      reject(crashed);
    });
  });
  crash.catch(() => {});
  const guard = (promise) => Promise.race([promise, crash]);
  try {
    const response = await guard(
      page.goto(url, {
        waitUntil: "load",
        timeout: args.timeout,
      })
    );
    const status = response?.status() ?? 0;
    const expectNotFound = NOT_FOUND_ROUTES.includes(route);
    if (expectNotFound) {
      // A 404, and inside the site: never a bare text body.
      const frame = await guard(
        page.evaluate(() => ({
          main: Boolean(document.querySelector("main")),
          viewport: Boolean(document.querySelector('meta[name="viewport"]')),
          subnav: Boolean(
            document.querySelector('a[href="/network/tdh/verification"]')
          ),
        }))
      );
      const missing = Object.entries(frame)
        .filter(([, present]) => !present)
        .map(([key]) => key);
      if (status !== 404 || missing.length > 0) {
        result.error = `expected a 404 inside the site; got HTTP ${status}${missing.length > 0 ? `, missing ${missing.join(", ")}` : ""}`;
        return result;
      }
    } else if (status >= 400) {
      result.error = `HTTP ${status}`;
      return result;
    }
    await page
      .waitForLoadState("networkidle", { timeout: 20_000 })
      .catch(() => {});
    // First as the page loads, every <details> closed; then all open.
    await guard(settle(page, false));
    const limits = {
      minFontPx: view.minFontPx ?? 12,
      minFieldPx: view.hasTouch ? 44 : 40,
      desktop: view.viewport.width >= 1280,
      phone: view.hasTouch,
    };
    const closed = await guard(page.evaluate(inspectPage, limits));
    await guard(settle(page, true));
    const opened = await guard(page.evaluate(inspectPage, limits));
    const seen = new Set();
    for (const [pass, list] of [
      ["closed", closed],
      ["open", opened],
    ]) {
      for (const v of list) {
        const key = `${v.check}|${v.where}|${v.text}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.violations.push({ ...v, detail: `${v.detail} [${pass}]` });
      }
    }
    const notFound = NOT_FOUND_ROUTES.includes(route);
    for (const text of new Set(consoleErrors)) {
      if (
        notFound &&
        ALLOWED_NOT_FOUND_CONSOLE.some((allowed) => allowed.test(text))
      ) {
        continue;
      }
      result.violations.push({
        check: "console-error",
        where: "console",
        text: text.replace(/\s+/g, " ").slice(0, 160),
        detail: "an error in the browser console",
      });
    }
    if (args.axe) {
      const axe = await new AxeBuilder({ page })
        .include("main")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      for (const violation of axe.violations) {
        for (const node of violation.nodes) {
          result.violations.push({
            check: `axe:${violation.id}`,
            where: node.target.join(" "),
            text: node.html.slice(0, 120),
            detail:
              node.failureSummary
                ?.split("\n")
                .slice(1)
                .join(" ")
                .slice(0, 200) ?? "",
          });
        }
      }
    }
    if (result.violations.length > 0) {
      const file = `${route.replaceAll("/", "_").replace(/^_/, "") || "root"}--${view.label}.png`;
      await page
        .screenshot({
          path: path.join(args.out, file),
          fullPage: true,
          timeout: 60_000,
        })
        .catch(() => {});
      result.screenshot = file;
    }
  } catch (error) {
    result.error = String(error?.message ?? error).split("\n")[0];
  } finally {
    await context.close().catch(() => {});
  }
  return result;
}

/** A view that does not finish in time fails, so the run never hangs. */
function withDeadline(promise, ms, label) {
  let timer;
  const deadline = new Promise((resolve) => {
    timer = setTimeout(
      () =>
        resolve({
          route: label.route,
          width: label.width,
          violations: [],
          error: `view did not finish in ${Math.round(ms / 1000)} s`,
        }),
      ms
    );
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  mkdirSync(args.out, { recursive: true });
  const launch = () =>
    chromium.launch({
      headless: true,
      channel: args.channel,
      timeout: 60_000,
    });
  let browser = await launch();
  const results = [];
  try {
    let routes = args.routes ?? DEFAULT_ROUTES;
    if (routes.some((r) => r.includes("{latestDay}"))) {
      const context = await browser.newContext();
      const day = await latestDay(context, args.base, args.timeout);
      await context.close();
      routes = routes.flatMap((r) => {
        if (!r.includes("{latestDay}")) return [r];
        if (day) return [r.replace("{latestDay}", day)];
        results.push({
          route: r,
          width: "-",
          violations: [],
          error: "no published day linked from /network/tdh/verification",
        });
        return [];
      });
    }
    for (const route of routes) {
      for (const width of args.widths) {
        const started = Date.now();
        if (!browser.isConnected()) {
          console.log("  (browser restarted after a crash)");
          browser = await launch();
        }
        const result = await withDeadline(
          checkView(browser, args, route, width),
          args.timeout + 180_000,
          { route, width: VIEWS[width].label }
        );
        results.push(result);
        const status = result.error
          ? `ERROR ${result.error}`
          : result.violations.length === 0
            ? "ok"
            : `${result.violations.length} violation(s)`;
        console.log(
          `${route} @ ${result.width}: ${status} (${((Date.now() - started) / 1000).toFixed(1)} s)`
        );
        for (const v of result.violations.slice(0, 40)) {
          console.log(
            `  - ${v.check}: ${v.detail} | ${v.where} | ${v.text.slice(0, 70)}`
          );
        }
        if (result.violations.length > 40) {
          console.log(
            `  ... ${result.violations.length - 40} more in report.json`
          );
        }
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }
  writeFileSync(
    path.join(args.out, "report.json"),
    `${JSON.stringify({ base: args.base, results }, null, 2)}\n`
  );
  const failed = results.filter((r) => r.error || r.violations.length > 0);
  const total = results.reduce((n, r) => n + r.violations.length, 0);
  console.log(
    failed.length === 0
      ? `All ${results.length} views pass.`
      : `${failed.length} of ${results.length} views fail (${total} violations). Report: ${path.join(args.out, "report.json")}`
  );
  process.exitCode = failed.length === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 2;
});
