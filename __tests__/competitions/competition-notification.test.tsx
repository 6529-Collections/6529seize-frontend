import { render, screen } from "@testing-library/react";
import NotificationCompetitionLifecycle from "@/components/brain/notifications/NotificationCompetitionLifecycle";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { INotificationCompetitionLifecycle } from "@/types/feed.types";

it("links winner notifications to the competition entry", () => {
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
      event_type: "COMPETITION_DECISION_COMPLETED",
      entry_id: "entry",
    },
  };

  render(<NotificationCompetitionLifecycle notification={notification} />);

  expect(screen.getByText("New competition results")).toBeVisible();
  expect(screen.queryByText("Competition updated")).toBeNull();
  expect(
    screen.getByRole("link", { name: "Community competition" })
  ).toHaveAttribute("href", "/waves/wave/competitions/competition?entry=entry");
});

it.each([
  "ENTRY_DISQUALIFIED",
  "COMPETITION_ENTRY_DISQUALIFIED",
  "COMPETITION_ENTRY_WITHDRAWN",
  "COMPETITION_ENTRY_DELETED",
  "COMPETITION_UPDATED",
])("hides cached removal and status notifications (%s)", (event_type) => {
  const notification = {
    cause: ApiNotificationCause.CompetitionLifecycle,
    additional_context: { event_type },
  } as INotificationCompetitionLifecycle;
  const { container } = render(
    <NotificationCompetitionLifecycle notification={notification} />
  );
  expect(container).toBeEmptyDOMElement();
});
