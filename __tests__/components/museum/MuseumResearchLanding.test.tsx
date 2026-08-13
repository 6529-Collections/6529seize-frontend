import { render, screen } from "@testing-library/react";
import { MuseumResearchLanding } from "@/components/museum/research/MuseumResearchLanding";
import type { MuseumMedia } from "@/lib/museum/publication/types";

const MEDIA: MuseumMedia = {
  id: "media-1",
  artworkId: "work-1",
  kind: "still",
  role: "source",
  mediaType: "image/jpeg",
  width: 1200,
  height: 900,
  altText: "A governed artwork study image.",
  credit: {
    creditLine: "Museum record",
    licenseLabel: "CC BY-NC 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/",
    rightsExpressionId: "cc-by-nc-4.0",
    sourcePath: "records/media/media-1.json",
  },
  sourcePath: "records/media/media-1.json",
  custody: "retained",
  url: "https://example.com/museum-study.jpg",
  preservationStatus: "retained_verified",
  sha256: `sha256:${"a".repeat(64)}`,
  upstreamProvider: null,
};

const ENTRY = {
  id: "research-1",
  slug: "research-1",
  title: "A study of the work",
  document: {
    id: "research-1",
    kind: "project_essay" as const,
    title: "A study of the work",
    markdown: "The work changes as its rules become visible.",
    sha256: null,
    sourcePath: "records/research/research-1.md",
    artistIds: [],
    projectIds: [],
    giftIds: [],
    artworkIds: [],
  },
  media: MEDIA,
};

describe("MuseumResearchLanding", () => {
  it("puts the visual study first and keeps the complete register findable", () => {
    render(
      <MuseumResearchLanding
        eyebrow="Research"
        title="Research, in public"
        description="Public scholarship."
        featured={{
          href: "/museum/network/research/research-1",
          eyebrow: "Project study",
          title: "A study of the work",
          description: "A close reading.",
          media: MEDIA,
          actionLabel: "Read the study",
        }}
        tiers={[
          {
            id: "scholarship",
            eyebrow: "Start with the art",
            title: "Close looking",
            description: "Close readings.",
            groups: [
              {
                id: "art",
                title: "Art and artists",
                description: "Artist and project studies.",
                entries: [ENTRY],
              },
            ],
          },
        ]}
        browseGroups={[
          {
            id: "art",
            title: "Art and artists",
            description: "Artist and project studies.",
            entries: [
              ENTRY,
              {
                ...ENTRY,
                id: "research-2",
                slug: "research-2",
                title: "A source record",
              },
            ],
          },
        ]}
        browseTitle="Browse the complete research record"
        browseDescription="Every record remains available."
      />
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Research, in public" })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: MEDIA.altText! })).toHaveLength(
      2
    );
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Browse the complete research record",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Close looking" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "A study of the work" }).length
    ).toBeGreaterThan(2);
    expect(
      screen.getByRole("link", { name: /^A source record\b/ })
    ).toHaveAttribute("href", "/museum/network/research/research-2");
  });

  it("chooses a later illustrated entry before the three-card editorial limit", () => {
    const lateMedia: MuseumMedia = {
      ...MEDIA,
      id: "media-late",
      artworkId: "work-late",
      altText: "A later illustrated research study.",
    };
    const { media: _media, ...textEntry } = ENTRY;
    const textOnlyEntries = [1, 2, 3].map((index) => ({
      ...textEntry,
      id: `text-only-${index}`,
      slug: `text-only-${index}`,
      title: `Text-only record ${index}`,
    }));

    render(
      <MuseumResearchLanding
        eyebrow="Research"
        title="Research, in public"
        description="Public scholarship."
        featured={{
          href: "/museum/network/research/text-only-1",
          eyebrow: "Research record",
          title: "Text-only record 1",
          description: "A textual record.",
          media: undefined,
          actionLabel: "Read the study",
        }}
        tiers={[
          {
            id: "scholarship",
            eyebrow: "Start with the art",
            title: "Close looking",
            description: "Close readings.",
            groups: [
              {
                id: "art",
                title: "Art and artists",
                description: "Artist and project studies.",
                entries: [
                  ...textOnlyEntries,
                  {
                    ...ENTRY,
                    id: "late-illustrated",
                    slug: "late-illustrated",
                    title: "Late illustrated study",
                    media: lateMedia,
                  },
                ],
              },
            ],
          },
        ]}
        browseGroups={[]}
        browseTitle="Browse the complete research record"
        browseDescription="Every record remains available."
      />
    );

    expect(
      screen.getByRole("img", { name: lateMedia.altText! })
    ).toBeInTheDocument();
    const lateStudyLinks = screen.getAllByRole("link", {
      name: "Late illustrated study",
    });
    expect(lateStudyLinks).toHaveLength(2);
    for (const link of lateStudyLinks) {
      expect(link).toHaveAttribute(
        "href",
        "/museum/network/research/late-illustrated"
      );
    }
  });
});
