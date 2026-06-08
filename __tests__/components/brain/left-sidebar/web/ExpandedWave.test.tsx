import React from "react";
import { render, screen } from "@testing-library/react";
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
  it("renders the subwave expand button as an avatar overlay without opening the wave", async () => {
    const user = userEvent.setup();
    const { onClick, onToggleExpand } = renderExpandedWave({
      canExpand: true,
      hasUnreadSubwaves: true,
    });

    const expandButton = screen.getByRole("button", {
      name: "Expand Chat Wave subwaves",
    });

    expect(expandButton).toHaveAttribute("aria-expanded", "false");
    expect(expandButton).toHaveClass("tw-absolute");
    expect(expandButton).toHaveClass("tw-left-4");
    expect(expandButton).toHaveClass("tw-top-8");
    expect(expandButton.querySelector(".tw-bg-primary-400")).not.toBeNull();
    expect(screen.getByRole("link").parentElement).toHaveClass("tw-gap-x-4");

    await user.click(expandButton);

    expect(onToggleExpand).toHaveBeenCalledWith("1");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not render a nested expand button for child rows", () => {
    renderExpandedWave({
      depth: 1,
      canExpand: true,
      showPin: true,
    });

    expect(
      screen.queryByRole("button", { name: "Expand Chat Wave subwaves" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link").parentElement).toHaveClass("tw-gap-x-2");
    expect(screen.queryByTestId("pin")).not.toBeInTheDocument();
  });
});
