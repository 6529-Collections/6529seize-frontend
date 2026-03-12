import { render, screen } from "@testing-library/react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ExploreWaveCard } from "@/components/home/explore-waves/ExploreWaveCard";
import { getTimeAgoShort } from "@/helpers/Helpers";
import type { ImgHTMLAttributes, ReactNode } from "react";

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

  it("uses ApiWave last_drop_time and description_drop preview content", () => {
    render(
      <ExploreWaveCard
        wave={createWave({
          last_drop_time: 2_000,
          metrics: {
            drops_count: 7,
            latest_drop_timestamp: 1_000,
          },
          description_drop: {
            parts: [
              {
                part_id: 1,
                content: "Description preview",
                media: [],
                quoted_drop: null,
              },
            ],
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
      content: {
        segments: [{ type: "text", content: "Description preview" }],
        apiMedia: [],
      },
    });
  });

  it("does not render the preview container when description_drop is empty", () => {
    render(
      <ExploreWaveCard
        wave={createWave({
          description_drop: {
            parts: [
              {
                part_id: 1,
                content: "   ",
                media: [],
                quoted_drop: null,
              },
            ],
          },
        })}
      />
    );

    expect(screen.queryByTestId("content-display")).not.toBeInTheDocument();
  });
});

function createWave(overrides: Partial<ApiWave> = {}): ApiWave {
  const baseWave = {
    id: "wave-1",
    serial_no: 1,
    author: {
      handle: "alice",
      banner1_color: null,
      banner2_color: null,
    },
    name: "Wave One",
    picture: null,
    created_at: 1,
    last_drop_time: 1_000,
    description_drop: {
      id: "drop-1",
      serial_no: 1,
      drop_type: "CHAT",
      rank: null,
      wave: {
        id: "wave-1",
      },
      author: {
        handle: "alice",
      },
      created_at: 1,
      updated_at: null,
      title: null,
      parts: [
        {
          part_id: 1,
          content: "Description preview",
          media: [],
          quoted_drop: null,
        },
      ],
      parts_count: 1,
      referenced_nfts: [],
      mentioned_users: [],
      mentioned_waves: [],
      metadata: [],
      rating: 0,
      realtime_rating: 0,
      rating_prediction: 0,
      top_raters: [],
      raters_count: 0,
      context_profile_context: null,
      subscribed_actions: [],
      is_signed: false,
      reactions: [],
      boosts: 0,
      hide_link_preview: false,
    },
    voting: {},
    visibility: {},
    participation: {},
    chat: {
      scope: {
        group: {
          is_direct_message: false,
        },
      },
      enabled: true,
    },
    wave: {
      type: "CHAT",
    },
    contributors_overview: [],
    subscribed_actions: [],
    metrics: {
      drops_count: 3,
      latest_drop_timestamp: 1_000,
    },
    pauses: [],
    pinned: false,
  } as any;

  return {
    ...baseWave,
    ...overrides,
    metrics: {
      ...baseWave.metrics,
      ...(overrides.metrics as object | undefined),
    },
    description_drop: {
      ...baseWave.description_drop,
      ...(overrides.description_drop as object | undefined),
    },
  } as ApiWave;
}
