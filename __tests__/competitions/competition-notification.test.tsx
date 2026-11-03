import { render, screen } from "@testing-library/react";
import NotificationCompetitionLifecycle from "@/components/brain/notifications/NotificationCompetitionLifecycle";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { INotificationCompetitionLifecycle } from "@/types/feed.types";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: jest.fn(() => "en-US"),
}));

beforeEach(() => jest.mocked(useBrowserLocale).mockReturnValue("en-US"));

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

it("links the results sentence to the competition entry with a decorative trophy", () => {
  const { container } = render(
    <NotificationCompetitionLifecycle notification={notification} />
  );

  expect(container).toHaveTextContent(
    "Results are in for Community competition"
  );
  expect(screen.queryByText("Competition updated")).toBeNull();
  expect(
    screen.getByRole("link", { name: "Community competition" })
  ).toHaveAttribute("href", "/waves/wave/competitions/competition?entry=entry");
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  expect(container.querySelector("time")).toBeInTheDocument();
});

it.each(["en-US", "en-GB", "fr-FR", "es-ES", "de-DE"] as const)(
  "keeps readable results copy with the current %s dictionary fallback",
  (locale) => {
    jest.mocked(useBrowserLocale).mockReturnValue(locale);
    const { container } = render(
      <NotificationCompetitionLifecycle notification={notification} />
    );
    expect(container).toHaveTextContent(
      "Results are in for Community competition"
    );
    expect(
      screen.getByRole("link", { name: "Community competition" })
    ).toBeVisible();
  }
);

it("preserves a long competition title and opens the competition when there is no entry", () => {
  const title = "CompetitionWithAnUnbrokenName".repeat(8);
  const { container } = render(
    <NotificationCompetitionLifecycle
      notification={{
        ...notification,
        additional_context: {
          wave_id: "wave",
          competition_id: "competition",
          competition_title: title,
          event_id: "event",
          event_type: "COMPETITION_DECISION_COMPLETED",
        },
      }}
    />
  );
  expect(screen.getByRole("link", { name: title })).toHaveAttribute(
    "href",
    "/waves/wave/competitions/competition"
  );
  expect(container).toHaveTextContent(title);
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
