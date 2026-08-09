import { metadata as aboutMetadata } from "@/app/museum/network/about/page";
import { metadata as governanceMetadata } from "@/app/museum/network/about/governance/page";
import { generateMetadata as governanceDetailMetadata } from "@/app/museum/network/about/governance/[decisionId]/page";
import { metadata as acquisitionProgramsMetadata } from "@/app/museum/network/acquisition-programs/page";
import { generateMetadata as acquisitionProgramDetailMetadata } from "@/app/museum/network/acquisition-programs/[slug]/page";
import { metadata as artistsMetadata } from "@/app/museum/network/artists/page";
import { generateMetadata as artistDetailMetadata } from "@/app/museum/network/artists/[slug]/page";
import { generateMetadata as collectionObjectMetadata } from "@/app/museum/network/collection/[objectId]/page";
import { metadata as collectionMetadata } from "@/app/museum/network/collection/page";
import { metadata as organizationsMetadata } from "@/app/museum/network/organizations/page";
import { generateMetadata as organizationDetailMetadata } from "@/app/museum/network/organizations/[slug]/page";
import { metadata as projectsMetadata } from "@/app/museum/network/projects/page";
import { generateMetadata as projectDetailMetadata } from "@/app/museum/network/projects/[slug]/page";
import { metadata as researchMetadata } from "@/app/museum/network/research/page";
import { metadata as institutionalPracticeMetadata } from "@/app/museum/network/research/institutional-practice/page";
import { metadata as dataArchitectureMetadata } from "@/app/museum/network/research/data-architecture/page";
import { metadata as scholarshipMetadata } from "@/app/museum/network/research/scholarship-and-writing/page";
import { metadata as sourcesMetadata } from "@/app/museum/network/research/sources-and-chronology/page";
import { metadata as rightsMetadata } from "@/app/museum/network/research/rights/page";
import { metadata as rightsArtistsMetadata } from "@/app/museum/network/research/rights/artists/page";
import { metadata as rightsCollectorsMetadata } from "@/app/museum/network/research/rights/collectors/page";
import { generateMetadata as researchDetailMetadata } from "@/app/museum/network/research/[slug]/page";
import { getMuseumObjectMetadata } from "@/components/museum/MuseumObjectPage";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { getMuseumView } from "@/lib/museum/normalize";
import type { MuseumPublication } from "@/lib/museum/publication/types";
import type { Metadata } from "next";

jest.mock("@/components/museum/MuseumObjectPage", () => ({
  getMuseumObjectMetadata: jest.fn(),
}));

jest.mock("@/lib/museum/publication/runtime", () => ({
  getMuseumPublicationState: jest.fn(),
}));

jest.mock("@/lib/museum/publication/runtimeBundle", () => ({
  getMuseumPublicationBundle: jest.fn(),
}));

jest.mock("@/lib/museum/normalize", () => ({
  getMuseumView: jest.fn(),
}));

jest.mock("@/lib/museum/generative-studies", () => ({
  getGenerativeStudyByProjectSlug: jest.fn(),
}));

jest.mock("@/lib/museum/generative-studies/minted", () => ({
  getMintedProjectIndex: jest.fn(),
}));

const mockedObjectMetadata = jest.mocked(getMuseumObjectMetadata);
const mockedPublicationState = jest.mocked(getMuseumPublicationState);
const mockedBundle = jest.mocked(getMuseumPublicationBundle);
const mockedView = jest.mocked(getMuseumView);

const publication = {
  identity: { commit: "a".repeat(40) },
  artists: [{ id: "ART-0001", slug: "casey-reas", preferredName: "Casey Reas" }],
  projects: [
    {
      id: "PRJ-0001",
      slug: "the-system-in-seven-states",
      title: "The System in Seven States",
      artistIds: [],
      organizationIds: [],
      workIds: [],
      sourcePaths: [],
    },
  ],
  organizations: [
    {
      id: "ORG-0001",
      slug: "art-blocks",
      preferredName: "Art Blocks",
      projectIds: [],
      sourcePaths: [],
    },
  ],
  acquisitionPrograms: [
    {
      id: "6529NM-AP-01",
      slug: "keys-and-gates",
      title: "Keys and Gates",
      acquisitionIds: [],
    },
  ],
  documents: [],
  works: [],
} as unknown as MuseumPublication;

