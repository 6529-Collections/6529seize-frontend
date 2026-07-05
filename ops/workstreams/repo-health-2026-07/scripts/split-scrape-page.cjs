#!/usr/bin/env node
// Table-driven mechanical splitter for WP-scrape pages.
// Extracts runs of sibling JSX elements (verbatim lines) into _sections
// fragment components and replaces them with component tags at the given
// indent. Fail-closed: aborts on any unexpected boundary shape.
//
// usage: node split-scrape-page.cjs <config.json>
// config: {
//   root, page, sectionsDir, importPrefix,
//   groups: [{ file, name, start, end, indent, firstMarker }]
// }
// - start/end: 1-based inclusive line range to move (must be complete
//   sibling elements: first line `^ {indent}<div$`, last `^ {indent}</div>$`)
// - firstMarker: substring required on the line after `start` (className)
const fs = require("node:fs");
const path = require("node:path");

const config = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const PAGE = path.join(config.root, config.page);
const src = fs.readFileSync(PAGE, "utf8");
if (src.includes("\r\n")) throw new Error("CRLF in source page");
const lines = src.split("\n");

const groups = [...config.groups].sort((a, b) => a.start - b.start);
for (let i = 1; i < groups.length; i++) {
  if (groups[i].start <= groups[i - 1].end) throw new Error("overlapping groups");
}

for (const g of groups) {
  const pad = " ".repeat(g.indent);
  const first = lines[g.start - 1];
  const last = lines[g.end - 1];
  if (first !== `${pad}<div`) {
    throw new Error(`${g.name}: first line mismatch: "${first}"`);
  }
  if (!lines[g.start].includes(g.firstMarker)) {
    throw new Error(`${g.name}: marker "${g.firstMarker}" not on line ${g.start + 1}`);
  }
  if (last !== `${pad}</div>`) {
    throw new Error(`${g.name}: last line mismatch: "${last}"`);
  }
  // Balance check: the moved range must be self-contained JSX (every tag
  // opened inside is closed inside). Heuristic: indentation of every line
  // in range must be >= indent, and the range must contain equal counts of
  // lines `^ {indent}<div$` and `^ {indent}</div>$`.
  let opens = 0;
  let closes = 0;
  for (let i = g.start - 1; i < g.end; i++) {
    const l = lines[i];
    if (l.trim() !== "" && !l.startsWith(pad)) {
      throw new Error(`${g.name}: line ${i + 1} outdents below group indent: "${l}"`);
    }
    if (l === `${pad}<div`) opens++;
    if (l === `${pad}</div>`) closes++;
  }
  if (opens !== closes) {
    throw new Error(`${g.name}: unbalanced top-level divs (${opens} vs ${closes})`);
  }
}

fs.mkdirSync(path.join(config.root, config.sectionsDir), { recursive: true });

for (const g of groups) {
  const body = lines.slice(g.start - 1, g.end).join("\n");
  const out = `export default function ${g.name}() {\n  return (\n    <>\n${body}\n    </>\n  );\n}\n`;
  fs.writeFileSync(path.join(config.root, config.sectionsDir, g.file), out, "utf8");
  console.log(`${g.file}: ${out.split("\n").length - 1} lines`);
}

// Rebuild the page bottom-up so line numbers stay valid.
let next = [...lines];
for (const g of [...groups].reverse()) {
  const pad = " ".repeat(g.indent);
  next.splice(g.start - 1, g.end - g.start + 1, `${pad}<${g.name} />`);
}
// Insert imports after the last existing top import line.
let lastImport = 0;
for (let i = 0; i < next.length; i++) {
  if (/^import\b/.test(next[i])) lastImport = i + 1;
  else if (next[i].trim() !== "" && lastImport > 0) break;
}
const importLines = groups.map(
  (g) => `import ${g.name} from "${config.importPrefix}/${g.file.replace(/\.tsx$/, "")}";`
);
next.splice(lastImport, 0, ...importLines);
fs.writeFileSync(PAGE, next.join("\n"), "utf8");
console.log(`${config.page}: ${next.length} lines`);
