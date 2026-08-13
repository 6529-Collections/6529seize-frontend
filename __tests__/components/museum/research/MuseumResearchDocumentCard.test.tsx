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
});
