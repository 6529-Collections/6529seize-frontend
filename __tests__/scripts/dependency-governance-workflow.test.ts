import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const source = fs.readFileSync(
  path.join(process.cwd(), ".github", "workflows", "dependency-governance.yml"),
  "utf8"
);
const workflow = YAML.parse(source);

describe("dependency governance workflow", () => {
  it("stays focused on dependency policy while required App CI owns app gates", () => {
    const steps = workflow.jobs["dependency-governance"].steps;
    const checkout = steps.find(
      (step: { name?: string }) => step.name === "Checkout code"
    );
    const stepNames = steps.map((step: { name?: string }) => step.name);

    expect(checkout.with).toMatchObject({
      filter: "blob:none",
      "fetch-depth": 0,
      "persist-credentials": false,
    });
    expect(stepNames).toEqual(
      expect.arrayContaining([
        "Restore pnpm store",
        "Use cached pnpm store",
        "Classify dependency risk",
        "Install dependencies",
        "Lint package.json versions",
        "Dependency governance unit tests",
      ])
    );
    expect(stepNames).not.toContain("Typecheck");
    expect(stepNames).not.toContain("Build app");
    expect(source).toContain(
      "Required App PR CI owns the complete application typecheck"
    );
    expect(source).not.toContain("TYPECHECK_OUTCOME");
    expect(source).not.toContain("BUILD_OUTCOME");
  });
});
