import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/components/waves/outcome/WaveRepOutcome", () => ({
  __esModule: true,
  WaveRepOutcome: (props: any) => <div data-testid="rep" />,
}));
jest.mock("@/components/waves/outcome/WaveNICOutcome", () => ({
  __esModule: true,
  WaveNICOutcome: (props: any) => <div data-testid="nic" />,
}));
jest.mock("@/components/waves/outcome/WaveManualOutcome", () => ({
  __esModule: true,
  WaveManualOutcome: (props: any) => <div data-testid="manual" />,
}));

jest.mock("@/hooks/waves/useWaveOutcomeDistributionQuery", () => ({
  useWaveOutcomeDistributionQuery: jest.fn().mockReturnValue({
    items: [],
    totalCount: 0,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
    isLoading: false,
    isError: false,
    errorMessage: undefined,
  }),
}));

import { WaveOutcome } from "@/components/waves/outcome/WaveOutcome";
import { ApiWaveOutcomeCredit } from "@/generated/models/ApiWaveOutcomeCredit";

describe("WaveOutcome", () => {
  it("renders rep outcome", () => {
    render(
      <WaveOutcome
        waveId="wave-1"
        outcome={{ credit: ApiWaveOutcomeCredit.Rep, index: 0 } as any}
      />
    );
    expect(screen.getByTestId("rep")).toBeInTheDocument();
  });

  it("renders nic outcome", () => {
    render(
      <WaveOutcome
        waveId="wave-2"
        outcome={{ credit: ApiWaveOutcomeCredit.Cic, index: 1 } as any}
      />
    );
    expect(screen.getByTestId("nic")).toBeInTheDocument();
  });

  it("renders manual outcome", () => {
    render(
      <WaveOutcome
        waveId="wave-3"
        outcome={{ credit: "OTHER", index: 2 } as any}
      />
    );
    expect(screen.getByTestId("manual")).toBeInTheDocument();
  });
});
