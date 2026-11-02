import { render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { renderToString } from "react-dom/server";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import { WaveTooltip } from "@/components/brain/left-sidebar/web/WebBrainLeftSidebarWave/subcomponents/WaveTooltip";

jest.mock("react-tooltip", () => ({
  Tooltip: ({
    id,
    place,
    positionStrategy,
    children,
  }: {
    readonly id: string;
    readonly place?: string;
    readonly positionStrategy?: string;
    readonly children?: ReactNode;
  }) => (
    <div
      data-testid={`tooltip-${id}`}
      data-place={place}
      data-position-strategy={positionStrategy}
    >
      {children}
    </div>
  ),
}));

const renderInsideStackingContext = (ui: ReactElement) => {
  // Mirrors a sidebar row: a positioned, z-indexed wrapper inside a clipped
  // scroll container.
  const scroller = document.createElement("div");
  scroller.style.overflow = "auto";
  const row = document.createElement("div");
  row.style.position = "relative";
  row.style.zIndex = "10";
  row.style.transform = "translateY(0)";
  scroller.appendChild(row);
  document.body.appendChild(scroller);
  const result = render(ui, { container: row });
  return {
    row,
    cleanup: () => {
      result.unmount();
      scroller.remove();
    },
  };
};

describe("BodyPortalTooltip", () => {
  it("renders the tooltip in document.body, outside clipping ancestors", () => {
    const { row, cleanup } = renderInsideStackingContext(
      <BodyPortalTooltip id="pin-tooltip" place="top" />
    );

    const tooltip = screen.getByTestId("tooltip-pin-tooltip");
    expect(tooltip.parentElement).toBe(document.body);
    expect(row).not.toContainElement(tooltip);
    cleanup();
  });

  it("positions against the viewport unless a strategy is supplied", () => {
    const { unmount } = render(
      <>
        <BodyPortalTooltip id="default-strategy" />
        <BodyPortalTooltip id="absolute-strategy" positionStrategy="absolute" />
      </>
    );

    expect(screen.getByTestId("tooltip-default-strategy")).toHaveAttribute(
      "data-position-strategy",
      "fixed"
    );
    expect(screen.getByTestId("tooltip-absolute-strategy")).toHaveAttribute(
      "data-position-strategy",
      "absolute"
    );
    unmount();
  });

  it("renders nothing on the server", () => {
    expect(renderToString(<BodyPortalTooltip id="server" />)).toBe("");
  });

  it("portals sidebar wave-name tooltips, including transformed subwave rows", () => {
    const { row, cleanup } = renderInsideStackingContext(
      <WaveTooltip id="wave-expanded-1" place="right">
        Subwave name
      </WaveTooltip>
    );

    const tooltip = screen.getByTestId("tooltip-wave-expanded-1");
    expect(tooltip.parentElement).toBe(document.body);
    expect(row).not.toContainElement(tooltip);
    expect(tooltip).toHaveAttribute("data-place", "right");
    expect(tooltip).toHaveTextContent("Subwave name");
    cleanup();
  });
});
