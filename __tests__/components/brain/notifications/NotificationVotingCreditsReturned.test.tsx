import { render, screen } from "@testing-library/react";
import NotificationVotingCreditsReturned from "@/components/brain/notifications/NotificationVotingCreditsReturned";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { INotificationVotingCreditsReturned } from "@/types/feed.types";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock(
  "@/components/brain/notifications/subcomponents/NotificationTimestamp",
  () => ({
    __esModule: true,
    default: () => <span>timestamp</span>,
  })
);

const notification: INotificationVotingCreditsReturned = {
  id: 1,
  cause: ApiNotificationCause.VotingCreditsReturned,
  created_at: 1000,
  read_at: null,
  additional_context: {
    event_id: "release",
    reason: "WIN",
    wave_id: "wave",
    competition_id: "competition",
    competition_title: "The Memes - Main Stage",
    entry_id: "entry",
    drop_id: "drop",
    submission_title: "Freedom To Transcend",
    credit_type: "TDH",
    amount: 1500,
    released_at: 900,
  },
};

it("renders the amount and both destinations without needing a live related drop or actor", () => {
  const { container } = render(
    <NotificationVotingCreditsReturned notification={notification} />
  );
  expect(container).toHaveTextContent(
    "1,500 voting credits were returned to you."
  );
  expect(
    screen.getByRole("link", { name: "Freedom To Transcend" })
  ).toHaveAttribute("href", "/waves/wave/competitions/competition?entry=entry");
  expect(
    screen.getByRole("link", { name: "The Memes - Main Stage" })
  ).toHaveAttribute("href", "/waves/wave/competitions/competition");
});

it("keeps a deleted submission title as text and links only to the surviving competition", () => {
  const { container } = render(
    <NotificationVotingCreditsReturned
      notification={{
        ...notification,
        additional_context: {
          ...notification.additional_context,
          reason: "AUTHOR_DELETED",
          amount: 1,
        },
      }}
    />
  );
  expect(container).toHaveTextContent("was deleted by its author from");
  expect(container).toHaveTextContent("1 voting credit was returned to you.");
  expect(
    screen.queryByRole("link", { name: "Freedom To Transcend" })
  ).not.toBeInTheDocument();
  expect(screen.getAllByRole("link")).toHaveLength(1);
});
