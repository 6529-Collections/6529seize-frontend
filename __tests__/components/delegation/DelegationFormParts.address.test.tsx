import { render } from '@testing-library/react';
import React from 'react';
import { DelegationAddressDisabledInput } from '../../../components/delegation/DelegationFormParts';

jest.mock('wagmi', () => ({
  useEnsName: () => ({ data: 'alice.eth' }),
  useEnsAddress: () => ({ data: '0x123' })
}));

jest.mock('@tippyjs/react', () => (props: any) => <div data-testid="tippy">{props.children}</div>);

jest.mock('react-bootstrap', () => ({ Form: { Control: (p: any) => <input {...p} />, Label:(p:any)=> <label {...p}/>, Group:(p:any)=> <div {...p}/>, Select:(p:any)=> <select {...p}/>, Row:(p:any)=> <div {...p}/>, Col:(p:any)=> <div {...p}/> }, Container:(p:any)=> <div {...p}/> }));

describe('Delegation address inputs', () => {
  it('DelegationAddressDisabledInput shows ens and address', () => {
    const { container } = render(<DelegationAddressDisabledInput address="0xabc" ens="alice.eth" />);
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('alice.eth - 0xabc');
    expect(input.disabled).toBe(true);
  });
});
