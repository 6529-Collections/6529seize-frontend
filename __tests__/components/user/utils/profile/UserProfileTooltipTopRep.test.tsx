import { render, screen } from "@testing-library/react";

import UserProfileTooltipTopRep from "@/components/user/utils/profile/UserProfileTooltipTopRep";
import type { ApiProfileRepRatesState } from "@/entities/IProfile";

const repRates = {
  total_rep_rating: 24,
  total_rep_rating_by_rater: null,
  rep_rates_left_for_rater: null,
  number_of_raters: 3,
  rating_stats: [
    {
      category: "Builder",
      rating: 12,
      contributor_count: 2,
      rater_contribution: 0,
    },
    {
      category: "Collector",
      rating: 7,
      contributor_count: 5,
      rater_contribution: 0,
    },
    {
      category: "Curator",
      rating: 7,
      contributor_count: 8,
      rater_contribution: 0,
    },
    {
      category: "Muted",
      rating: -2,
      contributor_count: 1,
      rater_contribution: 0,
    },
  ],
} satisfies ApiProfileRepRatesState;

describe("UserProfileTooltipTopRep", () => {
  it("renders the top rep categories with compact brain-style tags", () => {
    render(<UserProfileTooltipTopRep repRates={repRates} />);

    expect(screen.getByText("Top Rep")).toHaveClass(
      "tw-font-semibold",
      "tw-uppercase",
      "tw-text-iron-500"
    );

    expect(screen.getByText("Builder")).toHaveClass(
      "tw-font-medium",
      "tw-text-white"
    );
    expect(screen.getByText("12")).toHaveClass(
      "tw-font-medium",
      "tw-text-green"
    );

    expect(screen.getByText("Curator")).toBeInTheDocument();
    expect(screen.getByText("Collector")).toBeInTheDocument();
    expect(screen.queryByText("Muted")).not.toBeInTheDocument();

    expect(screen.getByText("Builder").closest("div")).toHaveClass(
      "tw-rounded-lg",
      "tw-border-white/10",
      "tw-bg-[#18191B]"
    );
  });

  it.each([
    {
      name: "mixed signs",
      ratings: [1, 10, -50_000, -900],
      categories: ["Small", "Positive", "Large negative", "Other negative"],
      expected: ["Large negative", "Other negative", "Positive"],
    },
    {
      name: "positive values",
      ratings: [1, 100, 10, 5],
      categories: ["Small", "Large", "Medium", "Extra"],
      expected: ["Large", "Medium", "Extra"],
    },
    {
      name: "negative values",
      ratings: [-1, -100, -10, -5],
      categories: ["Small", "Large", "Medium", "Extra"],
      expected: ["Large", "Medium", "Extra"],
    },
    {
      name: "equal magnitudes regardless of sign or contributor count",
      ratings: [50, -50, -50, 50],
      categories: ["Zulu", "alpha", "Alpha", "Beta"],
      expected: ["Alpha", "Beta", "Zulu"],
    },
    {
      name: "zero totals after nonzero values",
      ratings: [0, -1, 0],
      categories: ["Zulu", "Negative", "Alpha"],
      expected: ["Negative", "Alpha", "Zulu"],
    },
  ])(
    "orders $name without changing the source data",
    ({ ratings, categories, expected }) => {
      const data = {
        ...repRates,
        rating_stats: categories.map((category, index) => ({
          category,
          rating: ratings[index]!,
          contributor_count: 10 - index,
          rater_contribution: 0,
        })),
      };
      const original = [...data.rating_stats];
      Object.freeze(data.rating_stats);

      const { container } = render(
        <UserProfileTooltipTopRep repRates={data} />
      );

      expect(
        Array.from(
          container.querySelectorAll("span.tw-truncate"),
          (tag) => tag.textContent
        )
      ).toEqual(expected);
      expect(data.rating_stats).toEqual(original);
    }
  );

  it("preserves negative and zero score formatting and colors", () => {
    render(
      <UserProfileTooltipTopRep
        repRates={{
          ...repRates,
          rating_stats: [
            {
              category: "Negative",
              rating: -50_000,
              contributor_count: 1,
              rater_contribution: 0,
            },
            {
              category: "Zero",
              rating: 0,
              contributor_count: 2,
              rater_contribution: 0,
            },
          ],
        }}
      />
    );

    expect(screen.getByText("-50,000")).toHaveClass("tw-text-red");
    expect(screen.getByText("0")).toHaveClass("tw-text-iron-400");
  });

  it("renders nothing when there are no rep categories", () => {
    const { container } = render(
      <UserProfileTooltipTopRep
        repRates={{
          total_rep_rating: 0,
          total_rep_rating_by_rater: null,
          rep_rates_left_for_rater: null,
          number_of_raters: 0,
          rating_stats: [],
        }}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
