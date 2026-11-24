import { render, screen, within } from "@testing-library/react";
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

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    await userEvent.click(options[1]!);
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

    expect(screen.getByText("Counts for submissions")).toHaveClass(
      "tw-text-emerald-300"
    );
    expect(
      screen.getByRole("option", {
        name: "MemesNominee Counts for submissions",
      })
    ).toHaveClass(
      "tw-border-iron-700/60",
      "tw-bg-iron-800/60",
      "tw-text-iron-200"
    );
    expect(
      screen.getByRole("option", { name: "Memes Nominee" })
    ).not.toHaveClass("tw-border-emerald-500/30", "tw-bg-emerald-500/10");
    expect(screen.getByRole("option", { name: "Memes Nominee" })).toHaveClass(
      "tw-bg-transparent",
      "tw-text-iron-200"
    );
    expect(screen.getByText("MemesNominee", { exact: true })).not.toHaveClass(
      "tw-text-emerald-400"
    );
  });

  it("preserves the full category name while dimming the matched part on phones", () => {
    render(
      <UserPageRepNewRepSearchDropdown
        {...defaultProps}
        categories={["Memes Nominee", "Photography"]}
        state={RepSearchState.HAVE_RESULTS}
        search="memes no"
      />
    );
    const lookalike = screen.getByRole("option", { name: "Memes Nominee" });
    expect(lookalike).toHaveTextContent("Memes Nominee");
    expect(
      within(lookalike).getByText("Memes No", { exact: true })
    ).toHaveClass("tw-opacity-80", "md:tw-opacity-100");
    expect(
      screen.getByRole("option", { name: "Photography" })
    ).toHaveTextContent("Photography");
  });

  it("keeps every suggestion selectable with one active option", async () => {
    const categories = [
      "MemesNominee",
      "Memes Nominee",
      "Memes nominee",
      "memes nominee",
      "memes nomineer",
      "Memes Nomination",
      "The Memes Nominees",
      "Community memes nominee",
    ];
    const { rerender } = render(
      <UserPageRepNewRepSearchDropdown
        {...defaultProps}
        categories={categories}
        state={RepSearchState.HAVE_RESULTS}
        search="memes no"
        activeIndex={0}
        optionIdPrefix="category-option-"
      />
    );

    expect(screen.getAllByRole("option")).toHaveLength(categories.length);
    expect(screen.getAllByRole("option", { selected: true })).toHaveLength(1);
    expect(screen.getByRole("option", { selected: true })).toHaveAttribute(
      "id",
      "category-option-0"
    );
    expect(
      screen.queryByRole("button", { name: /show (?:all|more)/i })
    ).toBeNull();
    await userEvent.click(
      screen.getByRole("option", { name: "Community memes nominee" })
    );
    expect(defaultProps.onRepSelect).toHaveBeenCalledWith(
      "Community memes nominee"
    );

    rerender(
      <UserPageRepNewRepSearchDropdown
        {...defaultProps}
        categories={categories}
        state={RepSearchState.HAVE_RESULTS}
        search="memes no"
        activeIndex={2}
        optionIdPrefix="category-option-"
      />
    );
    expect(screen.getByRole("option", { selected: true })).toHaveAttribute(
      "id",
      "category-option-2"
    );
  });

  it("keeps the search focused during a pointer selection", async () => {
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="Category search" />
        <UserPageRepNewRepSearchDropdown
          {...defaultProps}
          categories={["Art"]}
          state={RepSearchState.HAVE_RESULTS}
        />
      </>
    );
    const search = screen.getByRole("textbox", { name: "Category search" });
    await user.click(search);
    await user.pointer({
      keys: "[MouseLeft>]",
      target: screen.getByRole("option", { name: "Art" }),
    });
    expect(search).toHaveFocus();
    await user.pointer({ keys: "[/MouseLeft]" });
    expect(defaultProps.onRepSelect).toHaveBeenCalledWith("Art");
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
