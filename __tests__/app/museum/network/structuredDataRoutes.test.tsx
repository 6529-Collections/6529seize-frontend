import { render, screen } from "@testing-library/react";
import MuseumArtistPage from "@/app/museum/network/artists/[slug]/page";
import MuseumWorkRoute from "@/app/museum/network/works/[workId]/page";
import {
  GitHubMuseumPublicationSource,
  legacyCaseyPublicationAssembler,
  type MuseumPublication,
  type MuseumPublicWork,
} from "@/lib/museum/publication";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import { createCaseyFixture } from "../../../lib/museum/publication/fixture";

jest.mock("@/lib/museum/publication/runtimeBundle", () => ({
  getMuseumPublicationBundle: jest.fn(),
}));

jest.mock("@/components/museum/MuseumObjectPage", () => ({
  MuseumObjectPage: ({ objectId }: { readonly objectId: string }) => (
    <div data-testid="museum-object">{objectId}</div>
  ),
}));

jest.mock("@/components/museum/MuseumArtworkFigure", () => ({
  MuseumArtworkFigure: () => <div data-testid="legacy-artwork" />,
}));

const mockedBundle = jest.mocked(getMuseumPublicationBundle);

function installPublication(publication: MuseumPublication | null): void {
  mockedBundle.mockResolvedValue({
    publicationState:
      publication === null
        ? {
            status: "unavailable",
            publication: null,
            errorCode: "test_publication_unavailable",
            failedAt: "2026-08-09T00:00:00Z",
            lastValidAcceptedAt: null,
          }
        : {
            status: "current",
            publication,
            errorCode: null,
            failedAt: null,
            lastValidAcceptedAt: null,
          },
    view: null,
  });
}

function readGraph(container: HTMLElement): unknown[] {
  const scripts = container.querySelectorAll(
    'script[type="application/ld+json"]'
  );
  expect(scripts).toHaveLength(1);
  const data: { "@graph": unknown[] } = JSON.parse(
    scripts[0]?.textContent ?? ""
  );
  return data["@graph"];
}

describe("Museum route structured-data emission", () => {
  let legacy: MuseumPublication;
  let typed: MuseumPublication;
  let work: MuseumPublicWork;

  beforeAll(async () => {
    const state = await new GitHubMuseumPublicationSource({
      ref: "main",
      assembler: legacyCaseyPublicationAssembler,
      fetch: createCaseyFixture().fetch,
    }).load();
    if (state.status !== "current") throw new Error("test_publication_missing");
    legacy = state.publication;
    const artist = legacy.artists[0];
    if (artist === undefined) throw new Error("test_artist_missing");
    work = {
      kind: "work",
      id: "6529NM-W-0001",
      slug: "century-31",
      title: "CENTURY #31",
      medium: "Generative artwork",
      artistId: artist.id,
      projectId: null,
      status: "accessioned_into_permanent_collection",
      statusAsOf: "2026-08-09",
      acquisitionIds: ["6529NM-CA-2026-001"],
      programIds: [],
      media: [],
      documentIds: [],
      qualifiers: [],
      sourcePaths: ["records/entities/6529NM-W-0001.json"],
    };
    typed = {
      ...legacy,
      artists: [{ ...artist, workIds: [work.id], documentIds: [] }],
      works: [work],
      projects: [],
      documents: [],
      workAliases: [
        {
          kind: "work_source_alias",
          sourceObjectId: "6529NM.2026.001.01",
          workId: work.id,
          sourcePath: "records/aliases.json",
        },
      ],
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    installPublication(typed);
  });

  it("renders canonical work JSON-LD alongside the work page", async () => {
    const { container } = render(
      await MuseumWorkRoute({
        params: Promise.resolve({ workId: work.id }),
      })
    );
    expect(readGraph(container)).toContainEqual(
      expect.objectContaining({
        "@type": "VisualArtwork",
        name: work.title,
        url: expect.stringContaining(`/museum/network/works/${work.id}`),
      })
    );
    expect(screen.getByTestId("museum-object")).toHaveTextContent(work.id);
  });

  it("terminates unknown works with notFound before rendering", async () => {
    await expect(
      MuseumWorkRoute({
        params: Promise.resolve({ workId: "6529NM-W-9999" }),
      })
    ).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });

  it("redirects aliases before rendering a competing JSON-LD URL", async () => {
    await expect(
      MuseumWorkRoute({
        params: Promise.resolve({ workId: "6529NM.2026.001.01" }),
      })
    ).rejects.toMatchObject({
      digest: expect.stringContaining(`/museum/network/works/${work.id};308;`),
    });
  });

  it("renders the typed artist record JSON-LD", async () => {
    const { container } = render(
      await MuseumArtistPage({
        params: Promise.resolve({ slug: "casey-reas" }),
      })
    );
    expect(readGraph(container)).toContainEqual(
      expect.objectContaining({
        "@type": "Thing",
        name: "Casey REAS",
        url: expect.stringContaining("/museum/network/artists/casey-reas"),
      })
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Casey REAS"
    );
  });

  it("preserves the legacy Casey fallback without typed JSON-LD", async () => {
    installPublication(legacy);
    const { container } = render(
      await MuseumArtistPage({
        params: Promise.resolve({ slug: "casey-reas" }),
      })
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Casey REAS"
    );
    expect(screen.getAllByTestId("legacy-artwork")).toHaveLength(7);
    expect(
      container.querySelector('script[type="application/ld+json"]')
    ).toBeNull();
  });

  it("terminates unknown artists before rendering", async () => {
    await expect(
      MuseumArtistPage({
        params: Promise.resolve({ slug: "unknown-artist" }),
      })
    ).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });

  it("omits structured data when the publication is unavailable", async () => {
    installPublication(null);
    const { container } = render(
      <>
        {await MuseumWorkRoute({
          params: Promise.resolve({ workId: work.id }),
        })}
        {await MuseumArtistPage({
          params: Promise.resolve({ slug: "casey-reas" }),
        })}
      </>
    );
    expect(
      container.querySelector('script[type="application/ld+json"]')
    ).toBeNull();
    expect(screen.queryByTestId("museum-object")).not.toBeInTheDocument();
  });
});
