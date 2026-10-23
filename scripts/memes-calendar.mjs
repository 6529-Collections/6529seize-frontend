import process from "node:process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const canonical = join(root, "shared/memes-calendar");
const packageName = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8")
).name;
if (packageName !== "6529seize" && packageName !== "6529backend")
  throw new Error(
    "Calendar commands require the frontend or backend repository"
  );
const directory =
  packageName === "6529backend" ? join(root, "src/memes-calendar") : canonical;
const manifestPath = join(directory, "manifest.json");
const sourceFiles = () =>
  readdirSync(directory)
    .filter((name) => name.endsWith(".ts") || name === ".prettierrc.json")
    .sort((a, b) => a.localeCompare(b, "en"));
const hashes = () =>
  Object.fromEntries(
    sourceFiles().map((name) => [
      name,
      createHash("sha256")
        .update(readFileSync(join(directory, name)))
        .digest("hex"),
    ])
  );
const [command = "check", target] = process.argv
  .slice(2)
  .filter((arg) => arg !== "--");

if (command === "refresh") {
  if (directory !== canonical)
    throw new Error(
      "Edit and refresh the canonical frontend source, then sync it"
    );
  const version = /MEMES_CALENDAR_VERSION\s*=\s*['"]([^'"]+)/.exec(
    readFileSync(join(directory, "phases.ts"), "utf8")
  )?.[1];
  if (!version) throw new Error("Calendar version is missing");
  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        version,
        source: "6529-Collections/6529seize-frontend:shared/memes-calendar",
        files: hashes(),
      },
      null,
      2
    ) + "\n"
  );
} else if (command !== "check" && command !== "sync") {
  throw new Error("Use check, refresh, or sync <backend-checkout>");
}
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (JSON.stringify(hashes()) !== JSON.stringify(manifest.files))
  throw new Error(
    "Calendar source differs from its pinned manifest; refresh the canonical source and sync both repositories"
  );
const phases = readFileSync(join(directory, "phases.ts"), "utf8");
if (
  !phases.includes(`'${manifest.version}'`) &&
  !phases.includes(`"${manifest.version}"`)
)
  throw new Error("Calendar version differs from its manifest");

function pruneObsoleteManagedFiles(destination, currentNames) {
  const oldManifest = join(destination, "manifest.json");
  if (!existsSync(oldManifest)) return;
  const previous = JSON.parse(readFileSync(oldManifest, "utf8"));
  const obsolete = Object.entries(previous.files).filter(
    ([name]) => !currentNames.has(name)
  );
  for (const [name, hash] of obsolete) {
    if (
      basename(name) !== name ||
      name.includes("\\") ||
      !(name.endsWith(".ts") || name === ".prettierrc.json")
    )
      throw new Error(
        "Invalid managed calendar filename in the previous manifest"
      );
    const path = join(destination, name);
    if (
      existsSync(path) &&
      createHash("sha256").update(readFileSync(path)).digest("hex") !== hash
    )
      throw new Error(`Obsolete calendar file has local changes: ${name}`);
  }
  for (const [name] of obsolete) {
    const path = join(destination, name);
    if (existsSync(path)) unlinkSync(path);
  }
}

if (command === "sync") {
  if (directory !== canonical || !target)
    throw new Error(
      "Sync requires the canonical frontend source and a backend checkout path"
    );
  const destinationRoot = resolve(target);
  if (
    JSON.parse(readFileSync(join(destinationRoot, "package.json"), "utf8"))
      .name !== "6529backend"
  )
    throw new Error("Target is not the backend repository");
  const destination = join(destinationRoot, "src/memes-calendar");
  mkdirSync(destination, { recursive: true });
  pruneObsoleteManagedFiles(destination, new Set(sourceFiles()));
  for (const name of [...sourceFiles(), "manifest.json"])
    copyFileSync(join(directory, name), join(destination, name));
  copyFileSync(
    fileURLToPath(import.meta.url),
    join(destinationRoot, "scripts/memes-calendar.mjs")
  );
}
process.stdout.write(
  `Memes calendar ${manifest.version}: ${command} complete\n`
);
