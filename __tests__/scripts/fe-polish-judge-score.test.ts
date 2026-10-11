import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SCRIPT = path.join(
  process.cwd(),
  "ops/skills/fe-polish-judge/scripts/score.mjs"
);
const RUBRIC = "fe-polish-judge/2.0";
const DIMENSIONS = [
  "J01",
  "J02",
  "J03",
  "J04",
  "J05",
  "J06",
  "J07",
  "J08",
  "J09",
  "J10",
  "J11",
  "J12",
  "J13",
];

type Json = Record<string, unknown>;
type Finding = Json & { id: string };

const tempDirs: string[] = [];

function makeRun(overrides: Json = {}): Json {
  return {
    rubric_version: RUBRIC,
    run_id: "test-run",
    not_applicable: { J13: "No wallet interaction" },
    budget: { repair_batches: 6 },
    ...overrides,
  };
}

function makeRound({
  scores = {},
  checks = {},
  findings = [],
  coverage = "verified",
  cryptoApplies = false,
}: {
  scores?: Record<string, number | string>;
  checks?: Record<string, string>;
  findings?: Finding[];
  coverage?: string;
  cryptoApplies?: boolean;
} = {}): Json {
  const dimensions: Record<string, Json> = {};
  for (const id of DIMENSIONS) {
    if (id === "J13" && !cryptoApplies) {
      continue;
    }
    const value = scores[id] ?? 9;
    dimensions[id] =
      typeof value === "number" ? { score: value } : { status: value };
  }
  const baseChecks: Record<string, string> = {
    I1: "pass",
    I2: "pass",
    I3: "pass",
  };
  if (cryptoApplies) {
    for (const id of ["S1", "S2", "S3", "S4", "S5", "S6"]) {
      baseChecks[id] = "pass";
    }
  }
  return {
    rubric_version: RUBRIC,
    candidate: "abc123",
    coverage: [{ cell: "/waves · empty · 390x844 · en-US", status: coverage }],
    dimensions,
    checks: { ...baseChecks, ...checks },
    findings,
    preserve: [],
  };
}

function finding(id: string, overrides: Json = {}): Finding {
  return {
    id,
    targets: ["J07"],
    severity: "P2",
    status: "open",
    admission: "baseline",
    ...overrides,
  };
}

function score(run: Json, rounds: Json[]) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fe-judge-"));
  tempDirs.push(dir);
  fs.mkdirSync(path.join(dir, "rounds"));
  fs.writeFileSync(path.join(dir, "run.json"), JSON.stringify(run));
  rounds.forEach((round, index) => {
    const name = `${String(index).padStart(2, "0")}.json`;
    fs.writeFileSync(path.join(dir, "rounds", name), JSON.stringify(round));
  });
  const result = spawnSync(process.execPath, [SCRIPT, dir], {
    encoding: "utf8",
  });
  expect(result.status).toBe(0);
  return JSON.parse(result.stdout) as Json & {
    decision: string;
    errors: string[];
    total: number | null;
    budget: Json;
    best: Json | null;
  };
}

