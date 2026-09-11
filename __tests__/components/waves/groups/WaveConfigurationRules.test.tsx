import { render, screen } from "@testing-library/react";
import WaveConfigurationRules from "@/components/waves/groups/WaveConfigurationRules";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

jest.mock("@/components/waves/specs/WaveCustomRules", () => ({
  __esModule: true,
  default: ({ display }: { readonly display?: string }) => (
    <div data-testid="guidelines" data-display={display} />
  ),
}));
jest.mock("@/components/waves/specs/WaveBindingRules", () => ({
  __esModule: true,
  default: ({ display }: { readonly display?: string }) => (
    <div data-testid="acceptance-rules" data-display={display} />
  ),
}));

const makeWave = (type: ApiWaveType): any => ({ wave: { type } });

describe("WaveConfigurationRules", () => {
  it("shows guidelines and acceptance rules in Configuration", () => {
    render(<WaveConfigurationRules wave={makeWave(ApiWaveType.Rank)} />);

    expect(screen.getByTestId("guidelines")).toHaveAttribute(
      "data-display",
      "configuration"
    );
    expect(screen.getByTestId("acceptance-rules")).toHaveAttribute(
      "data-display",
      "configuration"
    );
  });

  it("shows guidelines without acceptance rules for chat waves", () => {
    render(<WaveConfigurationRules wave={makeWave(ApiWaveType.Chat)} />);

    expect(screen.getByTestId("guidelines")).toBeInTheDocument();
    expect(screen.queryByTestId("acceptance-rules")).not.toBeInTheDocument();
  });
});
