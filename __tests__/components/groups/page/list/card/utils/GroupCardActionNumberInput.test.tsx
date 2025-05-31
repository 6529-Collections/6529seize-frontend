import { render, screen, fireEvent } from '@testing-library/react';
import GroupCardActionNumberInput from '../../../../../../../components/groups/page/list/card/utils/GroupCardActionNumberInput';
import { CreditDirection } from '../../../../../../../components/groups/page/list/card/GroupCard';

jest.mock('../../../../../../../components/groups/page/list/card/utils/GroupCardActionCreditDirection', () => (props: any) => (
  <div data-testid="credit-direction" onClick={() => props.setCreditDirection('ADD')} />
));

describe('GroupCardActionNumberInput', () => {
  it('handles positive numeric input', () => {
    const setAmount = jest.fn();
    render(
      <GroupCardActionNumberInput
        label="Amount"
        componentId="amt"
        amount={null}
        creditDirection={CreditDirection.ADD}
        setAmount={setAmount}
        setCreditDirection={jest.fn()}
      />
    );
    const input = screen.getByRole('spinbutton');
    
    fireEvent.change(input, { target: { value: '5' } });
    expect(setAmount).toHaveBeenCalledWith(5);
  });

  it('handles empty input', () => {
    const setAmount = jest.fn();
    render(
      <GroupCardActionNumberInput
        label="Amount"
        componentId="amt"
        amount={5}
        creditDirection={CreditDirection.ADD}
        setAmount={setAmount}
        setCreditDirection={jest.fn()}
      />
    );
    const input = screen.getByRole('spinbutton');
    
    fireEvent.change(input, { target: { value: '' } });
    expect(setAmount).toHaveBeenCalledWith(null);
  });

  it('handles negative numbers', () => {
    const setAmount = jest.fn();
    render(
      <GroupCardActionNumberInput
        label="Amount"
        componentId="amt"
        amount={null}
        creditDirection={CreditDirection.ADD}
        setAmount={setAmount}
        setCreditDirection={jest.fn()}
      />
    );
    const input = screen.getByRole('spinbutton');
    
    fireEvent.change(input, { target: { value: '-3' } });
    expect(setAmount).toHaveBeenCalledWith(0);
  });

  it('handles float input by converting to integer', () => {
    const setAmount = jest.fn();
    render(
      <GroupCardActionNumberInput
        label="Amount"
        componentId="amt"
        amount={null}
        creditDirection={CreditDirection.ADD}
        setAmount={setAmount}
        setCreditDirection={jest.fn()}
      />
    );
    const input = screen.getByRole('spinbutton');
    
    fireEvent.change(input, { target: { value: '5.7' } });
    expect(setAmount).toHaveBeenCalledWith(5);
  });

  it('renders credit direction selector', () => {
    render(
      <GroupCardActionNumberInput
        label="Amount"
        componentId="amt"
        amount={1}
        creditDirection={CreditDirection.ADD}
        setAmount={jest.fn()}
        setCreditDirection={jest.fn()}
      />
    );
    expect(screen.getByTestId('credit-direction')).toBeInTheDocument();
  });
});
