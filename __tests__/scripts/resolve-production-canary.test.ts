const {
  discoverProductionRun,
  deployRunId,
  githubJson,
  liveProductionVersion,
} = require("../../ops/scripts/resolve-production-canary.cjs");

const repository = "6529-Collections/6529seize-frontend";
const sha = "a".repeat(40);
const oldSha = "b".repeat(40);
const status = {
  state: "success",
  environment: "production",
  log_url: `https://github.com/${repository}/actions/runs/101/job/202`,
};
const deployment = { id: 10, sha, environment: "production" };
const run = {
  id: 101,
  head_sha: sha,
  head_branch: "main",
  event: "workflow_dispatch",
  path: ".github/workflows/build-upload-deploy-prod.yml",
  status: "completed",
  conclusion: "success",
  repository: { full_name: repository },
  head_repository: { full_name: repository },
};

describe("production canary deployment discovery", () => {
  it("anchors to the live SHA using deployment evidence without the stale run-history query", async () => {
    const getJson = jest
      .fn()
      .mockResolvedValueOnce([deployment])
      .mockResolvedValueOnce([status]);
    await expect(
      discoverProductionRun({ repository, sha, getJson })
    ).resolves.toEqual({
      run_id: "101",
      sha,
      discovery: "deployment-record",
    });
    expect(getJson.mock.calls[0][0]).toContain(
      `deployments?sha=${sha}&environment=production`
    );
    expect(getJson).toHaveBeenCalledTimes(2);
  });

  it("recovers from omitted deployment history using only a successful SHA-matching workflow", async () => {
    const getJson = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({
        workflow_runs: [{ ...run, id: 99, head_sha: oldSha }, run],
      });
    await expect(
      discoverProductionRun({ repository, sha, getJson })
    ).resolves.toMatchObject({
      run_id: "101",
      discovery: "sha-bound-workflow-history",
    });
    expect(getJson.mock.calls[1][0]).toContain(`head_sha=${sha}`);
  });

  it.each([
    { head_sha: oldSha },
    { conclusion: "failure" },
    { status: "in_progress" },
    { path: ".github/workflows/other.yml" },
    { event: "push" },
    { head_branch: "feature" },
    { head_repository: { full_name: "other/fork" } },
    { repository: { full_name: "other/repo" } },
  ])(
    "fails closed on outdated or invalid successful HTTP history: %j",
    async (overrides) => {
      const getJson = jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ workflow_runs: [{ ...run, ...overrides }] });
      await expect(
        discoverProductionRun({ repository, sha, getJson })
      ).rejects.toThrow("No successful production deployment evidence");
    }
  );

  it("bounds discovery when every response repeats an old page", async () => {
    const getJson = jest.fn().mockImplementation(async (endpoint: string) =>
      endpoint.includes("/deployments?")
        ? Array.from({ length: 100 }, () => ({ ...deployment, sha: oldSha }))
        : {
            workflow_runs: Array.from({ length: 100 }, () => ({
              ...run,
              head_sha: oldSha,
            })),
          }
    );
    await expect(
      discoverProductionRun({ repository, sha, getJson })
    ).rejects.toThrow("No successful production deployment evidence");
    expect(getJson).toHaveBeenCalledTimes(6);
    expect(getJson.mock.calls.at(-1)?.[0]).toContain("page=3");
    expect(
      getJson.mock.calls.some(([endpoint]) => endpoint.includes("/statuses"))
    ).toBe(false);
  });

  it.each([
    { state: "failure" },
    { environment: "staging" },
    { log_url: `https://evil.example/${repository}/actions/runs/101/job/202` },
    { log_url: "https://github.com/other/fork/actions/runs/101/job/202" },
    {
      log_url: `https://user@github.com/${repository}/actions/runs/101/job/202`,
    },
    {
      log_url: `https://github.com/${repository}/actions/runs/101/job/202?token=private`,
    },
    { log_url: "invalid" },
  ])("rejects invalid deployment status identity: %j", (overrides) => {
    expect(deployRunId({ ...status, ...overrides }, repository)).toBeNull();
  });

  it("retries transport errors but rejects authorization errors immediately", () => {
    const execute = jest
      .fn()
      .mockImplementationOnce(() => {
        throw Object.assign(new Error("API failed"), { stderr: "HTTP 502" });
      })
      .mockReturnValue('{"ok":true}');
    expect(githubJson("repos/example/repo/deployments", execute)).toEqual({
      ok: true,
    });
    expect(execute).toHaveBeenCalledTimes(2);
    const forbidden = jest.fn(() => {
      throw Object.assign(new Error("API failed"), { stderr: "HTTP 403" });
    });
    expect(() =>
      githubJson("repos/example/repo/deployments", forbidden)
    ).toThrow("API failed");
    expect(forbidden).toHaveBeenCalledTimes(1);
  });

  it.each([
    { version: oldSha, announced_version: sha },
    { version: sha, stale: true },
    { version: "invalid" },
  ])("rejects an invalid or unsettled live version: %j", async (body) => {
    const fetchImpl = jest.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({ "cache-control": "no-store" }),
      json: async () => body,
    });
    await expect(liveProductionVersion(fetchImpl)).rejects.toThrow(
      "stale, or invalid"
    );
  });

  it.each([200, 503])(
    "reports a malformed HTTP %s version response clearly",
    async (httpStatus) => {
      const json = jest
        .fn()
        .mockRejectedValue(new SyntaxError("HTML response"));
      const fetchImpl = jest.fn().mockResolvedValue({
        status: httpStatus,
        headers: new Headers({ "cache-control": "no-store" }),
        json,
      });
      await expect(liveProductionVersion(fetchImpl)).rejects.toThrow(
        "Production version is unavailable, stale, or invalid."
      );
      expect(json).toHaveBeenCalledTimes(httpStatus === 200 ? 1 : 0);
    }
  );

  it("requires an uncached successful live version response", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({ "cache-control": "no-store" }),
      json: async () => ({
        version: sha,
        announced_version: sha,
        stale: false,
      }),
    });
    await expect(liveProductionVersion(fetchImpl)).resolves.toBe(sha);
    fetchImpl.mockResolvedValue({
      status: 200,
      headers: new Headers({ "cache-control": "max-age=60" }),
      json: async () => ({ version: sha }),
    });
    await expect(liveProductionVersion(fetchImpl)).rejects.toThrow(
      "unavailable"
    );
  });
});
