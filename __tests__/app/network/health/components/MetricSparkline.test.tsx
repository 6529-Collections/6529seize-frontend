import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import MetricSparkline from "@/app/network/health/components/MetricSparkline";

jest.mock("@/components/utils/tooltip/CustomTooltip", () => ({
  __esModule: true,
  default: ({
    content,
    children,
  }: {
    readonly content: ReactNode;
    readonly children: ReactNode;
  }) => (
    <div data-testid="tooltip" data-content={String(content)}>
      {children}
    </div>
  ),
}));

describe("MetricSparkline", () => {
  it("renders bars in original data order", () => {
    render(<MetricSparkline data={[10, 20, 30]} color="tw-bg-blue-500" />);

    const bars = screen
      .getAllByTestId("tooltip")
      .map((tooltip) => tooltip.firstElementChild as HTMLElement);
    const heights = bars.map((bar) => Number.parseFloat(bar.style.height));

    expect(heights).toHaveLength(3);
    expect(heights[0]).toBeCloseTo(33.33, 2);
    expect(heights[1]).toBeCloseTo(66.67, 2);
    expect(heights[2]).toBeCloseTo(100, 2);
  });

  it("keeps tooltip dates aligned with the same data index", () => {
    const jan1 = Date.UTC(2025, 0, 1, 12, 0, 0);
    const jan2 = Date.UTC(2025, 0, 2, 12, 0, 0);

    render(
      <MetricSparkline
        data={[11, 22]}
        color="tw-bg-emerald-500"
        dates={[jan1, jan2]}
      />
    );

    const tooltips = screen.getAllByTestId("tooltip");
    expect(tooltips[0]).toHaveAttribute("data-content", "Jan 1: 11");
    expect(tooltips[1]).toHaveAttribute("data-content", "Jan 2: 22");
  });

  it("returns null when data is empty", () => {
    const { container } = render(
      <MetricSparkline data={[]} color="tw-bg-rose-500" />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders numeric tooltip content when dates are omitted", () => {
    render(<MetricSparkline data={[50]} color="tw-bg-teal-500" />);

    const tooltip = screen.getByTestId("tooltip");
    expect(tooltip).toHaveAttribute("data-content", "50");
  });
});
