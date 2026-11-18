import { act, render, screen, waitFor, within } from "@testing-library/react";
import { useContext } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import userEvent from "@testing-library/user-event";
import UserPageRepNewRepSearch from "@/components/user/rep/new-rep/UserPageRepNewRepSearch";
import { getGrantRepCategoriesToDisplay } from "@/components/user/rep/new-rep/grantRepCategoryOptions";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { useRepAllocation } from "@/hooks/useRepAllocation";

jest.unmock("react-use");

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
jest.mock(
  "@/components/user/rep/new-rep/UserPageRepNewRepError",
  () =>
    ({ msg }: { readonly msg: string }) => <div data-testid="error">{msg}</div>
);
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
    ratingStats: [],
    heroAvailableRep: 100,
    proxyAvailableCredit: null,
    minMaxValues: { min: -100, max: 100 },
    isError: false,
    isFetching: false,
    retry: jest.fn(),
  };
  const mockAllocation = jest.mocked(useRepAllocation);
  let suggestedCategories: string[];

  beforeEach(() => {
    jest.clearAllMocks();
    mockAllocation.mockReturnValue(allocation);
    jest
      .mocked(commonApiFetch)
      .mockImplementation(async ({ endpoint }) =>
        endpoint.startsWith("rep/categories/availability?")
          ? true
          : suggestedCategories
      );
    suggestedCategories = ["MemesNominee"];
  });

  it("prefills known chips, changes categories, and distinguishes editing from a new grant", async () => {
    const user = userEvent.setup();
    suggestedCategories = ["Music"];
    const ratings = [
      {
        category: "AI",
        rating: 2000,
        contributor_count: 3,
        rater_contribution: 1000,
      },
      {
        category: "Research",
        rating: 500,
        contributor_count: 2,
        rater_contribution: -25,
      },
      {
        category: "Music",
        rating: 900,
        contributor_count: 1,
        rater_contribution: 0,
      },
    ];
    mockAllocation.mockImplementation(({ category }) => ({
      ...allocation,
      ratingStats: ratings,
      repState: ratings.find((item) => item.category === category) ?? null,
    }));
    render(
      <UserPageRepNewRepSearch
        overview={null}
        profile={{ query: "recipient" } as ApiIdentity}
      />
    );
    const own = screen.getByRole("group", { name: "You assigned" });
    expect(
      screen.queryByRole("group", { name: "On this profile" })
    ).not.toBeInTheDocument();
    await user.click(within(own).getByRole("button", { name: "AI 1,000" }));
    expect(
      screen.getByRole("textbox", { name: "Your total REP for this category" })
    ).toHaveValue("1000");
    const amount = screen.getByRole("textbox", {
      name: "Your total REP for this category",
    });
    expect(amount).toHaveFocus();
    await waitFor(() => {
      expect((amount as HTMLInputElement).selectionStart).toBe(0);
      expect((amount as HTMLInputElement).selectionEnd).toBe(4);
    });
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(
      screen.queryByText(
        "Enter the total you want to give, including any existing rating."
      )
    ).toBeVisible();
    expect(
      within(own).getByRole("button", { name: "AI 1,000" })
    ).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Change category" }));
    await user.click(screen.getByRole("button", { name: "Research -25" }));
    expect(
      screen.getByRole("textbox", { name: "Your total REP for this category" })
    ).toHaveValue("-25");
    expect(screen.getByText("Current Rep:").parentElement).toHaveTextContent(
      "Current Rep:-25"
    );
    expect(screen.getByText("Adjustment:").parentElement).toHaveTextContent(
      "Adjustment:0"
    );
    await user.click(screen.getByRole("button", { name: "Change category" }));
    await user.type(
      screen.getByRole("textbox", { name: "Category to grant REP for" }),
      "mus"
    );
    expect(
      screen.queryByRole("button", { name: "AI 1,000" })
    ).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Music" }));
    expect(
      screen.getByRole("textbox", { name: "Your total REP for this category" })
    ).toHaveValue("0");
    expect(screen.getByRole("button", { name: "Grant Rep" })).toBeDisabled();
    expect(screen.getByText("Current Rep:").parentElement).toHaveTextContent(
      "Current Rep:0"
    );
    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "rep/categories/availability?param=mus",
      })
    );
    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "rep/categories/availability?param=Music",
      })
    );
    expect(commonApiPost).not.toHaveBeenCalled();
    const search = screen.getByRole("textbox", {
      name: "Category to grant REP for",
    });
    await user.click(search);
    await user.keyboard("{End}{Backspace}");
    expect(search).toHaveValue("Musi");
    expect(
      screen.getByRole("textbox", { name: "Your total REP for this category" })
    ).toBeDisabled();
    await user.keyboard("@");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "These characters can't be used"
    );
  });

  it.each([
    { ratingStats: [] },
    {
      ratingStats: [
        {
          category: "Music",
          rating: 900,
          contributor_count: 1,
          rater_contribution: 0,
        },
      ],
    },
  ])(
    "omits chip groups when no REP has been assigned (%j)",
    ({ ratingStats }) => {
      mockAllocation.mockReturnValue({ ...allocation, ratingStats });
      render(
        <UserPageRepNewRepSearch
          overview={null}
          profile={{ query: "recipient" } as ApiIdentity}
        />
      );
      expect(
        screen.getByRole("textbox", { name: "Category to grant REP for" })
      ).toHaveValue("");
      expect(screen.queryByRole("group")).not.toBeInTheDocument();
      expect(screen.getByText("Your available REP:")).toBeVisible();
      expect(screen.getByText("Your REP assigned to recipient:")).toBeVisible();
      expect(
        screen.getByText("Your REP assigned to recipient:").parentElement
      ).toHaveTextContent("Your REP assigned to recipient:0");
      expect(
        screen.queryByText("No REP assigned yet.")
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("textbox", {
          name: "Your total REP for this category",
        })
      ).toBeDisabled();
      expect(screen.getByRole("button", { name: "Grant Rep" })).toBeDisabled();
    }
  );

  it("retains an over-budget draft on blur and enables Save only after a valid change", async () => {
    const user = userEvent.setup();
    const rating = {
      category: "Art",
      rating: 20,
      contributor_count: 1,
      rater_contribution: 20,
    };
    mockAllocation.mockImplementation(({ category }) => ({
      ...allocation,
      ratingStats: [rating],
      repState: category === "Art" ? rating : null,
    }));
    render(
      <UserPageRepNewRepSearch
        overview={null}
        profile={{ query: "recipient" } as ApiIdentity}
      />
    );
    await user.click(screen.getByRole("button", { name: "Art 20" }));
    const input = screen.getByRole("textbox", {
      name: "Your total REP for this category",
    });
    await user.clear(input);
    await user.type(input, "101");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText("Your available REP:", { exact: true }).parentElement
    ).toHaveClass("tw-text-rose-400");
    await user.tab();
    expect(input).toHaveValue("101");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await user.clear(input);
    await user.type(input, "30");
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent("Current Rep:+20");
    expect(screen.getByRole("status")).toHaveTextContent("Adjustment:+10");
    expect(commonApiPost).not.toHaveBeenCalled();
  });

  it("ignores a delayed search choice after the user picks a known category", async () => {
    const user = userEvent.setup();
    const rating = {
      category: "Art",
      rating: 20,
      contributor_count: 1,
      rater_contribution: 20,
    };
    mockAllocation.mockImplementation(({ category }) => ({
      ...allocation,
      ratingStats: [rating],
      repState: category === "Art" ? rating : null,
    }));
    let finish = (_value: boolean) => {};
    jest.mocked(commonApiFetch).mockReturnValueOnce(
      new Promise<boolean>((resolve) => {
        finish = resolve;
      })
    );
    render(
      <UserPageRepNewRepSearch
        overview={null}
        profile={{ query: "recipient" } as ApiIdentity}
      />
    );
    const search = screen.getByRole("textbox", {
      name: "Category to grant REP for",
    });
    await user.type(search, "Other{enter}");
    await user.clear(search);
    await user.click(screen.getByRole("button", { name: "Art 20" }));
    await act(async () => {
      finish(true);
    });
    expect(search).toHaveValue("Art");
    expect(
      screen.getByRole("textbox", { name: "Your total REP for this category" })
    ).toHaveValue("20");
  });

  it("keeps the grant locked and open until the shared rating refresh completes", async () => {
    const user = userEvent.setup();
    let finishRefresh = () => {};
    const refresh = new Promise<void>((resolve) => {
      finishRefresh = resolve;
    });
    const onProfileRepModify = jest.fn(() => refresh);
    const onSuccess = jest.fn();
    jest.mocked(commonApiPost).mockResolvedValue(undefined);
    mockAllocation.mockReturnValue({
      ...allocation,
      repState: {
        category: "Art",
        rating: 0,
        contributor_count: 0,
        rater_contribution: 0,
      },
    });
    suggestedCategories = ["Art"];
    function Harness() {
      const auth = useContext(AuthContext);
      const queries = useContext(ReactQueryWrapperContext);
      return (
        <AuthContext.Provider
          value={{ ...auth, requestAuth: async () => ({ success: true }) }}
        >
          <ReactQueryWrapperContext.Provider
            value={{ ...queries, onProfileRepModify }}
          >
            <UserPageRepNewRepSearch
              overview={null}
              profile={{ query: "recipient" } as ApiIdentity}
              onSuccess={onSuccess}
            />
          </ReactQueryWrapperContext.Provider>
        </AuthContext.Provider>
      );
    }
    render(<Harness />);
    await user.type(
      screen.getByRole("textbox", { name: "Category to grant REP for" }),
      "Art"
    );
    const amount = screen.getByRole("textbox", {
      name: "Your total REP for this category",
    });
    await waitFor(() => expect(amount).toBeEnabled());
    await user.clear(amount);
    await user.type(amount, "25");
    const grant = screen.getByRole("button", {
      name: "Grant Rep",
    });
    await user.keyboard("{Enter}");
    await waitFor(() => expect(onProfileRepModify).toHaveBeenCalledTimes(1));
    expect(grant).toBeDisabled();
    expect(amount).toHaveValue("25");
    expect(onSuccess).not.toHaveBeenCalled();
    await act(async () => {
      finishRefresh();
    });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(commonApiPost).toHaveBeenCalledTimes(1);
  });

  it("retains an edit after a failed save and lets the user retry", async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    const rating = {
      category: "Art",
      rating: 20,
      contributor_count: 1,
      rater_contribution: 20,
    };
    mockAllocation.mockReturnValue({
      ...allocation,
      ratingStats: [rating],
      repState: rating,
    });
    jest
      .mocked(commonApiPost)
      .mockRejectedValueOnce(new Error("Try again"))
      .mockResolvedValueOnce(undefined);
    function Harness() {
      const auth = useContext(AuthContext);
      const queries = useContext(ReactQueryWrapperContext);
      return (
        <AuthContext
          value={{ ...auth, requestAuth: async () => ({ success: true }) }}
        >
          <ReactQueryWrapperContext
            value={{ ...queries, onProfileRepModify: async () => {} }}
          >
            <UserPageRepNewRepSearch
              overview={null}
              profile={{ query: "recipient" } as ApiIdentity}
              onSuccess={onSuccess}
            />
          </ReactQueryWrapperContext>
        </AuthContext>
      );
    }
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Art 20" }));
    const amount = screen.getByRole("textbox", {
      name: "Your total REP for this category",
    });
    await user.clear(amount);
    await user.type(amount, "35");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByTestId("error")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Category to grant REP for" })
    ).toHaveAttribute("aria-invalid", "false");
    expect(amount).toHaveValue("35");
    expect(onSuccess).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("error")).not.toBeInTheDocument();
    expect(commonApiPost).toHaveBeenCalledTimes(2);
  });

  it("preserves a typed amount when a delayed rating response arrives", async () => {
    const user = userEvent.setup();
    mockAllocation.mockReturnValue({
      ...allocation,
      minMaxValues: { min: 0, max: 0 },
    });
    suggestedCategories = ["Art"];
    const props = {
      overview: null,
      profile: { query: "recipient" } as ApiIdentity,
    };
    const { rerender } = render(<UserPageRepNewRepSearch {...props} />);
    await user.type(
      screen.getByRole("textbox", { name: "Category to grant REP for" }),
      "Art"
    );
    const amount = screen.getByRole("textbox", {
      name: "Your total REP for this category",
    });
    await waitFor(() => expect(amount).toBeEnabled());
    await user.clear(amount);
    await user.type(amount, "25");
    await user.tab();
    expect(amount).toHaveValue("25");
    expect(screen.getByRole("button", { name: "Grant Rep" })).toBeDisabled();

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
    expect(screen.getByRole("button", { name: "Grant Rep" })).toBeEnabled();
  });

  it("prefills the saved rating and keeps edits through background refreshes", async () => {
    const user = userEvent.setup();
    const props = {
      overview: null,
      profile: { query: "recipient" } as ApiIdentity,
    };
    const { rerender } = render(<UserPageRepNewRepSearch {...props} />);
    suggestedCategories = ["Art"];
    await user.type(
      screen.getByRole("textbox", { name: "Category to grant REP for" }),
      "Art"
    );
    const amount = screen.getByRole("textbox", {
      name: "Your total REP for this category",
    });
    const repState = {
      category: "Art",
      rating: 20,
      contributor_count: 1,
      rater_contribution: 20,
    };
    await waitFor(() => expect(amount).toBeEnabled());
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
    suggestedCategories = ["Art", "Research"];
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
    await user.type(search, "Art");
    const amount = screen.getByRole("textbox", {
      name: "Your total REP for this category",
    });
    await waitFor(() => expect(amount).toHaveValue("20"));
    await user.clear(amount);
    await user.type(amount, "30");
    await user.clear(search);
    await user.type(search, "Research");
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", {
          name: "Your total REP for this category",
        })
      ).toHaveValue("7")
    );
  });

  it("keeps the amount and grant action disabled without a category and keeps Cancel", () => {
    render(
      <UserPageRepNewRepSearch
        overview={null}
        profile={{ query: "recipient" } as ApiIdentity}
        onCancel={jest.fn()}
      />
    );
    expect(
      screen.getByRole("textbox", {
        name: "Your total REP for this category",
      })
    ).toBeDisabled();
    expect(
      screen.getByRole("textbox", { name: "Your total REP for this category" })
    ).toHaveAttribute("placeholder", "0");
    expect(screen.getByRole("button", { name: "Grant Rep" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
    const adjustment = screen
      .getByText("Current Rep:")
      .closest('[role="status"]');
    expect(adjustment).toHaveAttribute("aria-hidden", "true");
    expect(adjustment).toHaveClass("tw-invisible");
  });

  it("shows the minimum-length prompt on empty focus and loading after three characters", async () => {
    const user = userEvent.setup();
    render(
      <UserPageRepNewRepSearch
        overview={null}
        profile={{ query: "recipient" } as ApiIdentity}
      />
    );

    const search = screen.getByRole("textbox", {
      name: "Category to grant REP for",
    });
    await user.click(search);
    expect(screen.getByText("MIN_LENGTH_ERROR")).toBeInTheDocument();
    await user.type(search, "ar");
    expect(screen.getByText("MIN_LENGTH_ERROR")).toBeInTheDocument();
    await user.type(search, "t");

    expect(screen.getByText("LOADING")).toBeInTheDocument();
  });

  it("associates category validation with the search and clears it on edit", async () => {
    const user = userEvent.setup();
    render(
      <UserPageRepNewRepSearch
        overview={null}
        profile={{ query: "recipient" } as ApiIdentity}
      />
    );
    const search = screen.getByRole("textbox", {
      name: "Category to grant REP for",
    });
    expect(search).toHaveAttribute("aria-invalid", "false");
    await user.type(search, "ar{Enter}");
    const error = await screen.findByTestId("error");
    expect(search).toHaveAttribute("aria-invalid", "true");
    expect(search).toHaveAccessibleDescription(/Use at least 3 characters\./);
    expect(search.getAttribute("aria-describedby")?.split(" ")).toContain(
      error.parentElement?.id
    );
    expect(commonApiFetch).not.toHaveBeenCalled();
    await user.type(search, "t");
    expect(search).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByTestId("error")).not.toBeInTheDocument();
  });

  it("checks typed categories after a pause and ignores approval for older text", async () => {
    const user = userEvent.setup();
    let approveOldCategory = () => {};
    const oldApproval = new Promise<boolean>((resolve) => {
      approveOldCategory = () => resolve(true);
    });
    jest.mocked(commonApiFetch).mockImplementation(async ({ endpoint }) => {
      if (endpoint === "rep/categories/availability?param=Artist")
        return oldApproval;
      if (endpoint === "rep/categories/availability?param=artist")
        throw new Error("Category rejected");
      return suggestedCategories;
    });
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
    await user.type(search, "Artist");
    expect(commonApiFetch).not.toHaveBeenCalled();
    expect(amount).toBeDisabled();
    await waitFor(() =>
      expect(commonApiFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "rep/categories/availability?param=Artist",
        })
      )
    );
    await user.clear(search);
    await user.type(search, "artist");
    await act(async () => {
      approveOldCategory();
    });
    expect(amount).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Change category" })
    ).not.toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Category rejected"
    );
    expect(search).toHaveAccessibleDescription(/Category rejected/);
    expect(amount).toBeDisabled();
    expect(screen.getByRole("button", { name: "Grant Rep" })).toBeDisabled();
  });

  it("explains an unavailable category when the endpoint returns false", async () => {
    const user = userEvent.setup();
    jest
      .mocked(commonApiFetch)
      .mockImplementation(async ({ endpoint }) =>
        endpoint.startsWith("rep/categories/availability?")
          ? false
          : suggestedCategories
      );
    render(
      <UserPageRepNewRepSearch
        overview={null}
        profile={{ query: "recipient" } as ApiIdentity}
      />
    );
    const search = screen.getByRole("textbox", {
      name: "Category to grant REP for",
    });
    await user.type(search, " Artist ");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This category name is unavailable. Try a different name."
    );
    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "rep/categories/availability?param=Artist",
      })
    );
    expect(search).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByRole("textbox", { name: "Your total REP for this category" })
    ).toBeDisabled();
  });

  it("reuses approval when Enter confirms the typed category and preserves the amount", async () => {
    const user = userEvent.setup();
    mockAllocation.mockImplementation(({ category }) => ({
      ...allocation,
      repState: category
        ? { category, rating: 0, contributor_count: 0, rater_contribution: 0 }
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
    await waitFor(() => expect(amount).toBeEnabled());
    await user.clear(amount);
    await user.type(amount, "25");
    await user.click(search);
    await user.keyboard("{Enter}");

    expect(
      await screen.findByRole("button", { name: "Change category" })
    ).toBeInTheDocument();
    expect(amount).toHaveValue("25");
    expect(screen.getByRole("button", { name: "Grant Rep" })).toBeEnabled();
    expect(
      jest
        .mocked(commonApiFetch)
        .mock.calls.filter(
          ([{ endpoint }]) =>
            endpoint === "rep/categories/availability?param=Art"
        )
    ).toHaveLength(1);
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

  it("keeps submission guidance and uses Change category to search again", async () => {
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
      within(screen.getByText(/Memes submissions require/)).getByText(
        "MemesNominee"
      )
    ).toHaveClass("tw-text-emerald-400");

    await user.click(screen.getByRole("button", { name: "Change category" }));
    expect(input).toHaveFocus();
    await user.keyboard("meme");

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "MemesNominee" })).toBeVisible()
    );
    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "rep/categories/availability?param=MemesNominee",
      })
    );
  });

  it("warns when a typed MemesNominee look-alike is ready", async () => {
    const user = userEvent.setup();
    suggestedCategories = ["MemesNominee", "Memes nominee"];
    render(
      <UserPageRepNewRepSearch
        overview={null}
        profile={{ query: "recipient" } as ApiIdentity}
      />
    );
    const input = screen.getByPlaceholderText("Category to grant REP for");

    await user.type(input, "Memes nominee");
    await screen.findByText(
      '"Memes nominee" is a separate category. Only MemesNominee counts for submissions.'
    );
    expect(input).toHaveValue("Memes nominee");
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

  it("keeps the canonical suggestion available when Enter is pressed on a look-alike", async () => {
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
    expect(
      await screen.findByRole("button", { name: "MemesNominee" })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Change category" })
    ).not.toBeInTheDocument();
  });

  it("surfaces only the exact submission category ahead of its presentation variant", () => {
    expect(
      getGrantRepCategoriesToDisplay({
        search: "Memes-Nominee",
        categories: [],
        showSubmissionSuggestion: true,
      })
    ).toEqual(["MemesNominee"]);

    expect(
      getGrantRepCategoriesToDisplay({
        search: "memes nomin",
        categories: ["Memes Nominee", "Memes nominee"],
        showSubmissionSuggestion: true,
      })
    ).toEqual(["MemesNominee", "Memes Nominee", "Memes nominee"]);

    expect(
      getGrantRepCategoriesToDisplay({
        search: "Top Artist",
        categories: ["top artist"],
        showSubmissionSuggestion: true,
      })
    ).toEqual(["top artist"]);
  });
});
