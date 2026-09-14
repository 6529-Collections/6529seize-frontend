import DropVoteDistribution from "@/components/waves/drop/DropVoteDistribution";
import type { DropVoteSummaryState } from "@/components/waves/drop/useDropVoteSummary";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiDropVoteDistribution } from "@/generated/models/ApiDropVoteDistribution";
import type { ApiDropVoter } from "@/generated/models/ApiDropVoter";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const drop = {
  id: "drop-1",
  drop_type: ApiDropType.Participatory,
  wave: { voting_credit_type: ApiWaveCreditType.Tdh },
} as ExtendedDrop;

const voter = (id: string, handle: string, vote: number): ApiDropVoter =>
  ({
    voter: { id, handle, primary_address: "UNKNOWN" },
    vote,
  }) as ApiDropVoter;

const ready = (
  voteDistribution: ApiDropVoteDistribution,
  retry = jest.fn()
): DropVoteSummaryState => ({
  status: "ready",
  voteDistribution,
  retry,
});

describe("DropVoteDistribution", () => {
  it.each([
    {
      label: "positive-only",
      distribution: {
        positive_total: 100,
        negative_total: 0,
        positive_votes: [voter("supporter", "Supporter", 60)],
        negative_votes: [],
      },
      expectedName: "Supporter",
    },
    {
      label: "negative-only",
      distribution: {
        positive_total: 0,
        negative_total: -100,
        positive_votes: [],
        negative_votes: [voter("opponent", "Opponent", -60)],
      },
      expectedName: "Opponent",
    },
    {
      label: "mixed",
      distribution: {
        positive_total: 100,
        negative_total: -40,
        positive_votes: [voter("supporter", "Supporter", 60)],
        negative_votes: [voter("opponent", "Opponent", -30)],
      },
      expectedName: "Supporter",
    },
  ])(
    "renders a valid $label distribution",
    ({ distribution, expectedName }) => {
      render(
        <DropVoteDistribution drop={drop} voteSummary={ready(distribution)} />
      );

      expect(
        screen.getByRole("button", { name: "View vote breakdown" })
      ).toBeInTheDocument();
      expect(screen.getAllByText(expectedName).length).toBeGreaterThan(0);
    }
  );

  it("uses authoritative totals when voter enrichment is partial", () => {
    render(
      <DropVoteDistribution
        drop={drop}
        voteSummary={ready({
          positive_total: 100,
          negative_total: 0,
          positive_votes: [],
          negative_votes: [],
        })}
      />
    );

    expect(
      screen.getByRole("button", { name: "View vote breakdown" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Other positive voters combined: +100 TDH")
    ).toBeInTheDocument();
  });

  it("shows a stable accessible loading state", () => {
    render(
      <DropVoteDistribution drop={drop} voteSummary={{ status: "loading" }} />
    );

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveTextContent("Loading current votes…");
    expect(status).toHaveClass("tw-min-h-[4.75rem]");
  });

  it("shows a recoverable unavailable state", async () => {
    const user = userEvent.setup();
    const retry = jest.fn();
    render(
      <DropVoteDistribution
        drop={drop}
        voteSummary={{ status: "unavailable", retry }}
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Current votes couldn’t be loaded."
    );
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("offers recovery when a response is malformed", () => {
    const retry = jest.fn();
    render(
      <DropVoteDistribution
        drop={drop}
        voteSummary={ready(
          {
            positive_total: 100,
            negative_total: 0,
            positive_votes: [voter("opponent", "Opponent", -100)],
            negative_votes: [],
          },
          retry
        )}
      />
    );

    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
