import {
  displayMuseumStatus,
  isAdoptedGovernanceEffect,
  museumSlug,
  museumSlugMatches,
  statusTone,
} from "@/lib/museum/presentation";

describe("Museum presentation semantics", () => {
  it("does not infer adoption from a negative governance effect", () => {
    expect(isAdoptedGovernanceEffect("No adopted effect")).toBe(false);
    expect(isAdoptedGovernanceEffect("proposal_not_adopted")).toBe(false);
    expect(isAdoptedGovernanceEffect("adopted_policy")).toBe(true);
  });

  it("keeps encoded record identifiers distinct in deep links", () => {
    const dotted = museumSlug("6529NM.2026.001.001");
    const dashed = museumSlug("6529NM-2026-001-001");

    expect(dotted).not.toBe(dashed);
    expect(museumSlugMatches("6529NM.2026.001.001", dotted)).toBe(true);
    expect(museumSlugMatches("6529NM.2026.001.001", dashed)).toBe(false);
    expect(museumSlugMatches("object%01", "object%01")).toBe(true);
    expect(museumSlugMatches("object%01", museumSlug("object%01"))).toBe(true);
  });

  it("presents an unverified program selection as pending Museum work", () => {
    const status = "selection_complete_acquisition_and_accession_unverified";

    expect(displayMuseumStatus(status)).toBe(
      "Selection complete; acquisition and accession unverified"
    );
    expect(statusTone(status)).toBe("warning");
    expect(displayMuseumStatus("selected_unminted")).toBe("Selected; unminted");
  });
});
