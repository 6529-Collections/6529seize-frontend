import { render, screen } from "@testing-library/react";
import { ExploreWaveCard } from "@/components/home/explore-waves/ExploreWaveCard";
import { getTimeAgoShort } from "@/helpers/Helpers";
import type { ImgHTMLAttributes, ReactNode } from "react";
import type { SidebarWave } from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}));

const mockContentDisplay = jest.fn();

jest.mock("@/components/waves/drops/ContentDisplay", () => ({
  __esModule: true,
  default: (props: unknown) => {
    mockContentDisplay(props);
    return <div data-testid="content-display" />;
  },
}));

jest.mock("@/helpers/Helpers", () => ({
  getRandomColorWithSeed: jest.fn(() => "#123456"),
  getTimeAgoShort: jest.fn(() => "2m"),
}));

describe("ExploreWaveCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContentDisplay.mockClear();
  });

  it("uses sidebar wave latest drop time, total drops, and description preview", () => {
    render(
      <ExploreWaveCard
        wave={createWave({
          latestDropTimestamp: 2_000,
          totalDropsCount: 7,
          descriptionDrop: {
            contents: "Description preview",
            media: [],
          },
        })}
      />
    );

    expect(getTimeAgoShort).toHaveBeenCalledWith(2_000);
    expect(screen.getByText(/2m · 7/i)).toBeInTheDocument();
    expect(screen.getByTestId("content-display")).toBeInTheDocument();

    const lastContentDisplayProps =
      mockContentDisplay.mock.calls[
        mockContentDisplay.mock.calls.length - 1
      ][0];

    expect(lastContentDisplayProps).toMatchObject({
      linkify: false,
      shouldClamp: false,
      className: expect.stringContaining("tw-items-start"),
      textClassName: expect.stringContaining("tw-line-clamp-2"),
      content: {
        segments: [{ type: "text", content: "Description preview" }],
        apiMedia: [],
      },
    });
  });

  it("shows empty state when latest drop is missing", () => {
    render(
      <ExploreWaveCard
        wave={createWave({
          latestDropTimestamp: null,
        })}
      />
    );

    expect(screen.getByText("No drops yet")).toBeInTheDocument();
  });
});

function createWave(overrides: Partial<SidebarWave> = {}): SidebarWave {
  return {
    id: "wave-1",
    name: "Wave One",
    type: ApiWaveType.Chat,
    createdAt: 0,
    picture: null,
    contributors: [],
    isDirectMessage: false,
    hasCompetition: false,
    parentWaveId: null,
    hasSubwaves: false,
    descriptionDrop: {
      contents: "Description preview",
      media: [],
    },
    totalDropsCount: 3,
    isPrivate: false,
    latestDropTimestamp: 1_000,
    firstUnreadDropSerialNo: null,
    unreadDropsCount: 0,
    latestReadTimestamp: 0,
    pinned: false,
    muted: false,
    subscribed: false,
    ...overrides,
  };
}
