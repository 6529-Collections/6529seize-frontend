import { render, screen } from "@testing-library/react";
import { MuseumResearchDetail } from "@/components/museum/research/MuseumResearchDetail";
import type { MuseumEntityContextModel } from "@/lib/museum/publication/ia";
import type { MuseumMedia } from "@/lib/museum/publication/types";

const MEDIA: MuseumMedia = {
  id: "media-1",
  artworkId: "6529NM-W-0001",
  kind: "still",
  role: "source",
  mediaType: "image/jpeg",
  width: 1200,
  height: 900,
  altText: "A governed work image.",
  credit: {
    creditLine: "Museum publication record",
    licenseLabel: "CC BY-NC 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/",
    rightsExpressionId: "cc-by-nc-4.0",
    sourcePath: "records/media/media-1.json",
  },
  sourcePath: "records/media/media-1.json",
  custody: "retained",
  url: "https://example.com/governed-work.jpg",
  preservationStatus: "retained_verified",
  sha256: `sha256:${"b".repeat(64)}`,
  upstreamProvider: null,
};

const CONTEXT: MuseumEntityContextModel = {
  kind: "research",
  id: "6529NM-RP-0001",
  label: "A study of a work",
  canonicalHref: "/museum/network/research/a-study-of-a-work",
  breadcrumbs: [
    { label: "6529 Network Museum", href: "/museum/network" },
    { label: "Research", href: "/museum/network/research" },
    { label: "A study of a work" },
  ],
  statusAsOf: null,
  primaryRelations: [],
  secondaryRelations: [],
  sourcePath: "records/entities/6529NM-RP-0001.json",
  sourceCommit: "c".repeat(40),
};

describe("MuseumResearchDetail", () => {
  it("puts governed art before source context and keeps related work context visible", () => {
    render(
      <MuseumResearchDetail
        entry={{
          id: CONTEXT.id,
          slug: "a-study-of-a-work",
          title: CONTEXT.label,
          categoryLabel: "Art and artists",
          categoryDescription: "Artist and project studies.",
          kindLabel: "Project study",
          sourcePath: CONTEXT.sourcePath!,
          publicationUri:
            "https://github.com/6529-Collections/6529networkmuseum/blob/" +
            CONTEXT.sourceCommit +
            "/records/research/a-study.md",
          media: MEDIA,
          document: {
            id: CONTEXT.id,
            kind: "project_essay",
            title: CONTEXT.label,
            markdown:
              "# A study of a work\n\nThe essay stays grounded in the work.",
            sha256: null,
            sourcePath: "records/research/a-study.md",
            artistIds: [],
            projectIds: [],
            giftIds: [],
            artworkIds: [],
          },
          primaryRelations: [
            {
              kind: "work",
              id: "6529NM-W-0001",
              label: "The Work",
              href: "/museum/network/works/6529NM-W-0001",
              relation: "Interprets",
            },
          ],
          secondaryRelations: [],
        }}
        context={CONTEXT}
        workHrefs={{}}
      />
    );

    const image = screen.getByRole("img", { name: MEDIA.altText! });
    const source = screen.getByRole("link", { name: "Open source record" });
    expect(
      image.compareDocumentPosition(source) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      screen.getByText("The essay stays grounded in the work.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "The Work" })).toHaveAttribute(
      "href",
      "/museum/network/works/6529NM-W-0001"
    );
  });
});
