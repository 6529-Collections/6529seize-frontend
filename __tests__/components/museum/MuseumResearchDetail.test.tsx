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
  it("uses a dedicated portrait diagram on mobile without shrinking the desktop diagram", () => {
    const mobileMedia: MuseumMedia = {
      ...MEDIA,
      id: "media-mobile",
      width: 640,
      height: 1560,
      url: "/museum/research/editorial/generative-method-mobile.svg",
    };
    render(
      <MuseumResearchDetail
        entry={{
          id: CONTEXT.id,
          slug: "generative-system-analysis-standard",
          title: "Generative System Analysis Standard",
          description: "A reproducible method for studying generative art.",
          categoryLabel: "Museum practice",
          categoryDescription: "Methods and standards.",
          kindLabel: "Museum standard",
          sourcePath: CONTEXT.sourcePath!,
          media: MEDIA,
          mobileMedia,
          primaryRelations: [],
          secondaryRelations: [],
        }}
        context={CONTEXT}
        workHrefs={{}}
      />
    );

    const images = screen.getAllByRole("img", { name: MEDIA.altText! });
    expect(images).toHaveLength(2);
    expect(images[0]!.closest("figure")?.parentElement).toHaveClass(
      "tw-hidden",
      "sm:tw-block"
    );
    expect(images[1]!.closest("figure")?.parentElement).toHaveClass(
      "sm:tw-hidden"
    );
    expect(images[1]).toHaveAttribute(
      "src",
      "/museum/research/editorial/generative-method-mobile.svg"
    );
    expect(images[1]).toHaveAttribute("width", "640");
    expect(images[1]).toHaveAttribute("height", "1560");
  });

  it("puts governed art before source context and keeps related work context visible", () => {
    const { container } = render(
      <MuseumResearchDetail
        entry={{
          id: CONTEXT.id,
          slug: "a-study-of-a-work",
          title: CONTEXT.label,
          description: "A close reading grounded in the work.",
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
    const title = screen.getByRole("heading", {
      level: 1,
      name: CONTEXT.label,
    });
    expect(title).toHaveClass("tw-text-[2rem]", "sm:tw-text-[2.75rem]");
    expect(title.parentElement).toHaveClass("tw-max-w-5xl");
    const source = screen.getByRole("link", { name: "Open source record" });
    expect(
      image.compareDocumentPosition(source) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      screen.getByText("The essay stays grounded in the work.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Read the complete study" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Selected reading" })
    ).not.toBeInTheDocument();
    expect(
      container.querySelector("#complete-research-record")
    ).toHaveAttribute("open");
    expect(screen.getByRole("link", { name: "The Work" })).toHaveAttribute(
      "href",
      "/museum/network/works/6529NM-W-0001"
    );
  });

  it("shows the complete sixteen-work Keys and Gates study group", () => {
    const relations = Array.from({ length: 16 }, (_, index) => ({
      kind: "work" as const,
      id: `6529NM-W-${String(index + 1).padStart(4, "0")}`,
      label:
        index === 8
          ? "HugoFaz — the Artist in the Open Sea"
          : `Selected work ${index + 1}`,
      href: `/museum/network/works/${index + 1}`,
      relation: "Interprets",
      media: {
        kind: "governed" as const,
        src: MEDIA.url,
        width: MEDIA.width,
        height: MEDIA.height,
        alt: `Selected work ${index + 1}`,
      },
    }));

    render(
      <MuseumResearchDetail
        entry={{
          id: "6529NM-RP-KEYS",
          slug: "access-control-and-exit",
          title: "Access, Control, and Exit",
          categoryLabel: "Acquisition research",
          categoryDescription: "Research for an acquisition in progress.",
          description: "Sixteen selected photographs.",
          kindLabel: "Acquisition in progress",
          sourcePath: "records/research/access-control-and-exit.md",
          primaryRelations: relations,
          secondaryRelations: [],
        }}
        context={{ ...CONTEXT, primaryRelations: relations }}
        workHrefs={{}}
      />
    );

    expect(screen.getAllByRole("img")).toHaveLength(16);
    expect(
      screen.getByRole("link", { name: "Selected work 16" })
    ).toHaveAttribute("href", "/museum/network/works/16");
    expect(
      screen.getByRole("link", {
        name: "HugoFaz — the Artist in the Open Sea",
      })
    ).toHaveAttribute("href", "/museum/network/works/9");
    expect(screen.queryByText(/spelling.*retained/iu)).not.toBeInTheDocument();
  });

  it("makes the Magnum institutional display basis visible and inspectable", () => {
    const relations = Array.from({ length: 5 }, (_, index) => ({
      kind: "work" as const,
      id: `6529NM-W-${String(index + 24).padStart(4, "0")}`,
      label: `Magnum work ${index + 1}`,
      href: `/museum/network/works/${index + 24}`,
      relation: "Interprets",
      media: {
        kind: "governed" as const,
        src: MEDIA.url,
        width: MEDIA.width,
        height: MEDIA.height,
        alt: `Magnum work ${index + 1}`,
        creditLine: `© Photographer ${index + 1}/Magnum Photos 2022.`,
      },
    }));
    render(
      <MuseumResearchDetail
        entry={{
          id: "6529NM-RP-0003",
          slug: "conflict-at-its-edges",
          title: "Conflict at Its Edges",
          categoryLabel: "Acquisition research",
          categoryDescription: "Research on an accessioned gift.",
          description: "Five photographs in the permanent Collection.",
          kindLabel: "Acquisition essay",
          sourcePath: "records/research/conflict-at-its-edges.md",
          institutionalDisplay: {
            statement:
              "These All Rights Reserved works are shown as part of the Museum’s permanent Collection. The Museum’s credited institutional display position does not transfer copyright or create a general reproduction licence.",
            href: `https://github.com/6529-Collections/6529networkmuseum/blob/${CONTEXT.sourceCommit}/records/accessions/6529NM.2026.002/public/web-presentation-authority.md`,
            linkLabel: "Read the display basis",
          },
          primaryRelations: relations,
          secondaryRelations: [],
        }}
        context={{ ...CONTEXT, primaryRelations: relations }}
        workHrefs={{}}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Display and rights" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not transfer copyright/u)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Read the display basis" })
    ).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529networkmuseum/blob/${CONTEXT.sourceCommit}/records/accessions/6529NM.2026.002/public/web-presentation-authority.md`
    );
    expect(
      screen.getAllByText("All Rights Reserved. Accession 6529NM.2026.002.")
    ).toHaveLength(5);
  });
});
