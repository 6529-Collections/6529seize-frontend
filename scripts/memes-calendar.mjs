import process from "node:process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const canonical = join(root, "shared/memes-calendar");
const directory = existsSync(canonical)
  ? canonical
  : join(root, "src/memes-calendar");
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
const [command = "check", target] = process.argv.slice(2);

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
