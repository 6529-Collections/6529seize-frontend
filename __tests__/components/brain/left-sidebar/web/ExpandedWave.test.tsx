import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpandedWave } from "@/components/brain/left-sidebar/web/WebBrainLeftSidebarWave/subcomponents/ExpandedWave";
import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, onMouseEnter, onClick, className }: any) => (
    <a
      href={href}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={className}
    >
      {children}
    </a>
  ),
}));

jest.mock("@/components/waves/WavePicture", () => (props: any) => (
  <img data-testid="wave-picture" alt={props.name} />
));
jest.mock(
  "@/components/brain/left-sidebar/waves/BrainLeftSidebarWaveDropTime",
  () => (props: any) => <span data-testid="drop-time">{props.time}</span>
);
jest.mock(
  "@/components/brain/left-sidebar/waves/BrainLeftSidebarWavePin",
  () => (props: any) => <div data-testid="pin">{String(props.isPinned)}</div>
);

const baseWave = createMockMinimalWave({
  id: "1",
  name: "Chat Wave",
});

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

    const row = screen.getByRole("link").parentElement;

    expect(
      screen.queryByRole("button", { name: "Expand Chat Wave subwaves" })
    ).not.toBeInTheDocument();
    expect(row).toHaveClass("tw-px-5");
    expect(row).toHaveClass("tw-gap-x-4");
    expect(row).not.toHaveClass("tw-pl-2");
    expect(screen.getByRole("link").previousElementSibling).toBeNull();
    expect(screen.getByRole("link").nextElementSibling).toBe(
      screen.getByTestId("pin")
    );
  });

  it("renders the subwave expand button before the pin without opening the wave", async () => {
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
    expect(expandButton).toHaveClass("tw-size-6");
    expect(expandButton).toHaveClass("md:tw-size-5");
    expect(expandButton).toHaveClass("tw-rounded-full");
    expect(expandButton).toHaveClass("tw-border-0");
    expect(expandButton).toHaveClass("tw-bg-transparent");
    expect(expandButton).toHaveClass("desktop-hover:hover:tw-bg-iron-700/70");
    expect(expandButton.querySelector(".tw-bg-primary-400")).toBeNull();
    const unreadSubwavesDot = screen
      .getByRole("link")
      .querySelector(".tw-bg-primary-400");
    expect(unreadSubwavesDot).not.toBeNull();
    expect(unreadSubwavesDot).toHaveClass("tw-right-[-3px]");
    expect(unreadSubwavesDot).toHaveClass("tw-top-[-3px]");
    expect(screen.getByRole("link").parentElement).toHaveClass("tw-pl-2");
    expect(screen.getByRole("link").parentElement).toHaveClass("md:tw-pl-1");
    expect(screen.getByRole("link").parentElement).toHaveClass("tw-gap-x-2");
    expect(screen.getByRole("link").parentElement).toHaveClass("md:tw-gap-x-1");
    expect(screen.getByRole("link").previousElementSibling).toContainElement(
      expandButton
    );
    expect(screen.getByRole("link").nextElementSibling).toBe(
      screen.getByTestId("pin")
    );

    await user.click(expandButton);

    expect(onToggleExpand).toHaveBeenCalledWith("1");
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
    expect(screen.getByRole("link").parentElement).toHaveClass("tw-pl-[84px]");
    expect(screen.getByRole("link").parentElement).toHaveClass(
      "md:tw-pl-[72px]"
    );
    expect(screen.getByTestId("wave-picture").parentElement).toHaveClass(
      "tw-size-7"
    );
    const rail = screen
      .getByRole("link")
      .parentElement?.querySelector(".tw-w-px");
    expect(rail).not.toBeNull();
    expect(rail).toHaveClass("tw-left-14");
    expect(rail).toHaveClass("md:tw-left-11");
    expect(rail).toHaveClass("-tw-top-1");
    expect(rail).toHaveClass("tw-bottom-4");
    expect(
      screen.getByRole("link").parentElement?.querySelector(".tw-h-px")
    ).toBeNull();
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
    expect(expandButton).toHaveClass("tw-text-iron-300");
    expect(expandButton).toHaveClass("tw-opacity-100");
  });

  it("overlaps non-final child rails to avoid visible line gaps", () => {
    renderExpandedWave({
      depth: 1,
      isLastSubwave: false,
    });

    const rail = screen
      .getByRole("link")
      .parentElement?.querySelector(".tw-w-px");

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

      const waveRow = screen.getByRole("link").parentElement;
      if (waveRow === null) {
        throw new Error("Expected wave link to have a row parent");
      }

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

      const row = screen.getByRole("link").parentElement;
      if (row === null) {
        throw new Error("Expected wave link to have a row parent");
      }

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