afterAll(() => {
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("fe-polish-judge score.mjs", () => {
  it("accepts a consistent round with no open required findings", () => {
    const result = score(makeRun(), [makeRound()]);
    expect(result.decision).toBe("accepted");
    expect(result.label).toBe("judge-accepted (uncalibrated)");
    expect(result.total).toBe(9);
    expect(result.applicable_weight).toBe(90);
  });

  it("asks for repair when a required finding explains a failed floor", () => {
    const result = score(makeRun(), [
      makeRound({ scores: { J07: 7 }, findings: [finding("F-001")] }),
    ]);
    expect(result.decision).toBe("repair");
    expect(result.failed_floors).toEqual(["J07"]);
    expect(result.open_required).toEqual(["F-001"]);
  });

  it("rejects a below-floor score with no open required finding", () => {
    const result = score(makeRun(), [makeRound({ scores: { J07: 7 } })]);
    expect(result.decision).toBe("invalid_judge_output");
    expect(result.errors.join(" ")).toContain("J07 is below 8");
  });

  it("rejects a total below 8.5 with no open required finding", () => {
    const scores = Object.fromEntries(DIMENSIONS.map((id) => [id, 8]));
    const result = score(makeRun(), [makeRound({ scores })]);
    expect(result.decision).toBe("invalid_judge_output");
    expect(result.errors.join(" ")).toContain("below 8.5");
  });

  it("requires a P0 or P1 finding for a failed blocking check", () => {
    const unexplained = score(makeRun(), [
      makeRound({ checks: { I2: "fail" } }),
    ]);
    expect(unexplained.decision).toBe("invalid_judge_output");

    const explained = score(makeRun(), [
      makeRound({
        checks: { I2: "fail" },
        findings: [
          finding("F-001", { targets: ["I2", "J07"], severity: "P1" }),
        ],
      }),
    ]);
    expect(explained.decision).toBe("repair");
    expect(explained.failed_checks).toEqual(["I2"]);
  });

  it("requires S checks when crypto usability applies", () => {
    const run = makeRun({ not_applicable: {} });
    const missing = makeRound({ cryptoApplies: true });
    delete (missing.checks as Record<string, string>).S3;
    expect(score(run, [missing]).errors.join(" ")).toContain("S3");
    expect(score(run, [makeRound({ cryptoApplies: true })]).decision).toBe(
      "accepted"
    );
  });

  it("reports incomplete coverage and unpinned N/A", () => {
    const incomplete = score(makeRun(), [
      makeRound({ coverage: "unverified" }),
    ]);
    expect(incomplete.decision).toBe("incomplete");

    const unpinned = score(makeRun(), [
      makeRound({ scores: { J11: "not_applicable" } }),
    ]);
    expect(unpinned.decision).toBe("invalid_judge_output");
  });

  it("enforces ledger continuity and late-finding admission", () => {
    const baseline = makeRound({
      scores: { J07: 7 },
      findings: [finding("F-001")],
    });
    const dropped = makeRound();
    expect(score(makeRun(), [baseline, dropped]).errors.join(" ")).toContain(
      "F-001 disappeared"
    );

    const lateWithoutReason = makeRound({
      scores: { J06: 7 },
      findings: [
        finding("F-001", { status: "resolved" }),
        finding("F-002", { targets: ["J06"], admission: "baseline" }),
      ],
    });
    expect(
      score(makeRun(), [baseline, lateWithoutReason]).errors.join(" ")
    ).toContain("F-002");

    const regression = makeRound({
      scores: { J06: 7 },
      findings: [
        finding("F-001", { status: "resolved" }),
        finding("F-002", { targets: ["J06"], admission: "regression" }),
      ],
    });
    expect(score(makeRun(), [baseline, regression]).decision).toBe("repair");

    const closed = makeRound({
      findings: [finding("F-001", { status: "resolved" })],
    });
    const reopened = makeRound({
      scores: { J07: 7 },
      findings: [finding("F-001")],
    });
    expect(
      score(makeRun(), [baseline, closed, reopened]).errors.join(" ")
    ).toContain("F-001 reopened without reopen_reason");

    const reopenedWithReason = makeRound({
      scores: { J07: 7 },
      findings: [finding("F-001", { reopen_reason: "Regressed at 390 px" })],
    });
    expect(
      score(makeRun(), [baseline, closed, reopenedWithReason]).decision
    ).toBe("repair");
  });

  it("allows one recovery batch after two stalled batches, then stops", () => {
    const stuck = makeRound({
      scores: { J07: 7 },
      findings: [finding("F-001")],
    });
    const recovery = score(makeRun(), [stuck, stuck, stuck]);
    expect(recovery.decision).toBe("repair");
    expect(recovery.budget.recovery_batch).toBe(true);

    const stopped = score(makeRun(), [stuck, stuck, stuck, stuck]);
    expect(stopped.decision).toBe("threshold_not_reached");
    expect(stopped.best).toEqual({ round: 3, candidate: "abc123" });
  });

  it("stops when the repair budget is exhausted", () => {
    const progressing = [7, 7.5].map((j07, index) =>
      makeRound({
        scores: { J07: j07, J06: index === 0 ? 8 : 8.5 },
        findings: [finding("F-001")],
      })
    );
    const result = score(
      makeRun({ budget: { repair_batches: 1 } }),
      progressing
    );
    expect(result.decision).toBe("threshold_not_reached");
    expect(result.budget.remaining).toBe(0);
  });
});
