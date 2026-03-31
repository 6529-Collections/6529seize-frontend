import React from "react";
import { render, screen } from "@testing-library/react";
import WaveProfileTooltipWrapper from "@/components/utils/tooltip/WaveProfileTooltipWrapper";

const mockUseDeviceInfo = jest.fn(() => ({
  hasTouchScreen: false,
}));

jest.mock("@/components/utils/tooltip/HoverCard", () => ({
  __esModule: true,
  default: ({ ariaLabel, children }: any) => (
    <div data-testid="hover-card" data-aria-label={ariaLabel}>
      {children}
    </div>
  ),
}));

jest.mock("@/components/waves/utils/profile/WaveProfileTooltip", () => ({
  __esModule: true,
  default: () => <div data-testid="wave-profile-tooltip" />,
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseDeviceInfo(...args),
}));

describe("WaveProfileTooltipWrapper", () => {
  beforeEach(() => {
    mockUseDeviceInfo.mockReturnValue({
      hasTouchScreen: false,
    });
  });

  it("uses the initial wave name for the hover card label when available", () => {
    render(
      <WaveProfileTooltipWrapper
        waveId="wave-1"
        initialWave={{ name: "Genesis" } as any}
        fallbackName="Mentioned wave"
      >
        <button type="button">Wave Trigger</button>
      </WaveProfileTooltipWrapper>
    );

    expect(screen.getByTestId("hover-card")).toHaveAttribute(
      "data-aria-label",
      "Wave details for Genesis"
    );
  });

  it("falls back to the provided fallback name when the initial wave name is unavailable", () => {
    render(
      <WaveProfileTooltipWrapper waveId="wave-2" fallbackName="Mentioned wave">
        <button type="button">Wave Trigger</button>
      </WaveProfileTooltipWrapper>
    );

    expect(screen.getByTestId("hover-card")).toHaveAttribute(
      "data-aria-label",
      "Wave details for Mentioned wave"
    );
  });

  it("falls back to the wave id when no names are available", () => {
    render(
      <WaveProfileTooltipWrapper waveId="wave-3">
        <button type="button">Wave Trigger</button>
      </WaveProfileTooltipWrapper>
    );

    expect(screen.getByTestId("hover-card")).toHaveAttribute(
      "data-aria-label",
      "Wave details for Wave wave-3"
    );
  });
});
