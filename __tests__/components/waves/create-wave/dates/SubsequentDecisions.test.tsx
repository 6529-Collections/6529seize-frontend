import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubsequentDecisions from '@/components/waves/create-wave/dates/SubsequentDecisions';
import { Period } from '@/helpers/Types';

jest.mock('@/components/waves/create-wave/dates/DecisionPointDropdown', () => ({
  __esModule: true,
  default: ({ onChange }: any) => <button data-testid="dropdown" onClick={() => onChange(Period.HOURS)}>select</button>,
}));

jest.mock('@/components/utils/button/PrimaryButton', () => (props: any) => (
  <button onClick={props.onClicked} disabled={props.disabled}>{props.children}</button>
));

describe('SubsequentDecisions', () => {
  it('adds and removes additional decision times', async () => {
    const decisions: number[] = [];
    const setSubsequentDecisions = jest.fn((vals) => decisions.splice(0, decisions.length, ...vals));
    render(
      <SubsequentDecisions
        firstDecisionTime={0}
        subsequentDecisions={decisions}
        setSubsequentDecisions={setSubsequentDecisions}
      />
    );

    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '2');
    await userEvent.click(screen.getByTestId('dropdown'));
    await userEvent.click(screen.getByRole('button', { name: /add to timeline/i }));

    expect(setSubsequentDecisions).toHaveBeenCalledWith([3600000 * 2]);
  });
});
