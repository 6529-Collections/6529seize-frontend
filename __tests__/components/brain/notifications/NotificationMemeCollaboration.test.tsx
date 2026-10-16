import { render, screen } from "@testing-library/react";
import NotificationMemeCollaboration from "@/components/brain/notifications/NotificationMemeCollaboration";
import type { INotificationMemeCollaboration } from "@/types/feed.types";

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
    for (const label of ["Test Cat", action])
      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        "/waves/wave%2F1?drop=drop%2F1"
      );
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
