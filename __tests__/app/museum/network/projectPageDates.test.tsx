jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });
jest.mock("@/lib/museum/publication/runtimeBundle", () => ({
  getMuseumPublicationBundle: jest.fn(),
}));

import MuseumProjectPage from "@/app/museum/network/projects/[slug]/page";
import type { MuseumPublication } from "@/lib/museum/publication/types";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import { render, screen } from "@testing-library/react";
import { withHostTimeZone } from "../../../utils/timeZoneHarness";

const publication = {
  identity: { commit: "a".repeat(40) },
  artists: [
    {
      id: "ART-0001",
      slug: "casey-reas",
      preferredName: "Casey Reas",
      sourcePaths: ["records/entities/ART-0001.json"],
    },
  ],
  artworks: [],
  organizations: [],
  documents: [],
  projects: [
    {
      id: "PRJ-0001",
      slug: "the-system-in-seven-states",
      title: "The System in Seven States",
      artistId: "ART-0001",
      artistIds: ["ART-0001"],
      organizationIds: [],
      artworkIds: [],
      workIds: ["6529NM-W-0001"],
      documentIds: [],
      sourcePaths: ["records/entities/PRJ-0001.json"],
    },
  ],
  works: [
    {
      id: "6529NM-W-0001",
      title: "A Casey Reas work",
      artistId: "ART-0001",
      status: "accessioned_into_permanent_collection",
      // 01:30 UTC is still the previous day in the Americas.
      statusAsOf: "2026-08-09T01:30:00Z",
      documentIds: [],
      media: [],
      sourcePaths: ["records/entities/6529NM-W-0001.json"],
    },
  ],
} as unknown as MuseumPublication;

describe("Museum project page dates", () => {
  beforeEach(() => {
    jest.mocked(getMuseumPublicationBundle).mockResolvedValue({
      publicationState: { status: "current", publication },
      view: null,
    } as never);
  });

  it.each(["America/Los_Angeles", "Pacific/Auckland", "Pacific/Kiritimati"])(
    "prints each work's status date in UTC whatever the host zone is (%s)",
    async (zone) => {
      await withHostTimeZone(zone, async () =>
        render(
          await MuseumProjectPage({
            params: Promise.resolve({ slug: "the-system-in-seven-states" }),
          })
        )
      );

      expect(screen.getByText("As of Aug 9, 2026")).toBeInTheDocument();
    }
  );
});
