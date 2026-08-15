jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { render, screen } from "@testing-library/react";
import MuseumNetworkPage from "@/app/museum/network/page";
import type {
  MuseumMedia,
  MuseumExternalProposalPresentationMedia,
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

jest.mock("@/components/museum/MuseumProposalImage", () => ({
  MuseumProposalImage: ({
    alt,
    src,
    variants,
    optimizeSource,
  }: {
    readonly alt: string;
    readonly src: string;
    readonly variants?: readonly unknown[];
    readonly optimizeSource?: boolean;
  }) => (
    <img
      alt={alt}
      src={src}
      data-variant-count={String(variants?.length ?? 0)}
      data-optimize-source={String(optimizeSource ?? false)}
    />
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
    ).toHaveLength(1);
  });

  it("uses a reviewed presentation image and its responsive variants on Home", async () => {
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
    const presentation: MuseumExternalProposalPresentationMedia = {
      id: "magnum-presentation",
      kind: "external_proposal_presentation",
      mediaUrl: "https://example.com/palmyra-original.jpg",
      mediaMimeType: "image/jpeg",
      sourceByteSize: 16_900_000,
      width: 1600,
      height: 1067,
      altText: "Palmyra by Lorenzo Meloni",
      source: {
        kind: "signed_wave_storm",
        waveId: "5f207393-5418-4a75-8738-e40edb44a94d",
        dropId: "002bfa4f-8416-48bf-b35e-38f354e9a9f0",
        partId: 1,
        serial: 1,
        publicationRecordId: "proposal-magnum",
        contextEntityId: "6529NM-W-0001",
        sourcePath: "records/entities/media-reference.json",
        mediaRecordPath: "records/entities/media-reference.json",
        sourceCommit: "a".repeat(40),
      },
      credit: {
        creditLine: "© Lorenzo Meloni/Magnum Photos 2022.",
        sourcePath: "records/entities/media-reference.json",
      },
      rights: {
        status: "presentation_only",
        licenseLabel: "All Rights Reserved",
        licenseUrl: null,
      },
      download: "not_permitted",
      preservation: "not_retained",
      affordances: [
        "view",
        "thumbnail",
        "hero",
        "alt",
        "open_upstream_presentation",
      ],
      variants: [
        {
          url: "https://example.com/palmyra-small.jpg",
          width: 800,
          height: 533,
          byteSize: 240_000,
          sha256: `sha256:${"b".repeat(64)}`,
        },
      ],
    };
    const work: MuseumPublicWork = {
      kind: "work",
      id: "6529NM-W-0001",
      slug: "6529NM-W-0001",
      title: "6529NM-W-0001",
      medium: "Photography",
      artistId: artist.id,
      projectId: null,
      status: "accessioned_into_permanent_collection",
      statusAsOf: "2026-08-13",
      collectionMembership: true,
      acquisitionIds: [],
      programIds: [],
      media: [],
      mediaMetadata: [],
      presentationMedia: [presentation],
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

    const image = screen.getByRole("img", {
      name: "Palmyra by Lorenzo Meloni",
    });
    expect(image).toHaveAttribute(
      "src",
      "https://example.com/palmyra-original.jpg"
    );
    expect(image).toHaveAttribute("data-variant-count", "1");
    expect(image).toHaveAttribute("data-optimize-source", "true");
    expect(screen.getAllByText("Untitled work")).toHaveLength(1);
    expect(screen.queryByText("6529NM-W-0001")).not.toBeInTheDocument();
  });
});
