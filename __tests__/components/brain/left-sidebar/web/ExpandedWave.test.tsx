import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpandedWave } from "@/components/brain/left-sidebar/web/WebBrainLeftSidebarWave/subcomponents/ExpandedWave";
import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";
import type { ApiWaveScore } from "@/generated/models/ApiWaveScore";

type MockWavePinProps = {
  readonly className?: string;
  readonly isPinned?: boolean;
};

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    onMouseEnter,
    onClick,
    className,
    ...rest
  }: any) => (
    <a
      href={href}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={className}
      {...rest}
    >
      {children}
    </a>
  ),
}));

jest.mock("@/components/waves/WavePicture", () => () => (
  <span data-testid="wave-picture" />
));
jest.mock(
  "@/components/brain/left-sidebar/waves/BrainLeftSidebarWaveDropTime",
  () => (props: any) => <span data-testid="drop-time">{props.time}</span>
);
jest.mock(
  "@/components/brain/left-sidebar/waves/BrainLeftSidebarWavePin",
  () => (props: MockWavePinProps) => (
    <button
      type="button"
      className={props.className}
      data-testid="pin"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {String(props.isPinned)}
    </button>
  )
);

const baseWave = createMockMinimalWave({
  id: "1",
  name: "Chat Wave",
});
const waveScore = {
  visibility_score: 83,
  quality_score: 78,
  hotness_score: 92,
  rep_sort_score: 41,
} as ApiWaveScore;

const getWaveRow = (): HTMLElement => screen.getByRole("group");

const renderExpandedWave = (
  overrides: Partial<React.ComponentProps<typeof ExpandedWave>> = {}
) => {
  const onClick = jest.fn();
  const onToggleExpand = jest.fn();

  render(
    <ExpandedWave
      formattedWaveName="Chat Wave"
      haveNewDrops={false}
      href="/waves/1"
      isActive={false}
      isDropWave={false}
      isPinned={false}
      latestDropTimestamp={123}
      nameRef={React.createRef<HTMLDivElement>()}
      onClick={onClick}
      showExpandedTooltip={false}
      showPin={false}
      tooltipContent="Chat Wave"
      tooltipId="wave-expanded-1"
      tooltipPlacement="right"
      wave={baseWave}
      waveId="1"
      onToggleExpand={onToggleExpand}
      {...overrides}
    />
  );

  return { onClick, onToggleExpand };
};

