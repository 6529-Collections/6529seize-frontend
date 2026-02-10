import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DropContentSmall } from "@/components/waves/winners/drops/DropContentSmall";

jest.mock("@/components/waves/drops/WaveDropContent", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="wave-drop-content" onClick={() => props.onDropContentClick(props.drop)} />
  )
}));

const baseDrop = { id: "drop1", parts: [{}, {}] } as any;

describe("DropContentSmall", () => {
  it("renders WaveDropContent and triggers onDropClick", async () => {
    const handleDropClick = jest.fn();
    render(<DropContentSmall drop={baseDrop} onDropClick={handleDropClick} />);

    await userEvent.click(screen.getByTestId("wave-drop-content"));
    expect(handleDropClick).toHaveBeenCalledWith(baseDrop);
  });
});
