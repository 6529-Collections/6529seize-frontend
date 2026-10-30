import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
  unlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let fixture: string;
let frontend: string;
let backend: string;
let source: string;
let destination: string;
const run = (root: string, ...args: string[]) =>
  execFileSync(
    process.execPath,
    [join(root, "scripts/memes-calendar.mjs"), ...args],
    { stdio: "pipe" }
  );
beforeEach(() => {
  fixture = mkdtempSync(join(tmpdir(), "memes-calendar-sync-"));
  frontend = join(fixture, "frontend");
  backend = join(fixture, "backend");
  source = join(frontend, "shared/memes-calendar");
  destination = join(backend, "src/memes-calendar");
  mkdirSync(source, { recursive: true });
  mkdirSync(join(frontend, "scripts"));
  mkdirSync(join(backend, "scripts"), { recursive: true });
  writeFileSync(
    join(frontend, "package.json"),
    JSON.stringify({ name: "6529seize" })
  );
  writeFileSync(
    join(backend, "package.json"),
    JSON.stringify({ name: "6529backend" })
  );
  writeFileSync(
    join(frontend, "scripts/memes-calendar.mjs"),
    readFileSync(join(process.cwd(), "scripts/memes-calendar.mjs"))
  );
  writeFileSync(
    join(source, "phases.ts"),
    "export const MEMES_CALENDAR_VERSION = 'fixture.1';\n"
  );
  writeFileSync(join(source, "obsolete.ts"), "export const old = true;\n");
  run(frontend, "refresh");
  run(frontend, "sync", backend);
  unlinkSync(join(source, "obsolete.ts"));
  run(frontend, "refresh");
});
afterEach(() => rmSync(fixture, { recursive: true, force: true }));
it("removes obsolete managed files and preserves unrelated files", () => {
  writeFileSync(join(destination, "notes.md"), "operator notes");
  run(frontend, "sync", backend);
  expect(existsSync(join(destination, "obsolete.ts"))).toBe(false);
  expect(readFileSync(join(destination, "notes.md"), "utf8")).toBe(
    "operator notes"
  );
  expect(() => run(backend, "check")).not.toThrow();
});
it("preserves local edits to an obsolete managed file and refuses the sync", () => {
  writeFileSync(join(destination, "obsolete.ts"), "local changes");
  expect(() => run(frontend, "sync", backend)).toThrow();
  expect(readFileSync(join(destination, "obsolete.ts"), "utf8")).toBe(
    "local changes"
  );
});
it("rejects previous-manifest paths that escape the managed directory", () => {
  const protectedFile = join(backend, "src/keep.ts");
  writeFileSync(protectedFile, "keep");
  const path = join(destination, "manifest.json");
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  manifest.files["../keep.ts"] = createHash("sha256")
    .update("keep")
    .digest("hex");
  writeFileSync(path, JSON.stringify(manifest));
  expect(() => run(frontend, "sync", backend)).toThrow();
  expect(readFileSync(protectedFile, "utf8")).toBe("keep");
  expect(existsSync(join(destination, "obsolete.ts"))).toBe(true);
});
it("checks the backend copy even if an unrelated canonical-looking directory exists", () => {
  mkdirSync(join(backend, "shared/memes-calendar"), { recursive: true });
  expect(() => run(backend, "check")).not.toThrow();
});
