import React from "react";
import { render, screen } from "@testing-library/react";
import { CollapsedWave } from "@/components/brain/left-sidebar/web/WebBrainLeftSidebarWave/subcomponents/CollapsedWave";
import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    onMouseEnter,
    onClick,
    className,
    "aria-label": ariaLabel,
    "data-tooltip-id": tooltipId,
  }: any) => (
    <a
      href={href}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
      data-tooltip-id={tooltipId}
    >
      {children}
    </a>
  ),
}));

jest.mock("@/components/waves/WavePicture", () => (props: any) => (
  <img data-testid="wave-picture" alt={props.name} />
));

const baseWave = createMockMinimalWave({
  id: "1",
  name: "Chat Wave",
});

const renderCollapsedWave = (
  overrides: Partial<React.ComponentProps<typeof CollapsedWave>> = {}
) => {
  const onClick = jest.fn();

  render(
    <CollapsedWave
      formattedWaveName="Chat Wave"
      haveNewDrops={false}
      href="/waves/1"
      isActive={false}
      isDropWave={false}
      onClick={onClick}
      showTooltip={false}
      tooltipId="wave-collapsed-1"
      tooltipPlacement="right"
      wave={baseWave}
      {...overrides}
    />
  );

  return { onClick };
};

describe("CollapsedWave", () => {
  it("exposes unread subwaves in the collapsed link name", () => {
    renderCollapsedWave({
      hasUnreadSubwaves: true,
    });

    const link = screen.getByRole("link", {
      name: "Chat Wave, has unread subwaves",
    });

    expect(link).toHaveAttribute("href", "/waves/1");
    const unreadSubwavesDot = link.querySelector(
      "[aria-hidden='true'].tw-bg-primary-400"
    );
    expect(unreadSubwavesDot).not.toBeNull();
    expect(unreadSubwavesDot).toHaveClass("tw-right-[-3px]");
    expect(unreadSubwavesDot).toHaveClass("tw-top-[-3px]");
  });

  it("keeps direct unread drops in the collapsed link name", () => {
    renderCollapsedWave({
      haveNewDrops: true,
      hasUnreadSubwaves: true,
      wave: createMockMinimalWave({
        id: "1",
        name: "Chat Wave",
        newDropsCount: {
          count: 2,
          latestDropTimestamp: 123,
          firstUnreadSerialNo: null,
        },
      }),
    });

    expect(
      screen.getByRole("link", {
        name: "Chat Wave, 2 unread drops, has unread subwaves",
      })
    ).toBeInTheDocument();
  });

  it("omits unread subwaves from the collapsed link name when there are none", () => {
    renderCollapsedWave();

    expect(
      screen.getByRole("link", {
        name: "Chat Wave",
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: /has unread subwaves/,
      })
    ).not.toBeInTheDocument();
  });
});
