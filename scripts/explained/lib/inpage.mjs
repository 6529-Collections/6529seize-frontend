/**
 * The checks that run inside the page (passed to page.evaluate, so each is
 * self-contained). renderChecks is render.mjs's: overflow against the fixed
 * width and every element's right edge (never innerWidth, which mobile
 * emulation widens), text cut by its own box, the smallest HTML and SVG
 * text as rendered, and SVG labels that collide or are cut by their figure.
 * measure is measure.mjs's PATTERNS ruler, plus gutters and the numbers a
 * page prints outside its facts.
 */

export function renderChecks(vw) {
  const srOnly = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return (
      (r.width <= 1 && r.height <= 1) ||
      cs.clip === "rect(0px, 0px, 0px, 0px)" ||
      el.classList.contains("tw-sr-only")
    );
  };
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return (
      r.width > 0 &&
      r.height > 0 &&
      cs.visibility !== "hidden" &&
      cs.display !== "none" &&
      !srOnly(el)
    );
  };
  const root =
    document.querySelector("[data-explained-shell]") || document.body;
  // A sideways scroller inside the page (a chapter bar, a wide table) may
  // hold wider content; the app frame around the page may clip, so only
  // scrollers inside the Explained shell count.
  const inScroller = (el) => {
    for (let p = el.parentElement; p && p !== root; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip")
        return true;
    }
    return false;
  };
  const doc = document.documentElement;
  let over = Math.max(0, doc.scrollWidth - vw);
  const offenders = [];
  for (const el of root.querySelectorAll("*")) {
    if (!vis(el) || inScroller(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right > vw + 0.5 || r.left < -0.5) {
      over = Math.max(over, Math.round(r.right - vw), Math.round(-r.left));
      if (offenders.length < 8) {
        const cls =
          typeof el.className === "string"
            ? el.className
            : el.className.baseVal || "";
        offenders.push(
          `${el.tagName.toLowerCase()}.${cls.split(" ").slice(0, 3).join(".")} → ${Math.round(r.right)}`
        );
      }
    }
  }
  let minSvg = 99;
  for (const t of root.querySelectorAll("svg text")) {
    if (!vis(t)) continue;
    const svg = t.ownerSVGElement;
    const vb = svg && svg.viewBox && svg.viewBox.baseVal;
    const scale =
      vb && vb.width ? svg.getBoundingClientRect().width / vb.width : 1;
    minSvg = Math.min(minSvg, parseFloat(getComputedStyle(t).fontSize) * scale);
  }
  let minHtml = 99;
  let minWhere = "";
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode;
    const el = n.parentElement;
    if (
      !el ||
      !n.textContent.trim() ||
      el.closest("svg, script, style, [hidden]") ||
      !vis(el)
    )
      continue;
    const f = parseFloat(getComputedStyle(el).fontSize);
    if (f < minHtml) {
      minHtml = f;
      minWhere = `${el.tagName.toLowerCase()}: ${n.textContent.trim().slice(0, 30)}`;
    }
  }
  const collisions = [];
  for (const svg of root.querySelectorAll("svg")) {
    if (!vis(svg)) continue;
    const texts = [...svg.querySelectorAll("text")]
      .filter(vis)
      .map((t) => ({ t: t.textContent, r: t.getBoundingClientRect() }));
    const sr = svg.getBoundingClientRect();
    for (const a of texts) {
      if (
        a.r.left < sr.left - 1 ||
        a.r.right > sr.right + 1 ||
        a.r.top < sr.top - 1 ||
        a.r.bottom > sr.bottom + 1
      )
        collisions.push(`cut by its figure: "${a.t}"`);
    }
    for (let i = 0; i < texts.length; i += 1) {
      for (let j = i + 1; j < texts.length; j += 1) {
        const a = texts[i].r;
        const b = texts[j].r;
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 2 && oy > 3)
          collisions.push(`"${texts[i].t}" × "${texts[j].t}"`);
      }
    }
  }
  const clipped = [];
  for (const el of root.querySelectorAll("*")) {
    if (!vis(el) || el.closest("svg") || el.closest("[data-chapter-scroll]"))
      continue;
    const cs = getComputedStyle(el);
    const cuts =
      cs.overflowX === "hidden" ||
      cs.overflowX === "clip" ||
      cs.textOverflow === "ellipsis";
    if (
      cuts &&
      el.scrollWidth > el.clientWidth + 1 &&
      el.textContent.trim() &&
      el.children.length === 0
    ) {
      clipped.push(
        `${el.tagName.toLowerCase()}: ${el.textContent.trim().slice(0, 30)}`
      );
    }
  }
  // Text that escapes its frame: the nearest box with a border or a
  // background around it (the TDH gate's check). A frame may opt out with
  // data-ex-frame-ignore (a rule line whose label sits on it). A frame that
  // itself scrolls sideways (a row of chips on a phone) holds text past its
  // edge by design, as a scroller inside a frame does.
  const scrolls = (el) => {
    const o = getComputedStyle(el).overflowX;
    return o === "auto" || o === "scroll";
  };
  const escapes = [];
  const framed = (el) => {
    const cs = getComputedStyle(el);
    const border = ["Top", "Right", "Bottom", "Left"].some(
      (side) =>
        parseFloat(cs[`border${side}Width`]) > 0 &&
        cs[`border${side}Style`] !== "none"
    );
    const fill =
      cs.backgroundColor !== "rgba(0, 0, 0, 0)" &&
      cs.backgroundColor !== "transparent";
    return border || fill;
  };
  for (const frame of root.querySelectorAll("*")) {
    if (
      frame === root ||
      !vis(frame) ||
      frame.closest("svg, [data-ex-frame-ignore]") ||
      inScroller(frame) ||
      scrolls(frame) ||
      !framed(frame)
    )
      continue;
    const box = frame.getBoundingClientRect();
    const texts = document.createTreeWalker(frame, NodeFilter.SHOW_TEXT);
    while (texts.nextNode() && escapes.length < 12) {
      const node = texts.currentNode;
      const parent = node.parentElement;
      if (
        !parent ||
        !node.textContent.trim() ||
        parent.closest("svg") ||
        !vis(parent)
      )
        continue;
      // text inside a scroller or a popover within the frame may pass its edge
      let nested = false;
      for (let p = parent; p && p !== frame; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (
          cs.overflowX === "auto" ||
          cs.overflowX === "scroll" ||
          cs.position === "absolute" ||
          cs.position === "fixed"
        ) {
          nested = true;
          break;
        }
      }
      if (nested) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const r = range.getBoundingClientRect();
      if (r.width === 0) continue;
      if (
        r.right > box.right + 1 ||
        r.left < box.left - 1 ||
        r.bottom > box.bottom + 1 ||
        r.top < box.top - 1
      ) {
        const cls =
          typeof frame.className === "string"
            ? frame.className.split(" ").slice(0, 3).join(".")
            : "";
        escapes.push(
          `"${node.textContent.trim().slice(0, 30)}" escapes ${frame.tagName.toLowerCase()}.${cls} by ${Math.round(Math.max(r.right - box.right, box.left - r.left, r.bottom - box.bottom, box.top - r.top))} px`
        );
      }
    }
  }
  return {
    height: doc.scrollHeight,
    overflowPx: over,
    escapes,
    offenders,
    minSvgText: Math.round(minSvg * 10) / 10,
    minHtmlText: minHtml,
    minHtmlWhere: minWhere,
    collisions: collisions.slice(0, 20),
    clipped: clipped.slice(0, 10),
  };
}

