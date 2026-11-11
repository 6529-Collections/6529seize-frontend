import RepCategoryPill from "@/components/user/rep/RepCategoryPill";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/components/common/OverlappingAvatars", () => ({
  __esModule: true,
  default: () => <div data-testid="avatars" />,
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
        canEdit={false}
        onEdit={() => undefined}
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

  it("keeps edit and contributor actions separate", () => {
    const onEdit = jest.fn();
    const onOpenContributors = jest.fn();

    render(
      <RepCategoryPill
        category={category}
        canEdit
        onEdit={onEdit}
        onOpenContributors={onOpenContributors}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit REP category Dev extraordinaire",
      })
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "View 2 raters for Dev extraordinaire",
      })
    );

    expect(onEdit).toHaveBeenCalledWith("Dev extraordinaire");
    expect(onOpenContributors).toHaveBeenCalledWith(category);
  });
});
