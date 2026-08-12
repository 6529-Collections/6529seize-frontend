import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const ROOT = process.cwd();
const SOURCE_COMMIT = "a9fa98482c000e86161f670c8120c7801046fd01";
const ARCHIVE = path.join(
  ROOT,
  "ops",
  "archive",
  "frontend-release-bus-integration"
);

const readWorkflow = (name: string) => {
  const source = fs.readFileSync(
    path.join(ROOT, ".github", "workflows", name),
    "utf8"
  );
  return { source, workflow: YAML.parse(source) };
};

const workflowArchives = new Map([
  ["app-pr-ci.yml", "pre-change/.github/workflows/app-pr-ci.yml"],
  [
    "artifact-portability-report.yml",
    "pre-change/.github/workflows/artifact-portability-report.yml",
  ],
  [
    "build-upload-deploy-prod.yml",
    "pre-change/.github/workflows/build-upload-deploy-prod.yml",
  ],
  ["deploy-staging.yml", "pre-change/.github/workflows/deploy-staging.yml"],
  [
    "museum-publication-compatibility.yml",
    "pre-change/.github/workflows/museum-publication-compatibility.yml",
  ],
  [
    "production-artifact-verifier.yml",
    "pre-change/.github/workflows/production-artifact-verifier.yml",
  ],
  [
    "production-build-artifact.yml",
    "pre-change/.github/workflows/production-build-artifact.yml",
  ],
  [
    "production-e2e-dispatch.yml",
    "pre-change/.github/workflows/production-e2e-dispatch.yml",
  ],
  ["production-e2e.yml", "pre-change/.github/workflows/production-e2e.yml"],
  [
    "staging-e2e-dispatch.yml",
    "removed/.github/workflows/staging-e2e-dispatch.yml",
  ],
  ["staging-e2e.yml", "pre-change/.github/workflows/staging-e2e.yml"],
]);

const guidanceCopies = new Map([
  ["AGENTS.archived.md", "AGENTS.md"],
  ["README.md", "README.md"],
  [
    "artifact-portability-migration.md",
    "ops/docs/developer/artifact-portability-migration.md",
  ],
  ["deploy-6529-SKILL.md", "ops/skills/deploy-6529/SKILL.md"],
  [
    "deploy-6529-agent-openai.yaml",
    "ops/skills/deploy-6529/agents/openai.yaml",
  ],
  ["developer-README.md", "ops/docs/developer/README.md"],
  [
    "production-artifact-verifier.md",
    "ops/docs/developer/production-artifact-verifier.md",
  ],
  [
    "6529-autonomous-manager-SKILL.md",
    "ops/skills/6529-autonomous-manager/SKILL.md",
  ],
  ["skills-README.md", "ops/skills/README.md"],
  [
    "pnpm-and-socket-firewall.md",
    "ops/docs/developer/pnpm-and-socket-firewall.md",
  ],
  [
    "public-contract-review-platform-spec.md",
    "ops/docs/specs/2026-07-26-public-contract-review-platform.md",
  ],
  ["roadmap-README.md", "ops/roadmap/README.md"],
  ["scripts-README.md", "ops/scripts/README.md"],
  ["write-prs-SKILL.md", "ops/skills/write-prs/SKILL.md"],
  ["tests-README.md", "tests/README.md"],
]);

