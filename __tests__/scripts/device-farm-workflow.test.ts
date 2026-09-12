import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";

const workflow = YAML.parse(
  fs.readFileSync(".github/workflows/device-farm-qa.yml", "utf8")
);
const gitBash = path.join(
  process.env["ProgramFiles"] ?? "",
  "Git/bin/bash.exe"
);
const bash =
  process.platform === "win32" && fs.existsSync(gitBash) ? gitBash : "bash";

function plan(overrides: Record<string, string> = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "device-farm-plan-"));
  try {
    const result = spawnSync(bash, ["-c", workflow.jobs.plan.steps[0].run], {
      encoding: "utf8",
      timeout: 10_000,
      env: {
        ...process.env,
        HAS_DEVICEFARM_CREDENTIALS: "true",
        HAS_MOBILE_REPO_TOKEN: "true",
        MOBILE_SHELL_REPO: "example/mobile-shell",
        PACKS_INPUT: "all",
        TARGET_INPUT: "production",
        EVENT_NAME: "workflow_dispatch",
        SCHEDULE_CRON: "",
        ...overrides,
        GITHUB_OUTPUT: path.join(root, "outputs").replaceAll("\\", "/"),
        GITHUB_STEP_SUMMARY: path.join(root, "summary").replaceAll("\\", "/"),
      },
    });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    return {
      output: Object.fromEntries(
        fs
          .readFileSync(path.join(root, "outputs"), "utf8")
          .trim()
          .split("\n")
          .map((line) => line.split("="))
      ),
      log: result.stdout,
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

describe("Device Farm cadence and pack selection", () => {
  it("runs web every day and native only on Monday without overlapping schedules", () => {
    expect(workflow.on.schedule).toEqual([
      { cron: "0 4 * * 0,2-6" },
      { cron: "0 4 * * 1" },
    ]);
    expect(
      plan({ EVENT_NAME: "schedule", SCHEDULE_CRON: "0 4 * * 0,2-6" }).output
    ).toMatchObject({
      web: "true",
      native: "false",
      "target-url": "https://6529.io",
    });
    expect(
      plan({ EVENT_NAME: "schedule", SCHEDULE_CRON: "0 4 * * 1" }).output
    ).toMatchObject({ web: "true", native: "true" });
    expect(workflow.concurrency).toEqual({
      group: "device-farm-qa",
      "cancel-in-progress": false,
    });
  });

  it.each([
    ["all", "true", "true"],
    ["web", "true", "false"],
    ["native", "false", "true"],
  ])(
    "preserves manual %s selection and staging target",
    (packs, web, native) => {
      expect(
        plan({ PACKS_INPUT: packs, TARGET_INPUT: "staging" }).output
      ).toEqual({
        web,
        native,
        "target-url": "https://staging.6529.io",
      });
    }
  );

  it("makes missing provisioning visible and skips the affected packs", () => {
    const credentials = plan({ HAS_DEVICEFARM_CREDENTIALS: "false" });
    expect(credentials.output).toMatchObject({ web: "false", native: "false" });
    expect(credentials.log).toContain("::notice::Device Farm credentials");
    const token = plan({ HAS_MOBILE_REPO_TOKEN: "false" });
    expect(token.output).toMatchObject({ web: "true", native: "false" });
    expect(token.log).toContain("::notice::MOBILE_REPO_TOKEN");
  });

  it("warns visibly and keeps web coverage if a future schedule drifts", () => {
    const result = plan({ EVENT_NAME: "schedule", SCHEDULE_CRON: "0 5 * * 1" });
    expect(result.output).toMatchObject({ web: "true", native: "false" });
    expect(result.log).toContain("::warning::Unrecognized schedule cron");
  });
});
