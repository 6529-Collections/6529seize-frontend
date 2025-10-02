import { render, screen } from "@testing-library/react";
import CreateWaveOutcomeWarning from "@/components/waves/create-wave/outcomes/CreateWaveOutcomeWarning";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

jest.mock(
  "@/components/waves/create-wave/utils/CreateWaveWarning",
  () => ({
    __esModule: true,
    default: ({ title, description }: any) => (
      <div data-testid="warning">{title} - {description}</div>
    ),
  })
);

describe("CreateWaveOutcomeWarning", () => {
  it("returns null for non-approve waves", () => {
    const { container } = render(
      <CreateWaveOutcomeWarning
        waveType={ApiWaveType.Rank}
        dates={{} as any}
        maxWinners={null}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows indefinite warning when no endDate", () => {
    render(
      <CreateWaveOutcomeWarning
        waveType={ApiWaveType.Approve}
        dates={{} as any}
        maxWinners={null}
      />
    );
    expect(screen.getByTestId("warning")).toHaveTextContent(
      "Warning: Challenge Will Run Indefinitely"
    );
  });

  it("shows unlimited warning when endDate present", () => {
    render(
      <CreateWaveOutcomeWarning
        waveType={ApiWaveType.Approve}
        dates={{ endDate: 1 } as any}
        maxWinners={null}
      />
    );
    expect(screen.getByTestId("warning")).toHaveTextContent(
      "Warning: Unlimited Awards"
    );
  });

  it("returns null when maxWinners set", () => {
    const { container } = render(
      <CreateWaveOutcomeWarning
        waveType={ApiWaveType.Approve}
        dates={{ endDate: 1 } as any}
        maxWinners={5}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
