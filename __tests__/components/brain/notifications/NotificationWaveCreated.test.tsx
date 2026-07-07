import { render, screen } from "@testing-library/react";
import NotificationWaveCreated from "@/components/brain/notifications/wave-created/NotificationWaveCreated";

jest.mock("next/link", () => ({
  __esModule: true,
  default: (p: any) => <a {...p}>{p.children}</a>,
}));
jest.mock(
  "@/components/brain/notifications/wave-created/NotificationWaveFollowBtn",
  () => ({
    __esModule: true,
    default: (props: { followLabel?: string; followingLabel?: string }) => (
      <div data-testid="wave-follow">
        {props.followLabel}/{props.followingLabel}
      </div>
    ),
  })
);
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock("@/components/brain/notifications/NotificationsFollowBtn", () => ({
  __esModule: true,
  default: (props: { followLabel?: string; followingLabel?: string }) => (
    <div data-testid="follow-btn">
      {props.followLabel}/{props.followingLabel}
    </div>
  ),
}));
jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: () => "/scaled.jpg",
  getScaledResolvedImageUri: () => "/scaled.jpg",
  ImageScale: {},
}));
jest.mock("@/helpers/Helpers", () => ({
  getTimeAgoShort: () => "1m",
  parseIpfsUrl: (url: string) => url,
}));

const notification = {
  related_identity: { handle: "alice", pfp: "pfp.png" },
  additional_context: { wave_id: "1" },
  related_wave: {
    id: "1",
    name: "Wave 1",
    is_dm_wave: false,
  },
  created_at: "2024-01-01T00:00:00Z",
} as any;

it("renders wave data and links", () => {
  render(<NotificationWaveCreated notification={notification} />);
  expect(screen.getByRole("link", { name: "alice" })).toHaveAttribute(
    "href",
    "/alice"
  );
  expect(screen.getByRole("link", { name: "Wave 1" })).toHaveAttribute(
    "href",
    "/waves/1"
  );
  expect(
    screen.getByText("created a wave you can access:")
  ).toBeInTheDocument();
  expect(screen.getByTestId("wave-follow")).toHaveTextContent(
    "Join wave/Joined"
  );
  expect(screen.getByTestId("follow-btn")).toHaveTextContent(
    "Follow creator/Following creator"
  );
  const img = screen.getByRole("img");
  expect(img.getAttribute("src")).toContain("scaled.jpg");
});

it("renders direct message wave notifications with DM copy and action", () => {
  render(
    <NotificationWaveCreated
      notification={{
        ...notification,
        related_wave: {
          ...notification.related_wave,
          is_dm_wave: true,
        },
      }}
    />
  );

  expect(screen.getByText("started a DM with you:")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Wave 1" })).toHaveAttribute(
    "href",
    "/messages/1"
  );
  expect(screen.getByRole("link", { name: "Open DM" })).toHaveAttribute(
    "href",
    "/messages/1"
  );
  expect(screen.queryByTestId("wave-follow")).toBeNull();
});

it("renders fallback wave text without a link when wave id is missing", () => {
  render(
    <NotificationWaveCreated
      notification={{
        ...notification,
        additional_context: {},
        related_wave: undefined,
      }}
    />
  );

  expect(screen.getByText("Unknown wave")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Unknown wave" })).toBeNull();
  expect(screen.queryByTestId("wave-follow")).toBeNull();
});
