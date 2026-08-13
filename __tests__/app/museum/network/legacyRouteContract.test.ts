import { notFound, permanentRedirect } from "next/navigation";
import MuseumObjectLegacyRoute from "@/app/museum/network/objects/[objectId]/page";
import MuseumCollectionObjectRoute from "@/app/museum/network/collection/[objectId]/page";
import MuseumGiftRoute from "@/app/museum/network/gifts/[accessionId]/page";
import MuseumAccessionLegacyRoute from "@/app/museum/network/accessions/[accessionId]/page";
import MuseumAccessionsPage from "@/app/museum/network/accessions/page";
import MuseumProgramDetailPage from "@/app/museum/network/programs/[programId]/page";
import MuseumRightsLegacyPage from "@/app/museum/network/rights/page";
import MuseumRightsForArtistsLegacyPage from "@/app/museum/network/rights/artists/page";
import MuseumRightsForCollectorsLegacyPage from "@/app/museum/network/rights/collectors/page";
import MuseumStoriesPage from "@/app/museum/network/stories/page";
import MuseumSourceAndChronologyLegacyPage from "@/app/museum/network/stories/source-and-chronology/page";
import MuseumScholarshipAndWritingLegacyPage from "@/app/museum/network/stories/scholarship-and-writing/page";
import MuseumMethodologyPage from "@/app/museum/network/methodology/page";
import MuseumDataArchitectureLegacyPage from "@/app/museum/network/methodology/data-architecture/page";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import type { MuseumPublication } from "@/lib/museum/publication/types";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("not_found");
  }),
  permanentRedirect: jest.fn(() => {
    throw new Error("permanent_redirect");
  }),
}));

jest.mock("@/lib/museum/publication/runtimeBundle", () => ({
  getMuseumPublicationBundle: jest.fn(),
}));

const mockedNotFound = jest.mocked(notFound);
const mockedPermanentRedirect = jest.mocked(permanentRedirect);
const mockedBundle = jest.mocked(getMuseumPublicationBundle);

const CASEY_WORK_ID = "6529NM-W-0001";
const KEYS_AND_GATES_WORK_ID = "6529NM-W-0008";
const MAGNUM_WORK_ID = "6529NM-W-0024";
const CASEY_ACQUISITION_ID = "6529NM-CA-2026-001";
const KEYS_AND_GATES_PROGRAM_ID = "6529NM-AP-ENT-0002";

function publicationFixture(): MuseumPublication {
  return {
    identity: { commit: "a".repeat(40) },
    works: [
      { id: CASEY_WORK_ID, collectionMembership: true },
      { id: KEYS_AND_GATES_WORK_ID, collectionMembership: false },
      { id: MAGNUM_WORK_ID, collectionMembership: false },
    ],
    workAliases: [
      {
        kind: "work_source_alias",
        sourceObjectId: "6529NM.2026.001.01",
        workId: CASEY_WORK_ID,
        sourcePath: "records/aliases.json",
      },
      {
        kind: "work_source_alias",
        sourceObjectId: "6529NM-AP-01-OUT-001",
        workId: KEYS_AND_GATES_WORK_ID,
        sourcePath: "records/aliases.json",
      },
      {
        kind: "work_source_alias",
        sourceObjectId: "6529NM-PG-2026-001.OBJ-001",
        workId: MAGNUM_WORK_ID,
        sourcePath: "records/aliases.json",
      },
    ],
    routeAliases: [
      {
        legacyRoute: "/museum/network/gifts/legacy-gift",
        canonicalRoute:
          "/museum/network/acquisitions/the-system-in-seven-states",
        canonicalEntityId: CASEY_ACQUISITION_ID,
        sourcePath: "records/aliases.json",
      },
      {
        legacyRoute: "/museum/network/accessions/legacy-accession",
        canonicalRoute:
          "/museum/network/acquisitions/the-system-in-seven-states",
        canonicalEntityId: CASEY_ACQUISITION_ID,
        sourcePath: "records/aliases.json",
      },
    ],
    curatedAcquisitions: [
      {
        id: CASEY_ACQUISITION_ID,
        slug: "the-system-in-seven-states",
        sourceAliases: ["6529NM.2026.001"],
      },
    ],
    acquisitionAliases: [
      {
        kind: "acquisition_source_alias",
        alias: "6529NM.2026.001",
        acquisitionId: CASEY_ACQUISITION_ID,
        sourcePath: "records/aliases.json",
      },
    ],
    acquisitionPrograms: [
      {
        id: KEYS_AND_GATES_PROGRAM_ID,
        slug: "keys-and-gates",
        sourceAliases: ["6529NM-AP-01"],
      },
    ],
    artworks: [],
    artists: [],
    projects: [],
    documents: [],
    gifts: [],
    accessions: [],
    programs: [],
    declaredSourcePaths: [],
  } as unknown as MuseumPublication;
}

function installBundle(): void {
  mockedBundle.mockResolvedValue({
    publicationState: {
      status: "current",
      publication: publicationFixture(),
      errorCode: null,
      failedAt: null,
      lastValidAcceptedAt: null,
    },
    view: { programs: [] } as never,
  });
}

async function expectRedirect(
  route: () => unknown,
  destination: string
): Promise<void> {
  await expect(Promise.resolve().then(route)).rejects.toThrow(
    "permanent_redirect"
  );
  expect(mockedPermanentRedirect).toHaveBeenCalledWith(destination);
}

