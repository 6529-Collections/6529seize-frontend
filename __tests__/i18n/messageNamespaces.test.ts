import fs from "node:fs";
import path from "node:path";
import type { PublicEnv } from "@/config/env.schema";
import { sharedConfig } from "@/config/nextConfig";
import { EN_US_ROOT_MESSAGES } from "@/i18n/messages/en-US";
import { EN_US_MESSAGES } from "@/i18n/messages/en-US.complete";

// Browsers register the root en-US dictionary plus each `@/i18n/namespaces`
// module that a loaded module imports (`i18n/sourceMessages.browser.ts`).
// Server rendering and Jest register every namespace, so a component test
// passes even when its module forgets the import, and the browser would then
// hydrate empty text over server-rendered copy. This suite checks the imports
// statically instead: every module that can run in a browser and names a
// namespace's key imports that namespace.

type Messages = Readonly<Record<string, string>>;

interface Namespace {
  readonly name: string;
  readonly keys: ReadonlySet<string>;
  // Every "a." / "a.b." prefix of the namespace's keys, for composed keys.
  readonly prefixes: ReadonlySet<string>;
}

const REPO_ROOT = process.cwd();
const NAMESPACE_DIR = path.join(REPO_ROOT, "i18n", "namespaces");
const COMPLETE_DICTIONARY = path.join(
  REPO_ROOT,
  "i18n",
  "messages",
  "en-US.complete.ts"
);
// Turbopack's browser-only aliases, such as `@/i18n/sourceMessages`, which
// browsers resolve to `i18n/sourceMessages.browser.ts`.
const BROWSER_ALIASES = new Map(
  Object.entries(
    sharedConfig(
      {
        API_ENDPOINT: "https://api.6529.io",
        BASE_ENDPOINT: "https://6529.io",
        IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
      } as PublicEnv,
      ""
    ).turbopack?.resolveAlias ?? {}
  ).flatMap(([specifier, target]) =>
    typeof target === "object" &&
    target !== null &&
    "browser" in target &&
    typeof target.browser === "string"
      ? [[specifier, path.join(REPO_ROOT, target.browser)] as const]
      : []
  )
);
const SOURCE_DIRS = [
  "abis",
  "app",
  "components",
  "config",
  "constants",
  "contexts",
  "entities",
  "errors",
  "helpers",
  "hooks",
  "i18n",
  "lib",
  "services",
  "shared",
  "types",
  "utils",
  "wagmiConfig",
];
// Message sources hold keys without using them.
const KEY_SCAN_IGNORED_DIRS = [
  path.join(REPO_ROOT, "i18n", "messages") + path.sep,
  NAMESPACE_DIR + path.sep,
];
// A quoted string, or the head of a template literal, that looks like a
// message key or a key prefix: "museum.title", "museum.rooms." or
// `museum.rooms.${id}`.
const KEY_LIKE_LITERAL =
  /["'`]([A-Za-z][\w-]*(?:\.[\w-]+)*\.?)(?=["'`]|\$\{)/gu;
const NAMESPACE_IMPORT =
  /(?:\bfrom\s*|\bimport\s*)["']@\/i18n\/namespaces\/([\w-]+)["']/gu;
// Static imports and re-exports, side-effect imports, and dynamic imports.
// Type-only imports are skipped below because they never reach a bundle.
const MODULE_REFERENCE =
  /\b(?:import|export)\s+(type\s+)?[^;'"`]*?\bfrom\s*["']([^"']+)["']|\bimport\s*["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']\s*\)/gu;
const USE_CLIENT = /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*["']use client["']/u;
// `<Component messageKey="museum.title" />`: the text before a JSX prop value,
// back to the element's opening tag.
const JSX_PROP_OPENING = /<([A-Z]\w*)(?:\.\w+)*\s[^<]*[\w-]=\{?\s*$/u;

function loadNamespaces(): Namespace[] {
  if (!fs.existsSync(NAMESPACE_DIR)) {
    return [];
  }
  return fs
    .readdirSync(NAMESPACE_DIR)
    .filter((file) => file.endsWith(".ts"))
    .map((file) => {
      const name = path.basename(file, ".ts");
      const exports = jest.requireActual<Record<string, unknown>>(
        `@/i18n/namespaces/${name}`
      );
      const dictionaries = Object.values(exports).filter(
        (value): value is Messages =>
          typeof value === "object" && value !== null
      );
      if (dictionaries.length !== 1) {
        throw new Error(
          `@/i18n/namespaces/${name} must export exactly one message dictionary`
        );
      }
      const keys = new Set(Object.keys(dictionaries[0]!));
      const prefixes = new Set<string>();
      for (const key of keys) {
        const segments = key.split(".");
        for (let length = 1; length < segments.length; length += 1) {
          prefixes.add(`${segments.slice(0, length).join(".")}.`);
        }
      }
      return { name, keys, prefixes };
    });
}

function listSourceFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "node_modules" ? [] : listSourceFiles(entryPath);
    }
    return /\.tsx?$/u.test(entry.name) && !entry.name.endsWith(".d.ts")
      ? [entryPath]
      : [];
  });
}

