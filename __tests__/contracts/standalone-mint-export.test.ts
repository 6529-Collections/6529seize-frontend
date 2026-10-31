/** @jest-environment node */

/**
 * The standalone mint page is built with `output: "export"` (see
 * `standalone/standalone-memes-mint/scripts/export-mint-page.cjs`). That build
 * has two source-level failure modes the main app never meets, and both once
 * broke every export:
 *
 * - Next rejects any Server Action that is reachable from the static export's
 *   module graph ("Server Actions are not supported with static export"), even
 *   behind a lazy `import()`.
 * - The export copies a fixed list of files from `public/` and aborts when one
 *   is missing (a removed `favicon.ico` did exactly that).
 *
 * Both are cheap to catch statically, so this suite walks the real import graph
 * instead of waiting for a multi-minute `next build`.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { getProductionAppEnvironment } from "@/config/appEnvironment";

const projectRoot = path.resolve(__dirname, "../..");
const standaloneSrc = path.join(
  projectRoot,
  "standalone/standalone-memes-mint/src"
);
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".cjs", ".mjs"];
const SERVER_ACTION_DIRECTIVE = "use server";
const REAL_GATE = "components/messages/quick-dms/QuickDirectMessagesGate.tsx";
const SINGLE_DROP_VIEW = "components/waves/drop/SingleWaveDrop.tsx";
const SERVER_ACTION_MODULE =
  "components/waves/memes/submission/actions/validateInteractivePreview.ts";

// Parsing a couple of thousand files takes a while on a cold machine.
jest.setTimeout(120_000);

type PathMappings = Readonly<Record<string, readonly string[]>>;

interface ParsedModule {
  readonly runtimeSpecifiers: readonly string[];
  readonly hasServerActionDirective: boolean;
}

const parsedModules = new Map<string, ParsedModule>();

function readPathMappings(tsconfigPath: string): {
  readonly baseDir: string;
  readonly paths: PathMappings;
} {
  const { config } = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const options = (config?.compilerOptions ?? {}) as {
    baseUrl?: string;
    paths?: PathMappings;
  };
  return {
    baseDir: path.resolve(path.dirname(tsconfigPath), options.baseUrl ?? "."),
    paths: options.paths ?? {},
  };
}

const standaloneMappings = readPathMappings(
  path.join(standaloneSrc, "tsconfig.json")
);
const rootMappings = readPathMappings(path.join(projectRoot, "tsconfig.json"));

function isTypeOnlyImport(node: ts.ImportDeclaration): boolean {
  const clause = node.importClause;
  if (!clause) {
    return false;
  }
  if (clause.isTypeOnly) {
    return true;
  }
  const bindings = clause.namedBindings;
  return (
    clause.name === undefined &&
    bindings !== undefined &&
    ts.isNamedImports(bindings) &&
    bindings.elements.length > 0 &&
    bindings.elements.every((element) => element.isTypeOnly)
  );
}

function runtimeSpecifierOf(node: ts.Node): string | null {
  if (ts.isImportDeclaration(node)) {
    return !isTypeOnlyImport(node) && ts.isStringLiteral(node.moduleSpecifier)
      ? node.moduleSpecifier.text
      : null;
  }
  if (ts.isExportDeclaration(node)) {
    return !node.isTypeOnly &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteral(node.moduleSpecifier)
      ? node.moduleSpecifier.text
      : null;
  }
  if (ts.isCallExpression(node)) {
    const [firstArgument] = node.arguments;
    const callee = node.expression;
    const isModuleLoad =
      callee.kind === ts.SyntaxKind.ImportKeyword ||
      (ts.isIdentifier(callee) && callee.text === "require");
    return isModuleLoad && firstArgument && ts.isStringLiteral(firstArgument)
      ? firstArgument.text
      : null;
  }
  return null;
}

// Covers the file-level directive and inline actions in a function body.
function isServerActionDirective(node: ts.Node, parent: ts.Node): boolean {
  return (
    ts.isExpressionStatement(node) &&
    ts.isStringLiteral(node.expression) &&
    node.expression.text === SERVER_ACTION_DIRECTIVE &&
    (ts.isSourceFile(parent) || ts.isBlock(parent))
  );
}

function parseModule(file: string): ParsedModule {
  const cached = parsedModules.get(file);
  if (cached) {
    return cached;
  }
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    false,
    file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const runtimeSpecifiers: string[] = [];
  let hasServerActionDirective = false;
  const visit = (node: ts.Node, parent: ts.Node): void => {
    const specifier = runtimeSpecifierOf(node);
    if (specifier !== null) {
      runtimeSpecifiers.push(specifier);
    }
    hasServerActionDirective ||= isServerActionDirective(node, parent);
    ts.forEachChild(node, (child) => visit(child, node));
  };
  ts.forEachChild(source, (child) => visit(child, source));
  const parsed = { runtimeSpecifiers, hasServerActionDirective };
  parsedModules.set(file, parsed);
  return parsed;
}

function resolveSourceFile(candidate: string): string | null {
  const isFile = (file: string) =>
    fs.existsSync(file) && fs.statSync(file).isFile();
  if (isFile(candidate)) {
    return candidate;
  }
  const withExtension = SOURCE_EXTENSIONS.map(
    (extension) => candidate + extension
  ).find(isFile);
  if (withExtension) {
    return withExtension;
  }
  return (
    SOURCE_EXTENSIONS.map((extension) =>
      path.join(candidate, `index${extension}`)
    ).find(isFile) ?? null
  );
}

/**
 * TypeScript semantics: an exact pattern wins over a wildcard, and the longest
 * wildcard prefix wins among wildcards. This is also how Turbopack honours the
 * app's tsconfig `paths`.
 */
