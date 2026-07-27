import NotificationSubscriptionCoverage from "@/components/brain/notifications/subscription-coverage/NotificationSubscriptionCoverage";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import { ApiSubscriptionCoverageStatus } from "@/generated/models/ApiSubscriptionCoverageStatus";
import type { INotificationSubscriptionCoverage } from "@/types/feed.types";
import { render, screen } from "@testing-library/react";

describe("NotificationSubscriptionCoverage", () => {
  it("renders the risk, runway, authoritative deadline, and exact minimum top up", () => {
    const notification: INotificationSubscriptionCoverage = {
      id: 42,
      cause: ApiNotificationCause.SubscriptionCoverage,
      created_at: Date.now(),
      read_at: null,
      additional_context: {
        profile_handle: "sesamenoodles",
        status: ApiSubscriptionCoverageStatus.ActionRequired,
        consolidation_key: "profile-key",
        mint_capacity: 2,
        allocated_mints: 2,
        fully_funded_drops: 0,
        funded_through: null,
        next_unfunded: {
          token_id: 561,
          mint_at: new Date("2026-10-14T15:40:00Z"),
          requested_mints: 3,
          funded_mints: 2,
          missing_mints: 1,
        },
        minimum_top_up_eth: "0.01587",
        top_up_deadline: new Date("2026-10-12T14:30:00Z"),
      },
    };

    render(<NotificationSubscriptionCoverage notification={notification} />);

    expect(
      screen.getByText("Your immediate next intended drop is not fully funded.")
    ).toBeInTheDocument();
    expect(screen.getByText("0 drops funded")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Top up by Oct 12, 2026, 14:30 UTC to receive The Memes #561."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Top up 0.01587 ETH" })
    ).toHaveAttribute(
      "href",
      "/sesamenoodles/subscriptions#profile-subscriptions-top-up"
    );
  });
});
