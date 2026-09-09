import { render, screen } from "@testing-library/react";
import { MuseumResearchDocumentCard } from "@/components/museum/research/MuseumResearchDocumentCard";

describe("MuseumResearchDocumentCard", () => {
  it("keeps the index editorial and does not excerpt manuscript or record text", () => {
    render(
      <MuseumResearchDocumentCard
        entry={{
          id: "research-1",
          slug: "a-study-of-a-work",
          title: "A study of a work",
          document: {
            id: "research-1",
            kind: "project_essay",
            title: "A study of a work",
            markdown:
              "# A study of a work\n\nThe manuscript body should stay on the detail page.",
            sha256: null,
            sourcePath: "records/research/a-study.md",
            artistIds: [],
            projectIds: [],
            giftIds: [],
            artworkIds: [],
          },
        }}
      />
    );

    expect(
      screen.getByRole("heading", { name: "A study of a work" })
    ).toBeInTheDocument();
    expect(
      screen.queryByText("The manuscript body should stay on the detail page.")
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("A study of a work")).toHaveLength(1);
  });

  it("does not render an empty subject paragraph", () => {
    const { container } = render(
      <MuseumResearchDocumentCard
        entry={{
          id: "research-2",
          slug: "a-record",
          title: "A record",
          subjectLabels: [],
        }}
      />
    );

    expect(container.querySelector("p.tw-mt-2")).not.toBeInTheDocument();
  });

  it("keeps the item-level source visible when editorial media loads", () => {
    render(
      <MuseumResearchDocumentCard
        entry={{
          id: "research-3",
          slug: "an-illustrated-study",
          title: "An illustrated study",
          mediaSourceHref: "https://example.org/object/123",
          mediaSourceLabel: "View image source",
          media: {
            id: "research-media-3",
            artworkId: "editorial-illustration-3",
            kind: "still",
            role: "source",
            mediaType: "image/webp",
            width: 800,
            height: 600,
            altText: "An archival reading room.",
            credit: {
              creditLine: "Museum archive. CC0.",
              licenseLabel: "CC0 1.0",
              licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
              rightsExpressionId: null,
              sourcePath: "records/media/editorial-illustration-3.json",
            },
            sourcePath: "records/media/editorial-illustration-3.json",
            custody: "retained",
            url: "/museum/research/editorial/example.webp",
            preservationStatus: "retained_verified",
            sha256:
              "sha256:1111111111111111111111111111111111111111111111111111111111111111",
            upstreamProvider: null,
          },
        }}
      />
    );

    expect(
      screen.getByRole("link", { name: "View image source" })
    ).toHaveAttribute("href", "https://example.org/object/123");
  });
});
