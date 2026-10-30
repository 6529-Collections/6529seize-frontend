import { render, screen } from "@testing-library/react";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import React from "react";

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock react-tooltip
jest.mock("react-tooltip", () => ({
  Tooltip: ({ children, id, style }: any) => (
    <div id={id} data-testid={`tooltip-${id}`} role="tooltip" style={style}>
      {children}
    </div>
  ),
}));
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <svg data-testid="icon" />,
}));
jest.mock("@/helpers/Helpers", () => ({
  formatNumberWithCommas: (n: number) => String(n),
}));

describe("DropVoteProgressing", () => {
  it("returns null when invalid values", () => {
    const { container } = render(
      <DropVoteProgressing current={null as any} projected={5} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows projection with positive change", () => {
    const { container } = render(
      <DropVoteProgressing current={1} projected={2} />
    );
    const span = screen.getByText("2");
    expect(span.className).toContain("tw-text-emerald-500");
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(container).toContainElement(screen.getByRole("tooltip"));
  });

  it("can render the tooltip outside a clipped card above its modal", () => {
    const { container } = render(
      <DropVoteProgressing
        current={1}
        projected={2}
        tooltipPortal
        tooltipZIndex={1000002}
      />
    );
    const tooltip = screen.getByRole("tooltip");
    expect(container).not.toContainElement(tooltip);
    expect(tooltip.parentElement).toBe(document.body);
    expect(tooltip.style.zIndex).toBe("1000002");
    expect(tooltip).toHaveTextContent(
      "Projected vote count at decision time: 2"
    );
  });

  it("keeps a modal projection separate from the same totals behind it", () => {
    const { container } = render(
      <>
        <DropVoteProgressing current={1} projected={2} />
        <DropVoteProgressing current={1} projected={2} tooltipPortal />
      </>
    );
    const anchors = container.querySelectorAll("[data-tooltip-id]");
    const ids = Array.from(anchors, (anchor) =>
      anchor.getAttribute("data-tooltip-id")
    );
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) {
      expect(document.getElementById(id!)).toHaveAttribute("role", "tooltip");
    }
  });

  it("uses subtle styling when subtle prop set", () => {
    render(<DropVoteProgressing current={2} projected={1} subtle />);
    const span = screen.getByText("1");
    expect(span.className).toContain("tw-text-iron-600");
  });

  it("uses a custom tooltip label when provided", () => {
    render(
      <DropVoteProgressing
        current={1}
        projected={2}
        tooltipLabel="Votes given now"
      />
    );

    expect(screen.getByRole("tooltip")).toHaveTextContent("Votes given now: 2");
  });

  it("uses a compact display label while keeping exact tooltip value", () => {
    render(
      <DropVoteProgressing
        current={1}
        projected={2000}
        projectedLabel="2K"
        tooltipLabel="Realtime votes given"
      />
    );

    expect(screen.getByText("2K")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Realtime votes given: 2000"
    );
  });
});
