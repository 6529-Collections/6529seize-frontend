jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { render, screen } from "@testing-library/react";
import MuseumNetworkPage from "@/app/museum/network/page";
import type {
  MuseumMedia,
  MuseumPublicWork,
} from "@/lib/museum/publication/types";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import { createCaseyFixture } from "../../../lib/museum/publication/fixture";
import {
  GitHubMuseumPublicationSource,
  legacyCaseyPublicationAssembler,
} from "@/lib/museum/publication";

jest.mock("@/lib/museum/publication/runtimeBundle", () => ({
  getMuseumPublicationBundle: jest.fn(),
}));

jest.mock("@/components/museum/MuseumPublicMediaFigure", () => ({
  MuseumPublicMediaFigure: ({ alt }: { readonly alt: string }) => (
    <img alt={alt} src="https://example.com/work.jpg" />
  ),
}));

jest.mock("@/components/museum/MuseumNetworkHomeSecondarySections", () => ({
  MuseumNetworkHomeSecondarySections: () => null,
}));

const mockedBundle = jest.mocked(getMuseumPublicationBundle);

describe("Museum homepage media", () => {
  it("uses the work title when governed media has no alt text", async () => {
    const fixture = createCaseyFixture();
    const state = await new GitHubMuseumPublicationSource({
      ref: "main",
      assembler: legacyCaseyPublicationAssembler,
      fetch: fixture.fetch,
    }).load();
    if (state.status !== "current") {
      throw new Error("test_publication_missing");
    }

    const artist = state.publication.artists[0];
    if (artist === undefined) throw new Error("test_artist_missing");
    const media: MuseumMedia = {
      id: "typed-media-1",
      artworkId: "typed-work-1",
      kind: "still",
      role: "source",
      mediaType: "image/jpeg",
      width: 1200,
      height: 900,
      altText: null,
      credit: {
        creditLine: "Museum record",
        licenseLabel: null,
        licenseUrl: null,
        rightsExpressionId: null,
        sourcePath: "records/media/typed-media-1.json",
      },
      sourcePath: "records/media/typed-media-1.json",
      custody: "retained",
      url: "https://example.com/work.jpg",
      preservationStatus: "retained_verified",
      sha256: null,
      upstreamProvider: null,
    };
    const work: MuseumPublicWork = {
      kind: "work",
      id: "6529NM-W-0001",
      slug: "6529NM-W-0001",
      title: "Untitled homepage work",
      medium: "Generative digital artwork",
      artistId: artist.id,
      projectId: null,
      status: "accessioned_into_permanent_collection",
      statusAsOf: "2026-08-13",
      collectionMembership: true,
      acquisitionIds: [],
      programIds: [],
      media: [media],
      mediaMetadata: [],
      presentationMedia: [],
      documentIds: [],
      qualifiers: [],
      sourcePaths: ["records/works/6529NM-W-0001.json"],
    };
    const publication = {
      ...state.publication,
      works: [work],
    };
    const publicationState = {
      status: "current",
      publication,
      errorCode: null,
      failedAt: null,
      lastValidAcceptedAt: null,
    } as const;
    mockedBundle.mockResolvedValue({ publicationState, view: null });

    render(await MuseumNetworkPage());

    expect(
      screen.getAllByRole("img", { name: "Untitled homepage work" })
    ).toHaveLength(2);
  });
});
