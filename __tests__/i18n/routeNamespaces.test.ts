/** @jest-environment node */
jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import fs from "node:fs";
import path from "node:path";

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { PUBLIC_REVIEW_MESSAGES } from "@/i18n/messages/public-review";

type MessagesModule = typeof import("@/i18n/messages");
type EnUsModule = typeof import("@/i18n/messages/en-US");

const ROOT = process.cwd();
const NAMESPACE_MODULE = "@/i18n/namespaces/public-review";
const NAMESPACE_FILE = "i18n/namespaces/public-review.ts";
const SOURCE_ROOTS = [
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
  "types",
  "utils",
  "wagmiConfig",
];
const REVIEW_CODE =
  /^(app\/reviews|components\/public-review|lib\/public-review)\//;

// Shared code may use review helpers for routing and configuration only.
// Review copy is not registered outside the review routes, so these modules
// must not render it. Adding an importer here needs that check.
const SHARED_REVIEW_IMPORTERS = [
  "app/api/public-reviews/[review]/declarations/route.ts",
  "app/api/public-reviews/[review]/destination/route.ts",
  "config/publicReviews.ts",
];
// Server-only API routes: they may load review copy, which stays out of
// client bundles.
const SERVER_ONLY_IMPORTERS = new Set([
  "app/api/public-reviews/[review]/declarations/route.ts",
  "app/api/public-reviews/[review]/destination/route.ts",
]);
// These read review copy while they load, so each must load on its own: the
// declarations API route loads the feedback module without any review layout.
const EAGER_COPY_MODULES = [
  "@/lib/public-review/streamReviewFeedback.server",
  "@/components/public-review/StreamReviewRolesGuide",
];

// Representative keys from the namespace file and its split modules.
const REPRESENTATIVE_REVIEW_COPY = {
  "publicReview.status.heading": "Review status",
  "publicReview.pages.startHere.title": "Meet Stream",
  "publicReview.reference.overviewTitle": "Solidity technical reference",
  "publicReview.feedback.pages.referenceOverview":
    "Technical reference overview",
  "publicReview.rolesGuide.status.heading": "Start with status",
  "publicReview.development.heading": "Is Stream ready to launch?",
} as const;

const VALUE_IMPORT =
  /^\s*(?:import|export)\s+(?!type\b)(?:[^;]*?\bfrom\s+)?["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']\s*\)/gm;

const MESSAGES_IMPORT =
  /import\s*\{([^}]*)\}\s*from\s*["']@\/i18n\/messages["']/;

const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

const usesReviewKeys = (relativePath: string) =>
  /["'`]publicReview\./.test(readSource(relativePath));

// Whether the module looks up copy itself with t() or tRich().
function readsCopy(relativePath: string): boolean {
  const source = readSource(relativePath);
  const names = MESSAGES_IMPORT.exec(source)?.[1]
    ?.split(",")
    .map((name) => name.trim());
  return (
    names?.some((name) => name === "t" || name === "tRich") === true &&
    /\b(?:t|tRich)\(/.test(source)
  );
}

function listSourceFiles(): string[] {
  const files: string[] = [];
  const visit = (relativeDir: string) => {
    const entries = fs.readdirSync(path.join(ROOT, relativeDir), {
      withFileTypes: true,
    });
    for (const entry of entries) {
      const relativePath = `${relativeDir}/${entry.name}`;
      if (entry.isDirectory()) {
        visit(relativePath);
      } else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
        files.push(relativePath);
      }
    }
  };
  SOURCE_ROOTS.forEach(visit);
  return files;
}

function valueImports(relativePath: string): string[] {
  return [...readSource(relativePath).matchAll(VALUE_IMPORT)].flatMap(
    (match) => {
      const specifier = match[1] ?? match[2];
      return specifier ? [specifier] : [];
    }
  );
}

function resolveImport(from: string, specifier: string): string | undefined {
  let base: string;
  if (specifier.startsWith("@/")) {
    base = specifier.slice(2);
  } else if (specifier.startsWith(".")) {
    base = path.posix.join(path.posix.dirname(from), specifier);
  } else {
    return undefined;
  }
  return ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]
    .map((extension) => `${base}${extension}`)
    .find((candidate) => {
      const absolute = path.join(ROOT, candidate);
      return fs.existsSync(absolute) && fs.statSync(absolute).isFile();
    });
}

const resolvedImports = new Map<string, string[]>();

function moduleImports(file: string): string[] {
  let modules = resolvedImports.get(file);
  if (!modules) {
    modules = valueImports(file).flatMap(
      (specifier) => resolveImport(file, specifier) ?? []
    );
    resolvedImports.set(file, modules);
  }
  return modules;
}

// Every module the entries load through static value imports.
function importGraph(entries: readonly string[]): Set<string> {
  const seen = new Set<string>();
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.pop();
    if (file === undefined || seen.has(file)) {
      continue;
    }
    seen.add(file);
    queue.push(...moduleImports(file));
  }
  return seen;
}