function mapThroughPaths(
  specifier: string,
  mappings: { readonly baseDir: string; readonly paths: PathMappings }
): string | null {
  const exact = mappings.paths[specifier]?.[0];
  if (exact !== undefined) {
    return path.resolve(mappings.baseDir, exact);
  }
  const wildcard = Object.keys(mappings.paths)
    .filter((pattern) => pattern.endsWith("*"))
    .map((pattern) => ({ pattern, prefix: pattern.slice(0, -1) }))
    .filter(({ prefix }) => specifier.startsWith(prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  const target = wildcard ? mappings.paths[wildcard.pattern]?.[0] : undefined;
  if (wildcard === undefined || target === undefined) {
    return null;
  }
  return path.resolve(
    mappings.baseDir,
    target.replaceAll("*", specifier.slice(wildcard.prefix.length))
  );
}

function resolveSpecifier(
  specifier: string,
  importer: string,
  mappings: { readonly baseDir: string; readonly paths: PathMappings }
): string | null {
  if (specifier.startsWith(".")) {
    return resolveSourceFile(path.resolve(path.dirname(importer), specifier));
  }
  const mapped = mapThroughPaths(specifier, mappings);
  return mapped === null ? null : resolveSourceFile(mapped);
}

function collectGraph(
  entries: readonly string[],
  mappings: { readonly baseDir: string; readonly paths: PathMappings }
): Set<string> {
  const reachable = new Set<string>();
  const pending = entries.map((entry) => path.resolve(projectRoot, entry));
  for (let file = pending.pop(); file; file = pending.pop()) {
    if (reachable.has(file)) {
      continue;
    }
    reachable.add(file);
    if (!SOURCE_EXTENSIONS.includes(path.extname(file))) {
      continue;
    }
    for (const specifier of parseModule(file).runtimeSpecifiers) {
      const resolved = resolveSpecifier(specifier, file, mappings);
      if (resolved !== null) {
        pending.push(resolved);
      }
    }
  }
  return reachable;
}

function toProjectPath(file: string): string {
  return path.relative(projectRoot, file).replaceAll("\\", "/");
}

function serverActionModulesIn(graph: ReadonlySet<string>): string[] {
  return [...graph]
    .filter(
      (file) =>
        SOURCE_EXTENSIONS.includes(path.extname(file)) &&
        parseModule(file).hasServerActionDirective
    )
    .map(toProjectPath)
    .sort();
}

function standalonePublicFiles(): readonly string[] {
  const exportScript = require(
    path.join(
      projectRoot,
      "standalone/standalone-memes-mint/scripts/export-mint-page.cjs"
    )
  ) as { readonly STANDALONE_PUBLIC_FILES: readonly string[] };
  return exportScript.STANDALONE_PUBLIC_FILES;
}

describe("standalone mint static export", () => {
  it("never reaches a Server Action module from the page or the layout", () => {
    const graph = collectGraph(
      [
        "standalone/standalone-memes-mint/src/app/layout.tsx",
        "standalone/standalone-memes-mint/src/app/page.tsx",
      ],
      standaloneMappings
    );

    // Sanity check: the walk follows the layout through `Providers` into the
    // mapped stub, and the page into the mint UI, instead of stopping early.
    const relativeGraph = new Set([...graph].map(toProjectPath));
    expect(relativeGraph).toContain("components/providers/Providers.tsx");
    expect(relativeGraph).toContain(
      "standalone/standalone-memes-mint/src/components/NoQuickDirectMessagesGate.tsx"
    );
    expect(relativeGraph).toContain("components/the-memes/TheMemesMint.tsx");
    expect(relativeGraph).not.toContain(REAL_GATE);
    expect(serverActionModulesIn(graph)).toEqual([]);
  });

  it("would pull the wave chat UI in through the real Quick Direct Messages gate", () => {
    // Negative control for the mapping. The walker follows the gate's lazy
    // import and relative imports into the wave chat UI, which the standalone
    // tsconfig mapping (not luck) keeps out of the export.
    const graph = new Set(
      [...collectGraph([REAL_GATE], rootMappings)].map(toProjectPath)
    );

    expect(graph).toContain(
      "components/messages/quick-dms/QuickDirectMessages.tsx"
    );
    expect(graph).toContain("components/brain/my-stream/MyStreamWaveChat.tsx");
  });

  it("detects a Server Action reached through `@/` aliases", () => {
    // Negative control for the walker. The single drop view reaches the Memes
    // submission form's action, which the wave chat UI also reached until the
    // single drop renderers moved out of the list renderer registry.
    const graph = collectGraph([SINGLE_DROP_VIEW], rootMappings);

    expect(serverActionModulesIn(graph)).toEqual([SERVER_ACTION_MODULE]);
  });

  it("swaps the Quick Direct Messages gate for an empty component", () => {
    const stub = mapThroughPaths(
      "@/components/messages/quick-dms/QuickDirectMessagesGate",
      standaloneMappings
    );

    expect(stub).not.toBeNull();
    const resolved = resolveSourceFile(stub ?? "");
    expect(resolved).not.toBeNull();
    expect(path.relative(projectRoot, resolved ?? "").replaceAll("\\", "/")).toBe(
      "standalone/standalone-memes-mint/src/components/NoQuickDirectMessagesGate.tsx"
    );
  });

  it("only copies public files that exist", () => {
    const files = standalonePublicFiles();

    expect(files.length).toBeGreaterThan(0);
    expect(
      files.filter(
        (name) => !fs.existsSync(path.join(projectRoot, "public", name))
      )
    ).toEqual([]);
  });

  it("ships the favicon files the layout links to", () => {
    const { favicon, faviconFallback } = getProductionAppEnvironment();

    expect(standalonePublicFiles()).toEqual(
      expect.arrayContaining([
        favicon.slice(1),
        faviconFallback.slice(1),
      ])
    );
  });
});
