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
  it("opens the global category from the label", () => {
    const onOpenGlobalCategory = jest.fn();

    render(
      <RepCategoryPill
        category={category}
        canEdit={false}
        onEdit={() => undefined}
        onOpenGlobalCategory={onOpenGlobalCategory}
        onOpenContributors={() => undefined}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open global REP category Dev extraordinaire",
      })
    );

    expect(onOpenGlobalCategory).toHaveBeenCalledWith("Dev extraordinaire");
  });

  it("keeps edit and contributor actions separate", () => {
    const onEdit = jest.fn();
    const onOpenGlobalCategory = jest.fn();
    const onOpenContributors = jest.fn();

    render(
      <RepCategoryPill
        category={category}
        canEdit
        onEdit={onEdit}
        onOpenGlobalCategory={onOpenGlobalCategory}
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
        name: "View all raters for Dev extraordinaire",
      })
    );

    expect(onEdit).toHaveBeenCalledWith("Dev extraordinaire");
    expect(onOpenContributors).toHaveBeenCalledWith(category);
    expect(onOpenGlobalCategory).not.toHaveBeenCalled();
  });
});
