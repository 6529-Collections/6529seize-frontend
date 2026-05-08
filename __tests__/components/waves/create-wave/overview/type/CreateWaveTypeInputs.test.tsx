import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveTypeInputs from "@/components/waves/create-wave/overview/type/CreateWaveTypeInputs";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

jest.mock(
  "@/components/utils/radio/CommonBorderedRadioButton",
  () => (props: any) => (
    <button
      data-testid={props.type}
      disabled={props.disabled}
      onClick={() => props.onChange(props.type)}
    >
      {props.label}
    </button>
  )
);

describe("CreateWaveTypeInputs", () => {
  it("renders radio buttons and handles selection", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <CreateWaveTypeInputs selected={ApiWaveType.Chat} onChange={onChange} />
    );
    const rankBtn = screen.getByTestId(ApiWaveType.Rank);
    const approveBtn = screen.getByTestId(ApiWaveType.Approve);
    expect(approveBtn).not.toBeDisabled();
    await user.click(rankBtn);
    expect(onChange).toHaveBeenCalledWith(ApiWaveType.Rank);
    await user.click(approveBtn);
    expect(onChange).toHaveBeenCalledWith(ApiWaveType.Approve);
  });
});
