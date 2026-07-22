import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageRepNewRepSearch, {
  getGrantRepCategoriesToDisplay,
} from "@/components/user/rep/new-rep/UserPageRepNewRepSearch";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";

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
  useRepAllocation: () => ({
    repState: null,
    heroAvailableRep: 100,
    minMaxValues: { min: -100, max: 100 },
  }),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn().mockResolvedValue(true),
  commonApiPost: jest.fn(),
}));

describe("UserPageRepNewRepSearch", () => {
  beforeEach(() => {
    (commonApiFetch as jest.Mock).mockResolvedValue(true);
    (useQuery as jest.Mock).mockReturnValue({
      isFetching: false,
      data: ["MemesNominee"],
    });
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