describe("frontend deployment workflow contract", () => {
  it("keeps canonical names and makes main merges non-deploying", () => {
    const staging = readWorkflow("deploy-staging.yml").workflow;
    const production = readWorkflow("build-upload-deploy-prod.yml").workflow;
    expect(staging.name).toBe("Web Deploy - STAGING");
    expect(staging.on.push.branches).toEqual(["1a-staging"]);
    expect(staging.on.workflow_dispatch).toBeDefined();
    expect(staging.concurrency).toEqual({
      group: "staging-deploy",
      "cancel-in-progress": false,
    });
    expect(production.name).toBe("Web Deploy - PROD");
    expect(production.on.push).toBeUndefined();
    expect(production.on.pull_request).toBeUndefined();
    expect(production.on.workflow_dispatch).toBeDefined();
    expect(production.concurrency).toEqual({
      group: "web-deploy-prod",
      "cancel-in-progress": false,
    });
  });

  it("removes Release Bus control-plane plumbing from active deployment and E2E paths", () => {
    const activePaths = [
      "build-upload-deploy-prod.yml",
      "deploy-staging.yml",
      "production-artifact-verifier.yml",
      "production-build-artifact.yml",
      "production-e2e.yml",
      "staging-e2e.yml",
    ];
    const forbidden =
      /release[-_ ]bus|deployment[-_ ]bus|operation_id|authority\/|authority completion/i;
    for (const workflow of activePaths) {
      expect(readWorkflow(workflow).source).not.toMatch(forbidden);
    }
  });

  it("holds each environment lock through its matching automatic E2E", () => {
    const staging = readWorkflow("deploy-staging.yml").workflow;
    const stagingE2e = readWorkflow("staging-e2e.yml");
    const production = readWorkflow("build-upload-deploy-prod.yml").workflow;
    const productionE2e = readWorkflow("production-e2e.yml");

    expect(staging.jobs["automatic-staging-e2e"]).toMatchObject({
      needs: "deploy-staging",
      uses: "./.github/workflows/staging-e2e.yml",
      with: {
        pack: "all",
        trusted_deployed_sha: "${{ github.sha }}",
      },
    });
    expect(production.jobs["automatic-production-e2e"]).toMatchObject({
      needs: "build-upload-deploy",
      uses: "./.github/workflows/production-e2e.yml",
      with: { trusted_deployed_sha: "${{ github.sha }}" },
    });

    for (const e2e of [stagingE2e, productionE2e]) {
      expect(
        e2e.workflow.on.workflow_call.inputs.trusted_deployed_sha.required
      ).toBe(true);
      expect(
        e2e.workflow.on.workflow_dispatch.inputs.automatic_deploy_run_id
          .required
      ).toBe(true);
      expect(
        e2e.workflow.on.workflow_dispatch.inputs.target_sha
      ).toBeUndefined();
      expect(e2e.source).not.toContain("MANUAL_TARGET_SHA");
    }

    expect(stagingE2e.workflow.concurrency.group).toContain("staging-e2e");
    expect(stagingE2e.workflow.concurrency.group).toContain("staging-deploy");
    expect(productionE2e.workflow.concurrency.group).toContain(
      "production-e2e"
    );
    expect(productionE2e.workflow.concurrency.group).toContain(
      "web-deploy-prod"
    );
    expect(
      fs.existsSync(
        path.join(ROOT, ".github", "workflows", "staging-e2e-dispatch.yml")
      )
    ).toBe(false);
    expect(
      fs.existsSync(
        path.join(ROOT, ".github", "workflows", "production-e2e-dispatch.yml")
      )
    ).toBe(false);
  });

  it.each([
    {
      deployJob: "deploy-staging",
      e2eJob: "automatic-staging-e2e",
      finalizerJob: "notify-staging-outcome",
      requiredJobs: [
        "build-staging-artifact",
        "deploy-staging",
        "automatic-staging-e2e",
      ],
      workflow: "deploy-staging.yml",
    },
    {
      deployJob: "build-upload-deploy",
      e2eJob: "automatic-production-e2e",
      finalizerJob: "notify-production-outcome",
      requiredJobs: [
        "build-production-artifact",
        "verify-production-artifact",
        "build-upload-deploy",
        "automatic-production-e2e",
      ],
      workflow: "build-upload-deploy-prod.yml",
    },
  ])(
    "$workflow notifies only after the complete deployment and E2E lifecycle",
    ({ deployJob, e2eJob, finalizerJob, requiredJobs, workflow }) => {
      const parsed = readWorkflow(workflow).workflow;
      const deploySteps = parsed.jobs[deployJob].steps as Array<{
        name?: string;
      }>;
      const finalizer = parsed.jobs[finalizerJob];
      const failure = finalizer.steps.find(
        (step: { name?: string }) =>
          step.name === "Notify CI wave about failure"
      );
      const success = finalizer.steps.find(
        (step: { name?: string }) =>
          step.name === "Notify CI wave about success"
      );

      expect(
        deploySteps.some((step) => step.name?.startsWith("Notify CI wave"))
      ).toBe(false);
      expect(finalizer.if).toBe("always()");
      expect(finalizer.needs).toEqual(requiredJobs);
      expect(finalizer.needs).toContain(e2eJob);
      for (const job of requiredJobs) {
        expect(failure.if).toContain(`needs.${job}.result != 'success'`);
        expect(success.if).toContain(`needs.${job}.result == 'success'`);
      }
      expect(failure.env.CI_PIPELINES_STATUS).toBe("failure");
      expect(success.env.CI_PIPELINES_STATUS).toBe("success");
    }
  );

  it("keeps production release-note generation on complete pipeline success", () => {
    const production = readWorkflow("build-upload-deploy-prod.yml").workflow;
    const success = production.jobs["notify-production-outcome"].steps.find(
      (step: { name?: string }) => step.name === "Notify CI wave about success"
    );

    expect(success.env.CI_RELEASE_NOTES_PROMPT_PATH).toBe(
      "ops/release-notes/release-notes.prompt.md"
    );
  });

  it("exposes the staging access code only after deployed-source authorization", () => {
    const stagingE2e = readWorkflow("staging-e2e.yml").workflow;
    const job = stagingE2e.jobs["staging-packs"];
    const runPacks = job.steps.find(
      (step: { name?: string }) => step.name === "Run read-only staging packs"
    );

    expect(job.env.PLAYWRIGHT_STAGING_ACCESS_CODE).toBeUndefined();
    expect(runPacks.env.PLAYWRIGHT_STAGING_ACCESS_CODE).toBe(
      "${{ secrets.PLAYWRIGHT_STAGING_ACCESS_CODE }}"
    );
  });

  it("keeps exact-production provenance and late downgrade guards fail-closed", () => {
    const production = readWorkflow("build-upload-deploy-prod.yml").source;
    const verifier = readWorkflow("production-artifact-verifier.yml").source;
    const productionE2e = readWorkflow("production-e2e.yml").source;

    expect(verifier).toContain(
      '.path == ".github/workflows/production-build-artifact.yml"'
    );
    expect(verifier).toContain(
      '.path == ".github/workflows/build-upload-deploy-prod.yml"'
    );
    expect(verifier).toContain(
      '$repository + "/.github/workflows/production-build-artifact.yml"'
    );
    expect(verifier).toContain(".sha == $workflow_sha");
    expect(production).toContain(
      'git merge-base --is-ancestor "$COMMIT_SHA" "$current_main_sha"'
    );
    expect(production).not.toContain(
      'test "$current_main_sha" = "$COMMIT_SHA"'
    );
    expect(production).not.toContain("refusing to announce stale production");
    expect(production).toContain("refusing to overwrite it with $COMMIT_SHA");
    expect(productionE2e).toContain(
      'git fetch --no-tags --depth=1 origin "$EXPECTED_SHA"'
    );
    expect(productionE2e).not.toMatch(
      /uses: actions\/checkout@[^\n]+\n\s+with:\n\s+ref: \$\{\{ steps\.source\.outputs\.sha \}\}/u
    );
    expect(productionE2e).toContain("path: .version-verifier");
  });

  it("keeps exact source-commit copies of every modified workflow", () => {
    for (const [workflow, archivePath] of workflowArchives) {
      const archived = fs.readFileSync(path.join(ARCHIVE, archivePath));
      const original = execFileSync(
        "git",
        ["show", `${SOURCE_COMMIT}:.github/workflows/${workflow}`],
        { cwd: ROOT, encoding: "buffer" }
      );
      expect(archived.equals(original)).toBe(true);
    }
  });

  it("keeps a selective exact pre-change guidance set", () => {
    for (const [archivedName, originalPath] of guidanceCopies) {
      const archived = fs.readFileSync(
        path.join(ARCHIVE, "guidance", "pre-change", archivedName)
      );
      const original = execFileSync(
        "git",
        ["show", `${SOURCE_COMMIT}:${originalPath}`],
        { cwd: ROOT, encoding: "buffer" }
      );
      expect(archived.equals(original)).toBe(true);
    }
  });

  it("keeps archived workflows outside GitHub's executable workflow directory", () => {
    const removedWorkflowRoot = path.join(
      ARCHIVE,
      "removed",
      ".github",
      "workflows"
    );
    const removed = fs.readdirSync(removedWorkflowRoot).sort();
    expect(removed).toEqual([
      "production-authority-complete.yml",
      "release-bus-deploy-production.yml",
      "release-bus-deploy-staging.yml",
      "release-bus-v2-advance-staging-ref.yml",
      "release-bus-v2-compose.yml",
      "release-bus-v2-preflight.yml",
      "staging-e2e-dispatch.yml",
    ]);
    for (const workflow of removed) {
      expect(
        fs.existsSync(path.join(ROOT, ".github", "workflows", workflow))
      ).toBe(false);
      expect(
        fs
          .realpathSync(path.join(removedWorkflowRoot, workflow))
          .startsWith(path.join(ROOT, ".github", "workflows"))
      ).toBe(false);
    }
  });

  it("records the source commit and restoration guidance", () => {
    const readme = fs.readFileSync(path.join(ARCHIVE, "README.md"), "utf8");
    expect(readme).toContain(SOURCE_COMMIT);
    expect(readme).toMatch(
      /was archived so frontend deployment no\s+longer depends/u
    );
    expect(readme).toContain("Theoretical restoration");
    expect(readme).toContain("backend Release Bus");
    expect(readme).toContain("guidance/pre-change/");
  });
});
