import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageRepNewRepSearch from "@/components/user/rep/new-rep/UserPageRepNewRepSearch";
import { getGrantRepCategoriesToDisplay } from "@/components/user/rep/new-rep/grantRepCategoryOptions";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import { useRepAllocation } from "@/hooks/useRepAllocation";

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn().mockReturnValue({ mutateAsync: jest.fn() }),
  useQuery: jest.fn(),
}));

jest.mock(
  "@/components/user/rep/new-rep/UserPageRepNewRepSearchDropdown",
  () =>
    (props: {
      readonly state: string;
      readonly categories: readonly string[];
      readonly onRepSelect: (category: string) => void;
    }) => (
      <div data-testid="dropdown">
        <span>{props.state}</span>
        {props.categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => props.onRepSelect(category)}
          >
            {category}
          </button>
        ))}
      </div>
    )
);
jest.mock("@/components/user/rep/new-rep/UserPageRepNewRepError", () => () => (
  <div data-testid="error" />
));
jest.mock(
  "@/components/distribution-plan-tool/common/CircleLoader",
  () => () => <div data-testid="loader" />
);
jest.mock("@/hooks/useRepAllocation", () => ({
  useRepAllocation: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn().mockResolvedValue(true),
  commonApiPost: jest.fn(),
}));

