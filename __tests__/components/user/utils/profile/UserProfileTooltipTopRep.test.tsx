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