async function expectNotFound(route: () => unknown): Promise<void> {
  await expect(Promise.resolve().then(route)).rejects.toThrow("not_found");
  expect(mockedNotFound).toHaveBeenCalled();
  expect(mockedPermanentRedirect).not.toHaveBeenCalled();
}

describe("Museum legacy route contract", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installBundle();
  });

  it("redirects the legacy accessions index to Collection accession records", async () => {
    await expectRedirect(
      () => MuseumAccessionsPage(),
      "/museum/network/collection#collection-acquisitions-title"
    );
  });

  describe("Work aliases", () => {
    it.each([
      ["Casey accession object", "6529NM.2026.001.01", CASEY_WORK_ID],
      [
        "Keys and Gates outcome object",
        "6529NM-AP-01-OUT-001",
        KEYS_AND_GATES_WORK_ID,
      ],
      ["Magnum proposal object", "6529NM-PG-2026-001.OBJ-001", MAGNUM_WORK_ID],
    ])(
      "redirects the %s through its canonical Work ID",
      async (_, alias, workId) => {
        await expectRedirect(
          () =>
            MuseumObjectLegacyRoute({
              params: Promise.resolve({ objectId: alias }),
            }),
          `/museum/network/works/${workId}`
        );
      }
    );

    it("404s an unknown generic object alias", async () => {
      await expectNotFound(() =>
        MuseumObjectLegacyRoute({
          params: Promise.resolve({ objectId: "unknown-object" }),
        })
      );
    });
  });

  describe("permanent Collection aliases", () => {
    it("redirects the Casey accession object to its canonical Work", async () => {
      await expectRedirect(
        () =>
          MuseumCollectionObjectRoute({
            params: Promise.resolve({ objectId: "6529NM.2026.001.01" }),
          }),
        `/museum/network/works/${CASEY_WORK_ID}`
      );
    });

    it.each([
      "6529NM-AP-01-OUT-001",
      "6529NM-PG-2026-001.OBJ-001",
      "unknown-object",
    ])("404s a non-Collection or unknown alias: %s", async (objectId) => {
      await expectNotFound(() =>
        MuseumCollectionObjectRoute({
          params: Promise.resolve({ objectId }),
        })
      );
    });
  });

  describe("acquisition aliases", () => {
    it.each([
      ["gift", MuseumGiftRoute, "legacy-gift"],
      ["accession", MuseumAccessionLegacyRoute, "legacy-accession"],
    ])(
      "redirects the known legacy %s alias to the curated acquisition",
      async (_, route, alias) => {
        await expectRedirect(
          () => route({ params: Promise.resolve({ accessionId: alias }) }),
          "/museum/network/acquisitions/the-system-in-seven-states"
        );
      }
    );

    it.each([
      ["gift", MuseumGiftRoute],
      ["accession", MuseumAccessionLegacyRoute],
    ])("404s an unknown %s alias", async (_, route) => {
      await expectNotFound(() =>
        route({
          params: Promise.resolve({ accessionId: "unknown-acquisition" }),
        })
      );
    });

    it.each([
      ["gift", MuseumGiftRoute],
      ["accession", MuseumAccessionLegacyRoute],
    ])("404s a program ID in the %s namespace", async (_, route) => {
      await expectNotFound(() =>
        route({ params: Promise.resolve({ accessionId: "6529NM-AP-01" }) })
      );
    });
  });

  describe("Acquisition Program aliases", () => {
    it.each(["6529NM-AP-01", "keys-and-gates"])(
      "redirects the known program alias %s to the program route",
      async (programId) => {
        await expectRedirect(
          () =>
            MuseumProgramDetailPage({
              params: Promise.resolve({ programId }),
            }),
          "/museum/network/acquisition-programs/keys-and-gates"
        );
      }
    );

    it.each([CASEY_ACQUISITION_ID, "legacy-gift", "unknown-program"])(
      "404s a non-program or unknown alias: %s",
      async (programId) => {
        await expectNotFound(() =>
          MuseumProgramDetailPage({
            params: Promise.resolve({ programId }),
          })
        );
      }
    );
  });

  it.each([
    ["rights", MuseumRightsLegacyPage, "/museum/network/research/rights"],
    [
      "rights artists",
      MuseumRightsForArtistsLegacyPage,
      "/museum/network/research/rights/artists",
    ],
    [
      "rights collectors",
      MuseumRightsForCollectorsLegacyPage,
      "/museum/network/research/rights/collectors",
    ],
    ["stories", MuseumStoriesPage, "/museum/network/research"],
    [
      "stories source chronology",
      MuseumSourceAndChronologyLegacyPage,
      "/museum/network/research/sources-and-chronology",
    ],
    [
      "stories scholarship",
      MuseumScholarshipAndWritingLegacyPage,
      "/museum/network/research/scholarship-and-writing",
    ],
    ["methodology", MuseumMethodologyPage, "/museum/network/research"],
    [
      "methodology data architecture",
      MuseumDataArchitectureLegacyPage,
      "/museum/network/research/data-architecture",
    ],
  ])(
    "redirects the legacy %s destination exactly",
    async (_, route, destination) => {
      await expectRedirect(() => route(), destination);
    }
  );
});
