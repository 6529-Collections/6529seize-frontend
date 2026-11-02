jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });
jest.mock("@/lib/museum/normalize", () => ({
  getMuseumView: jest.fn(),
}));

import MuseumAboutGovernancePage from "@/app/museum/network/about/governance/page";
import MuseumAboutGovernanceDetailPage from "@/app/museum/network/about/governance/[decisionId]/page";
import { getMuseumView } from "@/lib/museum/normalize";
import { museumSlug } from "@/lib/museum/presentation";
import type { MuseumGovernanceDecision, MuseumView } from "@/lib/museum/types";
import { render, screen } from "@testing-library/react";
import { withHostTimeZone } from "../../../utils/timeZoneHarness";

const decision: MuseumGovernanceDecision = {
  decisionId: "6529NM-GOV-0001",
  serialNo: 1,
  title: "Adopt the public record",
  decisionClass: "policy",
  observedWaveStatus: "approved",
  governanceEffect: "adopted",
  disposition: null,
  rating: null,
  ratersCount: null,
  // 01:30 UTC is still the previous day in the Americas.
  createdAt: "2026-08-09T01:30:00Z",
  sourceUrl: null,
  sourcePath: "records/governance/6529NM-GOV-0001.json",
};

const ZONES = ["America/Los_Angeles", "Pacific/Auckland", "Pacific/Kiritimati"];

describe("Museum governance dates", () => {
  beforeEach(() => {
    jest.mocked(getMuseumView).mockResolvedValue({
      governance: [decision],
    } as unknown as MuseumView);
  });

  it.each(ZONES)(
    "prints the decision list date in UTC whatever the host zone is (%s)",
    async (zone) => {
      await withHostTimeZone(zone, async () =>
        render(await MuseumAboutGovernancePage())
      );

      expect(screen.getByText("Aug 9, 2026")).toBeInTheDocument();
    }
  );

  it.each(ZONES)(
    "prints the decision detail date in UTC whatever the host zone is (%s)",
    async (zone) => {
      await withHostTimeZone(zone, async () =>
        render(
          await MuseumAboutGovernanceDetailPage({
            params: Promise.resolve({
              decisionId: museumSlug(decision.decisionId),
            }),
          })
        )
      );

      expect(screen.getByText("Aug 9, 2026")).toBeInTheDocument();
    }
  );
});
