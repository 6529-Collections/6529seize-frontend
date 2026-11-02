import { render, screen } from "@testing-library/react";
import NotificationMemeCollaboration from "@/components/brain/notifications/NotificationMemeCollaboration";
import type { INotificationMemeCollaboration } from "@/types/feed.types";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { commonApiFetch } from "@/services/api/common-api";
import { fetchNotificationsV2 } from "@/services/api/notifications-v2-api";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/helpers/competition.helpers", () => ({
  isMultiCompetitionEnabled: () => false,
}));

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/utils/tooltip/UserProfileTooltipWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock(
  "@/components/brain/notifications/subcomponents/NotificationTimestamp",
  () => ({ __esModule: true, default: () => <span>Timestamp</span> })
);
function notification(event: string): INotificationMemeCollaboration {
  return {
    created_at: 1,
    related_identity: {
      id: "actor",
      handle: "phoebeum",
      pfp: "https://example.com/avatar.png",
    },
    additional_context: {
      event_type: event,
      wave_id: "wave/1",
      drop_id: "drop/1",
      invitation_id: "invite",
      artwork_name: "Test Cat",
    },
  } as INotificationMemeCollaboration;
}
it.each([
  ["INVITED", "invited you to collaborate on", "Review invitation"],
  ["ACCEPTED", "accepted your collaboration invitation for", "View artwork"],
  ["CANCELLED", "cancelled your collaboration invitation for", "View artwork"],
])(
  "renders the %s actor avatar, profile and named artwork with the correct action",
  (event, message, action) => {
    render(
      <NotificationMemeCollaboration notification={notification(event)} />
    );
    expect(screen.getByRole("img", { name: "phoebeum" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "phoebeum" })).toHaveAttribute(
      "href",
      "/phoebeum"
    );
    expect(screen.getByText(message)).toBeVisible();
    expect(screen.getByRole("link", { name: "Test Cat" })).toHaveAttribute(
      "href",
      "/waves/wave%2F1?drop=drop%2F1"
    );
    expect(
      screen.queryByRole("link", { name: action })
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByText("Timestamp")).toBeVisible();
  }
);
it("keeps older notifications readable without a profile or saved artwork name", () => {
  const old = {
    ...notification("INVITED"),
    related_identity: null,
    additional_context: {
      event_type: "INVITED",
      wave_id: "wave/1",
      drop_id: "drop/1",
      invitation_id: "invite",
    },
  };
  render(<NotificationMemeCollaboration notification={old} />);
  expect(screen.getByText("You were invited to collaborate on")).toBeVisible();
  expect(screen.getByRole("link", { name: "an artwork" })).toBeVisible();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});
it("does not construct broken artwork links when route context is missing", () => {
  const base = notification("INVITED");
  const invalid = {
    ...base,
    additional_context: { ...base.additional_context, wave_id: "" },
  };
  render(<NotificationMemeCollaboration notification={invalid} />);
  expect(screen.getByText("Test Cat")).toBeVisible();
  expect(
    screen.queryByRole("link", { name: "Review invitation" })
  ).not.toBeInTheDocument();
});
it("uses a neutral fallback for an unknown event", () => {
  render(
    <NotificationMemeCollaboration notification={notification("UNKNOWN")} />
  );
  expect(
    screen.getByText("An artwork collaboration invitation was updated.")
  ).toBeVisible();
  expect(
    screen.queryByText("invited you to collaborate on")
  ).not.toBeInTheDocument();
});

it("uses the artwork fallback when a saved title contains only whitespace", () => {
  const base = notification("INVITED");
  render(
    <NotificationMemeCollaboration
      notification={{
        ...base,
        additional_context: { ...base.additional_context, artwork_name: "   " },
      }}
    />
  );
  expect(screen.getByRole("link", { name: "an artwork" })).toBeVisible();
});

it.each(["INVITED", "ACCEPTED", "CANCELLED"] as const)(
  "renders the fetched and adapted %s notification with its actor and named artwork",
  async (event_type) => {
    jest.mocked(commonApiFetch).mockResolvedValue({
      unread_count: 1,
      notifications: [
        {
          id: 123,
          cause: ApiNotificationCause.MemeCollaboration,
          created_at: 1,
          read_at: null,
          related_drops: [],
          related_identity: {
            id: "actor",
            handle: "phoebeum",
            pfp: "https://example.com/avatar.png",
            primary_address: "0xabc",
            level: 21,
            classification: ApiProfileClassification.Pseudonym,
            badges: {},
          },
          additional_context: {
            event_type,
            wave_id: "wave/1",
            drop_id: "drop/1",
            invitation_id: "invite",
            actor_id: "actor",
            artwork_name: "Test Cat",
          },
        },
      ],
    });
    const result = await fetchNotificationsV2({ limit: "30" });
    const item = result.notifications[0];
    if (item?.cause !== ApiNotificationCause.MemeCollaboration)
      throw new Error("Expected collaboration notification");
    render(<NotificationMemeCollaboration notification={item} />);
    expect(screen.getByRole("img", { name: "phoebeum" })).toBeVisible();
    expect(screen.getByRole("link", { name: "phoebeum" })).toHaveAttribute(
      "href",
      "/phoebeum"
    );
    expect(screen.getByRole("link", { name: "Test Cat" })).toHaveAttribute(
      "href",
      "/waves/wave%2F1?drop=drop%2F1"
    );
    expect(screen.getAllByRole("link")).toHaveLength(2);
  }
);
