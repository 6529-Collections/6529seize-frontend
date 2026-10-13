import { render, screen } from "@testing-library/react";
import NotificationMemeCollaboration from "@/components/brain/notifications/NotificationMemeCollaboration";
import type { INotificationMemeCollaboration } from "@/types/feed.types";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock(
  "@/components/brain/notifications/subcomponents/NotificationTimestamp",
  () => ({ __esModule: true, default: () => <span>Timestamp</span> })
);
function notification(
  event: string,
  waveId = "wave/1"
): INotificationMemeCollaboration {
  return {
    created_at: 1,
    additional_context: {
      event_type: event,
      wave_id: waveId,
      drop_id: "drop/1",
    },
  } as INotificationMemeCollaboration;
}
it.each([
  ["INVITED", "You were invited to collaborate on an artwork."],
  ["ACCEPTED", "A collaborator accepted your artwork invitation."],
  ["UNKNOWN", "An artwork collaboration invitation was updated."],
])(
  "uses accurate copy for %s and links to the encoded artwork route",
  (event, copy) => {
    render(
      <NotificationMemeCollaboration notification={notification(event)} />
    );
    expect(screen.getByText(copy)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/waves/wave%2F1?drop=drop%2F1"
    );
    expect(screen.getByText(copy)).not.toHaveTextContent("Timestamp");
  }
);
it("does not render a broken review link when the route context is missing", () => {
  render(
    <NotificationMemeCollaboration notification={notification("INVITED", "")} />
  );
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
