import {
  displayGovernanceDecisionClass,
  displayGovernanceDisposition,
  displayGovernanceEffect,
  displayGovernanceWaveStatus,
} from "@/app/museum/network/about/governance/presentation";

describe("Museum governance presentation labels", () => {
  it("keeps database vocabulary out of visitor-facing governance fields", () => {
    expect(displayGovernanceDecisionClass("collection_preapproval")).toBe(
      "Collection preapproval"
    );
    expect(displayGovernanceDecisionClass("collecting_scope")).toBe(
      "Collecting scope"
    );
    expect(displayGovernanceDecisionClass("donation_policy")).toBe(
      "Donation policy"
    );
    expect(displayGovernanceWaveStatus("WINNER")).toBe("Adopted proposal");
    expect(displayGovernanceWaveStatus("PARTICIPATORY")).toBe("Open proposal");
    expect(displayGovernanceEffect("adopted")).toBe(
      "Adopted by the Museum Wave."
    );
    expect(displayGovernanceEffect("no_adopted_effect_at_snapshot")).toBe(
      "No adopted effect recorded at the snapshot."
    );
    expect(displayGovernanceDisposition("deferred")).toBe("Deferred");
    expect(displayGovernanceDisposition("undetermined")).toBe("Undetermined");
  });
});
