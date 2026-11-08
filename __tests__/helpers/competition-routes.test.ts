import {
  getCompetitionDropRoute,
  getCompetitionIdFromPathname,
  getCompetitionRoute,
  getCompetitionsRoute,
  isCompetitionCollectionSegment,
  isCompetitionPathname,
} from "@/helpers/competition.helpers";
import {
  canNavigateInWaveTabShell,
  registerWaveTabShell,
} from "@/helpers/waves/wave-tab-shell";

// Competitions are now called decisions. New links use `/decisions`; links
// that still carry the former `/competitions` segment must parse the same way.
describe("decision route helpers", () => {
  it("builds decision routes", () => {
    expect(getCompetitionsRoute("wave/1")).toBe("/waves/wave%2F1/decisions");
    expect(getCompetitionRoute("wave/1", "decision/1")).toBe(
      "/waves/wave%2F1/decisions/decision%2F1"
    );
    expect(getCompetitionDropRoute("wave", "decision", "drop/1")).toBe(
      "/waves/wave/decisions/decision?drop=drop%2F1"
    );
  });

  it("recognizes the current and legacy collection segments only", () => {
    expect(isCompetitionCollectionSegment("decisions")).toBe(true);
    expect(isCompetitionCollectionSegment("competitions")).toBe(true);
    expect(isCompetitionCollectionSegment("decision")).toBe(false);
    expect(isCompetitionCollectionSegment("Decisions")).toBe(false);
    expect(isCompetitionCollectionSegment(undefined)).toBe(false);
  });

  describe.each(["decisions", "competitions"])("/%s pathnames", (segment) => {
    it("treats the collection and a selected item as decision routes", () => {
      expect(isCompetitionPathname(`/waves/wave-1/${segment}`)).toBe(true);
      expect(isCompetitionPathname(`/waves/wave-1/${segment}/alpha`)).toBe(
        true
      );
      expect(isCompetitionPathname(`/waves/wave-1/${segment}/new`)).toBe(true);
    });

    it("reads the selected decision id", () => {
      expect(getCompetitionIdFromPathname(`/waves/wave-1/${segment}/alpha`)).toBe(
        "alpha"
      );
      expect(getCompetitionIdFromPathname(`/waves/wave-1/${segment}`)).toBeNull();
      expect(
        getCompetitionIdFromPathname(`/waves/wave-1/${segment}/new`)
      ).toBeNull();
    });

    it("ignores other route shapes", () => {
      expect(isCompetitionPathname(`/waves/${segment}`)).toBe(false);
      expect(isCompetitionPathname(`/messages/wave-1/${segment}/alpha`)).toBe(
        false
      );
      expect(isCompetitionPathname(`/waves/wave-1/${segment}/alpha/extra`)).toBe(
        false
      );
    });
  });

  it("ignores pathnames outside decision routes", () => {
    expect(isCompetitionPathname(null)).toBe(false);
    expect(isCompetitionPathname("/waves/wave-1")).toBe(false);
    expect(isCompetitionPathname("/waves/wave-1/members")).toBe(false);
    expect(getCompetitionIdFromPathname("/waves/wave-1")).toBeNull();
  });

  it.each([
    ["/waves/wave-1/decisions/alpha", "/waves/wave-1?competition=alpha"],
    ["/waves/wave-1/competitions/alpha", "/waves/wave-1?competition=alpha"],
    ["/waves/wave-1/competitions/alpha", "/waves/wave-1/decisions/alpha"],
  ])(
    "lets the wave tab shell switch tabs from %s to %s",
    (from, to) => {
      const unregister = registerWaveTabShell("wave-1");
      try {
        expect(
          canNavigateInWaveTabShell(
            new URL(`https://6529.io${from}?tab=leaderboard`),
            new URL(`https://6529.io${to}${to.includes("?") ? "&" : "?"}tab=chat`)
          )
        ).toBe(true);
      } finally {
        unregister();
      }
    }
  );
});
