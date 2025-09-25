#!/usr/bin/env node
/* eslint-disable */

const fs = require("fs");
const path = require("path");

const inputDir = process.argv[2];

if (!inputDir) {
  console.error("Usage: node migrate-pages.cjs <pages/your-folder>");
  process.exit(1);
}

const inputPath = path.resolve(inputDir);
const PAGES_DIR = path.resolve("pages");
const APP_DIR = path.resolve("app");

function walk(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
    } else if (entry.isFile() && entry.name === "index.tsx") {
      results.push(fullPath);
    }
  }
  return results;
}

function migrateIndexFile(indexFile) {
  const fileDir = path.dirname(indexFile);
  const relative = path.relative(PAGES_DIR, indexFile);
  const newFile = path
    .join(APP_DIR, relative)
    .replace(/index\.tsx$/, "page.tsx");
  fs.mkdirSync(path.dirname(newFile), { recursive: true });

  let content = fs.readFileSync(indexFile, "utf8");

  // Extract <title>
  let title = "Page";
  const titleMatch = content.match(/<title>(.*?)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // Remove unused imports
  content = content
    .replace(/^import\s+React\s+from\s+["']react["'];?\n?/gm, "")
    .replace(/^import\s+HeaderPlaceholder.*\n?/gm, "")
    .replace(/^import\s+dynamic.*\n?/gm, "")
    .replace(/^const\s+Header\s+=\s+dynamic\(\(\)\s+=>.*?\n^\s*}\);\n?/gms, "");

  // Remove top-level fragment if it's the only wrapper
  content = content.replace(
    /(\(\s*)<>\s*\n?([\s\S]*?)\n?\s*<\/>\s*(\);)/,
    "$1$2$3"
  );

  // Replace default export if needed
  content = content.replace(
    /export\s+default\s+.*?;/,
    "export default IndexPage;"
  );

  // Add metadata imports
  const metaImports = `import { getAppMetadata } from "@/components/providers/metadata";\nimport type { Metadata } from "next";\n`;
  content = metaImports + content.trim() + "\n";

  // Append generateMetadata
  content += `\nexport async function generateMetadata() {\n  return getAppMetadata({ title: "${title}" });\n}\n`;

  fs.writeFileSync(newFile, content.trim() + "\n", "utf8");
  fs.unlinkSync(indexFile);

  function updateImportsInTests(oldImportPath, newImportPath) {
    const testRoot = path.resolve("__tests__");
    const testFiles = walkFiles(testRoot);

    for (const file of testFiles) {
      let content = fs.readFileSync(file, "utf8");
      const updated = content.replace(
        new RegExp(`from ['"]([^'"]*?)${escapeRegex(oldImportPath)}['"]`, "g"),
        (match, pre) => `from "${pre}${newImportPath}"`
      );

      if (content !== updated) {
        fs.writeFileSync(file, updated, "utf8");
        console.log(`✏️  Updated imports in ${file}`);
      }
    }
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function walkFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let results = [];

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(walkFiles(full));
      } else if (entry.isFile() && /\.(t|j)sx?$/.test(entry.name)) {
        results.push(full);
      }
    }
    return results;
  }

  const oldImportPath = "pages/" + relative.replace(/\/index\.tsx$/, "");
  const newImportPath = path
    .relative(process.cwd(), newFile)
    .replace(/\.tsx$/, "")
    .replaceAll("\\", "/"); // for Windows

  updateImportsInTests(oldImportPath, newImportPath);

  // Remove the leaf folder if empty
  tryRemoveFolder(fileDir);

  console.log(`✅ Migrated ${indexFile} -> ${newFile}`);
}

function tryRemoveFolder(dir) {
  if (!fs.existsSync(dir)) return; // Skip if folder was already removed
  if (!dir.startsWith(PAGES_DIR)) return; // Don't delete outside /pages

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  if (entries.length > 0) return; // Not empty, stop here

  try {
    fs.rmdirSync(dir);
    console.log(`🗑️  Deleted empty folder ${dir}`);
    tryRemoveFolder(path.dirname(dir)); // Recursively clean parent
  } catch (err) {
    if (err.code !== "ENOTEMPTY") throw err; // Only ignore ENOTEMPTY
  }
}

function hasIndexTSXRecursively(dir) {
  if (!fs.existsSync(dir)) return false;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name === "index.tsx") return true;
    if (entry.isDirectory() && hasIndexTSXRecursively(fullPath)) return true;
  }
  return false;
}

// Run only in the given inputDir
if (!fs.existsSync(inputPath)) {
  console.error(`❌ Folder not found: ${inputDir}`);
  process.exit(1);
}

const files = walk(inputPath);
if (files.length === 0) {
  console.log(`No index.tsx files found under ${inputDir}`);
  process.exit(0);
}

// Migrate all
for (const file of files) {
  try {
    migrateIndexFile(file);
  } catch (err) {
    console.error(`❌ Failed to migrate ${file}`, err);
  }
}

// Final cleanup: remove inputDir (and parents) if no more index.tsx
if (!hasIndexTSXRecursively(inputPath)) {
  tryRemoveFolder(inputPath);
}
