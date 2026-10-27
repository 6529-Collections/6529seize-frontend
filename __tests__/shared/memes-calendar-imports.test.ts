import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import ts from "typescript";

const root = process.cwd();
const canonicalPrefix = resolve(root, "shared/memes-calendar") + sep;
const frontendOptions: ts.CompilerOptions = {
  baseUrl: root,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  module: ts.ModuleKind.ESNext,
  paths: { "@/*": ["./*"] },
};
const coreOptions: ts.CompilerOptions = {
  ...frontendOptions,
  paths: { "@/*": ["./*"], "@/shared/*": ["../shared/*"] },
};

it.each([
  "app/api/meme-calendar/meme-calendar-response.ts",
  "hooks/useManifoldClaim.ts",
  "components/meme-calendar/meme-calendar.helpers.tsx",
  "components/meme-calendar/meme-calendar.zone.ts",
  "components/meme-calendar/meme-calendar.szn1.ts",
  "components/meme-calendar/meme-calendar.upcoming.ts",
  "components/meme-calendar/meme-calendar.overrides.ts",
])(
  "%s resolves the local calendar under both web and Core path mappings",
  (path) => {
    const filename = resolve(root, path);
    const imports = ts
      .preProcessFile(readFileSync(filename, "utf8"))
      .importedFiles.filter(({ fileName }) =>
        fileName.includes("shared/memes-calendar")
      );
    expect(imports.length).toBeGreaterThan(0);
    for (const { fileName } of imports) {
      const web = ts.resolveModuleName(
        fileName,
        filename,
        frontendOptions,
        ts.sys
      ).resolvedModule;
      const core = ts.resolveModuleName(
        fileName,
        filename,
        coreOptions,
        ts.sys
      ).resolvedModule;
      expect(web?.resolvedFileName.startsWith(canonicalPrefix)).toBe(true);
      expect(core?.resolvedFileName).toBe(web?.resolvedFileName);
    }
  }
);
