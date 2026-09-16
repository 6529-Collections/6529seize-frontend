import { getMuseumObjectMetadata } from "@/components/museum/MuseumObjectPage";
import { getMuseumView } from "@/lib/museum/normalize";

jest.mock("@/lib/museum/normalize", () => ({
  getMuseumView: jest.fn(),
}));

const getMuseumViewMock = jest.mocked(getMuseumView);

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
  beforeEach(() => {
    getMuseumViewMock.mockReset();
  });

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

  it("resolves a source record through its canonical Work ID", async () => {
    const sourceRecordId = "external-source-record";
    const metadata = await getMuseumObjectMetadata(sourceRecordId, {
      status: "current",
      publication: {
        ...publication,
        entityGraph: {
          ...publication.entityGraph,
          entities: publication.entityGraph.entities.map((entity) =>
            entity.id === "6529NM-W-0001"
              ? { ...entity, sourceRecordIds: [sourceRecordId] }
              : entity
          ),
        },
      },
      errorCode: null,
      failedAt: null,
      lastValidAcceptedAt: null,
    } as never);

    expect(metadata.alternates?.canonical?.toString()).toContain(
      "/museum/network/works/6529NM-W-0001"
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("does not reopen the legacy view for an unmatched typed-graph record", async () => {
    const metadata = await getMuseumObjectMetadata("missing-record", {
      status: "current",
      publication,
      errorCode: null,
      failedAt: null,
      lastValidAcceptedAt: null,
    } as never);

    expect(getMuseumViewMock).not.toHaveBeenCalled();
    expect(metadata.alternates?.canonical).toBeUndefined();
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it.each([
    ["6529NM-W-0002", "6529NM.2026.001.02", "CENTURY #724"],
    ["6529NM-W-0003", "6529NM.2026.001.03", "CENTURY #401"],
    ["6529NM-W-0007", "6529NM.2026.001.07", "Ex Nihilo (Cosmos) #248"],
    ["6529NM-W-0008", "selected-work-eight", "Take the Key!"],
    ["6529NM-W-0014", "selected-work-fourteen", "the cost of open"],
  ])(
    "keeps %s metadata on its Work when an acquisition is listed first",
    async (workId, sourceRecordId, title) => {
      const canonicalRoute = `/museum/network/works/${workId}`;
      const workEntity = {
        ...publication.entityGraph.entities[0],
        id: workId,
        label: title,
        canonicalRoute,
        sourceRecordIds: [sourceRecordId],
      };
      const acquisition = {
        ...workEntity,
        id: "related-acquisition",
        entityType: "CURATED_ACQUISITION",
        canonicalRoute:
          "/museum/network/acquisitions/the-system-in-seven-states",
        sourceRecordIds: [workId, sourceRecordId, "6529NM.2026.001.01"],
      };
      for (const requestedId of [workId, sourceRecordId]) {
        const metadata = await getMuseumObjectMetadata(requestedId, {
          status: "current",
          publication: {
            ...publication,
            works: [...publication.works, { id: workId, title }],
            entityGraph: {
              ...publication.entityGraph,
              entities: [
                acquisition,
                workEntity,
                ...publication.entityGraph.entities,
              ],
              relations: [
                {
                  ...publication.entityGraph.relations[0],
                  targetEntityId: workId,
                },
              ],
            },
          },
          errorCode: null,
          failedAt: null,
          lastValidAcceptedAt: null,
        } as never);

        expect(metadata.alternates?.canonical?.toString()).toContain(
          canonicalRoute
        );
        expect(metadata.openGraph?.url?.toString()).toContain(canonicalRoute);
        expect(metadata.title).toBe(
          `${title} by Casey Reas — 6529 Network Museum`
        );
        expect(metadata.robots).toEqual({ index: true, follow: true });
      }
    }
  );

  it.each(["published", "archived"])(
    "prefers an exact %s Work over another Work's source-record reference",
    async (entityStatus) => {
      const metadata = await getMuseumObjectMetadata("6529NM-W-0001", {
        status: "current",
        publication: {
          ...publication,
          entityGraph: {
            ...publication.entityGraph,
            entities: [
              {
                ...publication.entityGraph.entities[0],
                id: "another-work",
                canonicalRoute: "/museum/network/works/another-work",
                sourceRecordIds: ["6529NM-W-0001"],
              },
              { ...publication.entityGraph.entities[0], entityStatus },
            ],
          },
        },
        errorCode: null,
        failedAt: null,
        lastValidAcceptedAt: null,
      } as never);

      if (entityStatus === "published") {
        expect(metadata.alternates?.canonical?.toString()).toContain(
          "/museum/network/works/6529NM-W-0001"
        );
        expect(metadata.robots).toEqual({ index: true, follow: true });
      } else {
        expect(metadata.alternates?.canonical).toBeUndefined();
        expect(metadata.robots).toEqual({ index: false, follow: true });
      }
    }
  );
});
