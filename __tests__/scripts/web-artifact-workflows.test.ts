import fs from "node:fs";
import path from "node:path";

const workflow = (name: string) =>
  fs.readFileSync(
    path.join(process.cwd(), ".github", "workflows", name),
    "utf8"
  );

describe("web deployment artifact workflows", () => {
  const staging = workflow("deploy-staging.yml");
  const production = workflow("production-build-artifact.yml");

  it.each([
    ["staging", staging],
    ["production", production],
  ])("packages and verifies the %s bundle", (_environment, source) => {
    expect(source).toContain("scripts/package-web-artifact.cjs prepare");
    expect(source).toContain("scripts/package-web-artifact.cjs assert-listing");
    expect(source).toContain("scripts/package-web-artifact.cjs assert-zip");
    expect(source).toContain('--content-roots "public"');
    expect(source).toContain("artifact-portability.cjs inventory");
  });

  it.each([
    ["staging", staging],
    ["production", production],
    ["production deploy", workflow("build-upload-deploy-prod.yml")],
  ])("carries no removed public-review inputs in %s", (_environment, source) => {
    expect(source).not.toMatch(/public-review|review-data|PUBLIC_REVIEW/);
  });

  it("contains no executable Release Bus packaging profile", () => {
    expect(staging).not.toMatch(/release[-_ ]bus/i);
    expect(production).not.toMatch(/release[-_ ]bus/i);
  });
});
