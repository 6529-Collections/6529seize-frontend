import fs from "node:fs";
import path from "node:path";

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("Release Bus frontend gate contract", () => {
  const gate = read("scripts/release-bus-frontend-gate.sh");
  const preflight = read(".github/workflows/release-bus-preflight.yml");
  const isolation = read(".github/workflows/release-bus-isolate-candidate.yml");
  const canary = read(".github/workflows/release-bus-base-canary.yml");
  const appPrCi = read(".github/workflows/app-pr-ci.yml");

  it("owns the only Release Bus Jest invocation", () => {
    expect(gate).toContain('./bin/6529 run test:no-coverage --runInBand "$@"');
    expect(gate).not.toContain("test:no-coverage -- --runInBand");

    for (const workflow of [preflight, isolation, canary]) {
      expect(workflow).not.toContain("test:no-coverage");
    }
  });

  it("is shared by preflight, isolation, and exact-base canary", () => {
    expect(preflight).toContain(
      "./scripts/release-bus-frontend-gate.sh validate"
    );
    expect(isolation).toContain("./scripts/release-bus-frontend-gate.sh full");
    expect(canary).toContain("./scripts/release-bus-frontend-gate.sh full");
  });

  it("executes its argument-forwarding contract in ordinary PR CI", () => {
    expect(appPrCi).toContain(
      "./scripts/release-bus-frontend-gate.sh contract"
    );
  });
});