const reachesNamespace = (entries: readonly string[]) =>
  importGraph(entries).has(NAMESPACE_FILE);

// A fresh module registry shows the dictionaries the way a page that is not a
// review loads them.
function loadSharedEnUsMessages(): EnUsModule["EN_US_MESSAGES"] {
  let enUs: EnUsModule | undefined;
  jest.isolateModules(() => {
    enUs = jest.requireActual<EnUsModule>("@/i18n/messages/en-US");
  });
  if (!enUs) {
    throw new Error("en-US messages did not load");
  }
  return enUs.EN_US_MESSAGES;
}

describe("public-review message namespace", () => {
  const sourceFiles = listSourceFiles();

  it("keeps review copy out of the shared en-US dictionary", () => {
    const shared = loadSharedEnUsMessages();

    expect(
      Object.keys(shared).filter((key) => key.startsWith("publicReview."))
    ).toEqual([]);
    expect(shared["navigation.nfts.stream"]).toBe("6529 Stream");
  });

  it("adds only review keys and never replaces shared copy", () => {
    const shared = loadSharedEnUsMessages();
    const reviewKeys = Object.keys(PUBLIC_REVIEW_MESSAGES);

    expect(PUBLIC_REVIEW_MESSAGES).toMatchObject(REPRESENTATIVE_REVIEW_COPY);
    expect(
      reviewKeys.filter((key) => !key.startsWith("publicReview."))
    ).toEqual([]);
    expect(reviewKeys.filter((key) => key in shared)).toEqual([]);
  });

  it("registers every review key and leaves shared copy unchanged", () => {
    jest.isolateModules(() => {
      const { EN_US_MESSAGES } = jest.requireActual<EnUsModule>(
        "@/i18n/messages/en-US"
      );
      const { t } = jest.requireActual<MessagesModule>("@/i18n/messages");
      const shared = { ...EN_US_MESSAGES };

      jest.requireActual(NAMESPACE_MODULE);

      const registeredKeys = Object.keys(EN_US_MESSAGES);
      expect(registeredKeys).toHaveLength(
        Object.keys(shared).length + Object.keys(PUBLIC_REVIEW_MESSAGES).length
      );
      expect(EN_US_MESSAGES).toMatchObject(shared);
      for (const [key, value] of Object.entries(REPRESENTATIVE_REVIEW_COPY)) {
        expect(t("en-US", key as keyof typeof REPRESENTATIVE_REVIEW_COPY)).toBe(
          value
        );
      }
    });
  });

  it("resolves review copy in every locale once the namespace loads", () => {
    jest.isolateModules(() => {
      const { t } = jest.requireActual<MessagesModule>("@/i18n/messages");

      for (const locale of SUPPORTED_LOCALES) {
        expect(() => t(locale, "publicReview.status.heading")).toThrow(
          "Missing source message for key: publicReview.status.heading"
        );
      }

      jest.requireActual(NAMESPACE_MODULE);

      expect(t("en-US", "publicReview.status.heading")).toBe("Review status");
      expect(t("fr-FR", "publicReview.status.heading")).toBe("Review status");
      expect(t("en-US", "publicReview.eyebrow", { contract: "Core" })).toBe(
        "Core contract"
      );
    });
  });

  it("registers review copy when the client wrapper loads", () => {
    jest.isolateModules(() => {
      const { t } = jest.requireActual<MessagesModule>("@/i18n/messages");

      jest.requireActual("@/components/public-review/PublicReviewMessages");

      expect(t("de-DE", "publicReview.status.heading")).toBe("Review status");
    });
  });

  it("loads the namespace in the layout around every review page", () => {
    const layout = readSource("app/reviews/[review]/layout.tsx");
    const wrapper = readSource(
      "components/public-review/PublicReviewMessages.tsx"
    );

    expect(valueImports("app/reviews/[review]/layout.tsx")).toContain(
      NAMESPACE_MODULE
    );
    expect(layout).toMatch(
      /<PublicReviewMessages>\{children\}<\/PublicReviewMessages>/
    );
    expect(wrapper.startsWith('"use client";')).toBe(true);
    expect(
      valueImports("components/public-review/PublicReviewMessages.tsx")
    ).toContain(NAMESPACE_MODULE);
    expect(
      sourceFiles.filter(
        (file) =>
          file.startsWith("app/reviews/") &&
          !file.startsWith("app/reviews/[review]/")
      )
    ).toEqual([]);
  });

  it.each(EAGER_COPY_MODULES)(
    "%s loads without the review layout",
    (moduleName) => {
      jest.isolateModules(() => {
        expect(() => jest.requireActual(moduleName)).not.toThrow();
      });
    }
  );

  it("loads the namespace in every module that reads review copy", () => {
    const copyReaders = sourceFiles.filter(
      (file) =>
        readsCopy(file) && (REVIEW_CODE.test(file) || usesReviewKeys(file))
    );

    expect(copyReaders).toEqual(
      expect.arrayContaining([
        "components/public-review/PublicReviewGuidePointList.tsx",
        "components/public-review/StreamReviewRolesGuide.tsx",
        "lib/public-review/streamReviewEntryMarkdown.ts",
        "lib/public-review/streamReviewFeedback.server.ts",
      ])
    );
    expect(copyReaders.filter((file) => !reachesNamespace([file]))).toEqual([]);
  });

  it("is imported only by review code", () => {
    const importers = sourceFiles.filter((file) =>
      valueImports(file).some(
        (specifier) =>
          specifier === NAMESPACE_MODULE ||
          specifier === "@/i18n/messages/public-review"
      )
    );

    expect(
      importers.filter(
        (file) => !REVIEW_CODE.test(file) && file !== NAMESPACE_FILE
      )
    ).toEqual([]);
  });

  it("uses review keys only in review code", () => {
    const offenders = sourceFiles.filter(
      (file) =>
        !REVIEW_CODE.test(file) &&
        file !== NAMESPACE_FILE &&
        !file.startsWith("i18n/messages/public-review") &&
        /["'`]publicReview\./.test(readSource(file))
    );

    expect(offenders).toEqual([]);
  });

  it("keeps review code out of shared bundles", () => {
    const sharedImporters = sourceFiles.filter(
      (file) =>
        !REVIEW_CODE.test(file) &&
        valueImports(file).some((specifier) =>
          /^@\/(components|lib)\/public-review\//.test(specifier)
        )
    );

    expect(sharedImporters.sort()).toEqual([...SHARED_REVIEW_IMPORTERS].sort());
    expect(reachesNamespace(["app/reviews/[review]/layout.tsx"])).toBe(true);
    for (const file of sharedImporters) {
      const reviewImports = valueImports(file).filter((specifier) =>
        /^@\/(components|lib)\/public-review\//.test(specifier)
      );

      expect(
        reviewImports.filter((specifier) =>
          specifier.startsWith("@/components/public-review/")
        )
      ).toEqual([]);
      if (!SERVER_ONLY_IMPORTERS.has(file)) {
        const reviewGraph = importGraph(
          reviewImports.flatMap(
            (specifier) => resolveImport(file, specifier) ?? []
          )
        );
        expect([file, reviewGraph.has(NAMESPACE_FILE)]).toEqual([file, false]);
        // Without the namespace, these modules may hold review keys as data
        // but must never look the copy up.
        expect([...reviewGraph].filter((module) => readsCopy(module))).toEqual(
          []
        );
      }
    }
  });
});
