import fs from "node:fs";
import path from "node:path";

function workflow(name: string): string {
  return fs.readFileSync(
    path.join(process.cwd(), ".github", "workflows", name),
    "utf8"
  );
}

const appPrCi = workflow("app-pr-ci.yml");
const releaseBusPreflight = workflow("release-bus-v2-preflight.yml");
const legacyProduction = workflow("build-upload-deploy-prod.yml");
const helper = "node scripts/package-public-review-artifacts.cjs";
const sourceCleanGuard =
  "git status --porcelain=v1 --untracked-files=all -- public/review-data content/public-reviews config/public-reviews";

describe("public-review artifact workflow contract", () => {
  it("keeps exact PR CI source-evidence-only instead of building deploy profiles", () => {
    if (appPrCi.includes("Create exact PR merge-tree CI evidence")) {
      expect(appPrCi).toContain("release-bus-v2-pr-evidence/manifest.json");
      expect(appPrCi).not.toContain(`${helper} prepare`);
      expect(appPrCi).not.toContain("release-bus-profile/target/package.zip");
      expect(appPrCi).not.toContain("--profile staging");
    } else {
      expect(appPrCi).toContain(
        "Upload exact PR merge-tree dual-profile artifact"
      );
      expect(appPrCi.match(new RegExp(`${helper} prepare`, "g"))).toHaveLength(
        2
      );
      expect(appPrCi).toContain("--profile staging");
      expect(appPrCi).toContain("--profile production");
    }
  });

  it("binds one selected release-bus artifact to its explicit environment", () => {
    expect(releaseBusPreflight).toContain(
      `${helper} prepare \\\n              --profile "$profile"`
    );
    expect(releaseBusPreflight).toContain(
      `${helper} assert-zip \\\n              --profile "$profile"`
    );
    expect(releaseBusPreflight).toContain(
      `${helper} assert-listing \\\n              --profile "$profile"`
    );
    expect(releaseBusPreflight).toContain(
      'unzip -Z1 "$destination/target/package.zip"'
    );
    expect(releaseBusPreflight).toContain(
      'build_profile "$ARTIFACT_ENVIRONMENT" release-bus-artifact'
    );
    expect(releaseBusPreflight).toContain(sourceCleanGuard);
    expect(releaseBusPreflight).toContain(
      'test -z "$(find "$destination/target/_next" -type l -print -quit)"'
    );
    expect(releaseBusPreflight).toContain('--extracted-root "$zip_extract"');
    expect(releaseBusPreflight).not.toMatch(/\bcp -r public\b/);
  });

  it("fails closed around the legacy production artifact constructor", () => {
    expect(
      legacyProduction.match(new RegExp(`${helper} prepare`, "g"))
    ).toHaveLength(1);
    expect(
      legacyProduction.match(new RegExp(`${helper} assert-zip`, "g"))
    ).toHaveLength(1);
    expect(
      legacyProduction.match(new RegExp(`${helper} assert-listing`, "g"))
    ).toHaveLength(1);
    expect(legacyProduction.match(/--profile production/g)).toHaveLength(3);
    expect(legacyProduction).toContain("unzip -Z1 target/package.zip");
    expect(legacyProduction).toContain(sourceCleanGuard);
    expect(legacyProduction).toContain(
      'test -z "$(find target/_next -type l -print -quit)"'
    );
    expect(legacyProduction).toContain('--extracted-root "$zip_extract"');
    expect(legacyProduction).not.toMatch(/\bcp -r public\b/);
  });

  it("preserves production identity and staging help and agent regeneration", () => {
    expect(appPrCi).toContain('BASE_ENDPOINT: "https://6529.io"');
    expect(appPrCi).toContain("GIPHY_API_KEY: ${{ vars.GIPHY_API_KEY }}");
    expect(releaseBusPreflight).toContain(
      "GIPHY_API_KEY: ${{ vars.GIPHY_API_KEY }}"
    );
    expect(legacyProduction).toContain(
      "GIPHY_API_KEY: ${{ vars.GIPHY_API_KEY || secrets.GIPHY_API_KEY }}"
    );
    expect(releaseBusPreflight).toContain("./bin/6529 run help-index:sync");
    expect(releaseBusPreflight).toContain("./bin/6529 run agent-files:sync");
  });
});
