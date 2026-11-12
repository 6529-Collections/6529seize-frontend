import RepCategoryPill from "@/components/user/rep/RepCategoryPill";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/components/common/OverlappingAvatars", () => ({
  __esModule: true,
  default: () => <span data-testid="avatars" />,
}));

const category: ApiRepCategory = {
  category: "Dev extraordinaire",
  total_rep: 1234,
  contributor_count: 2,
  authenticated_user_contribution: 50,
  top_contributors: [],
};

describe("RepCategoryPill", () => {
  it("opens category details from the label", () => {
    const onOpenContributors = jest.fn();

    render(
      <RepCategoryPill
        category={category}
        onOpenContributors={onOpenContributors}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open REP category Dev extraordinaire",
      })
    );

    expect(onOpenContributors).toHaveBeenCalledWith(category);
  });

  it("opens category details from the count without an edit shortcut", () => {
    const onOpenContributors = jest.fn();

    render(
      <RepCategoryPill
        category={category}
        onOpenContributors={onOpenContributors}
      />
    );

    fireEvent.click(screen.getByText("2 raters"));

    expect(onOpenContributors).toHaveBeenCalledWith(category);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: /^Edit REP category/ })
    ).not.toBeInTheDocument();
  });
});
