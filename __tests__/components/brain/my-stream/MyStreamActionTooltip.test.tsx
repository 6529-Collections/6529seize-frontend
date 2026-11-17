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
  it.each(["default", "wave-header"] as const)(
    "omits %s hover tooltips on touch devices",
    (variant) => {
      mockTouch.mockReturnValue(true);
      render(<MyStreamActionTooltip id="touch-action" variant={variant} />);
      expect(screen.queryByTestId("action-tooltip")).not.toBeInTheDocument();
    }
  );
  it.each(["default", "wave-header"] as const)(
    "portals the %s tooltip above local layout stacking contexts",
    (variant) => {
      const host = document.createElement("div");
      document.body.appendChild(host);

      const { unmount } = render(
        <MyStreamActionTooltip id="wave-header-actions" variant={variant} />,
        { container: host }
      );

      const tooltip = screen.getByTestId("action-tooltip");
      expect(tooltip.parentElement).toBe(document.body);
      expect(host).not.toContainElement(tooltip);

      unmount();
      host.remove();
    }
  );
});
