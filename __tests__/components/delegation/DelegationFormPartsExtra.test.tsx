import { render, fireEvent, screen } from '@testing-library/react';
import {
  DelegationFormLabel,
  DelegationFormOptionsFormGroup,
  DelegationFormDelegateAddressFormGroup,
} from '@/components/delegation/DelegationFormParts';

jest.mock('wagmi', () => ({ useEnsName: () => ({ data: null }), useEnsAddress: () => ({ data: null }) }));

describe('DelegationFormParts extras', () => {

  it('DelegationFormLabel renders tooltip', () => {
    const { getByText } = render(<DelegationFormLabel title="T" tooltip="tip" />);
    expect(getByText('T')).toBeInTheDocument();

    const tooltipButton = screen.getByRole('button', { name: 'tip' });
    fireEvent.mouseEnter(tooltipButton);
    expect(screen.getByRole('tooltip')).toHaveTextContent('tip');
  });

  it('DelegationFormOptionsFormGroup allows selecting option', () => {
    const setSelected = jest.fn();
    const { container } = render(
      <DelegationFormOptionsFormGroup title="O" tooltip="t" options={['a','b']} selected="a" setSelected={setSelected} />
    );
    fireEvent.change(container.querySelector('select')!, { target: { value: 'b' } });
    expect(setSelected).toHaveBeenCalledWith('b');
  });

  it('DelegationFormDelegateAddressFormGroup uses input component', () => {
    const setAddress = jest.fn();
    render(<DelegationFormDelegateAddressFormGroup setAddress={setAddress} title="D" tooltip="tt" />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '0x1' } });
    expect(setAddress).toHaveBeenCalledWith('0x1');
  });
});
