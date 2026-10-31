import {
  emitSitemapWarning,
  getSitemapRetryDelayMs,
  loadSitemapSection,
  resolveSitemapFailurePolicy,
  runSitemapTaskWithRetry,
} from "@/helpers/seo/sitemap-resilience";

const COMMIT_SHA = "92966f2836ebf2af06edfe0fe2cff25041307c92";

const failTimes = <T>(times: number, value: T) => {
  let calls = 0;
  const task = jest.fn(async (): Promise<T> => {
    calls += 1;
    if (calls <= times) {
      throw new Error(`boom ${calls}`);
    }
    return value;
  });
  return task;
};

describe("getSitemapRetryDelayMs", () => {
  it("backs off exponentially with equal jitter", () => {
    expect(getSitemapRetryDelayMs(1, { random: () => 0 })).toBe(1_000);
    expect(getSitemapRetryDelayMs(1, { random: () => 1 })).toBe(2_000);
    expect(getSitemapRetryDelayMs(2, { random: () => 0 })).toBe(2_000);
    expect(getSitemapRetryDelayMs(2, { random: () => 1 })).toBe(4_000);
  });

  it("caps the delay", () => {
    expect(
      getSitemapRetryDelayMs(10, { maxDelayMs: 5_000, random: () => 1 })
    ).toBe(5_000);
    expect(
      getSitemapRetryDelayMs(10, { maxDelayMs: 5_000, random: () => 0 })
    ).toBe(2_500);
  });

  it("stays within the jitter window by default", () => {
    for (let retry = 1; retry <= 5; retry += 1) {
      const ceiling = Math.min(15_000, 2_000 * 2 ** (retry - 1));
      const delay = getSitemapRetryDelayMs(retry);
      expect(delay).toBeGreaterThanOrEqual(ceiling / 2);
      expect(delay).toBeLessThanOrEqual(ceiling);
    }
  });
});

