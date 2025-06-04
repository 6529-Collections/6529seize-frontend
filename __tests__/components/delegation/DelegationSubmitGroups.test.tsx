import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DelegationSubmitGroups } from '../../../components/delegation/DelegationFormParts';

jest.mock('react-bootstrap', () => ({
  __esModule: true,
  Form: {
    Group: (p:any) => <form {...p}>{p.children}</form>,
    Label: (p:any) => <label {...p}>{p.children}</label>,
    Control: (p:any) => <input {...p} />,
    Select: (p:any) => <select {...p} />,
  },
  Row: (p:any) => <div {...p} />,
  Col: (p:any) => <div {...p} />,
}));
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (p:any) => <svg {...p} /> }));
jest.mock('@tippyjs/react', () => (props:any) => <div>{props.children}</div>);
jest.mock('../../../helpers/AllowlistToolHelpers', () => ({ getRandomObjectId: ()=>'id' }));
jest.mock('../../../helpers/Helpers', () => ({ getTransactionLink: ()=>'link' }));

const writeContract = jest.fn();
jest.mock('wagmi', () => ({
  useWriteContract: () => ({ writeContract, isPending: false, data: undefined, error: undefined, reset: jest.fn() }),
  useWaitForTransactionReceipt: () => ({ isLoading: false }),
}));

beforeEach(() => {
  writeContract.mockClear();
});

describe('DelegationSubmitGroups', () => {
  it('displays errors when validation fails', () => {
    Object.defineProperty(global, 'scrollBy', { value: jest.fn(), writable: true });
    const validate = jest.fn().mockReturnValue(['err']);
    render(
      <DelegationSubmitGroups
        title="T"
        writeParams={{}}
        showCancel={false}
        gasError={undefined}
        validate={validate}
        onHide={jest.fn()}
        onSetToast={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(writeContract).not.toHaveBeenCalled();
    expect(screen.getByText('err')).toBeInTheDocument();
  });

  it('calls writeContract on valid submit', () => {
    const onSetToast = jest.fn();
    render(
      <DelegationSubmitGroups
        title="T"
        writeParams={{ foo: 'bar' }}
        showCancel={true}
        gasError={undefined}
        validate={() => []}
        onHide={jest.fn()}
        onSetToast={onSetToast}
      />
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(writeContract).toHaveBeenCalledWith({ foo: 'bar' });
    expect(onSetToast).toHaveBeenCalledWith({ title: 'T', message: 'Confirm in your wallet...' });
  });
});
