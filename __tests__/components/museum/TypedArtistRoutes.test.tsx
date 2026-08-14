import { render, screen } from "@testing-library/react";
import type {
  MuseumProject,
  MuseumPublicWork,
} from "@/lib/museum/publication/types";
import { MuseumArtistRecordSummary } from "@/app/museum/network/artists/[slug]/MuseumArtistRecordSummary";
import { TypedArtistProjects } from "@/app/museum/network/artists/[slug]/TypedArtistProjects";
import { TypedArtistWorks } from "@/app/museum/network/artists/[slug]/TypedArtistWorks";

jest.mock("@/app/museum/network/artists/[slug]/TypedArtistWorkCard", () => ({
  TypedArtistWorkCard: () => <div data-testid="typed-artist-work-card" />,
}));

function buildProject(workCount: number): MuseumProject {
  return {
    id: `project-${workCount}`,
    slug: `project-${workCount}`,
    title: `Project ${workCount}`,
    artistId: "artist-1",
    platform: "Test platform",
    releaseYear: 2026,
    artworkIds: Array.from(
      { length: workCount },
      (_, index) => `work-${index}`
    ),
    documentIds: [],
    sourcePaths: [],
  };
}

const WORK = {
  kind: "work",
  id: "work-1",
  slug: "work-1",
  title: "Work 1",
  medium: "Digital work",
  artistId: "artist-1",
  projectId: null,
  status: "proposed_in_museum_wave",
  statusAsOf: "2026-08-12",
  acquisitionIds: [],
  programIds: [],
  media: [],
  documentIds: [],
  qualifiers: [],
  sourcePaths: [],
} satisfies MuseumPublicWork;

describe("typed artist route components", () => {
  it("labels artist relationships, acquisition, and profile links separately", () => {
    render(
      <MuseumArtistRecordSummary
        relationshipSummary="Permanent Collection"
        workCount={7}
        acquisition={{
          label: "The System in Seven States",
          href: "/museum/network/acquisitions/the-system-in-seven-states",
        }}
        profileHref="#artist-profile-title"
        sourceHref="https://github.com/6529-Collections/6529networkmuseum/blob/main/artist.json"
      />
    );

    expect(
      screen.getByRole("region", { name: "Artist record" })
    ).toBeInTheDocument();
    expect(screen.getByText("Collection relationship")).toBeInTheDocument();
    expect(screen.getByText("7 works")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "The System in Seven States" })
    ).toHaveAttribute(
      "href",
      "/museum/network/acquisitions/the-system-in-seven-states"
    );
    expect(
      screen.getByRole("link", { name: "Read the artist profile" })
    ).toHaveAttribute("href", "#artist-profile-title");
    expect(screen.getByText("Source record")).toBeInTheDocument();
    expect(screen.queryByText("6529NM.2026.001")).not.toBeInTheDocument();
  });

  it("localizes project work counts and exposes a visible focus ring", () => {
    const { rerender } = render(
      <TypedArtistProjects projects={[buildProject(1), buildProject(2)]} />
    );

    expect(screen.getByText("1 work")).toBeInTheDocument();
    expect(screen.getByText("2 works")).toBeInTheDocument();
    expect(screen.getAllByRole("link")[0]).toHaveClass(
      "focus-visible:tw-ring-2",
      "focus-visible:tw-ring-primary-400"
    );

    rerender(<TypedArtistProjects projects={[buildProject(1)]} />);
    expect(screen.queryByText("1 works")).not.toBeInTheDocument();
  });

  it("uses an inclusive artist heading and omits an empty works section", () => {
    const { rerender } = render(
      <TypedArtistWorks
        relationshipLabel={() => "Selected"}
        view={null}
        works={[WORK]}
      />
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Works by this artist" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("typed-artist-work-card")).toBeInTheDocument();

    rerender(
      <TypedArtistWorks
        relationshipLabel={() => "Selected"}
        view={null}
        works={[]}
      />
    );
    expect(
      screen.queryByRole("heading", { name: "Works by this artist" })
    ).toBeNull();
  });
});
