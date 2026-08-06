import fs from "node:fs";
import path from "node:path";

type DagNode = {
  readonly duration: number;
  readonly needs: readonly string[];
};

const contract = JSON.parse(
  fs.readFileSync(
    path.join(
      process.cwd(),
      "ops/deployment-bus/one-click-production-performance-contract.v1.json"
    ),
    "utf8"
  )
);

function finishTimes(nodes: Readonly<Record<string, DagNode>>) {
  const finished = new Map<string, number>();
  const visiting = new Set<string>();

  const finish = (name: string): number => {
    const known = finished.get(name);
    if (known !== undefined) return known;
    if (visiting.has(name)) throw new Error(`DAG cycle at ${name}`);
    const node = nodes[name];
    if (!node) throw new Error(`Unknown DAG dependency ${name}`);
    visiting.add(name);
    const dependencyFinish = Math.max(
      0,
      ...node.needs.map((dependency) => finish(dependency))
    );
    visiting.delete(name);
    const value = dependencyFinish + node.duration;
    finished.set(name, value);
    return value;
  };

  for (const name of Object.keys(nodes)) finish(name);
  return finished;
}

describe("one-click production performance contract", () => {
  it("records measured evidence separately from forecasts", () => {
    expect(contract.schema_version).toBe("one-click-production-performance.v1");
    expect(contract.observations.comparable_success).toMatchObject({
      elapsed_minutes: 46.983,
      run_ids: [
        "30977459534",
        "30977518490",
        "30978079115",
        "30978958753",
        "30979315540",
      ],
    });
    expect(contract.observations.readiness_incident).toMatchObject({
      elapsed_minutes: 66.3,
      manual_authorization_and_retry_idle_minutes: 18,
      readiness_timeout_minutes: 22,
    });
    expect(contract.targets).toEqual({
      interim_median_minutes: 42,
      final_p95_minutes: 25,
      p95_status: "not-yet-met",
    });
  });

  it("keeps production artifact work parallel to staging", () => {
    const nodes = contract.synthetic_dag.nodes as Readonly<
      Record<string, DagNode>
    >;
    expect(nodes["production-build"].needs).toEqual(["preflight"]);
    expect(nodes["staging-build"].needs).toEqual(["preflight"]);
    expect(nodes["production-build"].needs).not.toContain("staging-e2e");

    const times = finishTimes(nodes);
    expect(times.get("production-build")).toBe(9);
    expect(times.get("staging-e2e")).toBe(22);
    expect(times.get("production-e2e")).toBe(
      contract.synthetic_dag.expected_critical_path_minutes
    );
  });

  it("records the cost of accidental serialization", () => {
    const parallel = contract.forecast_minutes.parallel_production_artifact;
    const serialized = contract.forecast_minutes.serialized_production_artifact;
    expect(serialized.best - parallel.best).toBe(8);
    expect(serialized.median - parallel.median).toBe(14);
    expect(serialized.conservative_p95 - parallel.conservative_p95).toBe(14);
    expect(contract.forecast_speedup_percent).toEqual({
      parallel_vs_serialized_median: 25,
      parallel_vs_comparable_observed: 10.6,
      parallel_vs_readiness_incident: 36.7,
    });
  });
});
