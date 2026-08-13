import { render, screen } from "@testing-library/react";
import { MuseumResearchProjectsLanding } from "@/components/museum/research/MuseumResearchProjectsLanding";
import type { MuseumMedia } from "@/lib/museum/publication/types";

const MEDIA: MuseumMedia = {
  id: "media-1",
  artworkId: "work-1",
  kind: "still",
  role: "source",
  mediaType: "image/jpeg",
  width: 1200,
  height: 900,
  altText: "A project still.",
  credit: {
    creditLine: "Museum record",
    licenseLabel: "CC BY-NC 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/",
    rightsExpressionId: "cc-by-nc-4.0",
    sourcePath: "records/media/media-1.json",
  },
  sourcePath: "records/media/media-1.json",
  custody: "retained",
  url: "https://example.com/project-still.jpg",
  preservationStatus: "retained_verified",
  sha256: `sha256:${"b".repeat(64)}`,
  upstreamProvider: null,
};

const PROJECT = {
  id: "project-1",
  href: "/museum/network/projects/project-1",
  title: "A Body of Work",
  artistNames: ["An Artist"],
  platform: "Art Blocks",
  releaseYear: 2024,
  workCount: 3,
  media: MEDIA,
};

describe("MuseumResearchProjectsLanding", () => {
  it("explains project scope before presenting the complete project index", () => {
    render(
      <MuseumResearchProjectsLanding
        eyebrow="Artist projects"
        title="Artist bodies of work and series"
        description="Projects give works context."
        distinctionTitle="Read the project alongside the Museum record"
        distinctionDescription="Projects describe artists' bodies of work; the Collection and Acquisitions pages describe Museum holdings and decisions."
        featuredDescription="A project brings an artist's works into relation."
        featured={PROJECT}
        projects={[
          PROJECT,
          (({ media: _media, ...project }) => ({
            ...project,
            id: "project-2",
            href: "/museum/network/projects/project-2",
            title: "Another Series",
          }))(PROJECT),
        ]}
        browseTitle="All projects and series"
        collectionLabel="View the Collection"
        collectionHref="/museum/network/collection"
        acquisitionsLabel="View acquisitions"
        acquisitionsHref="/museum/network/acquisitions"
      />
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Artist bodies of work and series",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Projects describe artists' bodies of work; the Collection and Acquisitions pages describe Museum holdings and decisions."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View the Collection" })
    ).toHaveAttribute("href", "/museum/network/collection");
    expect(
      screen.getByRole("link", { name: "View acquisitions" })
    ).toHaveAttribute("href", "/museum/network/acquisitions");
    expect(
      screen.getAllByRole("link", { name: "A Body of Work" }).length
    ).toBeGreaterThan(1);
    expect(
      screen.getByRole("link", { name: "Another Series" })
    ).toHaveAttribute("href", "/museum/network/projects/project-2");
    expect(screen.getAllByRole("img", { name: MEDIA.altText! })).toHaveLength(
      2
    );
  });
});
