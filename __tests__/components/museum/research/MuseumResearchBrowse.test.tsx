import { render } from "@testing-library/react";
import { MuseumResearchBrowse } from "@/components/museum/research/MuseumResearchBrowse";

const LABELS = {
  eyebrow: "Reference index",
  searchLabel: "Search",
  searchPlaceholder: "Search",
  filterLabel: "Filter",
  allSubjectsLabel: "All subjects",
  noResultsLabel: "No results",
  resultCountOne: "{count} record",
  resultCountOther: "{count} records",
  sourceLabel: "Source",
  opensInNewTab: "Opens in a new tab.",
};

describe("MuseumResearchBrowse", () => {
  it("keeps the immediate count visible and the debounced announcement exclusive to assistive technology", () => {
    const { container } = render(
      <MuseumResearchBrowse
        groups={[
          {
            id: "art",
            title: "Art and artists",
            description: "Studies",
            entries: [
              {
                id: "research-1",
                slug: "a-study",
                title: "A study",
                publicationUri: "https://example.com/research-source",
              },
            ],
          },
        ]}
        title="Research library"
        description="Published studies"
        labels={LABELS}
      />
    );

    expect(container.querySelector("p[aria-hidden='true']")).toHaveTextContent(
      "1 record"
    );
    expect(container.querySelector("[aria-live='polite']")).toHaveTextContent(
      "1 record"
    );
    expect(
      container.querySelector("a[href='https://example.com/research-source']")
    ).toHaveAccessibleName("Source Opens in a new tab.");
  });
});
