import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageRepNewRepSearchDropdown from "@/components/user/rep/new-rep/UserPageRepNewRepSearchDropdown";
import { RepSearchState } from "@/components/user/rep/new-rep/rep-search-types";

const defaultProps = {
  listId: "rep-category-options",
  minSearchLength: 3,
  maxSearchLength: 100,
  onRepSelect: jest.fn(),
};

describe("UserPageRepNewRepSearchDropdown", () => {
  beforeEach(() => {
    defaultProps.onRepSelect.mockClear();
  });

  it("groups similar spellings under the selected existing category", async () => {
    const option = {
      kind: "existing" as const,
      category: "top artist",
      aliases: ["Top Artist"],
      selectionReason: "most-active" as const,
    };
    render(
      <UserPageRepNewRepSearchDropdown
        {...defaultProps}
        options={[option]}
        state={RepSearchState.HAVE_RESULTS}
      />
    );

    expect(screen.getByText("Existing category")).toBeInTheDocument();
    expect(
      screen.getByText("Most active spelling among similar categories.")
    ).toBeInTheDocument();
    expect(screen.getByText("Top Artist")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("option"));
    expect(defaultProps.onRepSelect).toHaveBeenCalledWith(option);
  });

  it("identifies the category used by Memes submission eligibility", () => {
    render(
      <UserPageRepNewRepSearchDropdown
        {...defaultProps}
        options={[
          {
            kind: "existing",
            category: "MemesNominee",
            aliases: ["Memes Nominee"],
            selectionReason: "submission",
          },
        ]}
        state={RepSearchState.HAVE_RESULTS}
      />
    );

    expect(
      screen.getByText("Counts toward Memes submission eligibility.")
    ).toBeInTheDocument();
  });

  it("presents new category creation as a separate deliberate action", () => {
    render(
      <UserPageRepNewRepSearchDropdown
        {...defaultProps}
        options={[{ kind: "new", category: "Fresh Category" }]}
        state={RepSearchState.HAVE_RESULTS}
      />
    );

    expect(screen.getByText("Create new category")).toBeInTheDocument();
    expect(screen.getByText("Fresh Category")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No equivalent category exists. This exact spelling creates a separate category."
      )
    ).toBeInTheDocument();
  });

  it("shows minimum, maximum, loading, and error states", () => {
    const { rerender } = render(
      <UserPageRepNewRepSearchDropdown
        {...defaultProps}
        options={[]}
        state={RepSearchState.MIN_LENGTH_ERROR}
      />
    );
    expect(screen.getByText("Type at least 3 characters.")).toBeInTheDocument();

    rerender(
      <UserPageRepNewRepSearchDropdown
        {...defaultProps}
        options={[]}
        state={RepSearchState.MAX_LENGTH_ERROR}
      />
    );
    expect(
      screen.getByText("Type at most 100 characters.")
    ).toBeInTheDocument();

    rerender(
      <UserPageRepNewRepSearchDropdown
        {...defaultProps}
        options={[]}
        state={RepSearchState.LOADING}
      />
    );
    expect(
      screen.getByText("Finding existing categories...")
    ).toBeInTheDocument();

    rerender(
      <UserPageRepNewRepSearchDropdown
        {...defaultProps}
        options={[]}
        state={RepSearchState.ERROR}
      />
    );
    expect(
      screen.getByText("Could not search REP categories. Please try again.")
    ).toBeInTheDocument();
  });
});
