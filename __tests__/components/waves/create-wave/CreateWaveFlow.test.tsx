import { fireEvent, render, screen } from "@testing-library/react";
import CreateWaveFlow from "../../../../components/waves/create-wave/CreateWaveFlow";

jest.mock("../../../../hooks/isMobileScreen", () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useIsMobileScreen from "../../../../hooks/isMobileScreen";
const mockedUseIsMobileScreen = useIsMobileScreen as jest.Mock;

describe("CreateWaveFlow", () => {
  it("renders title size based on screen width", () => {
    mockedUseIsMobileScreen.mockReturnValueOnce(true);
    const { rerender } = render(
      <CreateWaveFlow title="Test" onBack={() => {}}>
        <div data-testid="child" />
      </CreateWaveFlow>
    );
    expect(screen.getByText("Test")).toHaveClass("tw-text-3xl");

    mockedUseIsMobileScreen.mockReturnValueOnce(false);
    rerender(
      <CreateWaveFlow title="Test" onBack={() => {}}>
        <div data-testid="child" />
      </CreateWaveFlow>
    );
    expect(screen.getByText("Test")).toHaveClass("tw-text-5xl");
  });

  it("invokes onBack when button clicked", () => {
    mockedUseIsMobileScreen.mockReturnValue(false);
    const onBack = jest.fn();
    render(
      <CreateWaveFlow title="BackTest" onBack={onBack}>
        <span />
      </CreateWaveFlow>
    );
    fireEvent.click(screen.getByRole("button", { name: "All Waves" }));
    expect(onBack).toHaveBeenCalled();
  });
});