describe("ExpandedWave", () => {
  it("uses normal row padding when a wave has no subwaves", () => {
    renderExpandedWave({
      showPin: true,
    });

    const row = getWaveRow();

    expect(
      screen.queryByRole("button", { name: "Expand Chat Wave subwaves" })
    ).not.toBeInTheDocument();
    expect(row).toHaveClass("tw-px-5");
    expect(row).toHaveClass("tw-gap-x-4");
    expect(row).toHaveClass("tw-items-center");
    expect(row).not.toHaveClass("tw-items-start");
    expect(row).toHaveClass("tw-h-full");
    expect(row).toHaveClass("tw-min-h-[62px]");
    expect(row).not.toHaveClass("tw-pl-2");
  });

  it("opens the wave from the stretched row link", async () => {
    const user = userEvent.setup();
    const { onClick } = renderExpandedWave();

    await user.click(screen.getByRole("link", { name: "Chat Wave" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders one row link and keeps the subwave expand button separate", async () => {
    const user = userEvent.setup();
    const { onClick, onToggleExpand } = renderExpandedWave({
      canExpand: true,
      hasUnreadSubwaves: true,
      showPin: true,
    });

    const expandButton = screen.getByRole("button", {
      name: "Expand Chat Wave subwaves",
    });

    expect(expandButton).toHaveAttribute("aria-expanded", "false");
    expect(expandButton).not.toHaveClass("tw-absolute");
    expect(expandButton).toHaveClass("tw-relative");
    expect(expandButton).toHaveClass("tw-inline-flex");
    expect(expandButton).toHaveClass("tw-size-5");
    expect(expandButton).toHaveClass("tw-rounded-full");
    expect(expandButton).toHaveClass("tw-border-0");
    expect(expandButton).toHaveClass("tw-bg-transparent");
    expect(expandButton).toHaveClass("desktop-hover:hover:tw-bg-iron-700/70");
    expect(expandButton.querySelector("svg")).toHaveClass("tw-size-3.5");
    expect(expandButton.querySelector(".tw-bg-primary-400")).toBeNull();
    const unreadSubwavesDot = getWaveRow().querySelector(".tw-bg-primary-400");
    expect(unreadSubwavesDot).not.toBeNull();
    expect(unreadSubwavesDot).toHaveClass("tw-right-[-3px]");
    expect(unreadSubwavesDot).toHaveClass("tw-top-[-3px]");
    expect(getWaveRow()).toHaveClass("tw-px-5");
    expect(getWaveRow()).toHaveClass("tw-gap-x-4");
    expect(getWaveRow()).toHaveClass("tw-items-center");
    expect(getWaveRow()).not.toHaveClass("tw-items-start");
    expect(getWaveRow()).toHaveClass("tw-h-full");
    expect(getWaveRow()).toHaveClass("tw-min-h-[62px]");
    expect(getWaveRow()).not.toHaveClass("tw-pl-2");
    const rowLink = screen.getByRole("link", { name: "Chat Wave" });
    expect(rowLink).toHaveClass("tw-static");
    expect(rowLink).toHaveClass("before:tw-absolute");
    expect(rowLink).toHaveClass("before:tw-inset-0");
    expect(rowLink).toHaveClass("before:tw-z-[5]");
    expect(rowLink).toHaveClass("before:tw-content-['']");
    expect(rowLink).toHaveClass("focus-visible:before:tw-ring-2");
    expect(expandButton.closest("a")).toBeNull();
    expect(expandButton.parentElement).toHaveClass("tw-z-10");
    const avatar = screen.getByTestId("sidebar-wave-avatar");
    expect(avatar).toHaveAttribute("aria-hidden", "true");
    expect(avatar.closest("a")).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(1);

    await user.click(expandButton);

    expect(onToggleExpand).toHaveBeenCalledWith("1");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("anchors the expanded title tooltip to the visible row link", () => {
    renderExpandedWave({
      showExpandedTooltip: true,
      showPin: true,
    });

    const rowLink = screen.getByRole("link", { name: "Chat Wave" });
    const tooltipAnchor = screen.getByText("Chat Wave");

    expect(rowLink).not.toHaveAttribute("data-tooltip-id");
    expect(tooltipAnchor.closest("a")).toBe(rowLink);
    expect(tooltipAnchor).toHaveAttribute("data-tooltip-id", "wave-expanded-1");
    expect(tooltipAnchor).toHaveAttribute("data-tooltip-content", "Chat Wave");
    expect(tooltipAnchor).toHaveClass("tw-relative");
    expect(tooltipAnchor).toHaveClass("tw-z-[6]");
  });

  it("does not navigate when the pin control is clicked", async () => {
    const user = userEvent.setup();
    const { onClick } = renderExpandedWave({
      showPin: true,
    });

    await user.click(screen.getByTestId("pin"));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not render a nested expand button for child rows", () => {
    renderExpandedWave({
      depth: 1,
      canExpand: true,
      isLastSubwave: true,
      showPin: true,
    });

    expect(
      screen.queryByRole("button", { name: "Expand Chat Wave subwaves" })
    ).not.toBeInTheDocument();
    expect(getWaveRow()).toHaveClass("tw-pl-[74px]");
    expect(getWaveRow()).toHaveClass("md:tw-pl-[66px]");
    expect(screen.getByTestId("wave-picture").parentElement).toHaveClass(
      "tw-size-7"
    );
    const rail = getWaveRow().querySelector(".tw-w-px");
    expect(rail).not.toBeNull();
    expect(rail).toHaveClass("tw-left-[35.5px]");
    expect(rail).not.toHaveClass("md:tw-left-11");
    expect(rail).toHaveClass("-tw-top-1");
    expect(rail).toHaveClass("tw-bottom-4");
    expect(getWaveRow()).toHaveClass("tw-items-center");
    expect(getWaveRow()).not.toHaveClass("tw-items-start");
    expect(getWaveRow()).toHaveClass("tw-h-full");
    expect(getWaveRow()).toHaveClass("tw-min-h-[54px]");
    expect(getWaveRow().querySelector(".tw-h-px")).toBeNull();
    expect(screen.queryByTestId("pin")).not.toBeInTheDocument();
  });

  it("keeps the expand button visually active when subwaves are open", () => {
    renderExpandedWave({
      canExpand: true,
      isExpanded: true,
    });

    const expandButton = screen.getByRole("button", {
      name: "Collapse Chat Wave subwaves",
    });

    expect(expandButton).toHaveClass("tw-bg-iron-700/60");
    expect(expandButton).toHaveClass("tw-text-iron-200");
    expect(expandButton).toHaveClass("tw-opacity-100");
  });

  it("places the timestamp below the title and keeps pin before the far-right score", () => {
    renderExpandedWave({
      showPin: true,
      wave: createMockMinimalWave({
        id: "1",
        name: "Chat Wave",
        waveScore,
      }),
    });

    const timestamp = screen.getByTestId("drop-time");
    const timestampWrapper = timestamp.parentElement;
    const textStack = timestampWrapper?.parentElement;
    const metadataRow = textStack?.parentElement;
    const trailingCluster = screen
      .getByText("83")
      .closest("[aria-label]")
      ?.closest(".tw-ml-auto");
    const pin = screen.getByTestId("pin");
    const score = screen.getByText("83").closest("[aria-label]");

    expect(textStack?.children[1]).toBe(timestampWrapper);
    expect(metadataRow?.children[1]).toBe(trailingCluster);
    expect(timestampWrapper).not.toHaveClass("tw-ml-auto");
    expect(timestampWrapper).not.toHaveClass("-tw-mt-0.5");
    expect(trailingCluster).toHaveClass("tw-ml-auto");
    expect(trailingCluster).toHaveClass("tw-items-center");
    expect(trailingCluster?.firstElementChild).toBe(pin);
    expect(trailingCluster?.lastElementChild).toContainElement(score);
  });

  it("overlaps non-final child rails to avoid visible line gaps", () => {
    renderExpandedWave({
      depth: 1,
      isLastSubwave: false,
    });

    const rail = getWaveRow().querySelector(".tw-w-px");

    expect(rail).not.toBeNull();
    expect(rail).toHaveClass("-tw-top-1");
    expect(rail).toHaveClass("-tw-bottom-1");
  });

  it("prefetches subwaves after hover intent on expandable rows", () => {
    jest.useFakeTimers();
    const onPrefetchSubwaves = jest.fn();

    try {
      renderExpandedWave({
        canExpand: true,
        onPrefetchSubwaves,
      });

      const waveRow = getWaveRow();

      fireEvent.mouseEnter(waveRow);

      act(() => {
        jest.advanceTimersByTime(149);
      });
      expect(onPrefetchSubwaves).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(onPrefetchSubwaves).toHaveBeenCalledWith("1");
    } finally {
      jest.useRealTimers();
    }
  });

  it("cancels subwave prefetch when hover intent ends early", () => {
    jest.useFakeTimers();
    const onPrefetchSubwaves = jest.fn();

    try {
      renderExpandedWave({
        canExpand: true,
        onPrefetchSubwaves,
      });

      const row = getWaveRow();

      fireEvent.mouseEnter(row);
      fireEvent.mouseLeave(row);

      act(() => {
        jest.advanceTimersByTime(150);
      });
      expect(onPrefetchSubwaves).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});
