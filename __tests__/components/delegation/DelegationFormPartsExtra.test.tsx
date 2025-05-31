import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import {
  DelegationFormLabel,
  DelegationFormOptionsFormGroup,
  DelegationFormDelegateAddressFormGroup,
} from '../../../components/delegation/DelegationFormParts';

jest.mock('react-bootstrap', () => ({
  __esModule: true,
  Form: { Control: (p:any)=> <input {...p}/>, Select: (p:any)=> <select {...p}/> , Label: (p:any)=> <label {...p}/> , Group:(p:any)=> <div {...p}/> },
  Row: (p:any)=> <div {...p}/> ,
  Col: (p:any)=> <div {...p}/> ,
}));
jest.mock('@tippyjs/react', () => (props:any) => <div data-testid="tippy">{props.children}</div>);

jest.mock('wagmi', () => ({ useEnsName: () => ({ data: null }), useEnsAddress: () => ({ data: null }) }));

describe('DelegationFormParts extras', () => {

  it('DelegationFormLabel renders tooltip', () => {
    const { getByText } = render(<DelegationFormLabel title="T" tooltip="tip" />);
    expect(getByText('T')).toBeInTheDocument();
    expect(screen.getByTestId('tippy')).toBeInTheDocument();
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
