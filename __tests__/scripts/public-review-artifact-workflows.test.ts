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
  it("uses one profile-aware helper for both exact PR artifact profiles", () => {
    expect(appPrCi.match(new RegExp(`${helper} prepare`, "g"))).toHaveLength(2);
    expect(appPrCi.match(new RegExp(`${helper} assert-zip`, "g"))).toHaveLength(
      2
    );
    expect(
      appPrCi.match(new RegExp(`${helper} assert-listing`, "g"))
    ).toHaveLength(2);
    expect(appPrCi.match(/--profile production/g)).toHaveLength(3);
    expect(appPrCi.match(/--profile staging/g)).toHaveLength(3);
    expect(appPrCi.match(/unzip -Z1/g)).toHaveLength(2);
    expect(appPrCi.match(/unzip -q/g)).toHaveLength(2);
    expect(appPrCi.match(/--extracted-root "\$zip_extract"/g)).toHaveLength(2);
    expect(
      appPrCi.match(
        /test -z "\$\(find "\$profile\/target\/_next" -type l -print -quit\)"/g
      )
    ).toHaveLength(2);
    expect(appPrCi.match(new RegExp(sourceCleanGuard, "g"))).toHaveLength(2);
    expect(appPrCi).not.toMatch(/\bcp -r public\b/);
  });

  it("binds release-bus matrix artifacts to their explicit environment", () => {
    expect(releaseBusPreflight).toContain(
      `${helper} prepare \\\n            --profile "$BUILD_ENVIRONMENT"`
    );
    expect(releaseBusPreflight).toContain(
      `${helper} assert-zip \\\n            --profile "$BUILD_ENVIRONMENT"`
    );
    expect(releaseBusPreflight).toContain(
      `${helper} assert-listing \\\n            --profile "$BUILD_ENVIRONMENT"`
    );
    expect(releaseBusPreflight).toContain(
      "unzip -Z1 release-bus-profile/target/package.zip"
    );
    expect(releaseBusPreflight).toContain(sourceCleanGuard);
    expect(releaseBusPreflight).toContain(
      'test -z "$(find release-bus-profile/target/_next -type l -print -quit)"'
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
    expect(appPrCi).toContain("./bin/6529 run help-index:sync");
    expect(appPrCi).toContain("./bin/6529 run agent-files:sync");
  });
});
