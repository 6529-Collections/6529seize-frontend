#!/usr/bin/env node
// Enumerate sibling <div blocks at a given indent within a line range and
// greedily group them under a target size. Prints group boundaries.
// usage: node gen-split-config.cjs <file> <rangeStart> <rangeEnd> <indent> <targetLines>
const fs = require("node:fs");
const [file, rs, re, ind, target] = process.argv.slice(2);
const lines = fs.readFileSync(file, "utf8").split("\n");
const start = Number(rs), end = Number(re), indent = Number(ind), cap = Number(target || 520);
const pad = " ".repeat(indent);

const blocks = [];
let open = null;
for (let i = start - 1; i < end; i++) {
  const l = lines[i];
  if (l === `${pad}<div`) {
    if (open !== null) throw new Error(`nested same-indent <div at ${i + 1} (open ${open})`);
    open = i + 1;
  } else if (l === `${pad}</div>`) {
    if (open === null) throw new Error(`unmatched </div> at ${i + 1}`);
    blocks.push({ start: open, end: i + 1, size: i + 1 - open + 1, marker: lines[open] ? lines[open].trim().slice(0, 90) : "" });
    open = null;
  } else if (l.trim() !== "" && !l.startsWith(pad) && open === null) {
    // content between blocks at shallower indent — fail closed
    throw new Error(`unexpected outdent between blocks at ${i + 1}: "${l}"`);
  }
}
if (open !== null) throw new Error(`unclosed <div opened at ${open}`);

console.log(`${blocks.length} blocks between ${start}-${end} at indent ${indent}`);
const groups = [];
let cur = null;
for (const b of blocks) {
  if (cur && cur.size + b.size > cap) { groups.push(cur); cur = null; }
  if (!cur) cur = { start: b.start, end: b.end, size: b.size, count: 1 };
  else { cur.end = b.end; cur.size += b.size; cur.count++; }
}
if (cur) groups.push(cur);
for (const g of groups) {
  console.log(`group: start=${g.start} end=${g.end} lines=${g.size} blocks=${g.count}`);
}
