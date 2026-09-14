import { getMuseumObjectMetadata } from "@/components/museum/MuseumObjectPage";

const publication = {
  works: [
    {
      id: "6529NM-W-0001",
      title: "CENTURY #31",
    },
  ],
  entityGraph: {
    entities: [
      {
        id: "6529NM-W-0001",
        entityType: "WORK",
        entityStatus: "published",
        pageExposure: "canonical_page",
        canonicalRoute: "/museum/network/works/6529NM-W-0001",
        sourceRecordIds: ["6529NM.2026.001.01"],
        label: "CENTURY #31",
      },
      {
        id: "6529NM-AGT-0001",
        entityType: "ARTIST_OR_CREATOR",
        entityStatus: "published",
        pageExposure: "canonical_page",
        canonicalRoute: "/museum/network/artists/casey-reas",
        sourceRecordIds: [],
        label: "Casey Reas",
      },
    ],
    relations: [
      {
        relationType: "ARTIST_CREATES_WORK",
        sourceEntityId: "6529NM-AGT-0001",
        targetEntityId: "6529NM-W-0001",
      },
    ],
  },
};

describe("Museum object metadata", () => {
  it.each(["current", "stale"] as const)(
    "uses the accepted %s publication for canonical metadata",
    async (status) => {
      const metadata = await getMuseumObjectMetadata("6529NM.2026.001.01", {
        status,
        publication,
        errorCode:
          status === "current" ? null : "source_temporarily_unavailable",
        failedAt: status === "current" ? null : "2026-09-14T00:00:00.000Z",
        lastValidAcceptedAt:
          status === "current" ? null : "2026-09-13T23:00:00.000Z",
      } as never);

      expect(metadata.alternates?.canonical?.toString()).toContain(
        "/museum/network/works/6529NM-W-0001"
      );
      expect(metadata.robots).toEqual({ index: true, follow: true });
      expect(metadata.title).toContain("CENTURY #31");
      expect(metadata.title).toContain("Casey Reas");
      expect(metadata.title).toContain("6529 Network Museum");
    }
  );

  it("noindexes an unavailable publication without inventing a canonical", async () => {
    const metadata = await getMuseumObjectMetadata("6529NM-W-0001", {
      status: "unavailable",
      publication: null,
      errorCode: "source_unavailable",
      failedAt: "2026-09-14T00:00:00.000Z",
      lastValidAcceptedAt: null,
    });

    expect(metadata.alternates?.canonical).toBeUndefined();
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
