import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const details = require("../../scripts/ci-failure-details.cjs") as {
  parsePlaywrightFailures: (output: string) => {
    count: number;
    tests: Array<{
      name: string;
      title: string;
      project: string;
      location: string;
    }>;
  } | null;
  summarizeE2E: (root: string) => string | null;
  getFailureDescription: (options: {
    artifactRoot?: string;
    description?: string;
    repository: string;
    runId: string;
    runAttempt: number;
    token?: string;
    fetchImpl?: typeof fetch;
  }) => Promise<string>;
};

const failedList = (
  projects: string[],
  name = "returns to its distribution row"
) =>
  `  ${projects.length} failed\n` +
  projects
    .map(
      (project) =>
        `    [${project}] › tests/social/profile.spec.ts:531:7 › Profile coverage › ${name}\n`
    )
    .join("");

describe("CI failure details", () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "ci-failure-details-"));
  });

  afterEach(() => fs.rmSync(root, { force: true, recursive: true }));

  function evidence(attempt = 1, status = "failed") {
    fs.writeFileSync(
      path.join(root, "evidence.json"),
      JSON.stringify({
        schema_version: "deployment-e2e-packs.v1",
        results: [
          {
            script_key: "test:e2e:staging:profile-deep-links-readonly",
            status,
            attempts: [{ attempt: 1 }, ...(attempt === 1 ? [] : [{ attempt }])],
          },
        ],
      })
    );
    const folder = path.join(
      root,
      "test-e2e-staging-profile-deep-links-readonly",
      ...(attempt === 1 ? [] : [`attempt-${attempt}`])
    );
    fs.mkdirSync(folder, { recursive: true });
    return path.join(folder, "output.log");
  }

  it("reads final failures while excluding assertion bodies and flaky retries", () => {
    const output =
      "Error: private diagnostics\n1) [web-mobile-chromium] › recovered test\n" +
      failedList(["web-desktop-chromium"]) +
      "  1 flaky\n    [web-mobile-chromium] › tests/a.spec.ts:1:1 › recovered test\n  10 passed\n";
    expect(details.parsePlaywrightFailures(output)).toEqual({
      count: 1,
      tests: [
        {
          name: "returns to its distribution row",
          title: "Profile coverage › returns to its distribution row",
          project: "web-desktop-chromium",
          location: "tests/social/profile.spec.ts:531:7",
        },
      ],
    });
  });

  it("keeps later failures after an unexpected line and stops before flaky tests", () => {
    const output =
      "  2 failed\n" +
      "    [web-desktop-chromium] › tests/a.spec.ts:1:1 › Suite A › first failure\n" +
      "      unexpected annotation\n" +
      "    [web-mobile-chromium] › tests/a.spec.ts:2:1 › Suite A › second failure\n" +
      "  1 flaky\n    [web-mobile-chromium] › tests/a.spec.ts:3:1 › recovered test\n";
    expect(
      details.parsePlaywrightFailures(output)?.tests.map((test) => test.name)
    ).toEqual(["first failure", "second failure"]);
  });

  it("stops a partial failure list before unrelated lines after a blank boundary", () => {
    const output =
      "  2 failed\n" +
      "    [web-desktop-chromium] › tests/a.spec.ts:1:1 › first failure\n\n" +
      "    [web-mobile-chromium] › tests/a.spec.ts:2:1 › unrelated diagnostic\n";
    expect(
      details.parsePlaywrightFailures(output)?.tests.map((test) => test.name)
    ).toEqual(["first failure"]);
  });

  it("disambiguates identical leaf names using their full suite titles", () => {
    fs.writeFileSync(
      evidence(),
      "  2 failed\n" +
        "    [web-desktop-chromium] › tests/a.spec.ts:1:1 › Suite A › same name\n" +
        "    [web-desktop-chromium] › tests/a.spec.ts:2:1 › Suite B › same name\n"
    );
    const summary = details.summarizeE2E(root);
    expect(summary).toContain("- Suite A › same name");
    expect(summary).toContain("- Suite B › same name");
  });

  it.each([{ results: "broken" }, { results: [{ status: "failed" }] }])(
    "explicitly reports malformed test evidence",
    async (invalid) => {
      fs.writeFileSync(
        path.join(root, "evidence.json"),
        JSON.stringify({
          schema_version: "deployment-e2e-packs.v1",
          ...invalid,
        })
      );
      expect(
        await details.getFailureDescription({
          artifactRoot: root,
          repository: "6529-Collections/6529seize-frontend",
          runId: "123",
          runAttempt: 1,
        })
      ).toContain("Test failure evidence unavailable");
    }
  );

  it("groups shared test names across desktop and mobile", () => {
    fs.writeFileSync(
      evidence(),
      failedList(["web-desktop-chromium", "web-mobile-chromium"])
    );
    expect(details.summarizeE2E(root)).toBe(
      [
        "**2 failed tests across 1 pack**",
        "",
        "**profile-deep-links-readonly — desktop Chromium and mobile Chromium (2 failures)**",
        "",
        "- returns to its distribution row",
      ].join("\n")
    );
  });

  it("reads only the final pack attempt and ignores a recovered pack", () => {
    const first = evidence();
    fs.writeFileSync(
      first,
      failedList(["web-mobile-chromium"], "earlier failure")
    );
    fs.writeFileSync(
      evidence(2),
      failedList(["web-desktop-chromium"], "final failure")
    );
    expect(details.summarizeE2E(root)).toContain("final failure");
    expect(details.summarizeE2E(root)).not.toContain("earlier failure");
    evidence(2, "passed");
    expect(details.summarizeE2E(root)).toBeNull();
  });

  it("reports missing and partial test summaries without inventing test names", () => {
    evidence();
    expect(details.summarizeE2E(root)).toContain("Test results unavailable");
    fs.writeFileSync(
      evidence(),
      "  2 failed\n" +
        failedList(["web-desktop-chromium"]).split("\n").slice(1).join("\n")
    );
    expect(details.summarizeE2E(root)).toContain("1 test names unavailable");
  });

  it("bounds long lists and prevents test names from adding mentions or Markdown", () => {
    fs.writeFileSync(
      evidence(),
      failedList(["web-mobile-chromium"], "@devs6529 **unsafe**\nignored")
    );
    expect(details.summarizeE2E(root)).toContain(
      "＠devs6529 \\*\\*unsafe\\*\\*"
    );
    const names = Array.from(
      { length: 100 },
      (_, index) =>
        `    [web-mobile-chromium] › tests/a.spec.ts:${index + 1}:1 › ${"long name ".repeat(20)}${index}`
    );
    fs.writeFileSync(evidence(), "  100 failed\n" + names.join("\n"));
    const summary = details.summarizeE2E(root)!;
    expect(summary.length).toBeLessThanOrEqual(4800);
    expect(summary).toContain("Additional details omitted");
  });

  it("omits URLs embedded in failed test names", () => {
    fs.writeFileSync(
      evidence(),
      failedList(
        ["web-mobile-chromium"],
        "visits https://example.com/path?token=secret safely"
      )
    );
    const summary = details.summarizeE2E(root);
    expect(summary).toContain("- visits [URL omitted] safely");
    expect(summary).not.toContain("https://");
    expect(summary).not.toContain("token=secret");
  });

  it("looks up failed setup steps when failed packs have no recovered names", async () => {
    evidence();
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jobs: [
          {
            name: "Staging E2E packs",
            steps: [{ name: "Install Playwright", conclusion: "failure" }],
          },
        ],
      }),
    });
    const description = await details.getFailureDescription({
      artifactRoot: root,
      repository: "6529-Collections/6529seize-frontend",
      runId: "123",
      runAttempt: 1,
      token: "test-token",
      fetchImpl,
    });
    expect(description).toContain("Test results unavailable");
    expect(description).toContain("Staging E2E packs — Install Playwright");
  });

  it("identifies failed workflow steps in the current attempt for either repo", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jobs: [
          {
            name: "Deploy api",
            steps: [
              { name: "Build API", conclusion: "failure" },
              { name: "Deploy", conclusion: "skipped" },
            ],
          },
        ],
      }),
    });
    const description = await details.getFailureDescription({
      repository: "6529-Collections/6529seize-backend",
      runId: "123",
      runAttempt: 2,
      token: "test-token",
      fetchImpl,
    });
    expect(description).toBe(
      "**Failed workflow steps**\n\n- Deploy api — Build API"
    );
    expect(fetchImpl.mock.calls[0][0]).toContain("/runs/123/attempts/2/jobs");
  });

  it("keeps the alert description when enrichment fails", async () => {
    const fetchImpl = jest
      .fn()
      .mockRejectedValue(new Error("GitHub unavailable"));
    expect(
      await details.getFailureDescription({
        repository: "6529-Collections/6529seize-frontend",
        runId: "123",
        runAttempt: 1,
        token: "test-token",
        description: "Browser validation could not start.",
        fetchImpl,
      })
    ).toBe("Browser validation could not start.");
  });
});
