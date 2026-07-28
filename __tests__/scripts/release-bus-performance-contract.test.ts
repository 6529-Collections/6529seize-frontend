import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const root = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");
const workflow = (name: string) =>
  YAML.parse(read(`.github/workflows/${name}`));

describe("Release Bus frontend performance contract", () => {
  const contract = JSON.parse(
    read("ops/deployment-bus/release-bus-performance-contract.v1.json")
  );
  const preflightSource = read(
    ".github/workflows/release-bus-v2-preflight.yml"
  );
  const preflight = YAML.parse(preflightSource);

  it("records repeatable baselines, targets, and the v3 critical path", () => {
    expect(contract.baselines.frontend_production_train).toMatchObject({
      preflight_run_id: "30378015899",
      preflight_minutes: 21.7,
    });
    expect(contract.baselines.mixed_staging_train).toMatchObject({
      frontend_preflight_minutes: 12.8,
      staging_e2e_minutes: 16.5,
    });
    expect(contract.targets.mixed_staging_minutes).toMatchObject({
      minimum: 15,
      maximum: 20,
      excludes_runner_queue: true,
    });
    expect(Object.keys(preflight.jobs)).toEqual(
      contract.normal_v3_preflight.critical_path_jobs
    );
  });

  it("keeps full quality gates in exact merge-tree PR CI, not train preflight", () => {
    for (const command of contract.normal_v3_preflight.forbidden_commands) {
      expect(preflightSource).not.toContain(command);
    }
    expect(preflightSource.match(/\.\/bin\/6529 install:frozen/g)).toHaveLength(
      contract.normal_v3_preflight.dependency_installs
    );
    expect(
      preflightSource.match(/package_profile "\$profile" "\$destination"/g)
    ).toHaveLength(1);

    const appPrCi = read(".github/workflows/app-pr-ci.yml");
    expect(appPrCi).toContain("./bin/6529 run lint:changed");
    expect(appPrCi).toContain("./bin/6529 run typecheck:changed");
    expect(appPrCi).toContain("Run related Jest tests");
    expect(appPrCi).toContain("./bin/6529 run build");
    expect(appPrCi).toContain("exact-merge-tree-pr-ci-v1");
    expect(appPrCi).toContain("sha256sum ./manifest.json > SHA256SUMS");
    expect(appPrCi).not.toContain(
      "Build staging profile for exact artifact reuse"
    );
    expect(appPrCi).toContain("scripts/e2e-packs.cjs");
    expect(appPrCi).toContain("tests/packs.manifest.cjs");
  });

  it("pins the build and E2E runtime to an exact Node patch", () => {
    for (const workflowPath of [
      ".github/workflows/app-pr-ci.yml",
      ".github/workflows/release-bus-v2-preflight.yml",
      ".github/workflows/staging-e2e.yml",
      ".github/workflows/production-e2e.yml",
    ]) {
      const source = read(workflowPath);
      expect(source).toContain('node-version: "22.17.1"');
      expect(source).not.toMatch(/node-version:\s*["']22["']/);
    }
  });

  it("binds v3 to one environment and keeps legacy dual bytes same-train only", () => {
    const inputs = preflight.on.workflow_dispatch.inputs;
    expect(inputs.artifact_contract_version).toMatchObject({
      default: "legacy-v2",
      options: ["legacy-v2", "environment-bound-v3"],
    });
    expect(preflightSource).toContain(
      'build_profile "$ARTIFACT_ENVIRONMENT" release-bus-artifact'
    );
    expect(preflightSource).toContain("schema_version:3");
    expect(preflightSource).toContain(
      'artifact_contract:"environment-bound-v1"'
    );
    expect(preflightSource).toContain(
      'artifact_contract_version:"environment-bound-v3"'
    );
    expect(preflightSource).toContain(
      '.evidence_contract == "exact-merge-tree-pr-ci-v1"'
    );
    expect(preflightSource).toContain(
      'test "$(jq -r .path <<< "$run")" = .github/workflows/app-pr-ci.yml'
    );
    const authorize = preflight.jobs.authorize.steps.find(
      (step: { name?: string }) => step.name === "Authorize exact v2 operation"
    );
    const report = preflight.jobs.finalize.steps.find(
      (step: { name?: string }) =>
        step.name === "Report structured terminal result"
    );
    expect(authorize.run).toContain('environment:"orchestration"');
    for (const literal of [
      "schema_version:",
      "artifact_contract:",
      "artifact_contract_version:$contract",
      "repository:$repository",
      "source_sha:$source_sha",
      "environment:$environment",
      "package_digest:",
    ]) {
      expect(report.run).toContain(literal);
    }

    for (const environment of ["staging", "production"]) {
      const deploy = workflow(`release-bus-deploy-${environment}.yml`);
      const validation = deploy.jobs.deploy.steps.find(
        (step: { name?: string }) =>
          step.name === "Validate dispatch inputs before using credentials"
      );
      const verification = deploy.jobs.deploy.steps.find(
        (step: { name?: string }) =>
          step.name === "Verify and bind immutable artifact"
      );
      const credentialIndex = deploy.jobs.deploy.steps.findIndex(
        (step: { name?: string }) => step.name === "Configure AWS credentials"
      );
      const verificationIndex = deploy.jobs.deploy.steps.findIndex(
        (step: { name?: string }) =>
          step.name === "Verify and bind immutable artifact"
      );
      expect(validation.run).toContain(
        '[ "$ARTIFACT_CONTRACT_VERSION" = legacy-v2 ]'
      );
      expect(validation.run).toContain(
        'test "$ARTIFACT_TRAIN_ID" = "$TRAIN_ID"'
      );
      expect(verification.run).toContain(
        '.artifact_contract == "environment-bound-v1"'
      );
      expect(verification.run).toContain(
        '[ "$ARTIFACT_CONTRACT_VERSION" = environment-bound-v3 ] && [ "$schema_version" = 3 ]'
      );
      expect(verification.run).toContain(
        '.artifact_contract_version == "environment-bound-v3"'
      );
      expect(verification.run).toContain(`.environment == "${environment}"`);
      expect(verification.run).toContain(
        '[ "$ARTIFACT_CONTRACT_VERSION" = legacy-v2 ]'
      );
      expect(verification.run).toContain(
        "Artifact schema is incompatible with $ARTIFACT_CONTRACT_VERSION."
      );
      expect(verification.run).toContain(".source_sha == $source_sha");
      expect(verification.run).toContain(
        'test "$artifact_digest" = "$EXPECTED_ARTIFACT_DIGEST"'
      );
      expect(verificationIndex).toBeLessThan(credentialIndex);
      expect(
        deploy.jobs.deploy.steps.filter((step: { name?: string }) =>
          /build/i.test(step.name ?? "")
        )
      ).toEqual([]);
    }
  });

  it("accepts rollback revision identities without admitting arbitrary values", () => {
    expect(preflightSource).toContain(
      "^([1-9][0-9]{0,8}|rollback-[1-9][0-9]{0,8})$"
    );
    for (const environment of ["staging", "production"]) {
      const deploySource = read(
        `.github/workflows/release-bus-deploy-${environment}.yml`
      );
      expect(deploySource).toContain(
        "^([1-9][0-9]{0,8}|rollback-[1-9][0-9]{0,8})$"
      );
    }
  });

  it("keeps E2E lane ownership independent and parallelizes readonly packs only", () => {
    const staging = workflow("staging-e2e.yml");
    const production = workflow("production-e2e.yml");
    expect(staging.concurrency).toEqual({
      group: contract.e2e.staging_concurrency_group,
      "cancel-in-progress": false,
    });
    expect(production.concurrency).toEqual({
      group: contract.e2e.production_concurrency_group,
      "cancel-in-progress": false,
    });
    expect(staging.concurrency.group).not.toBe(production.concurrency.group);
    expect(staging.concurrency.group).not.toMatch(/all/i);
    expect(production.concurrency.group).not.toMatch(/all/i);

    const stagingSource = read(".github/workflows/staging-e2e.yml");
    const productionSource = read(".github/workflows/production-e2e.yml");
    expect(stagingSource).toContain("args+=(--parallel 3)");
    expect(productionSource).toContain("args+=(--parallel 3)");
    expect(stagingSource).toContain("RELEASE_BUS_E2E_MANIFEST_IDENTITY_SHA256");
    expect(productionSource).toContain(
      "RELEASE_BUS_E2E_MANIFEST_IDENTITY_SHA256"
    );
    expect(stagingSource).toContain("infrastructure_failure_count");
    expect(productionSource).toContain("infrastructure_failure_count");
    for (const source of [stagingSource, productionSource]) {
      expect(source).toContain("Validate exact manifest-bound E2E evidence");
      expect(source).toContain('.schema_version == "release-bus-e2e-packs.v1"');
      expect(source).toContain(
        "(.results | map(.script_key) | unique | length) == .pack_count"
      );
      expect(source).toContain('(.results | all(.safety == "readonly"))');
      expect(source).toContain(
        '.results | all(.status == "passed" and .failure_class == null)'
      );
      expect(source).toContain("manifest_identity_sha256:$identity");
      expect(source).toContain('test "$EVIDENCE_OUTCOME" = success');
    }
    const runnerSource = read("scripts/e2e-packs.cjs");
    expect(runnerSource).toContain("process.kill(-child.pid, signal)");
    expect(runnerSource).toContain('killGroup("SIGKILL")');
  });
});
