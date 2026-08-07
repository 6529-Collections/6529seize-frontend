const evidence =
  require("../../ops/scripts/production-authority-failure-evidence.cjs") as {
    buildFailureEvidence: (
      input: Record<string, unknown>
    ) => Record<string, unknown>;
    evidenceDigest: (value: unknown) => string;
  };

const TARGET_SHA = "a".repeat(40);
const FOREIGN_SHA = "b".repeat(40);

function run(
  kind: "deploy" | "e2e",
  conclusion: string,
  headSha = TARGET_SHA,
  actorLogin = "github-actions[bot]",
  triggeringActorLogin = actorLogin
) {
  return {
    id: kind === "deploy" ? 123456789 : 987654321,
    name: kind === "deploy" ? "Web Deploy - PROD" : "Production E2E",
    path:
      kind === "deploy"
        ? ".github/workflows/build-upload-deploy-prod.yml"
        : ".github/workflows/production-e2e.yml",
    display_title:
      kind === "deploy"
        ? `Production deploy ${headSha} [frontend-prod-123456789]`
        : "Production E2E automatic 123456789",
    event: "workflow_dispatch",
    head_branch: "main",
    head_sha: headSha,
    repository: { full_name: "6529-Collections/6529seize-frontend" },
    head_repository: { full_name: "6529-Collections/6529seize-frontend" },
    status: "completed",
    conclusion,
    run_attempt: 2,
    ...(kind === "e2e"
      ? {
          actor: { login: actorLogin },
          triggering_actor: { login: triggeringActorLogin },
        }
      : {}),
  };
}

const jobs = {
  total_count: 1,
  jobs: [
    {
      id: 2_147_483_647,
      name: "terminal job",
      status: "completed",
      conclusion: "failure",
      steps: [
        {
          number: 1,
          name: "Terminal step",
          status: "completed",
          conclusion: "failure",
        },
      ],
    },
  ],
};

function build(
  kind: "deploy" | "e2e",
  conclusion = "failure",
  headSha = TARGET_SHA,
  actorLogin = "github-actions[bot]",
  triggeringActorLogin = actorLogin
) {
  return evidence.buildFailureEvidence({
    kind,
    run: run(kind, conclusion, headSha, actorLogin, triggeringActorLogin),
    jobs,
    runId: kind === "deploy" ? "123456789" : "987654321",
    attempt: 2,
    deployRunId: "123456789",
    targetSha: TARGET_SHA,
  });
}

describe("production terminal failure evidence", () => {
  it("accepts realistic large job IDs and produces a deterministic digest", () => {
    const first = build("deploy");
    const second = build("deploy");

    expect(evidence.evidenceDigest(first)).toBe(
      evidence.evidenceDigest(second)
    );
    expect(JSON.stringify(first)).toContain('"id":"2147483647"');
  });

  it("accepts a later protected-main E2E head and records the deployed target separately", () => {
    const result = build("e2e", "failure", FOREIGN_SHA);

    expect(result).toMatchObject({
      deployed_target_sha: TARGET_SHA,
      workflow: {
        actor_login: "github-actions[bot]",
        head_sha: FOREIGN_SHA,
        triggering_actor_login: "github-actions[bot]",
      },
    });
  });

  it.each([
    ["actor", "human", "github-actions[bot]"],
    ["triggering actor", "github-actions[bot]", "human"],
  ])(
    "rejects a human-dispatched automatic-looking E2E (%s)",
    (_label, actor, triggeringActor) => {
      expect(() =>
        build("e2e", "failure", FOREIGN_SHA, actor, triggeringActor)
      ).toThrow(/E2E_(?:ACTOR|TRIGGERING_ACTOR)_LOGIN/);
    }
  );

  it("keeps the original deploy run target SHA exact", () => {
    expect(() => build("deploy", "failure", FOREIGN_SHA)).toThrow(
      "RUN_TARGET_SHA_MISMATCH"
    );
  });

  it("rejects an unbound deploy display title", () => {
    const candidate = run("deploy", "failure");
    candidate.display_title = "Web Deploy - PROD";
    expect(() =>
      evidence.buildFailureEvidence({
        kind: "deploy",
        run: candidate,
        jobs,
        runId: "123456789",
        attempt: 2,
        deployRunId: "123456789",
        targetSha: TARGET_SHA,
      })
    ).toThrow("DEPLOY_TITLE");
  });

  it.each(["neutral", "skipped"])(
    "rejects unsupported terminal conclusion %s",
    (conclusion) => {
      expect(() => build("deploy", conclusion)).toThrow("RUN_NOT_FAILED");
    }
  );
});
