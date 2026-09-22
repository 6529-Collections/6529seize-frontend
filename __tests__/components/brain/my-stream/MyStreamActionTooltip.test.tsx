import { render, screen } from "@testing-library/react";
import MyStreamActionTooltip from "@/components/brain/my-stream/MyStreamActionTooltip";

jest.mock("react-tooltip", () => ({
  Tooltip: ({ id }: { readonly id: string }) => (
    <div data-testid="action-tooltip">{id}</div>
  ),
}));

describe("MyStreamActionTooltip", () => {
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
