import { act, fireEvent, render, screen } from "@testing-library/react";
import { ExploreWaveCard } from "@/components/home/explore-waves/ExploreWaveCard";
import { getTimeAgoShort } from "@/helpers/Helpers";
import type { ImgHTMLAttributes, ReactNode } from "react";
import type { SidebarWave } from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { getWaveCardTint } from "@/components/home/explore-waves/getWaveCardTint";

jest.mock("@/components/home/explore-waves/getWaveCardTint");

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
    expect(screen.getByText(/2m ago · 7/i)).toBeInTheDocument();
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

  it("keeps the homepage cover source, description, and link when styling changes", () => {
    const wave = createWave({
      descriptionDrop: {
        contents: "**A wave** for [art](https://example.com)",
        media: [],
      },
      picture: "https://example.com/wave.png",
    });
    const { rerender } = render(
      <ExploreWaveCard wave={wave} horizontalOnMobile />
    );
    const link = screen.getByRole("link", { name: /^View wave Wave One/ });
    expect(link).toHaveAttribute("href", "/waves/wave-1");
    expect(screen.getByText("A wave for art")).toBeInTheDocument();
    expect(screen.getByText(/2m ago · 3/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("img")).toHaveAttribute(
      "sizes",
      "(max-width: 639px) 33vw, (max-width: 767px) 17vw, (max-width: 1023px) 50vw, 33vw"
    );
    expect(mockContentDisplay).not.toHaveBeenCalled();

    rerender(<ExploreWaveCard wave={wave} />);
    expect(screen.getByTestId("content-display")).toBeInTheDocument();
  });

  it("samples only the desktop homepage variant and clears tint on mobile", () => {
    const desktop = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    const mediaSpy = jest
      .spyOn(window, "matchMedia")
      .mockReturnValue(desktop as unknown as MediaQueryList);
    jest.mocked(getWaveCardTint).mockReturnValue("20 30 40");
    const wave = createWave({ picture: "https://example.com/tinted-wave.png" });
    const { rerender, unmount } = render(
      <ExploreWaveCard wave={wave} horizontalOnMobile />
    );
    const card = screen.getByRole("link");
    const details = card.lastElementChild as HTMLElement;
    fireEvent.load(screen.getByRole("img"));
    expect(getWaveCardTint).not.toHaveBeenCalled();
    expect(details.style.getPropertyValue("--card-tint")).toBe("");

    const changeBreakpoint = desktop.addEventListener.mock
      .calls[0]![1] as () => void;
    desktop.matches = true;
    act(changeBreakpoint);
    expect(details.style.getPropertyValue("--card-tint")).toBe("20 30 40");
    rerender(<ExploreWaveCard wave={wave} horizontalOnMobile />);
    fireEvent.mouseOver(card);
    expect(getWaveCardTint).toHaveBeenCalledTimes(1);

    desktop.matches = false;
    act(changeBreakpoint);
    expect(details.style.getPropertyValue("--card-tint")).toBe("");
    desktop.matches = true;
    rerender(<ExploreWaveCard wave={wave} />);
    fireEvent.load(screen.getByRole("img"));
    expect(getWaveCardTint).toHaveBeenCalledTimes(1);
    expect(desktop.removeEventListener).toHaveBeenCalledWith(
      "change",
      changeBreakpoint
    );
    unmount();
    mediaSpy.mockRestore();
  });

  it("reuses the image tint on Discover mobile without resampling on hover or rerender", () => {
    const mediaSpy = jest.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as unknown as MediaQueryList);
    jest.mocked(getWaveCardTint).mockReturnValue("20 30 40");
    const wave = createWave({
      picture: "https://example.com/discover-wave.png",
    });
    const { rerender, unmount } = render(
      <ExploreWaveCard wave={wave} artworkOverlay />
    );
    const card = screen.getByRole("link");
    const details = card.lastElementChild as HTMLElement;
    expect(details.style.getPropertyValue("--card-tint")).toBe("20 30 40");
    const calls = jest.mocked(getWaveCardTint).mock.calls.length;
    rerender(<ExploreWaveCard wave={wave} artworkOverlay />);
    fireEvent.mouseOver(card);
    expect(getWaveCardTint).toHaveBeenCalledTimes(calls);
    expect(screen.getByTestId("content-display")).toBeInTheDocument();
    expect(screen.getByText(/2m ago · 3/i)).toBeInTheDocument();
    expect(card).toHaveAttribute("href", "/waves/wave-1");
    expect(screen.getAllByRole("link")).toHaveLength(1);
    rerender(<ExploreWaveCard wave={wave} compact artworkOverlay />);
    expect(details.style.getPropertyValue("--card-tint")).toBe("");
    expect(getWaveCardTint).toHaveBeenCalledTimes(calls);
    unmount();
    mediaSpy.mockRestore();
  });

  it("keeps the untinted fallback when a homepage Wave has no artwork", () => {
    const samplingCalls = jest.mocked(getWaveCardTint).mock.calls.length;
    render(
      <ExploreWaveCard
        wave={createWave({ picture: null })}
        horizontalOnMobile
      />
    );

    const card = screen.getByRole("link");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      (card.lastElementChild as HTMLElement).style.getPropertyValue("--card-tint")
    ).toBe("");
    expect(getWaveCardTint).toHaveBeenCalledTimes(samplingCalls);
    expect(card).toHaveAttribute("href", "/waves/wave-1");
    expect(screen.getByText("Description preview")).toBeInTheDocument();
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

  it("renders a plain-text homepage description between activity and scores", () => {
    render(
      <ExploreWaveCard
        horizontalOnMobile
        wave={createWave({
          descriptionDrop: {
            contents:
              "**Punk6529's** [book list](https://example.com/books) and _discussion_",
            media: [],
          },
          waveScore: {
            visibility_score: 96,
            quality_score: 90,
            hotness_score: 98,
            rep_sort_score: 76,
          } as SidebarWave["waveScore"],
        })}
      />
    );

    const description = screen.getByText("Punk6529's book list and discussion");
    const activity = screen.getByText(/2m ago · 3/i);
    const score = screen.getByText("Score");
    expect(mockContentDisplay).not.toHaveBeenCalled();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(description.childElementCount).toBe(0);
    expect(activity.compareDocumentPosition(description)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(description.compareDocumentPosition(score)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it("shows labelled score, hotness, and REP values in one icon row", () => {
    render(
      <ExploreWaveCard
        wave={createWave({
          waveRep: {
            total_rep: 1_250,
          } as SidebarWave["waveRep"],
          waveScore: {
            visibility_score: 96,
            quality_score: 90,
            hotness_score: 98,
            rep_sort_score: 76,
          } as SidebarWave["waveScore"],
        })}
      />
    );

    expect(screen.getByText("Score")).toBeInTheDocument();
    expect(screen.getByText("Hot")).toBeInTheDocument();
    expect(screen.getByText("REP")).toBeInTheDocument();
    expect(screen.getByText("96")).toBeInTheDocument();
    expect(screen.getByText("98")).toBeInTheDocument();
    expect(screen.getByText("+1.3K")).toBeInTheDocument();

    const metricsRow = screen
      .getByText("96")
      .closest(".explore-wave-card-metrics");
    expect(metricsRow).toBeInTheDocument();
    expect(metricsRow).toHaveClass("tw-flex-wrap");

    const scoreBadge = screen.getByText("96").closest("[aria-label]");
    expect(scoreBadge).toHaveAttribute(
      "aria-label",
      "Visibility score 96 out of 100"
    );

    expect(screen.getByText("98").closest("[aria-label]")).toHaveAttribute(
      "aria-label",
      "Hotness score 98 out of 100"
    );
    expect(screen.getByText("+1.3K").closest("[aria-label]")).toHaveAttribute(
      "aria-label",
      "Wave REP positive 1,250"
    );

    expect(
      screen.getByRole("link", {
        name: /View wave Wave One\. Visibility score 96 out of 100\./,
      })
    ).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Wave REP positive 1,250")
    );
  });

  it("shows REP score fallback when raw wave REP is missing", () => {
    render(
      <ExploreWaveCard
        wave={createWave({
          waveRep: null,
          waveScore: {
            visibility_score: 72,
            quality_score: null,
            hotness_score: null,
            rep_sort_score: 76,
          } as SidebarWave["waveScore"],
        })}
      />
    );

    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("76")).toBeInTheDocument();
    expect(screen.getByText("REP")).toBeInTheDocument();
    expect(screen.getByText("76").closest("[aria-label]")).toHaveAttribute(
      "aria-label",
      "Wave REP score 76 out of 100"
    );
    expect(
      screen.getByRole("link", {
        name: /View wave Wave One\. Visibility score 72 out of 100\./,
      })
    ).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Wave REP score 76 out of 100")
    );
  });
});

function createWave(overrides: Partial<SidebarWave> = {}): SidebarWave {
  return {
    id: "wave-1",
    name: "Wave One",
    type: ApiWaveType.Chat,
    createdAt: 0,
    creator: null,
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
    waveRep: null,
    waveScore: null,
    ...overrides,
  };
}
