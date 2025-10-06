import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveTypeInputs from '@/components/waves/create-wave/overview/type/CreateWaveTypeInputs';
import { ApiWaveType } from '@/generated/models/ApiWaveType';

jest.mock('@/components/utils/radio/CommonBorderedRadioButton', () => (props: any) => (
  <button data-testid={props.type} disabled={props.disabled} onClick={() => props.onChange(props.type)}>{props.label}</button>
));

describe('CreateWaveTypeInputs', () => {
  it('renders radio buttons and handles selection', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<CreateWaveTypeInputs selected={ApiWaveType.Chat} onChange={onChange} />);
    const rankBtn = screen.getByTestId(ApiWaveType.Rank);
    expect(screen.getByTestId(ApiWaveType.Approve)).toBeDisabled();
    await user.click(rankBtn);
    expect(onChange).toHaveBeenCalledWith(ApiWaveType.Rank);
  });
});
