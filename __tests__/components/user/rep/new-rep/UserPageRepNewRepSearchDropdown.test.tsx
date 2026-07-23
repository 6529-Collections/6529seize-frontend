import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageRepNewRepSearchDropdown from "@/components/user/rep/new-rep/UserPageRepNewRepSearchDropdown";
import { RepSearchState } from "@/components/user/rep/new-rep/rep-search-types";

const defaultProps = {
  minSearchLength: 3,
  maxSearchLength: 100,
  onRepSelect: jest.fn(),
};

describe("UserPageRepNewRepSearchDropdown", () => {
  beforeEach(() => {
    defaultProps.onRepSelect.mockClear();
  });

  it("renders compact category pills and handles selection", async () => {
    render(
      <UserPageRepNewRepSearchDropdown
        {...defaultProps}
        categories={["Art", "NFT"]}
        state={RepSearchState.HAVE_RESULTS}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    await userEvent.click(buttons[1]!);
    expect(defaultProps.onRepSelect).toHaveBeenCalledWith("NFT");
  });

  it("distinguishes the exact submission category from its look-alikes", () => {
    render(
      <UserPageRepNewRepSearchDropdown
        {...defaultProps}
        categories={["MemesNominee", "Memes Nominee"]}
        state={RepSearchState.HAVE_RESULTS}
      />
    );

    expect(screen.getByText("Counts for submissions")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "MemesNominee Counts for submissions",
      })
    ).toHaveClass(
      "tw-border-emerald-500/30",
      "tw-bg-emerald-500/10",
      "tw-text-white"
    );
    expect(
      screen.getByRole("button", { name: "Memes Nominee" })
    ).not.toHaveClass("tw-border-emerald-500/30", "tw-bg-emerald-500/10");
    expect(screen.getByRole("button", { name: "Memes Nominee" })).toHaveClass(
      "tw-bg-transparent",
      "tw-text-iron-300"
    );
  });

  it("shows minimum, maximum, and loading states", () => {
    const { rerender } = render(
      <UserPageRepNewRepSearchDropdown
        {...defaultProps}
        categories={[]}
        state={RepSearchState.MIN_LENGTH_ERROR}
      />
    );
    expect(screen.getByText("Type at least 3 characters.")).toBeInTheDocument();

    rerender(
      <UserPageRepNewRepSearchDropdown
        {...defaultProps}
        categories={[]}
        state={RepSearchState.MAX_LENGTH_ERROR}
      />
    );
    expect(
      screen.getByText("Type at most 100 characters.")
    ).toBeInTheDocument();

    rerender(
      <UserPageRepNewRepSearchDropdown
        {...defaultProps}
        categories={[]}
        state={RepSearchState.LOADING}
      />
    );
    expect(
      screen.getByText("Finding existing categories...")
    ).toBeInTheDocument();
  });
});
