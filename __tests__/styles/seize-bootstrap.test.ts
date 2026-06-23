import path from "node:path";
import { createRequire } from "node:module";
import { compile } from "sass";

const requireFromTest = createRequire(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const bootstrapPackagePath = path.dirname(
  requireFromTest.resolve("bootstrap/package.json")
);
const nodeModulesPath = path.dirname(bootstrapPackagePath);

describe("seize Bootstrap theme", () => {
  const css = compile(path.join(repoRoot, "styles/seize-bootstrap.scss"), {
    loadPaths: [nodeModulesPath, path.join(bootstrapPackagePath, "scss")],
    quietDeps: true,
    silenceDeprecations: ["import"],
  }).css;

  it("preserves brand colors in Bootstrap's derived CSS", () => {
    expect(css).toContain("--bs-pink: #da2089;");
    expect(css).toContain("--bs-green: #208359;");
    expect(css).toContain("--bs-blue: #267c93;");
    expect(css).toContain("--bs-orange: #ffa500;");
    expect(css).toContain("--bs-yellow: #ffff00;");
    expect(css).toContain("--bs-primary: #267c93;");
    expect(css).toContain("--bs-link-color: #267c93;");
    expect(css).toMatch(
      /\.btn-primary\s*\{[\s\S]*?--bs-btn-bg: #267c93;[\s\S]*?--bs-btn-border-color: #267c93;[\s\S]*?\}/
    );
    expect(css).toMatch(
      /\.text-bg-primary\s*\{[\s\S]*?background-color: RGBA\(var\(--bs-primary-rgb\), var\(--bs-bg-opacity, 1\)\) !important;[\s\S]*?\}/
    );
  });
});
