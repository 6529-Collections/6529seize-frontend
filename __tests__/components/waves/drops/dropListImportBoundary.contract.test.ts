import fs from "node:fs";
import path from "node:path";

// A list of drops (and every drop link preview, which renders a drop) must not
// pull the chat composer or the Giphy picker into its bundle. The single drop
// view owns the composer, so a list reaches it only through a lazy boundary,
// and the Giphy picker loads only when someone opens it. These walk the static
// import graph the way the bundler does: type-only imports are erased and a
// dynamic import() starts a separate chunk, so neither counts as an edge.

const ROOT = process.cwd();

const SINGLE_DROP_VIEW = "components/waves/drop/SingleWaveDropChat.tsx";
const COMPOSER_FILES = [
  SINGLE_DROP_VIEW,
  "components/waves/PrivilegedDropCreator.tsx",
  "components/waves/create-drop-content/CreateDropComposer.tsx",
];
const GIF_PICKER_FILE = "components/waves/CreateDropGifPicker.tsx";
const GIPHY_PACKAGE = "@giphy/react-components";

// Everything that renders a list of drops or a drop link preview, plus the
// profile page, which opens single drops in a modal.
const SURFACES_WITHOUT_COMPOSER = [
  "components/waves/drops/participation/participationRendererRegistry.tsx",
  "components/waves/drops/Drop.tsx",
  "components/waves/drops/WaveDropLinkPreview.tsx",
  "components/drops/view/part/dropPartMarkdown/handlers/seize.tsx",
  "components/user/layout/UserPageLayout.tsx",
];

// import/export statements with a module specifier. Group 1 is the clause
// before `from`, group 2 the specifier. `import type` and `export type` are
// skipped here, and clauses made only of `type` specifiers are skipped below.
const STATIC_IMPORT =
  /^(?:import|export)\s+(?!type\b)(?:([^;'"]*?)\s+from\s+)?["']([^"']+)["']/gm;
const TYPE_SPECIFIER = /^type\s+[\w$]+(?:\s+as\s+[\w$]+)?$/;

// `{ type A, type B as C }`: every specifier is a type, so the import is erased.
function isTypeOnlyClause(clause: string): boolean {
  if (!clause.startsWith("{") || !clause.endsWith("}")) {
    return false;
  }
  const specifiers = clause
    .slice(1, -1)
    .split(",")
    .map((specifier) => specifier.trim())
    .filter(Boolean);
  return (
    specifiers.length > 0 &&
    specifiers.every((specifier) => TYPE_SPECIFIER.test(specifier))
  );
}

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

const sourceCache = new Map<string, string | null>();

function readFileIfPresent(file: string): string | null {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    // Missing files and directories are not import targets.
    return null;
  }
}

function readSource(file: string): string | null {
  if (!sourceCache.has(file)) {
    sourceCache.set(file, readFileIfPresent(file));
  }
  return sourceCache.get(file) ?? null;
}

function resolveFile(base: string): string | null {
  const candidates = [
    base,
    ...EXTENSIONS.map((extension) => base + extension),
    ...EXTENSIONS.map((extension) => path.join(base, `index${extension}`)),
  ];
  return (
    candidates.find(
      (candidate) =>
        EXTENSIONS.includes(path.extname(candidate)) &&
        readSource(candidate) !== null
    ) ?? null
  );
}

interface StaticImportWalk {
  readonly importedBy: Map<string, string | null>;
  readonly packages: Set<string>;
}

function walkStaticImports(entry: string): StaticImportWalk {
  const start = path.join(ROOT, entry);
  const importedBy = new Map<string, string | null>([[start, null]]);
  const packages = new Set<string>();
  const queue = [start];

  for (let file = queue.shift(); file; file = queue.shift()) {
    for (const [, clause, specifier] of (readSource(file) ?? "").matchAll(
      STATIC_IMPORT
    )) {
      if (!specifier || (clause && isTypeOnlyClause(clause.trim()))) {
        continue;
      }

      let next: string | null = null;
      if (specifier.startsWith("@/")) {
        next = resolveFile(path.join(ROOT, specifier.slice(2)));
      } else if (specifier.startsWith(".")) {
        next = resolveFile(path.resolve(path.dirname(file), specifier));
      } else {
        packages.add(specifier);
      }

      if (next && !importedBy.has(next)) {
        importedBy.set(next, file);
        queue.push(next);
      }
    }
  }

  return { importedBy, packages };
}

// The import chain from the walk's entry to `target`, or null when the walk
// never reaches it. A failing test prints the chain to cut.
function importChain(walk: StaticImportWalk, target: string): string | null {
  const chain: string[] = [];
  let file: string | null | undefined = path.join(ROOT, target);
  if (!walk.importedBy.has(file)) return null;
  while (file) {
    chain.push(path.relative(ROOT, file).replaceAll("\\", "/"));
    file = walk.importedBy.get(file);
  }
  return chain.reverse().join("\n  -> ");
}

function reachedFrom(walk: StaticImportWalk, files: readonly string[]) {
  return files.flatMap((file) => importChain(walk, file) ?? []);
}

describe("drop list import boundary", () => {
  it.each(SURFACES_WITHOUT_COMPOSER)(
    "%s reaches neither the composer nor the Giphy picker",
    (entry) => {
      const walk = walkStaticImports(entry);

      expect(reachedFrom(walk, [...COMPOSER_FILES, GIF_PICKER_FILE])).toEqual(
        []
      );
      expect(walk.packages.has(GIPHY_PACKAGE)).toBe(false);
    }
  );

  it("loads the Giphy picker on demand from the composer", () => {
    const walk = walkStaticImports(
      "components/waves/create-drop-content/CreateDropComposer.tsx"
    );

    expect(reachedFrom(walk, [GIF_PICKER_FILE])).toEqual([]);
    expect(walk.packages.has(GIPHY_PACKAGE)).toBe(false);
  });

  it("really walks the graph, so the checks above cannot pass vacuously", () => {
    // The single drop view does import the composer, and the walk must see it.
    const walk = walkStaticImports("components/waves/drop/SingleWaveDrop.tsx");

    expect(importChain(walk, SINGLE_DROP_VIEW)).toContain(
      "components/waves/drop/SingleWaveDropWrapper.tsx"
    );
    expect(
      importChain(walk, "components/waves/PrivilegedDropCreator.tsx")
    ).not.toBeNull();
    // The picker's own module is the only static importer of the Giphy package.
    expect(walkStaticImports(GIF_PICKER_FILE).packages.has(GIPHY_PACKAGE)).toBe(
      true
    );
  });
});
