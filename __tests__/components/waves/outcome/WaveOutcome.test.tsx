import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("../../../../components/waves/outcome/WaveRepOutcome", () => ({
  __esModule: true,
  WaveRepOutcome: (props: any) => <div data-testid="rep" />,
}));
jest.mock("../../../../components/waves/outcome/WaveNICOutcome", () => ({
  __esModule: true,
  WaveNICOutcome: (props: any) => <div data-testid="nic" />,
}));
jest.mock("../../../../components/waves/outcome/WaveManualOutcome", () => ({
  __esModule: true,
  WaveManualOutcome: (props: any) => <div data-testid="manual" />,
}));

import { WaveOutcome } from "../../../../components/waves/outcome/WaveOutcome";
import { ApiWaveOutcomeCredit } from "../../../../generated/models/ApiWaveOutcomeCredit";

describe("WaveOutcome", () => {
  it("renders rep outcome", () => {
    render(<WaveOutcome outcome={{ credit: ApiWaveOutcomeCredit.Rep } as any} />);
    expect(screen.getByTestId("rep")).toBeInTheDocument();
  });

  it("renders nic outcome", () => {
    render(<WaveOutcome outcome={{ credit: ApiWaveOutcomeCredit.Cic } as any} />);
    expect(screen.getByTestId("nic")).toBeInTheDocument();
  });

  it("renders manual outcome", () => {
    render(<WaveOutcome outcome={{ credit: "OTHER" } as any} />);
    expect(screen.getByTestId("manual")).toBeInTheDocument();
  });
});
