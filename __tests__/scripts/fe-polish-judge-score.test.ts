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

type Finding = {
  readonly id: string;
  readonly targets: readonly string[];
  readonly severity: string;
  readonly status: string;
  readonly admission?: string;
  readonly reopen_reason?: string;
};

type Cell = {
  readonly route: string;
  readonly state: string;
  readonly viewport: string;
  readonly locale: string;
  readonly status: string;
  readonly reason?: string;
};

type Round = {
  readonly rubric_version: string;
  readonly candidate: string;
  readonly coverage: readonly Cell[];
  readonly dimensions: Record<string, { score?: number; status?: string }>;
  readonly checks: Record<string, string>;
  readonly findings: readonly Finding[];
  readonly preserve: readonly string[];
};

type Run = {
  readonly rubric_version: string;
  readonly run_id: string;
  readonly candidate: { commit: string };
  readonly scope: {
    routes: string[];
    states: string[];
    viewports: string[];
    locales: string[];
  };
  readonly not_applicable: Record<string, string>;
  readonly budget: { repair_batches: number };
};

type ScoreResult = {
  readonly decision: string;
  readonly label: string | null;
  readonly errors: readonly string[];
  readonly total: number | null;
  readonly applicable_weight: number | null;
  readonly failed_floors: readonly string[];
  readonly failed_checks: readonly string[];
  readonly open_required: readonly string[];
  readonly budget: { remaining: number; recovery_batch: boolean };
  readonly best: { round: number; candidate: string } | null;
};

const tempDirs: string[] = [];

function makeRun(overrides: Partial<Run> = {}): Run {
  return {
    rubric_version: RUBRIC,
    run_id: "test-run",
    candidate: { commit: "abc123" },
    scope: {
      routes: ["/waves"],
      states: ["empty"],
      viewports: ["390x844"],
      locales: ["en-US"],
    },
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
  candidate = "abc123",
  cryptoApplies = false,
}: {
  scores?: Record<string, number | string>;
  checks?: Record<string, string>;
  findings?: Finding[];
  coverage?: string;
  candidate?: string;
  cryptoApplies?: boolean;
} = {}): Round {
  const dimensions: Round["dimensions"] = {};
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
    candidate,
    coverage: [
      {
        route: "/waves",
        state: "empty",
        viewport: "390x844",
        locale: "en-US",
        status: coverage,
        ...(coverage === "verified" ? {} : { reason: "No fixture yet" }),
      },
    ],
    dimensions,
    checks: { ...baseChecks, ...checks },
    findings,
    preserve: [],
  };
}

function finding(id: string, overrides: Partial<Finding> = {}): Finding {
  return {
    id,
    targets: ["J07"],
    severity: "P2",
    status: "open",
    admission: "baseline",
    ...overrides,
  };
}

