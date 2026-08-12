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
const stagingWorkflow = workflow("deploy-staging.yml");
const legacyProduction = workflow("build-upload-deploy-prod.yml");
const productionBuild = workflow("production-build-artifact.yml");
const stagingArtifactDeployScript = fs.readFileSync(
  path.join(process.cwd(), "ops", "scripts", "deploy-staging-artifact.sh"),
  "utf8"
);
const proxySource = fs.readFileSync(
  path.join(process.cwd(), "proxy.ts"),
  "utf8"
);
const standaloneStart = fs.readFileSync(
  path.join(process.cwd(), "scripts", "start-standalone.cjs"),
  "utf8"
);
const helper = "node scripts/package-public-review-artifacts.cjs";
const sourceCleanGuard =
  "git status --porcelain=v1 --untracked-files=all -- public/review-data content/public-reviews config/public-reviews";

describe("public-review artifact workflow contract", () => {
  it("bakes mainnet NextGen contracts into every staging artifact", () => {
    expect(stagingWorkflow).toContain('NEXTGEN_CHAIN_ID: "1"');
    expect(stagingWorkflow).not.toContain("STAGING_NEXTGEN_CHAIN_ID");
    expect(
      releaseBusPreflight.match(/export NEXTGEN_CHAIN_ID=1/g)
    ).toHaveLength(2);
    expect(releaseBusPreflight).not.toContain("STAGING_NEXTGEN_CHAIN_ID");
  });

  it("bakes the environment-specific mobile app scheme", () => {
    expect(stagingWorkflow).toContain(
      "MOBILE_APP_SCHEME: mobileStaging6529"
    );
    expect(releaseBusPreflight).toContain(
      "export MOBILE_APP_SCHEME=mobileStaging6529"
    );
    expect(releaseBusPreflight).toContain(
      "export MOBILE_APP_SCHEME=mobile6529"
    );
    expect(legacyProduction).toContain(
      'MOBILE_APP_SCHEME: "mobile6529"'
    );
    expect(productionBuild).toContain(
      'MOBILE_APP_SCHEME: "mobile6529"'
    );
  });

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
    expect(releaseBusPreflight).toContain(
      '--extracted-root "$portability_extract"'
    );
    expect(releaseBusPreflight).not.toMatch(/\bcp -r public\b/);
  });

  it("fails closed around the production prebuild artifact constructor", () => {
    expect(
      productionBuild.match(new RegExp(`${helper} prepare`, "g"))
    ).toHaveLength(1);
    expect(
      productionBuild.match(new RegExp(`${helper} assert-zip`, "g"))
    ).toHaveLength(1);
    expect(
      productionBuild.match(new RegExp(`${helper} assert-listing`, "g"))
    ).toHaveLength(1);
    expect(productionBuild.match(/--profile production/g)).toHaveLength(3);
    expect(productionBuild).toContain(
      "unzip -Z1 production-artifact/target/package.zip"
    );
    expect(productionBuild).toContain(sourceCleanGuard);
    expect(productionBuild).toContain(
      'test -z "$(find production-artifact/target/_next -type l -print -quit)"'
    );
    expect(productionBuild).toContain('--extracted-root "$zip_extract"');
    expect(productionBuild).toContain(
      '--runtime-config "$zip_extract/.next/PUBLIC_RUNTIME.json"'
    );
    expect(productionBuild).toContain(
      '--assets-flag "$zip_extract/.next/ASSETS_FROM_S3"'
    );
    expect(productionBuild).not.toContain(
      "--extracted-root .production-bundle"
    );
    expect(productionBuild).not.toMatch(/\bcp -r public\b/);
  });

  it("injects a validated production-only public-review destination", () => {
    expect(legacyProduction).toContain(
      "PUBLIC_REVIEW_DISCUSSION_DESTINATIONS: ${{ secrets.PUBLIC_REVIEW_PRODUCTION_DISCUSSION_DESTINATIONS }}"
    );
    expect(legacyProduction).toContain('keys == ["production"]');
    expect(legacyProduction).toContain(
      'OptionName:"PUBLIC_REVIEW_DISCUSSION_DESTINATIONS"'
    );
    expect(legacyProduction).toContain('--option-settings "$option_settings"');
  });

  it("builds and deploys one exact manual staging artifact", () => {
    expect(stagingWorkflow).toContain(
      "PUBLIC_REVIEW_DISCUSSION_DESTINATIONS: ${{ secrets.PUBLIC_REVIEW_DISCUSSION_DESTINATIONS }}"
    );
    expect(stagingWorkflow).toContain('artifact_contract:"manual-staging-v1"');
    expect(stagingWorkflow).toContain(`${helper} prepare`);
    expect(stagingWorkflow).toContain(`${helper} assert-listing`);
    expect(stagingWorkflow).toContain(`${helper} assert-zip`);
    expect(stagingWorkflow).toContain('--extracted-root "$zip_extract"');
    expect(stagingWorkflow).toContain(
      '--runtime-config "$zip_extract/.next/PUBLIC_RUNTIME.json"'
    );
    expect(stagingWorkflow).toContain(
      '--assets-flag "$zip_extract/.next/ASSETS_FROM_S3"'
    );
    expect(stagingWorkflow).not.toContain("--extracted-root .staging-bundle");
    expect(stagingWorkflow).toContain("./bin/6529 run base-build");
    expect(stagingWorkflow).toContain(
      "bash ops/scripts/deploy-staging-artifact.sh"
    );
    expect(stagingWorkflow).toContain(
      "PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_B64"
    );
    expect(stagingWorkflow).not.toContain(
      "PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_PARAMETER"
    );
    expect(stagingWorkflow).not.toContain("aws ssm get-parameter");
    expect(stagingWorkflow).toContain('(has("production") | not)');
    expect(stagingArtifactDeployScript).toContain(
      "printf '%s' \"$PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_B64\" | base64 -d"
    );
    expect(stagingArtifactDeployScript).toContain(
      "public-review-discussion-destinations.json"
    );
    expect(stagingArtifactDeployScript).toContain("pm2 startOrReload");
    expect(stagingArtifactDeployScript).toContain(
      'wait_for_local_version "$EXPECTED_SHA"'
    );
    expect(standaloneStart).toContain('"package-public-review-artifacts.cjs"');
    expect(standaloneStart).toContain('"prepare"');
    expect(standaloneStart).toContain(
      'process.env["STANDALONE_ARTIFACT_PROFILE"]'
    );
    expect(standaloneStart).toContain(
      'process.env["PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_FILE"]'
    );
    expect(standaloneStart).toContain(
      'delete packagingEnv["PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_FILE"]'
    );
  });

  it("inventories the exact extracted release package rather than the symlinked build tree", () => {
    expect(releaseBusPreflight).toContain(
      'local portability_extract="$destination/portability-extract"'
    );
    expect(releaseBusPreflight).toContain(
      'unzip -q "$destination/target/package.zip" -d "$portability_extract"'
    );
    expect(releaseBusPreflight).toContain(
      "--extracted-root release-bus-artifact/portability-extract"
    );
    expect(releaseBusPreflight).toContain(
      '--extracted-root "release-bus-artifact/profiles/$profile/portability-extract"'
    );
    expect(releaseBusPreflight).not.toContain(
      "--extracted-root release-bus-artifact/bundle"
    );
    expect(releaseBusPreflight).not.toContain(
      '--extracted-root "release-bus-artifact/profiles/$profile/bundle"'
    );
    expect(releaseBusPreflight).toContain(
      "rm -rf release-bus-artifact/portability-extract"
    );
    expect(releaseBusPreflight).toContain(
      'rm -rf "release-bus-artifact/profiles/$profile/portability-extract"'
    );
  });

  it("generates help and agent artifacts after configuring each release-bus profile", () => {
    const generateStepStart = releaseBusPreflight.indexOf(
      "      - name: Generate source-stable environment schema once"
    );
    const packageStepStart = releaseBusPreflight.indexOf(
      "      - name: Build and package only the authorized environment contract"
    );
    const generateStep = releaseBusPreflight.slice(
      generateStepStart,
      packageStepStart
    );
    const buildProfileStart = releaseBusPreflight.indexOf(
      "          build_profile() {"
    );
    const buildProfileEnd = releaseBusPreflight.indexOf(
      "\n          rm -rf release-bus-artifact",
      buildProfileStart
    );
    const buildProfile = releaseBusPreflight.slice(
      buildProfileStart,
      buildProfileEnd
    );
    const configureProfileIndex = buildProfile.indexOf(
      'configure_profile "$profile"'
    );
    const helpIndexSyncIndex = buildProfile.indexOf(
      "./bin/6529 run help-index:sync"
    );
    const agentFilesSyncIndex = buildProfile.indexOf(
      "./bin/6529 run agent-files:sync"
    );
    const baseBuildIndex = buildProfile.indexOf("./bin/6529 run base-build");

    expect(generateStepStart).toBeGreaterThanOrEqual(0);
    expect(packageStepStart).toBeGreaterThan(generateStepStart);
    expect(generateStep).toContain("./bin/6529 run build:env-schema");
    expect(generateStep).not.toContain("./bin/6529 run help-index:sync");
    expect(generateStep).not.toContain("./bin/6529 run agent-files:sync");
    expect(configureProfileIndex).toBeGreaterThanOrEqual(0);
    expect(helpIndexSyncIndex).toBeGreaterThan(configureProfileIndex);
    expect(agentFilesSyncIndex).toBeGreaterThan(helpIndexSyncIndex);
    expect(baseBuildIndex).toBeGreaterThan(agentFilesSyncIndex);
  });

  it("ships the shared Stream artifact exception in manual and release-bus staging", () => {
    expect(proxySource).toContain(
      'const STREAM_REVIEW_DATA_PREFIX = "/review-data/6529-stream/";'
    );
    expect(proxySource).toContain(
      "isPublicStreamReviewDataPath(req, pathname)"
    );
    expect(proxySource).toContain("rawPathname === pathname");
    expect(stagingWorkflow).toContain(`${helper} prepare`);
    expect(stagingWorkflow).toContain("--profile staging");
    expect(releaseBusPreflight).toContain(
      'build_profile "$ARTIFACT_ENVIRONMENT" release-bus-artifact'
    );
    expect(releaseBusPreflight).toContain(
      "build_profile staging release-bus-artifact/profiles/staging"
    );
    expect(releaseBusPreflight).toContain("./bin/6529 run base-build");
  });

  it("preserves production identity for every deployment constructor", () => {
    expect(appPrCi).toContain('BASE_ENDPOINT: "https://6529.io"');
    expect(appPrCi).toContain("GIPHY_API_KEY: ${{ vars.GIPHY_API_KEY }}");
    expect(releaseBusPreflight).toContain(
      "GIPHY_API_KEY: ${{ vars.GIPHY_API_KEY }}"
    );
    expect(productionBuild).toContain(
      "GIPHY_API_KEY: ${{ vars.GIPHY_API_KEY || secrets.GIPHY_API_KEY }}"
    );
  });
});
