import { render, screen } from "@testing-library/react";
import CreateWaveFlow from "@/components/waves/create-wave/CreateWaveFlow";

describe("CreateWaveFlow", () => {
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

    expect(screen.queryByRole('button', { name: 'All Waves' })).toBeNull();
  });
});