function resolveModule(fromFile: string, specifier: string): string | null {
  let base: string;
  if (specifier.startsWith("@/")) {
    base = path.join(REPO_ROOT, specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    base = path.resolve(path.dirname(fromFile), specifier);
  } else {
    return null;
  }
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  return (
    candidates.find(
      (candidate) =>
        /\.tsx?$/u.test(candidate) &&
        fs.existsSync(candidate) &&
        fs.statSync(candidate).isFile()
    ) ?? null
  );
}

// Modules that can run in a browser: every "use client" module and whatever
// it imports, statically or dynamically.
function findBrowserModules(sources: ReadonlyMap<string, string>): Set<string> {
  const browserModules = new Set<string>();
  const pending = [...sources]
    .filter(([, source]) => USE_CLIENT.test(source))
    .map(([file]) => file);
  while (pending.length > 0) {
    const file = pending.pop()!;
    if (browserModules.has(file)) {
      continue;
    }
    browserModules.add(file);
    const source = sources.get(file) ?? fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(MODULE_REFERENCE)) {
      const isTypeOnly = match[1] !== undefined;
      const specifier = match[2] ?? match[3] ?? match[4];
      const resolved =
        !isTypeOnly && specifier
          ? (BROWSER_ALIASES.get(specifier) ?? resolveModule(file, specifier))
          : null;
      if (resolved) {
        pending.push(resolved);
      }
    }
  }
  return browserModules;
}

// The module that `file` imports `identifier` from, if it is a local module.
function findImportedModule(
  file: string,
  source: string,
  identifier: string
): string | null {
  const binding = new RegExp(`\\b${identifier}\\b`, "u");
  for (const match of source.matchAll(MODULE_REFERENCE)) {
    const specifier = match[2];
    const clause = match[0].slice(0, match[0].lastIndexOf("from"));
    if (specifier && binding.test(clause)) {
      return resolveModule(file, specifier);
    }
  }
  return null;
}

function namespacesNamedBy(
  literal: string,
  namespaces: readonly Namespace[]
): Namespace[] {
  // A single word such as "museum" is a route or an id far more often than a
  // key prefix.
  if (!literal.includes(".") || Object.hasOwn(EN_US_ROOT_MESSAGES, literal)) {
    return [];
  }
  const prefix = literal.endsWith(".") ? literal : `${literal}.`;
  return namespaces.filter(
    (namespace) => namespace.keys.has(literal) || namespace.prefixes.has(prefix)
  );
}

function toRepoPath(file: string): string {
  return path.relative(REPO_ROOT, file).split(path.sep).join("/");
}

const namespaces = loadNamespaces();
const sources = new Map(
  SOURCE_DIRS.flatMap((directory) =>
    listSourceFiles(path.join(REPO_ROOT, directory))
  ).map((file) => [file, fs.readFileSync(file, "utf8")])
);
const browserModules = findBrowserModules(sources);
const keyScanSources = [...sources].filter(
  ([file]) =>
    !KEY_SCAN_IGNORED_DIRS.some((directory) => file.startsWith(directory))
);

describe("en-US message namespaces", () => {
  it("compose the complete dictionary with the root dictionary, without overlap", () => {
    const owners = new Map<string, string[]>();
    const addOwner = (key: string, owner: string) => {
      owners.set(key, [...(owners.get(key) ?? []), owner]);
    };
    Object.keys(EN_US_ROOT_MESSAGES).forEach((key) => addOwner(key, "root"));
    for (const namespace of namespaces) {
      namespace.keys.forEach((key) => addOwner(key, namespace.name));
    }

    const overlapping = [...owners].filter(
      ([, keyOwners]) => keyOwners.length > 1
    );
    expect(overlapping).toEqual([]);
    expect([...owners.keys()].sort()).toEqual(
      Object.keys(EN_US_MESSAGES).sort()
    );
  });

  it("are imported by every browser module that names their keys", () => {
    const missingImports: string[] = [];

    for (const [file, source] of keyScanSources) {
      if (!browserModules.has(file)) {
        continue;
      }
      const imported = new Set(
        [...source.matchAll(NAMESPACE_IMPORT)].map((match) => match[1])
      );
      const needed = new Set<string>();
      for (const match of source.matchAll(KEY_LIKE_LITERAL)) {
        for (const namespace of namespacesNamedBy(match[1]!, namespaces)) {
          needed.add(namespace.name);
        }
      }
      for (const name of needed) {
        if (!imported.has(name)) {
          missingImports.push(
            `${toRepoPath(file)} needs import "@/i18n/namespaces/${name}"`
          );
        }
      }
    }

    expect(missingImports).toEqual([]);
  });

  it("are not handed from server modules to client components as props", () => {
    const keyProps: string[] = [];

    for (const [file, source] of keyScanSources) {
      if (browserModules.has(file)) {
        continue;
      }
      for (const match of source.matchAll(KEY_LIKE_LITERAL)) {
        if (namespacesNamedBy(match[1]!, namespaces).length === 0) {
          continue;
        }
        const element = JSX_PROP_OPENING.exec(
          source.slice(Math.max(0, match.index - 400), match.index)
        )?.[1];
        const elementModule = element
          ? findImportedModule(file, source, element)
          : null;
        if (
          elementModule &&
          USE_CLIENT.test(sources.get(elementModule) ?? "")
        ) {
          keyProps.push(`${toRepoPath(file)}: <${element}> ${match[1]}`);
        }
      }
    }

    expect(keyProps).toEqual([]);
  });

  it("keep the complete dictionary out of the browser's static module graph", () => {
    // Browsers load it only through the fallback's dynamic import().
    const staticImporters = [...browserModules].filter((file) => {
      const source = sources.get(file) ?? fs.readFileSync(file, "utf8");
      return [...source.matchAll(MODULE_REFERENCE)].some((match) => {
        const specifier = match[2] ?? match[3];
        return (
          match[1] === undefined &&
          specifier !== undefined &&
          resolveModule(file, specifier) === COMPLETE_DICTIONARY
        );
      });
    });

    expect(staticImporters.map(toRepoPath)).toEqual([]);
  });
});
