import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

// next.config enables the React Compiler (config/nextConfig.ts), but Jest
// transpiles with ts-jest and never runs it. Behavior that only breaks once the
// compiler rewrites the source therefore passes every render test here and
// fails in the browser. This compiles the lazy-load modules the way the app
// build does and checks what the compiler hands to the JSX runtime.
//
// The failure that prompted it: `const Component = loaded; <Component />` was
// compiled to `_jsx("loaded", ...)`. A lowercase JSX tag is a DOM element, so
// the search modal rendered an empty `<loaded>` element and never opened.
/* eslint-disable @typescript-eslint/no-require-imports */
const babel = require("next/dist/compiled/babel/core");
const presetReact = require("next/dist/compiled/babel/preset-react");
const reactCompiler = require("babel-plugin-react-compiler");
/* eslint-enable @typescript-eslint/no-require-imports */

const REPO_ROOT = path.resolve(__dirname, "../../../..");

function compileWithReactCompiler(relativePath: string): string {
  const source = fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
  const preservedJsx = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.Preserve,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const result = babel.transformSync(preservedJsx, {
    filename: path.basename(relativePath).replace(/\.tsx?$/, ".jsx"),
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ["jsx"] },
    plugins: [[reactCompiler.default ?? reactCompiler, {}]],
    presets: [[presetReact.default ?? presetReact, { runtime: "automatic" }]],
  });
  return result.code as string;
}

// The first argument of every jsx()/jsxs() call: a quoted string is a DOM tag,
// an identifier is a component.
function jsxElementTypes(code: string): string[] {
  return [...code.matchAll(/_?jsxs?\(\s*("[^"]*"|[A-Za-z_$][\w$.]*)/g)].map(
    (match) => match[1] as string
  );
}

describe("lazy-load modules under the React Compiler", () => {
  it("really runs the compiler, so the checks below cannot pass vacuously", () => {
    const code = compileWithReactCompiler(
      "components/utils/lazy-load/createLazyComponentLoader.tsx"
    );
    // The compiler adds a memo cache to every hook and component it compiles.
    expect(code).toMatch(/\b_c\(\d+\)/);
  });

  it("never turns the loaded component into a DOM tag", () => {
    const code = compileWithReactCompiler(
      "components/utils/lazy-load/createLazyComponentLoader.tsx"
    );

    // This module renders the component it loaded and nothing else, so no
    // element it creates may have a string (DOM tag) type.
    expect(
      jsxElementTypes(code).filter((type) => type.startsWith('"'))
    ).toEqual([]);
    expect(code).toContain("createElement(loaded");
  });

  it.each([
    [
      "components/header/header-search/LazyHeaderSearchModal.tsx",
      ["CancelOnEscapeWhileLoading", "LoadedHeaderSearchModal"],
    ],
    [
      "components/waves/drops/search/LazyWaveDropsSearchModal.tsx",
      ["CancelOnEscapeWhileLoading", "LoadedWaveDropsSearchModal"],
    ],
  ])("renders only its own components in %s", (file, components) => {
    const types = jsxElementTypes(compileWithReactCompiler(file));

    expect([...new Set(types)].sort()).toEqual([...components].sort());
  });

  it.each([
    ["components/waves/drop/LazySingleWaveDrop.tsx", "LoadedSingleWaveDrop"],
    [
      "components/waves/LazyCreateDropGifPicker.tsx",
      "LoadedCreateDropGifPicker",
    ],
  ])("renders the loaded component by identifier in %s", (file, loaded) => {
    const types = jsxElementTypes(compileWithReactCompiler(file));

    expect(types).toContain(loaded);
    expect(types).not.toContain('"loaded"');
  });
});
