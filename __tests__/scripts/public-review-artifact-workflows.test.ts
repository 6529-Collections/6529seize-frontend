import fs from "node:fs";
import path from "node:path";

const workflow = (name: string) =>
  fs.readFileSync(
    path.join(process.cwd(), ".github", "workflows", name),
    "utf8"
  );

describe("public-review deployment artifact workflows", () => {
  const staging = workflow("deploy-staging.yml");
  const production = workflow("production-build-artifact.yml");

  it.each([
    ["staging", staging],
    ["production", production],
  ])(
    "packages and verifies the %s public-review assets",
    (_environment, source) => {
      expect(source).toContain(
        "scripts/package-public-review-artifacts.cjs prepare"
      );
      expect(source).toContain(
        "scripts/package-public-review-artifacts.cjs assert-listing"
      );
      expect(source).toContain(
        "scripts/package-public-review-artifacts.cjs assert-zip"
      );
      expect(source).toContain("public/review-data");
      expect(source).toContain("content/public-reviews");
      expect(source).toContain("config/public-reviews");
      expect(source).toContain("artifact-portability.cjs inventory");
    }
  );

  it("contains no executable Release Bus packaging profile", () => {
    expect(staging).not.toMatch(/release[-_ ]bus/i);
    expect(production).not.toMatch(/release[-_ ]bus/i);
  });
});