function installPublication(): void {
  mockedPublicationState.mockResolvedValue({
    status: "current",
    publication,
    errorCode: null,
    failedAt: null,
    lastValidAcceptedAt: null,
  });
  mockedBundle.mockResolvedValue({
    publicationState: {
      status: "current",
      publication,
      errorCode: null,
      failedAt: null,
      lastValidAcceptedAt: null,
    },
    view: { programs: [] } as never,
  });
  mockedView.mockResolvedValue({
    governance: [
      {
        decisionId: "DEC-0001",
        title: "A Museum decision",
        governanceEffect: "Adopted",
        decisionClass: "policy",
        observedWaveStatus: "WINNER",
        createdAt: null,
        disposition: null,
        rating: null,
        ratersCount: null,
      },
    ],
  } as never);
}

function canonical(metadata: Metadata): string | undefined {
  const value = metadata.alternates?.canonical;
  return value === null || value === undefined ? undefined : value.toString();
}

describe("Network Museum canonical metadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installPublication();
    mockedObjectMetadata.mockResolvedValue({
      title: "Legacy object",
      description: "Legacy object metadata",
    });
  });

  it.each([
    [aboutMetadata, "/museum/network/about"],
    [collectionMetadata, "/museum/network/collection"],
    [artistsMetadata, "/museum/network/artists"],
    [projectsMetadata, "/museum/network/projects"],
    [organizationsMetadata, "/museum/network/organizations"],
    [acquisitionProgramsMetadata, "/museum/network/acquisition-programs"],
    [researchMetadata, "/museum/network/research"],
    [governanceMetadata, "/museum/network/about/governance"],
    [institutionalPracticeMetadata, "/museum/network/research/institutional-practice"],
    [dataArchitectureMetadata, "/museum/network/research/data-architecture"],
    [scholarshipMetadata, "/museum/network/research/scholarship-and-writing"],
    [sourcesMetadata, "/museum/network/research/sources-and-chronology"],
    [rightsMetadata, "/museum/network/research/rights"],
    [rightsArtistsMetadata, "/museum/network/research/rights/artists"],
    [rightsCollectorsMetadata, "/museum/network/research/rights/collectors"],
  ])("declares the canonical URL for %s", (metadata, href) => {
    expect(canonical(metadata)).toBe(href);
  });

  it("declares canonical URLs only for resolved record-driven routes", async () => {
    await expect(
      canonical(
        await artistDetailMetadata({
          params: Promise.resolve({ slug: "casey-reas" }),
        })
      )
    ).toBe("/museum/network/artists/casey-reas");
    await expect(
      canonical(
        await projectDetailMetadata({
          params: Promise.resolve({ slug: "the-system-in-seven-states" }),
        })
      )
    ).toBe("/museum/network/projects/the-system-in-seven-states");
    await expect(
      canonical(
        await organizationDetailMetadata({
          params: Promise.resolve({ slug: "art-blocks" }),
        })
      )
    ).toBe("/museum/network/organizations/art-blocks");
    await expect(
      canonical(
        await acquisitionProgramDetailMetadata({
          params: Promise.resolve({ slug: "keys-and-gates" }),
        })
      )
    ).toBe("/museum/network/acquisition-programs/keys-and-gates");
    await expect(
      canonical(
        await researchDetailMetadata({
          params: Promise.resolve({ slug: "missing-record" }),
        })
      )
    ).toBeUndefined();
    await expect(
      canonical(
        await artistDetailMetadata({
          params: Promise.resolve({ slug: "missing-artist" }),
        })
      )
    ).toBeUndefined();
  });

  it("does not project Keys and Gates metadata onto an unknown program route", async () => {
    mockedBundle.mockResolvedValue({
      publicationState: {
        status: "current",
        publication,
        errorCode: null,
        failedAt: null,
        lastValidAcceptedAt: null,
      },
      view: {
        approvedCollections: [],
        programs: [
          {
            programId: "6529NM-AP-01",
            title: "Keys and Gates",
          },
        ],
      } as never,
    });

    const metadata = await acquisitionProgramDetailMetadata({
      params: Promise.resolve({ slug: "unknown-program" }),
    });

    expect(canonical(metadata)).toBeUndefined();
    expect(JSON.stringify(metadata.title)).not.toContain("Keys and Gates");
  });

  it("keeps legacy Collection object metadata redirect-owned", async () => {
    expect(
      canonical(
        await collectionObjectMetadata({
          params: Promise.resolve({ objectId: "6529NM.2026.001.01" }),
        })
      )
    ).toBeUndefined();
  });

  it("canonicalizes a resolved governance slug", async () => {
    expect(
      canonical(
        await governanceDetailMetadata({
          params: Promise.resolve({ decisionId: "DEC-0001" }),
        })
      )
    ).toBe("/museum/network/about/governance/DEC-0001");
  });
});
