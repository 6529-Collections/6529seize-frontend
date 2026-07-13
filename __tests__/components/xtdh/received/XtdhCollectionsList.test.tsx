import { XtdhCollectionsList } from "@/components/xtdh/received/subcomponents/XtdhCollectionsList";
import { render, screen } from "@testing-library/react";

describe("XtdhCollectionsList", () => {
  it("shows a query-specific empty state for a collection search", () => {
    render(
      <XtdhCollectionsList
        isEnabled
        isLoading={false}
        isError={false}
        collections={[]}
        onRetry={jest.fn()}
        isIdentityScoped={false}
        searchTerm="meme"
      />
    );

    expect(
      screen.getByText("No collections found for “meme”")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Try another collection name or clear the search to see all collections."
      )
    ).toBeInTheDocument();
  });
});
