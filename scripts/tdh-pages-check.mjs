#!/usr/bin/env node
/**
 * Layout and legibility gate for the TDH pages.
 *
 * Renders every TDH route in headless Chromium at 1440 px (desktop), 390 px
 * (a phone: touch, mobile user agent) and 390 px with a desktop user agent
 * (a narrow desktop window), with every <details> opened, and fails on:
 *
 * - horizontal page overflow, and elements that reach past the viewport;
 * - text that escapes its frame (the nearest ancestor with a border or a
 *   background), is cut off by an overflow-hidden ancestor, or runs past the
 *   edge of its SVG;
 * - sideways-scrolling regions that are not marked `data-tdh-scroll` (the
 *   shared scroll frame, which shows an edge fade and a hint);
 * - text collisions: two pieces of text drawn over each other, in HTML or
 *   SVG;
 * - one word per line: a text block of three or more words wrapped so that
 *   most of its lines hold a single word;
 * - text rendered under 12 px, SVG text included (its font size times the
 *   SVG's scale on screen);
 * - WCAG 2.2 AA failures found by axe-core (colour contrast among them), and
 *   SVG text whose contrast with what is drawn under it is below AA;
 * - broken table layouts: a <caption> taken out of flow (the sr-only
 *   caption that adds an anonymous column), or rows that do not span their
 *   table.
 *
 * Usage (a dev server or `next start` must be running):
 *
 *   6529 run tdh-pages:check -- --base http://localhost:3001
 *
 * Options: --base URL, --routes /a,/b, --widths 1440,390,390d,
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

const DEFAULT_ROUTES = [
  "/network/tdh",
  "/network/tdh/how-it-works",
  "/network/tdh/specification",
  "/network/tdh/formal",
  "/network/tdh/implementations",
  "/network/tdh/verification",
  "/network/tdh/verification/{latestDay}",
  "/network/tdh/consolidation",
  "/network/tdh/consolidation/design",
  "/network/tdh/historic-boosts",
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
  // Not in the default set; for checking the tablet band by hand.
  768: {
    label: "768",
    viewport: { width: 768, height: 1024 },
    isMobile: false,
    hasTouch: false,
  },
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
    widths: ["1440", "390", "390d"],
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
    else if (arg === "--routes") args.routes = next().split(",");
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
        `Unknown width ${width}; use 1440, 390, 390d, 768 or 1024`
      );
    }
  }
  return args;
}

/**
 * Runs in the page. Returns every violation of the geometric and type checks
 * inside <main>, plus the page-level overflow.
 */
function inspectPage() {
  const MIN_FONT_PX = 12;
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
  const clipRect = (el, rect) => {
    let { left, top, right, bottom } = rect;
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
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
      const hasBg =
        bg && bg !== "transparent" && !/rgba\(.*,\s*0\)$/.test(bg);
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
    if (cs.display === "inline" || cs.display === "contents" || cs.display === "none") continue;
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
      const left = Math.min(...cells.map((c) => c.getBoundingClientRect().left));
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

  // 5. SVG text contrast against what is drawn under it.
  const parseColor = (value) => {
    const m = /rgba?\(([^)]+)\)/.exec(value ?? "");
    if (!m) return null;
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
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
  const pageBg =
    parseColor(style(document.body).backgroundColor) ?? {
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
        if (["rect", "circle", "ellipse", "path", "polygon"].includes(under.tagName)) {
          color = parseColor(us.fill);
          if (color) color.a *= Number.parseFloat(us.fillOpacity) * opacityOf(under);
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

  return violations;
}

async function settle(page) {
  await page.evaluate(async () => {
    for (const details of document.querySelectorAll("main details")) {
      details.open = true;
    }
    await document.fonts.ready;
    const step = Math.max(400, window.innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
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
  try {
    const response = await page.goto(url, {
      waitUntil: "load",
      timeout: args.timeout,
    });
    const status = response?.status() ?? 0;
    if (status >= 400) {
      result.error = `HTTP ${status}`;
      return result;
    }
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
    await settle(page);
    result.violations = await page.evaluate(inspectPage);
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
            detail: node.failureSummary?.split("\n").slice(1).join(" ").slice(0, 200) ?? "",
          });
        }
      }
    }
    if (result.violations.length > 0) {
      const file = `${route.replaceAll("/", "_").replace(/^_/, "") || "root"}--${view.label}.png`;
      await page.screenshot({
        path: path.join(args.out, file),
        fullPage: true,
        timeout: 60_000,
      }).catch(() => {});
      result.screenshot = file;
    }
  } catch (error) {
    result.error = String(error?.message ?? error).split("\n")[0];
  } finally {
    await context.close();
  }
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  mkdirSync(args.out, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    channel: args.channel,
    timeout: 60_000,
  });
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
        const result = await checkView(browser, args, route, width);
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
          console.log(`  - ${v.check}: ${v.detail} | ${v.where} | ${v.text.slice(0, 70)}`);
        }
        if (result.violations.length > 40) {
          console.log(`  ... ${result.violations.length - 40} more in report.json`);
        }
      }
    }
  } finally {
    await browser.close();
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
