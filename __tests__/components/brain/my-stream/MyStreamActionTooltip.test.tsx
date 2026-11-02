import { render, screen } from "@testing-library/react";
import MyStreamActionTooltip from "@/components/brain/my-stream/MyStreamActionTooltip";

const mockTouch = jest.fn(() => false);
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => mockTouch(),
}));

jest.mock("react-tooltip", () => ({
  Tooltip: ({ id }: { readonly id: string }) => (
    <div data-testid="action-tooltip">{id}</div>
  ),
}));

describe("MyStreamActionTooltip", () => {
  beforeEach(() => mockTouch.mockReturnValue(false));
  it("omits hover tooltips on touch devices", () => {
    mockTouch.mockReturnValue(true);
    render(<MyStreamActionTooltip id="touch-action" />);
    expect(screen.queryByTestId("action-tooltip")).not.toBeInTheDocument();
  });
  it("portals the tooltip above local layout stacking contexts", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const { unmount } = render(
      <MyStreamActionTooltip id="wave-header-actions" />,
      { container: host }
    );

    const tooltip = screen.getByTestId("action-tooltip");
    expect(tooltip.parentElement).toBe(document.body);
    expect(host).not.toContainElement(tooltip);

    unmount();
    host.remove();
  });
});
