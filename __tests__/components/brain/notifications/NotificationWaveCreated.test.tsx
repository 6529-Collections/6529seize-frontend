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
    default: () => <div data-testid="wave-follow" />,
  })
);
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock("@/components/brain/notifications/NotificationsFollowBtn", () => ({
  __esModule: true,
  default: () => <div data-testid="follow-btn" />,
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
  expect(screen.getByTestId("wave-follow")).toBeInTheDocument();
  expect(screen.getByTestId("follow-btn")).toBeInTheDocument();
  const img = screen.getByRole("img");
  expect(img.getAttribute("src")).toContain("scaled.jpg");
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
