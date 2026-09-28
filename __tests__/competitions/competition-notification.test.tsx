import { render, screen } from "@testing-library/react";
import NotificationCompetitionLifecycle from "@/components/brain/notifications/NotificationCompetitionLifecycle";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { INotificationCompetitionLifecycle } from "@/types/feed.types";

it("identifies a disqualified entry and links to its competition history", () => {
  const notification: INotificationCompetitionLifecycle = {
    id: 1,
    created_at: 1,
    read_at: null,
    cause: ApiNotificationCause.CompetitionLifecycle,
    additional_context: {
      wave_id: "wave",
      competition_id: "competition",
      competition_title: "Community competition",
      event_id: "event",
      event_type: "ENTRY_DISQUALIFIED",
      entry_id: "entry",
    },
  };

  render(<NotificationCompetitionLifecycle notification={notification} />);

  expect(screen.getByText("Competition entry disqualified")).toBeVisible();
  expect(screen.queryByText("Competition updated")).toBeNull();
  expect(
    screen.getByRole("link", { name: "Community competition" })
  ).toHaveAttribute("href", "/waves/wave/competitions/competition?entry=entry");
});
