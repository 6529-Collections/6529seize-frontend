import { ObjectSerializer } from "@/generated/models/ObjectSerializer";
import type { ReleaseBusV2DeployPlan } from "@/generated/models/ReleaseBusV2DeployPlan";

describe("Release Bus v2 generated models", () => {
  it("round-trips deploy-plan units as a JSON array", () => {
    const plan: ReleaseBusV2DeployPlan = {
      units: ["api", "worker"],
      edges: [["api", "worker"]],
    };

    const wire = ObjectSerializer.serialize(plan, "ReleaseBusV2DeployPlan", "");
    expect(JSON.parse(JSON.stringify(wire))).toEqual(plan);

    const restored = ObjectSerializer.deserialize(
      wire,
      "ReleaseBusV2DeployPlan",
      ""
    ) as ReleaseBusV2DeployPlan;
    expect(restored.units).toEqual(["api", "worker"]);
    expect(restored.edges).toEqual([["api", "worker"]]);
  });
});
