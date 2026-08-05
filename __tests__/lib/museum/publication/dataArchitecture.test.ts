import {
  buildMuseumPageSourceCatalog,
  GitHubMuseumPublicationSource,
  legacyCaseyPublicationAssembler,
} from "@/lib/museum/publication";
import { createCaseyFixture } from "./fixture";

const PROFILE_PATH = "docs/data-architecture/profile.json";
const SCHEDULE_PATH = "docs/data-architecture/casey-reas-machine-schedule.json";

describe("Museum data architecture publication", () => {
  it("assembles the exact eleven-standard profile and seven-object schedule", async () => {
    const state = await new GitHubMuseumPublicationSource({
      ref: "main",
      assembler: legacyCaseyPublicationAssembler,
      fetch: createCaseyFixture().fetch,
    }).load();

    expect(state.status).toBe("current");
    if (state.status !== "current") return;
    expect(state.publication.dataArchitecture).toMatchObject({
      id: "6529NM_DATA_ARCHITECTURE_V1",
      version: "1.0.0",
      status: "working_standard",
    });
    expect(
      state.publication.dataArchitecture.standards.map(({ slug }) => slug)
    ).toEqual([
      "spectrum",
      "cidoc-crm",
      "lido",
      "premis",
      "prov-o",
      "getty-aat-ulan",
      "iiif",
      "c2pa",
      "bagit",
      "ocfl",
      "caip-19",
    ]);
    expect(
      state.publication.dataArchitecture.caseySchedule.objects
    ).toHaveLength(7);
    expect(
      state.publication.dataArchitecture.caseySchedule.objects.map(
        ({ objectId, title }) => [objectId, title]
      )
    ).toEqual(state.publication.artworks.map(({ id, title }) => [id, title]));
    const catalog = buildMuseumPageSourceCatalog(state.publication);
    expect(catalog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          pathname: "/museum/network/methodology/data-architecture",
          source: expect.objectContaining({
            primaryPath: "docs/data-architecture.md",
          }),
        }),
        expect.objectContaining({
          pathname: "/museum/network/methodology/data-architecture/premis",
          source: expect.objectContaining({
            primaryPath: "docs/data-architecture/premis.md",
          }),
        }),
        expect.objectContaining({
          pathname:
            "/museum/network/methodology/data-architecture/casey-reas-implementation",
          source: expect.objectContaining({
            primaryPath: "docs/data-architecture/casey-reas-implementation.md",
            relatedSources: expect.arrayContaining([
              expect.objectContaining({
                path: "docs/data-architecture/casey-reas-machine-schedule.json",
                label: "machineSchedule",
              }),
            ]),
          }),
        }),
      ])
    );
  });

  it("fails the complete publication closed when a profile document is absent", async () => {
    const state = await new GitHubMuseumPublicationSource({
      ref: "main",
      assembler: legacyCaseyPublicationAssembler,
      fetch: createCaseyFixture({
        omittedManifestPath: "docs/data-architecture/premis.md",
      }).fetch,
    }).load();

    expect(state).toMatchObject({
      status: "unavailable",
      publication: null,
      errorCode: "publication_required_path_undeclared",
    });
  });

  it("rejects reordered or renamed standards", async () => {
    const fixture = createCaseyFixture();
    const profile = JSON.parse(fixture.documents[PROFILE_PATH] ?? "null") as {
      standards: Array<{ slug: string }>;
    };
    profile.standards[0]!.slug = "lido";
    const state = await new GitHubMuseumPublicationSource({
      ref: "main",
      assembler: legacyCaseyPublicationAssembler,
      fetch: createCaseyFixture({
        documentOverrides: { [PROFILE_PATH]: JSON.stringify(profile) },
      }).fetch,
    }).load();

    expect(state).toMatchObject({
      status: "unavailable",
      errorCode: "publication_data_architecture_invalid",
    });
  });

  it("rejects a Casey schedule that drifts from the accessioned works", async () => {
    const fixture = createCaseyFixture();
    const schedule = JSON.parse(fixture.documents[SCHEDULE_PATH] ?? "null") as {
      objects: Array<{ title: string }>;
    };
    schedule.objects[0]!.title = "Wrong title";
    const state = await new GitHubMuseumPublicationSource({
      ref: "main",
      assembler: legacyCaseyPublicationAssembler,
      fetch: createCaseyFixture({
        documentOverrides: { [SCHEDULE_PATH]: JSON.stringify(schedule) },
      }).fetch,
    }).load();

    expect(state).toMatchObject({
      status: "unavailable",
      errorCode: "publication_data_architecture_casey_mismatch",
    });
  });
});