describe("runSitemapTaskWithRetry", () => {
  it("returns the first success without sleeping", async () => {
    const sleep = jest.fn(async () => undefined);

    await expect(
      runSitemapTaskWithRetry("memes", async () => "ok", { sleep })
    ).resolves.toBe("ok");
    expect(sleep).not.toHaveBeenCalled();
  });

  it("retries with jittered backoff until the task succeeds", async () => {
    const task = failTimes(2, "ok");
    const sleep = jest.fn(async () => undefined);
    const onRetry = jest.fn();

    await expect(
      runSitemapTaskWithRetry("memes", task, {
        sleep,
        onRetry,
        random: () => 0,
      })
    ).resolves.toBe("ok");

    expect(task).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls).toEqual([[1_000], [2_000]]);
    expect(onRetry).toHaveBeenNthCalledWith(
      1,
      "memes attempt 1/3 failed (boom 1); retrying in 1000 ms"
    );
    expect(onRetry).toHaveBeenNthCalledWith(
      2,
      "memes attempt 2/3 failed (boom 2); retrying in 2000 ms"
    );
  });

  it("throws the last error with its cause once attempts are exhausted", async () => {
    const task = failTimes(99, "ok");
    const sleep = jest.fn(async () => undefined);

    const result = runSitemapTaskWithRetry("memes", task, { sleep });

    await expect(result).rejects.toThrow(
      "Sitemap memes failed after 3 attempts: boom 3"
    );
    await expect(result).rejects.toMatchObject({
      cause: expect.objectContaining({ message: "boom 3" }),
    });
    expect(task).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("supports a single attempt and clamps invalid attempt counts", async () => {
    const task = failTimes(99, "ok");

    await expect(
      runSitemapTaskWithRetry("memes", task, { attempts: 0 })
    ).rejects.toThrow("Sitemap memes failed after 1 attempt: boom 1");
    expect(task).toHaveBeenCalledTimes(1);
  });
});

describe("loadSitemapSection", () => {
  const retry = { sleep: async () => undefined };

  it("returns the loaded items", async () => {
    await expect(
      loadSitemapSection("memes", async () => [1, 2], {
        policy: "fail",
        retry,
      })
    ).resolves.toEqual({ name: "memes", status: "loaded", items: [1, 2] });
  });

  it("routes retry progress to log and keeps warn for skipped sections", async () => {
    const log = jest.fn();
    const warn = jest.fn();

    await loadSitemapSection("memes", failTimes(1, ["ok"]), {
      policy: "fail",
      retry,
      log,
      warn,
    });

    expect(log).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it("rethrows an exhausted section under the fail policy", async () => {
    await expect(
      loadSitemapSection("memes", failTimes(99, ["ok"]), {
        policy: "fail",
        retry,
      })
    ).rejects.toThrow("Sitemap memes failed after 3 attempts");
  });

  it("skips an exhausted section with a warning under the fallback policy", async () => {
    const warn = jest.fn();

    const result = await loadSitemapSection("memes", failTimes(99, ["ok"]), {
      policy: "fallback",
      retry,
      warn,
    });

    expect(result).toEqual({
      name: "memes",
      status: "skipped",
      items: [],
      reason: "Sitemap memes failed after 3 attempts: boom 3",
    });
    expect(warn).toHaveBeenCalledWith(
      "memes section skipped, so the sitemap will not list it: Sitemap memes failed after 3 attempts: boom 3"
    );
  });

  it("skips an optional section even under the fail policy", async () => {
    const result = await loadSitemapSection("profiles", failTimes(99, ["ok"]), {
      policy: "fail",
      optional: true,
      retry,
    });

    expect(result.status).toBe("skipped");
  });
});

describe("resolveSitemapFailurePolicy", () => {
  it("fails only for production deploy builds", () => {
    expect(
      resolveSitemapFailurePolicy({
        GITHUB_ACTIONS: "true",
        VERSION: COMMIT_SHA,
      })
    ).toBe("fail");
  });

  it("falls back for pull-request builds, which do not set VERSION", () => {
    expect(resolveSitemapFailurePolicy({ GITHUB_ACTIONS: "true" })).toBe(
      "fallback"
    );
  });

  it("falls back for local builds", () => {
    expect(resolveSitemapFailurePolicy({})).toBe("fallback");
    expect(resolveSitemapFailurePolicy({ VERSION: COMMIT_SHA })).toBe(
      "fallback"
    );
  });

  it("does not treat a non-commit VERSION as a deploy build", () => {
    expect(
      resolveSitemapFailurePolicy({
        GITHUB_ACTIONS: "true",
        VERSION: "6529seize",
      })
    ).toBe("fallback");
  });

  it("honors an explicit override in either direction", () => {
    expect(
      resolveSitemapFailurePolicy({
        GITHUB_ACTIONS: "true",
        VERSION: COMMIT_SHA,
        SITEMAP_FAILURE_POLICY: "fallback",
      })
    ).toBe("fallback");
    expect(
      resolveSitemapFailurePolicy({ SITEMAP_FAILURE_POLICY: "fail" })
    ).toBe("fail");
    expect(
      resolveSitemapFailurePolicy({ SITEMAP_FAILURE_POLICY: "bogus" })
    ).toBe("fallback");
  });
});

describe("emitSitemapWarning", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("writes a build-log warning and, in GitHub Actions, an annotation", () => {
    const stderr = jest
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    const stdout = jest
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    emitSitemapWarning("gradient section skipped", { GITHUB_ACTIONS: "true" });

    expect(stderr).toHaveBeenCalledWith(
      "[sitemap] WARNING: gradient section skipped\n"
    );
    expect(stdout).toHaveBeenCalledWith(
      "::warning title=Sitemap generation::gradient section skipped\n"
    );
  });

  it("escapes workflow-command control characters and stays quiet outside CI", () => {
    const stderr = jest
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    const stdout = jest
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    emitSitemapWarning("100%\nnext", { GITHUB_ACTIONS: "true" });
    expect(stdout).toHaveBeenCalledWith(
      "::warning title=Sitemap generation::100%25%0Anext\n"
    );

    stdout.mockClear();
    emitSitemapWarning("local", {});
    expect(stderr).toHaveBeenCalledWith("[sitemap] WARNING: local\n");
    expect(stdout).not.toHaveBeenCalled();
  });
});
