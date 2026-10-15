/** @jest-environment node */
jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import fs from "node:fs";
import path from "node:path";

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
  "app/stream/page.tsx",
  "config/publicReviews.ts",
  "hooks/useSidebarSections.ts",
];
// Server-only: it may load review copy, which stays out of client bundles.
const SERVER_ONLY_IMPORTERS = new Set([
  "app/api/public-reviews/[review]/declarations/route.ts",
]);
// These read review copy while they load, so each must load on its own: the
// declarations API route loads the feedback module without any review layout.
const EAGER_COPY_MODULES = [
  "@/lib/public-review/streamReviewFeedback.server",
  "@/components/public-review/StreamReviewRolesGuide",
];

const VALUE_IMPORT =
  /^\s*(?:import|export)\s+(?!type\b)(?:[^;]*?\bfrom\s+)?["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']\s*\)/gm;

const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

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

function reachesNamespace(entries: readonly string[]): boolean {
  const seen = new Set<string>();
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.pop();
    if (file === undefined || seen.has(file)) {
      continue;
    }
    if (file === NAMESPACE_FILE) {
      return true;
    }
    seen.add(file);
    for (const specifier of valueImports(file)) {
      const resolved = resolveImport(file, specifier);
      if (resolved) {
        queue.push(resolved);
      }
    }
  }
  return false;
}

// jest.setup.js registers every namespace for the whole suite. A fresh module
// registry shows the dictionaries the way a page that is not a review loads
// them.
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
    expect(shared["navigation.nfts.streamReview"]).toBe("6529 Stream — Review");
  });

  it("adds only review keys and never replaces shared copy", () => {
    const shared = loadSharedEnUsMessages();
    const reviewKeys = Object.keys(PUBLIC_REVIEW_MESSAGES);

    expect(reviewKeys.length).toBeGreaterThan(1000);
    expect(
      reviewKeys.filter((key) => !key.startsWith("publicReview."))
    ).toEqual([]);
    expect(reviewKeys.filter((key) => key in shared)).toEqual([]);
  });

  it("resolves review copy in every locale once the namespace loads", () => {
    jest.isolateModules(() => {
      const { t } = jest.requireActual<MessagesModule>("@/i18n/messages");

      expect(() => t("en-US", "publicReview.status.heading")).toThrow(
        "Missing source message for key: publicReview.status.heading"
      );

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
        const reviewModules = reviewImports.flatMap(
          (specifier) => resolveImport(file, specifier) ?? []
        );
        expect([file, reachesNamespace(reviewModules)]).toEqual([file, false]);
      }
    }
  });
});
