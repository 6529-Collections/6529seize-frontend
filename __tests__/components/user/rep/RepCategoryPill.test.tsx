import RepCategoryPill from "@/components/user/rep/RepCategoryPill";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import type { RepDirection } from "@/components/user/rep/UserPageRep.helpers";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/components/common/OverlappingAvatars", () => ({
  __esModule: true,
  default: ({
    items,
    size,
  }: {
    items: { key: string; href?: string; ariaLabel: string }[];
    size: string;
  }) => (
    <span data-testid="avatars" data-size={size}>
      {items.map((item) =>
        item.href ? (
          <a key={item.key} href={item.href}>
            {item.ariaLabel}
          </a>
        ) : (
          <span key={item.key}>{item.ariaLabel}</span>
        )
      )}
    </span>
  ),
}));

const category: ApiRepCategory = {
  category: "Dev extraordinaire",
  total_rep: 1234,
  contributor_count: 2,
  authenticated_user_contribution: 50,
  top_contributors: [],
};

describe("RepCategoryPill", () => {
  it("hides stale personal amounts unless the caller enables them for a signed-in viewer", () => {
    render(
      <RepCategoryPill category={category} onOpenContributors={jest.fn()} />
    );
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-describedby");
    expect(
      screen.queryByText(/You assigned:|Assigned to you:/)
    ).not.toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeVisible();
  });

  it("opens category details from the label", () => {
    const onOpenContributors = jest.fn();

    render(
      <RepCategoryPill
        showPersonalContribution
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

  it("uses one category toggle without an edit shortcut", () => {
    const onOpenContributors = jest.fn();

    render(
      <RepCategoryPill
        showPersonalContribution
        category={category}
        onOpenContributors={onOpenContributors}
      />
    );

    expect(screen.getByText("2 raters")).toBeVisible();
    fireEvent.click(screen.getByRole("button"));

    expect(onOpenContributors).toHaveBeenCalledWith(category);
    expect(screen.getByText(/You assigned:/)).toBeVisible();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: /^Edit REP category/ })
    ).not.toBeInTheDocument();
  });

  it.each([true, false])(
    "keeps 24px avatar links separate from the toggle (links: %s)",
    (linkAvatars) => {
      const onOpenContributors = jest.fn();
      render(
        <RepCategoryPill
          category={{
            ...category,
            top_contributors: [
              {
                profile: {
                  id: "alice",
                  handle: "alice",
                  primary_address: "0x123",
                  pfp: null,
                  banner1_color: null,
                  banner2_color: null,
                  cic: 0,
                  rep: 20,
                  tdh: 0,
                  tdh_rate: 0,
                  xtdh: 0,
                  xtdh_rate: 0,
                  level: 0,
                  classification: ApiProfileClassification.Pseudonym,
                  sub_classification: null,
                  subscribed_actions: [],
                  archived: false,
                  active_main_stage_submission_ids: [],
                  winner_main_stage_drop_ids: [],
                  artist_of_prevote_cards: [],
                  profile_wave_id: null,
                  is_wave_creator: false,
                },
                contribution: 20,
              },
            ],
          }}
          linkAvatars={linkAvatars}
          onOpenContributors={onOpenContributors}
        />
      );
      expect(screen.getByTestId("avatars")).toHaveAttribute("data-size", "sm");
      expect(screen.getByRole("button").querySelector("a")).toBeNull();
      if (linkAvatars) {
        const link = screen.getByRole("link", { name: "alice" });
        expect(link).toHaveAttribute("href", "/alice");
        fireEvent.click(link);
        expect(onOpenContributors).not.toHaveBeenCalled();
      } else expect(screen.queryByRole("link")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button"));
      expect(onOpenContributors).toHaveBeenCalledWith(
        expect.objectContaining({ category: category.category })
      );
    }
  );

  it.each<{ direction: RepDirection; amount: number; description: string }>([
    {
      direction: "received",
      amount: 12345,
      description: "You assigned: 12,345",
    },
    {
      direction: "received",
      amount: -12345,
      description: "You assigned: -12,345",
    },
    {
      direction: "given",
      amount: 12345,
      description: "Assigned to you: 12,345",
    },
    {
      direction: "given",
      amount: -12345,
      description: "Assigned to you: -12,345",
    },
  ])(
    "shows the personal amount for $direction ($amount)",
    ({ direction, amount, description }) => {
      render(
        <RepCategoryPill
          showPersonalContribution
          category={{ ...category, authenticated_user_contribution: amount }}
          direction={direction}
          onOpenContributors={jest.fn()}
        />
      );
      expect(screen.getByRole("button")).toHaveAccessibleDescription(
        description
      );
    }
  );

  it.each([null, 0])("omits a personal amount of %s", (amount) => {
    render(
      <RepCategoryPill
        showPersonalContribution
        category={{ ...category, authenticated_user_contribution: amount }}
        onOpenContributors={jest.fn()}
      />
    );
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-describedby");
    expect(
      screen.queryByText(/You assigned:|Assigned to you:/)
    ).not.toBeInTheDocument();
  });
});
