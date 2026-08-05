import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import MuseumDataArchitectureProfilePage, {
  generateMetadata,
} from "@/app/museum/network/methodology/data-architecture/[slug]/page";
import MuseumDataArchitecturePage from "@/app/museum/network/methodology/data-architecture/page";
import {
  GitHubMuseumPublicationSource,
  legacyCaseyPublicationAssembler,
  type MuseumPublication,
} from "@/lib/museum/publication";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { createCaseyFixture } from "../../../lib/museum/publication/fixture";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("not_found");
  }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    readonly children: ReactNode;
    readonly prefetch?: boolean;
  }) => (
    <a {...props} data-prefetch={String(prefetch)}>
      {children}
    </a>
  ),
}));

jest.mock("@/lib/museum/publication/runtime", () => ({
  getMuseumPublicationState: jest.fn(),
}));

const mockedPublicationState = jest.mocked(getMuseumPublicationState);
const mockedNotFound = jest.mocked(notFound);

async function buildPublication(): Promise<MuseumPublication> {
  const state = await new GitHubMuseumPublicationSource({
    ref: "main",
    assembler: legacyCaseyPublicationAssembler,
    fetch: createCaseyFixture().fetch,
  }).load();
  if (state.status !== "current") throw new Error("test_publication_missing");
  return state.publication;
}

describe("Museum data architecture routes", () => {
  let publication: MuseumPublication;

  beforeAll(async () => {
    publication = await buildPublication();
  });

  beforeEach(() => {
    mockedPublicationState.mockResolvedValue({
      status: "current",
      publication,
      errorCode: null,
      failedAt: null,
      lastValidAcceptedAt: null,
    });
  });

  afterEach(() => jest.clearAllMocks());

  it("publishes the plain-language architecture and exact machine profile together", async () => {
    render(await MuseumDataArchitecturePage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "How the Museum knows and cares for art",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("A public introduction to the Museum data architecture.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Read the machine application profile")
    ).toBeInTheDocument();
    expect(
      screen
        .getByText("Read the machine application profile")
        .closest("details")
        ?.querySelector("pre")?.textContent
    ).toBe(publication.dataArchitecture.profileJson);
    expect(
      screen.getByRole("link", { name: "Back to methods and provenance" })
    ).toHaveAttribute("data-prefetch", "false");
  });

  it("publishes an individual standards profile onsite", async () => {
    render(
      await MuseumDataArchitectureProfilePage({
        params: Promise.resolve({ slug: "premis" }),
      })
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "PREMIS: keeping a digital artwork usable",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("What does PREMIS contribute?")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "The question" })
    ).toBeInTheDocument();
  });

  it("publishes the Casey audit with the seven-object schedule", async () => {
    render(
      await MuseumDataArchitectureProfilePage({
        params: Promise.resolve({ slug: "casey-reas-implementation" }),
      })
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Casey Reas: the first implementation audit",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Read the seven-object machine schedule")
    ).toBeInTheDocument();
    expect(
      screen
        .getByText("Read the seven-object machine schedule")
        .closest("details")
        ?.querySelector("pre")?.textContent
    ).toBe(publication.dataArchitecture.caseySchedule.sourceJson);
  });

  it("uses the governed document title in metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "cidoc-crm" }),
    });
    expect(metadata.title).toBe("CIDOC CRM: a history made of events");
  });

  it("returns a 404 for an unknown standards slug", async () => {
    await expect(
      MuseumDataArchitectureProfilePage({
        params: Promise.resolve({ slug: "unknown" }),
      })
    ).rejects.toThrow("not_found");
    expect(mockedNotFound).toHaveBeenCalledTimes(1);
  });

  it("returns a 404 metadata boundary for an unknown standards slug", async () => {
    await expect(
      generateMetadata({
        params: Promise.resolve({ slug: "unknown" }),
      })
    ).rejects.toThrow("not_found");
    expect(mockedNotFound).toHaveBeenCalledTimes(1);
  });

  it("fails closed when the architecture aggregate is incomplete", async () => {
    mockedPublicationState.mockResolvedValue({
      status: "current",
      publication: {
        ...publication,
        dataArchitecture: {
          ...publication.dataArchitecture,
          standards: publication.dataArchitecture.standards.slice(0, 10),
        },
      },
      errorCode: null,
      failedAt: null,
      lastValidAcceptedAt: null,
    });
    render(await MuseumDataArchitecturePage());
    expect(
      screen.getByRole("heading", {
        name: "The Museum publication is temporarily unavailable",
      })
    ).toBeInTheDocument();
  });
});
