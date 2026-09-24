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

/** Runs the workflow's pack planner and captures its outputs and visible summary. */
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
      summary: fs.readFileSync(path.join(root, "summary"), "utf8"),
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
    const daily = plan({
      EVENT_NAME: "schedule",
      SCHEDULE_CRON: "0 4 * * 0,2-6",
    });
    expect(daily.output).toMatchObject({
      web: "true",
      native: "false",
      "target-url": "https://6529.io",
    });
    expect(daily.summary).toContain(
      "Requested packs: `web` (event: `schedule`, cron: `0 4 * * 0,2-6`)"
    );
    const weekly = plan({ EVENT_NAME: "schedule", SCHEDULE_CRON: "0 4 * * 1" });
    expect(weekly.output).toMatchObject({ web: "true", native: "true" });
    expect(weekly.summary).toContain(
      "Requested packs: `all` (event: `schedule`, cron: `0 4 * * 1`)"
    );
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
      const manual = plan({ PACKS_INPUT: packs, TARGET_INPUT: "staging" });
      expect(manual.output).toEqual({
        web,
        native,
        "target-url": "https://staging.6529.io",
        "requested-packs": packs,
      });
      expect(manual.summary).toContain(
        `Requested packs: \`${packs}\` (event: \`workflow_dispatch\`)`
      );
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

describe("Device Farm aggregate outcome", () => {
  it("validates nested device evidence without accessing AWS", () => {
    const result = spawnSync(
      "python3",
      ["scripts/__tests__/device_farm_report_test.py"],
      {
        encoding: "utf8",
        timeout: 10_000,
        env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
      }
    );
    expect(result.error).toBeUndefined();
    expect(result.stderr).toContain("OK");
    expect(result.status).toBe(0);
  });

  function report(overrides: Record<string, string> = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "device-farm-report-"));
    try {
      const step = workflow.jobs.report.steps.find(
        (entry: { name: string }) => entry.name === "Summarize pack results"
      );
      const result = spawnSync(bash, ["-c", step.run], {
        encoding: "utf8",
        timeout: 10_000,
        env: {
          ...process.env,
          PLAN_RESULT: "success",
          PACKAGE_RESULT: "success",
          REQUESTED_PACKS: "web",
          WEB_RESULT: "success",
          NATIVE_RESULT: "skipped",
          ...overrides,
          GITHUB_STEP_SUMMARY: path.join(root, "summary").replaceAll("\\", "/"),
        },
      });
      expect(result.error).toBeUndefined();
      return result;
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }

  it("keeps explicitly unrequested packs neutral", () => {
    expect(report().status).toBe(0);
    expect(
      report({
        REQUESTED_PACKS: "native",
        WEB_RESULT: "skipped",
        NATIVE_RESULT: "success",
      }).status
    ).toBe(0);
    expect(
      report({ REQUESTED_PACKS: "all", NATIVE_RESULT: "success" }).status
    ).toBe(0);
  });

  it.each(["failure", "cancelled", "skipped", ""])(
    "fails closed when a required stage is %s",
    (state) => {
      for (const key of ["PLAN_RESULT", "PACKAGE_RESULT", "WEB_RESULT"]) {
        expect(report({ [key]: state }).status).toBe(1);
      }
      expect(
        report({ REQUESTED_PACKS: "all", NATIVE_RESULT: state }).status
      ).toBe(1);
    }
  );

  it("reports the runner acquisition failure even when both packs skipped", () => {
    const result = report({
      PLAN_RESULT: "failure",
      PACKAGE_RESULT: "skipped",
      WEB_RESULT: "skipped",
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain(
      "infrastructure/setup failed or tests did not run"
    );
    expect(workflow.jobs.report.needs).toContain("package-tests");
    expect(workflow.jobs.report.if).toBe("always()");
  });

  it("does not pass missing credentials or missing requested native access", () => {
    expect(
      report({ PACKAGE_RESULT: "skipped", WEB_RESULT: "skipped" }).status
    ).toBe(1);
    expect(
      report({ REQUESTED_PACKS: "all", NATIVE_RESULT: "skipped" }).status
    ).toBe(1);
    expect(report({ REQUESTED_PACKS: "unknown" }).status).toBe(1);
  });

  it("collects and diagnoses evidence even after the Device Farm action fails", () => {
    const steps = workflow.jobs["web-smoke"].steps;
    const diagnosis = steps.find(
      (step: { name: string }) => step.name === "Summarize device diagnostics"
    );
    expect(diagnosis.if).toBe("always()");
    expect(diagnosis.run).toContain("python3 scripts/device-farm-report.py");
    expect(diagnosis.run).toContain("--query 'run.totalJobs'");
    expect(diagnosis.env.ARTIFACT_FOLDER).toContain(
      "steps.devicefarm.outputs.artifact-folder"
    );
    const action = steps.find(
      (step: { id: string }) => step.id === "devicefarm"
    );
    expect(action["continue-on-error"]).toBeUndefined();
  });
});