export function measure(vh) {
  const article =
    document.querySelector("[data-ex-article]") ||
    document.querySelector("main") ||
    document.body;
  const skip = (el) =>
    el.closest(
      "nav, [data-ex-hwk], [data-ex-nocopy], svg, script, style, [hidden], [aria-hidden='true'], .tw-sr-only, button"
    );
  const words = (text) => text.trim().split(/\s+/).filter(Boolean).length;
  let total = 0;
  let first = 0;
  let chars = 0;
  const tones = {};
  const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode;
    const el = n.parentElement;
    if (!el || skip(el)) continue;
    const t = n.textContent.trim();
    if (!t) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0) continue;
    const c = words(t);
    total += c;
    if (rect.top + window.scrollY < vh) first += c;
    const color = getComputedStyle(el).color;
    tones[color] = (tones[color] || 0) + t.length;
    chars += t.length;
  }
  const mainTones = Object.values(tones).filter(
    (v) => v / Math.max(1, chars) >= 0.02
  ).length;
  const ps = [...article.querySelectorAll("p")].filter(
    (p) => p.getBoundingClientRect().width > 0 && !skip(p)
  );
  const sizes = {};
  let gap = null;
  for (const p of ps) {
    const cs = getComputedStyle(p);
    const key = `${parseFloat(cs.fontSize)}/${parseFloat(cs.lineHeight)}`;
    sizes[key] = (sizes[key] || 0) + p.textContent.length;
    const next = p.nextElementSibling;
    if (
      gap === null &&
      next &&
      next.tagName === "P" &&
      (cs.fontSize === "18px" || cs.fontSize === "16px") &&
      getComputedStyle(next).fontSize === cs.fontSize
    ) {
      gap = parseFloat(cs.marginBottom) / parseFloat(cs.lineHeight);
    }
  }
  const body = Object.entries(sizes).sort((a, b) => b[1] - a[1])[0];
  const sentences = ps
    .flatMap((p) => p.textContent.trim().split(/(?<=[.?!])\s+/))
    .filter((s) => words(s) > 2);
  const long = sentences.filter((s) => words(s) > 30).length;
  const lede = document.querySelector("[data-ex-lede]");
  const ledeText = lede ? lede.textContent.trim() : "";
  const height = document.documentElement.scrollHeight;
  const figureSelector =
    "[data-lens], figure, [data-fig], [data-livestrip], img, [data-ladder], [data-trail], [data-claim-parts], [data-receipt], [data-verdict]";
  const figures = [...article.querySelectorAll(figureSelector)].filter((el) => {
    if (el.parentElement && el.parentElement.closest(figureSelector))
      return false;
    const r = el.getBoundingClientRect();
    return r.width >= 120 && r.height >= 80;
  }).length;
  const shell = document.querySelector("[data-explained-shell]");
  const gutter =
    shell && article !== document.body
      ? Math.round(
          article.getBoundingClientRect().left -
            shell.getBoundingClientRect().left
        )
      : null;

  // Numbers printed outside a fact: digits in prose not inside [data-fact],
  // a hash, code, a model or a figure, once names are taken out (6529, CC0,
  // D136, P26, §5.2, #562, TDH v1.4) and bare ordinals ("01", "3").
  const allowed =
    "[data-fact], [data-hash], [data-stripes], code, pre, [data-lens], svg, [data-simulated], [data-verdict='simulated'], [data-ex-allow-number], [data-day], [data-fig]";
  const NAMES = [
    /\{\w+\}/g,
    /\b6529(?:\.io)?\b/g,
    /\bCC0\b/g,
    /\bSP1\b/g,
    /\bGroth16\b/g,
    /\bBN254\b/g,
    /\bSHA-256\b/g,
    /\bERC-(?:1155|721|20)\b/g,
    /#\d+/g,
    /\b[DP]\d{1,3}\b/g,
    /§\s?\d+(?:\.\d+)*/g,
    /\bTDH v\d+\.\d+\b/g,
    /\bS\d\b/g,
  ];
  const outside = [];
  const numberWalker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
  while (numberWalker.nextNode()) {
    const n = numberWalker.currentNode;
    const el = n.parentElement;
    if (!el || skip(el) || el.closest(allowed)) continue;
    let text = n.textContent;
    if (/^\s*\d{1,2}\s*$/.test(text)) continue;
    for (const name of NAMES) text = text.replace(name, " ");
    const found = text.match(/\d[\d,.:]*/g);
    if (found && outside.length < 20)
      outside.push(
        `${found.join(" ")} in "${n.textContent.trim().slice(0, 40)}"`
      );
  }
  return {
    words: total,
    firstScreenWords: first,
    screens: +(height / vh).toFixed(1),
    wordsPerScreen: Math.round(total / (height / vh)),
    body: body ? body[0] : null,
    paragraphGap: gap === null ? null : +gap.toFixed(2),
    tones: mainTones,
    figures,
    figuresPer1000: +((figures / Math.max(total, 1)) * 1000).toFixed(1),
    sentences: sentences.length,
    longSentences: long,
    ledeWords: lede ? words(ledeText) : null,
    ledeSentences: lede
      ? ledeText.split(/(?<=[.?!])\s+/).filter((s) => words(s) > 0).length
      : 0,
    gutter,
    numbersOutsideFacts: outside,
  };
}