describe("UserPageRepNewRepSearch", () => {
  const allocation = {
    repState: null,
    heroAvailableRep: 100,
    proxyAvailableCredit: null,
    minMaxValues: { min: -100, max: 100 },
    isError: false,
    isFetching: false,
    retry: jest.fn(),
  };
  const mockAllocation = jest.mocked(useRepAllocation);

  beforeEach(() => {
    mockAllocation.mockReturnValue(allocation);
    (commonApiFetch as jest.Mock).mockResolvedValue(true);
    (useQuery as jest.Mock).mockReturnValue({
      isFetching: false,
      data: ["MemesNominee"],
    });
  });

  it("preserves a typed amount when a delayed rating response arrives", async () => {
    const user = userEvent.setup();
    mockAllocation.mockReturnValue({
      ...allocation,
      minMaxValues: { min: 0, max: 0 },
    });
    (useQuery as jest.Mock).mockReturnValue({
      isFetching: false,
      data: ["Art"],
    });
    const props = {
      overview: null,
      profile: { query: "recipient" } as ApiIdentity,
    };
    const { rerender } = render(<UserPageRepNewRepSearch {...props} />);
    const amount = screen.getByRole("textbox", {
      name: "Your total REP for this category",
    });
    await user.type(
      screen.getByRole("textbox", { name: "Category to grant REP for" }),
      "Art"
    );
    await user.click(
      await screen.findByRole("button", { name: "Art", exact: true })
    );
    await user.clear(amount);
    await user.type(amount, "25");
    await user.tab();
    expect(amount).toHaveValue("25");
    expect(screen.getByRole("button", { name: "Grant REP" })).toBeDisabled();

    mockAllocation.mockReturnValue({
      ...allocation,
      repState: {
        category: "Art",
        rating: 0,
        contributor_count: 0,
        rater_contribution: 0,
      },
    });
    rerender(<UserPageRepNewRepSearch {...props} />);

    expect(amount).toHaveValue("25");
    expect(screen.getByRole("button", { name: "Grant REP" })).toBeEnabled();
  });

  it("prefills the saved rating and keeps edits through background refreshes", async () => {
    const user = userEvent.setup();
    const props = {
      overview: null,
      profile: { query: "recipient" } as ApiIdentity,
    };
    const { rerender } = render(<UserPageRepNewRepSearch {...props} />);
    const amount = screen.getByRole("textbox", {
      name: "Your total REP for this category",
    });
    const repState = {
      category: "Art",
      rating: 20,
      contributor_count: 1,
      rater_contribution: 20,
    };
    mockAllocation.mockReturnValue({ ...allocation, repState });
    rerender(<UserPageRepNewRepSearch {...props} />);
    expect(amount).toHaveValue("20");

    await user.clear(amount);
    await user.type(amount, "35");
    mockAllocation.mockReturnValue({
      ...allocation,
      repState: { ...repState },
    });
    rerender(<UserPageRepNewRepSearch {...props} />);

    expect(amount).toHaveValue("35");
  });

  it("clears the previous category draft and prefills the next category", async () => {
    const user = userEvent.setup();
    (useQuery as jest.Mock).mockReturnValue({
      isFetching: false,
      data: ["Art", "Research"],
    });
    mockAllocation.mockImplementation(({ category }) => ({
      ...allocation,
      repState: category
        ? {
            category,
            rating: 20,
            contributor_count: 1,
            rater_contribution: category === "Art" ? 20 : 7,
          }
        : null,
    }));
    render(
      <UserPageRepNewRepSearch
        overview={null}
        profile={{ query: "recipient" } as ApiIdentity}
      />
    );
    const search = screen.getByRole("textbox", {
      name: "Category to grant REP for",
    });
    const amount = screen.getByRole("textbox", {
      name: "Your total REP for this category",
    });
    await user.type(search, "Art");
    await user.click(
      await screen.findByRole("button", { name: "Art", exact: true })
    );
    await waitFor(() => expect(amount).toHaveValue("20"));
    await user.clear(amount);
    await user.type(amount, "30");
    await user.clear(search);
    await user.type(search, "Research");
    await user.click(
      await screen.findByRole("button", { name: "Research", exact: true })
    );
    await waitFor(() => expect(amount).toHaveValue("7"));
  });

  it("lets users type an amount while category selection remains required", async () => {
    const user = userEvent.setup();
    render(
      <UserPageRepNewRepSearch
        overview={null}
        profile={{ query: "recipient" } as ApiIdentity}
      />
    );
    await user.clear(
      screen.getByRole("textbox", { name: "Your total REP for this category" })
    );
    await user.type(
      screen.getByRole("textbox", { name: "Your total REP for this category" }),
      "1"
    );
    expect(
      screen.getByRole("textbox", { name: "Your total REP for this category" })
    ).toHaveValue("1");
    expect(screen.getByRole("button", { name: "Grant REP" })).toBeDisabled();
  });

  it("shows loading instead of the minimum-length prompt once three characters are entered", async () => {
    const user = userEvent.setup();
    render(
      <UserPageRepNewRepSearch
        overview={null}
        profile={{ query: "recipient" } as ApiIdentity}
      />
    );

    await user.type(
      screen.getByPlaceholderText("Category to grant REP for"),
      "art"
    );

    expect(screen.getByText("LOADING")).toBeInTheDocument();
  });

  it("counts Unicode characters consistently for the search minimum", async () => {
    const user = userEvent.setup();
    render(
      <UserPageRepNewRepSearch
        overview={null}
        profile={{ query: "recipient" } as ApiIdentity}
      />
    );

    await user.type(
      screen.getByPlaceholderText("Category to grant REP for"),
      "😀😀"
    );

    expect(screen.getByText("MIN_LENGTH_ERROR")).toBeInTheDocument();
  });

  it("keeps the production select, edit, and search-again interaction", async () => {
    const user = userEvent.setup();
    render(
      <UserPageRepNewRepSearch
        overview={null}
        profile={{ query: "recipient" } as ApiIdentity}
      />
    );
    const input = screen.getByPlaceholderText("Category to grant REP for");

    await user.type(input, "meme");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "MemesNominee" })).toBeVisible()
    );
    await user.click(screen.getByRole("button", { name: "MemesNominee" }));
    await waitFor(() => expect(input).toHaveValue("MemesNominee"));
    expect(
      within(screen.getByRole("status")).getByText("MemesNominee")
    ).toHaveClass("tw-text-emerald-400");

    await user.click(input);
    await user.clear(input);
    await user.type(input, "meme");

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "MemesNominee" })).toBeVisible()
    );
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "/rep/categories/availability",
      params: { param: "MemesNominee" },
    });
  });

  it("warns after a non-qualifying MemesNominee look-alike is selected", async () => {
    const user = userEvent.setup();
    (useQuery as jest.Mock).mockReturnValue({
      isFetching: false,
      data: ["MemesNominee", "Memes nominee"],
    });
    render(
      <UserPageRepNewRepSearch
        overview={null}
        profile={{ query: "recipient" } as ApiIdentity}
      />
    );
    const input = screen.getByPlaceholderText("Category to grant REP for");

    await user.type(input, "Memes nominee");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Memes nominee" })
      ).toBeVisible()
    );
    await user.click(screen.getByRole("button", { name: "Memes nominee" }));

    await waitFor(() => expect(input).toHaveValue("Memes nominee"));
    expect(input).toHaveClass("tw-ring-iron-700/60");
    expect(input).not.toHaveClass("tw-border-amber-400/50");
    expect(
      screen.getByText(
        '"Memes nominee" is a separate category. Only MemesNominee counts for submissions.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Memes submissions require/)
    ).not.toBeInTheDocument();
  });

  it("requires an explicit choice before selecting a look-alike with Enter", async () => {
    const user = userEvent.setup();
    render(
      <UserPageRepNewRepSearch
        overview={null}
        profile={{ query: "recipient" } as ApiIdentity}
      />
    );
    const input = screen.getByPlaceholderText("Category to grant REP for");

    await user.type(input, "memes nominee{enter}");

    expect(input).toHaveValue("memes nominee");
    expect(screen.getByTestId("dropdown")).toBeInTheDocument();
    expect(commonApiFetch).not.toHaveBeenCalledWith({
      endpoint: "/rep/categories/availability",
      params: { param: "memes nominee" },
    });
  });

  it("surfaces only the exact submission category ahead of its presentation variant", () => {
    expect(
      getGrantRepCategoriesToDisplay({
        search: "Memes-Nominee",
        categories: [],
        includeTypedCategory: true,
      })
    ).toEqual(["MemesNominee", "Memes-Nominee"]);

    expect(
      getGrantRepCategoriesToDisplay({
        search: "memes nomin",
        categories: ["Memes Nominee", "Memes nominee"],
        includeTypedCategory: true,
      })
    ).toEqual([
      "MemesNominee",
      "memes nomin",
      "Memes Nominee",
      "Memes nominee",
    ]);

    expect(
      getGrantRepCategoriesToDisplay({
        search: "Top Artist",
        categories: ["top artist"],
        includeTypedCategory: true,
      })
    ).toEqual(["Top Artist", "top artist"]);
  });
});