function score(run: Run, rounds: Round[]): ScoreResult {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "fe-judge-"));
  tempDirs.push(root);
  const roundsDir = path.join(root, "run", "rounds");
  fs.mkdirSync(roundsDir, { recursive: true });
  fs.writeFileSync(path.join(root, "run", "run.json"), JSON.stringify(run));
  rounds.forEach((round, index) => {
    const name = `${String(index).padStart(2, "0")}.json`;
    fs.writeFileSync(path.join(roundsDir, name), JSON.stringify(round));
  });
  const result = spawnSync(process.execPath, [SCRIPT, "run"], {
    cwd: root,
    encoding: "utf8",
  });
  expect(result.status).toBe(0);
  return JSON.parse(result.stdout) as ScoreResult;
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

  it("refuses a run directory outside the working directory", () => {
    const result = spawnSync(process.execPath, [SCRIPT, os.tmpdir()], {
      cwd: path.dirname(SCRIPT),
      encoding: "utf8",
    });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("inside the current working directory");
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
    const complete = makeRound({ cryptoApplies: true });
    const checksWithoutS3 = Object.fromEntries(
      Object.entries(complete.checks).filter(([id]) => id !== "S3")
    );
    const missing = { ...complete, checks: checksWithoutS3 };
    expect(score(run, [missing]).errors.join(" ")).toContain("S3");
    expect(score(run, [complete]).decision).toBe("accepted");
  });

  it("validates coverage against the pinned scope and candidate", () => {
    const wider = makeRun({
      scope: {
        routes: ["/waves"],
        states: ["empty"],
        viewports: ["1440x1000", "390x844"],
        locales: ["en-US"],
      },
    });
    expect(score(wider, [makeRound()]).errors.join(" ")).toContain(
      "missing pinned cell /waves · empty · 1440x1000 · en-US"
    );

    const unexplained = makeRound({ coverage: "unverified" });
    const withoutReason = {
      ...unexplained,
      coverage: unexplained.coverage.map((cell) => ({
        route: cell.route,
        state: cell.state,
        viewport: cell.viewport,
        locale: cell.locale,
        status: cell.status,
      })),
    };
    expect(score(makeRun(), [withoutReason]).errors.join(" ")).toContain(
      "unverified needs a reason"
    );

    const stale = score(makeRun({ candidate: { commit: "def456" } }), [
      makeRound(),
    ]);
    expect(stale.decision).toBe("invalid_judge_output");
    expect(stale.errors.join(" ")).toContain("run.json candidate is def456");
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
    const stuck = (candidate: string) =>
      makeRound({
        candidate,
        scores: { J07: 7 },
        findings: [finding("F-001")],
      });
    const recovery = score(makeRun({ candidate: { commit: "c2" } }), [
      stuck("c0"),
      stuck("c1"),
      stuck("c2"),
    ]);
    expect(recovery.decision).toBe("repair");
    expect(recovery.budget.recovery_batch).toBe(true);

    const stopped = score(makeRun({ candidate: { commit: "c3" } }), [
      stuck("c0"),
      stuck("c1"),
      stuck("c2"),
      stuck("c3"),
    ]);
    expect(stopped.decision).toBe("threshold_not_reached");
    expect(stopped.best).toEqual({ round: 3, candidate: "c3" });

    const resumed = score(makeRun({ candidate: { commit: "c3" } }), [
      stuck("c0"),
      stuck("c1"),
      stuck("c2"),
      makeRound({
        candidate: "c3",
        scores: { J06: 7 },
        findings: [
          finding("F-001", { status: "resolved" }),
          finding("F-002", { targets: ["J06"], admission: "regression" }),
        ],
      }),
    ]);
    expect(resumed.decision).toBe("repair");
    expect(resumed.budget.recovery_batch).toBe(false);
  });

  it("spends no budget when the same candidate is rejudged", () => {
    const run = makeRun({ budget: { repair_batches: 1 } });
    const result = score(run, [
      makeRound({ coverage: "unverified" }),
      makeRound({
        scores: { J07: 7 },
        findings: [finding("F-001", { admission: "resolved_unverified" })],
      }),
    ]);
    expect(result.decision).toBe("repair");
    expect(result.budget.remaining).toBe(1);
  });

  it("rejects a round that does not name its candidate", () => {
    const unnamed = score(makeRun(), [makeRound({ candidate: "" })]);
    expect(unnamed.decision).toBe("invalid_judge_output");
    expect(unnamed.errors.join(" ")).toContain(
      "Round must name the candidate commit it judged"
    );
  });

  it("stops when the repair budget is exhausted", () => {
    const progressing = [7, 7.5].map((j07, index) =>
      makeRound({
        candidate: `c${index}`,
        scores: { J07: j07, J06: index === 0 ? 8 : 8.5 },
        findings: [finding("F-001")],
      })
    );
    const result = score(
      makeRun({ candidate: { commit: "c1" }, budget: { repair_batches: 1 } }),
      progressing
    );
    expect(result.decision).toBe("threshold_not_reached");
    expect(result.budget.remaining).toBe(0);
  });
});
