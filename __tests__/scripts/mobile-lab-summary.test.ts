const {
  BUDGETS,
  evaluateBudgets,
  median,
  pageMedians,
  render,
} = require("../../ops/scripts/mobile-lab/summarize.cjs");

type RunOverrides = {
  label: string;
  enc: number;
  jsDec?: number;
  lcp?: number | null;
  idlePerMinute?: number;
};

function run({
  label,
  enc,
  jsDec = 0,
  lcp = 1000,
  idlePerMinute,
}: RunOverrides) {
  return {
    label,
    fcp: 800,
    lcp,
    tbt: 2000,
    heap: { usedMB: 40, usedAfterGcMB: 38 },
    html: { decoded: 500 * 1024, inlineRsc: 400 * 1024, status: 200 },
    jsBeforeFcp: { enc: 200 * 1024, dec: 800 * 1024 },
    net: {
      n: 100,
      enc,
      dec: enc * 3,
      cached: 0,
      byType: { js: { n: 50, enc: enc / 2, dec: jsDec } },
      byHost: {},
    },
    requests: [],
    ...(idlePerMinute === undefined
      ? {}
      : {
          idle: {
            seconds: 60,
            requests: idlePerMinute,
            perMinute: idlePerMinute,
            encBytes: 0,
            endpoints: {},
          },
        }),
  };
}

const results = {
  base: "https://6529.io",
  when: "2026-10-15T00:00:00.000Z",
  deployedVersion: "a".repeat(40),
  browser: "149",
  device: "Pixel 7",
  cpuThrottle: 4,
  network: "fast4g",
  networkParams: { latency: 165, downloadThroughput: 1012500 },
  runs: [
    run({ label: "home-cold-1", enc: 3_000_000, lcp: 4000 }),
    run({ label: "home-cold-2", enc: 1_000_000, lcp: 2000 }),
    run({ label: "home-cold-3", enc: 2_000_000, lcp: 3000 }),
    run({ label: "home-warm-1", enc: 100_000, idlePerMinute: 0 }),
    run({ label: "museum-cold-1", enc: 500_000, lcp: null }),
  ],
};

describe("mobile lab summary", () => {
  it("takes the lower middle value and ignores missing values", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2);
    expect(median([null, 5, Number.NaN])).toBe(5);
    expect(median([])).toBeNull();
  });

  it("reports cold-load medians with the warm reload and idle window", () => {
    const [home, museum] = pageMedians(results);
    expect(home).toMatchObject({
      page: "home",
      startRoute: true,
      coldRuns: 3,
      transfer: 2_000_000,
      lcp: 3000,
      warmTransfer: 100_000,
      idlePerMinute: 0,
    });
    expect(museum).toMatchObject({
      page: "museum",
      startRoute: false,
      lcp: null,
      warmTransfer: null,
    });
  });

  it("checks each budget and says when there is no data", () => {
    const [home, museum] = pageMedians(results);
    expect(evaluateBudgets(home)).toEqual({
      jsBeforeFirstPaint: "within",
      firstLoadTransfer: "over",
      largestContent: "over",
      idleRequests: "within",
    });
    expect(evaluateBudgets(museum)).toMatchObject({
      firstLoadTransfer: "within",
      largestContent: "no data",
      idleRequests: "no data",
    });
    expect(BUDGETS.firstLoadTransferBytes).toBe(1.5 * 1024 * 1024);
  });

  it("lists runs that hit a navigation error", () => {
    const withError = {
      ...results,
      runs: [
        ...results.runs,
        {
          ...run({ label: "waves-cold-1", enc: 10 }),
          navigationError: "Redirected to the access gate: /access",
        },
      ],
    };
    expect(render(withError, null)).toContain(
      "- waves-cold-1: Redirected to the access gate: /access"
    );
    expect(render(results, null)).not.toContain("Navigation errors");
    // The failed run does not count towards the page's medians.
    const waves = pageMedians(withError).find(
      (row: { page: string }) => row.page === "waves"
    );
    expect(waves).toMatchObject({ coldRuns: 0, transfer: null });
  });

  it("renders the budgets and a comparison with an earlier run", () => {
    const earlier = {
      ...results,
      deployedVersion: "b".repeat(40),
      runs: results.runs.map((r: { net: { enc: number } }) => ({
        ...r,
        net: { ...r.net, enc: r.net.enc * 2 },
      })),
    };
    const markdown = render(results, earlier);
    expect(markdown).toContain("### Budgets (reported, not enforced)");
    expect(markdown).toContain("| home | within | over | over | within |");
    expect(markdown).toContain(
      "| museum | within | within (not a start route) | no data | no data |"
    );
    expect(markdown).toContain(
      `### Compared with https://6529.io at ${"b".repeat(40)}`
    );
    expect(markdown).toContain("3.81 → 1.91 (-1.91)");
  });
});
