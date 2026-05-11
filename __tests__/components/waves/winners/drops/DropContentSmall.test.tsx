import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DropContentSmall } from "@/components/waves/winners/drops/DropContentSmall";

const mockWaveDropContent = jest.fn((props: any) => (
  <div
    data-testid="wave-drop-content"
    onClick={() => props.onDropContentClick(props.drop)}
  />
));

jest.mock("@/components/waves/drops/WaveDropContent", () => ({
  __esModule: true,
  default: (props: any) => mockWaveDropContent(props),
}));

const baseDrop = { id: "drop1", parts: [{}, {}] } as any;

describe("DropContentSmall", () => {
  beforeEach(() => {
    mockWaveDropContent.mockClear();
  });

  it("renders WaveDropContent and triggers onDropClick", async () => {
    const handleDropClick = jest.fn();
    render(<DropContentSmall drop={baseDrop} onDropClick={handleDropClick} />);

    await userEvent.click(screen.getByTestId("wave-drop-content"));
    expect(handleDropClick).toHaveBeenCalledTimes(1);
  });

  it("forwards content presentation to WaveDropContent", () => {
    render(
      <DropContentSmall
        drop={baseDrop}
        onDropClick={jest.fn()}
        contentPresentation="quorumCompact"
      />
    );

    expect(mockWaveDropContent).toHaveBeenCalledWith(
      expect.objectContaining({
        contentPresentation: "quorumCompact",
      })
    );
  });
});
