import { fireEvent, render, screen } from "@testing-library/react";
import CreateWaveFlow from "@/components/waves/create-wave/CreateWaveFlow";

describe("CreateWaveFlow", () => {
  it("keeps Escape navigation for a standalone flow", () => {
    const onBack = jest.fn();
    render(
      <CreateWaveFlow title="Test" onBack={onBack}>
        <button type="button">Continue</button>
      </CreateWaveFlow>
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "Continue" }), {
      key: "Escape",
    });
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders provided children", () => {
    render(
      <CreateWaveFlow title="Test" onBack={() => {}}>
        <div data-testid="child">content</div>
      </CreateWaveFlow>
    );

    expect(screen.getByTestId("child")).toHaveTextContent("content");
  });

  it("does not render legacy back button", () => {
    render(
      <CreateWaveFlow title="Test" onBack={() => {}}>
        <span>child</span>
      </CreateWaveFlow>
    );

    expect(screen.queryByRole("button", { name: "All Waves" })).toBeNull();
  });
});
