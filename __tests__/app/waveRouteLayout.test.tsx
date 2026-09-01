import WaveLayout from "@/app/waves/[wave]/layout";
import WaveLoading from "@/app/waves/[wave]/loading";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/waves/layout/WavesLayout", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: React.ReactNode }) => (
    <div data-testid="waves-layout">{children}</div>
  ),
}));

jest.mock("@/components/waves/WaveViewLoadingPlaceholder", () => ({
  __esModule: true,
  default: () => <div data-testid="wave-view-loading-placeholder" />,
}));

describe("wave route layout", () => {
  it("keeps the Waves shell outside the route loading placeholder", () => {
    render(
      <WaveLayout>
        <WaveLoading />
      </WaveLayout>
    );

    expect(screen.getByTestId("waves-layout")).toContainElement(
      screen.getByTestId("wave-view-loading-placeholder")
    );
  });
});
