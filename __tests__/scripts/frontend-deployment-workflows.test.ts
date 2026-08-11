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

const modifiedWorkflows = [
  "app-pr-ci.yml",
  "artifact-portability-report.yml",
  "build-upload-deploy-prod.yml",
  "deploy-staging.yml",
  "museum-publication-compatibility.yml",
  "production-artifact-verifier.yml",
  "production-build-artifact.yml",
  "production-e2e-dispatch.yml",
  "production-e2e.yml",
  "staging-e2e.yml",
];

const guidanceCopies = new Map([
  ["AGENTS.md", "AGENTS.md"],
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
      "production-e2e-dispatch.yml",
      "production-e2e.yml",
      "staging-e2e-dispatch.yml",
      "staging-e2e.yml",
    ];
    const forbidden =
      /release[-_ ]bus|deployment[-_ ]bus|operation_id|authority\/|authority completion/i;
    for (const workflow of activePaths) {
      expect(readWorkflow(workflow).source).not.toMatch(forbidden);
    }
  });

  it("keeps exact source-commit copies of every modified workflow", () => {
    for (const workflow of modifiedWorkflows) {
      const archived = fs.readFileSync(
        path.join(ARCHIVE, "pre-change", ".github", "workflows", workflow)
      );
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
