import MuseumAcquisitionProgramPage from "@/app/museum/network/acquisition-programs/[slug]/page";
import { buildMuseumEntityContext } from "@/lib/museum/publication/ia";
import {
  displayMuseumPublicAcquisitionProgramStatus,
  museumPublicAcquisitionProgramStatusAsOf,
} from "@/lib/museum/publication/programStatus";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import type { MuseumPublication } from "@/lib/museum/publication/types";

jest.mock("@/lib/museum/publication/ia", () => ({
  buildMuseumEntityContext: jest.fn(),
}));

jest.mock("@/lib/museum/publication/runtimeBundle", () => ({
  getMuseumPublicationBundle: jest.fn(),
}));

const mockedBuildMuseumEntityContext = jest.mocked(buildMuseumEntityContext);
const mockedGetMuseumPublicationBundle = jest.mocked(
  getMuseumPublicationBundle
);

describe("Museum acquisition program status projection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBuildMuseumEntityContext.mockImplementation(
      (input) => input as never
    );
  });

  it("maps Keys and Gates selection_complete to finished Museum copy", () => {
    expect(
      displayMuseumPublicAcquisitionProgramStatus("selection_complete")
    ).toBe("Selection complete");
  });

  it("fails closed for an unsupported typed status", () => {
    expect(() =>
      displayMuseumPublicAcquisitionProgramStatus("selected_unminted" as never)
    ).toThrow("museum_acquisition_program_status:selected_unminted");
  });

  it("uses the typed program status and date when the first Work differs", async () => {
    const publication = {
      identity: { commit: "a".repeat(40) },
      acquisitionPrograms: [
        {
          kind: "acquisition_program",
          id: "6529NM-AP-ENT-0002",
          slug: "keys-and-gates",
          title: "Keys and Gates",
          status: "selection_complete",
          statusAsOf: "2026-08-08T12:00:00Z",
          acquisitionMethod: "other_authorized_method",
          acquisitionIds: [],
          sourceDocumentIds: [],
          sourcePaths: ["records/entities/6529NM-AP-ENT-0002.json"],
        },
      ],
      works: [
        {
          id: "6529NM-W-0020",
          title: "A divergent first Work",
          status: "selected_through_acquisition_program_acquisition_pending",
          statusAsOf: "2026-01-01T00:00:00Z",
          programIds: ["6529NM-AP-ENT-0002"],
          acquisitionIds: [],
          sourcePaths: ["records/entities/6529NM-W-0020.json"],
          media: [],
        },
      ],
      documents: [],
      artworks: [],
    } as unknown as MuseumPublication;

    mockedGetMuseumPublicationBundle.mockResolvedValue({
      publicationState: {
        status: "current",
        publication,
        errorCode: null,
        failedAt: null,
        lastValidAcceptedAt: null,
      },
      view: { approvedCollections: [], objects: [], programs: [] } as never,
    });

    await MuseumAcquisitionProgramPage({
      params: Promise.resolve({ slug: "keys-and-gates" }),
    });

    const context = mockedBuildMuseumEntityContext.mock.calls[0]?.[0];
    expect(context).toEqual(
      expect.objectContaining({
        status: "Selection complete",
        statusAsOf: "2026-08-08T12:00:00Z",
      })
    );
    expect(context?.status).not.toContain("Acquisition pending");
    expect(context?.statusAsOf).not.toBe("2026-01-01T00:00:00Z");
    expect(
      museumPublicAcquisitionProgramStatusAsOf(
        publication.acquisitionPrograms?.[0]
      )
    ).toBe("2026-08-08T12:00:00Z");
  });
});
