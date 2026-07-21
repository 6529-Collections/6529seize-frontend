import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageRepNewRepSearch from "@/components/user/rep/new-rep/UserPageRepNewRepSearch";
import type { GrantRepCategoryOption } from "@/components/user/rep/new-rep/grantRepCategorySearch";
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
      readonly options: readonly GrantRepCategoryOption[];
      readonly onRepSelect: (option: GrantRepCategoryOption) => void;
    }) => (
      <div data-testid="dropdown">
        <span>{props.state}</span>
        {props.options.map((option) => (
          <button
            key={`${option.kind}-${option.category}`}
            onClick={() => props.onRepSelect(option)}
          >
            {option.category}
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

const existingOption = {
  kind: "existing" as const,
  category: "MemesNominee",
  aliases: ["Memes Nominee"],
  selectionReason: "submission" as const,
};

describe("UserPageRepNewRepSearch", () => {
  beforeEach(() => {
    (commonApiFetch as jest.Mock).mockResolvedValue(true);
    (useQuery as jest.Mock).mockReturnValue({
      isError: false,
      isFetching: false,
      data: [existingOption],
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

  it("selects and confirms the exact existing category", async () => {
    const user = userEvent.setup();
    render(
      <UserPageRepNewRepSearch
        overview={null}
        profile={{ query: "recipient" } as ApiIdentity}
      />
    );

    await user.type(
      screen.getByPlaceholderText("Category to grant REP for"),
      "Memes Nominee"
    );
    await waitFor(() => screen.getByRole("button", { name: "MemesNominee" }));
    await user.click(screen.getByRole("button", { name: "MemesNominee" }));

    await waitFor(() => {
      expect(
        screen.getByText("Using existing category: MemesNominee.")
      ).toBeInTheDocument();
    });
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "/rep/categories/availability",
      params: { param: "MemesNominee" },
    });
  });
});
