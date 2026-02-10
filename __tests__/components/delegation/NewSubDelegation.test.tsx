import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewSubDelegationComponent from '@/components/delegation/NewSubDelegation';

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <svg data-testid="icon" /> }));

let submitGroupsMock: jest.Mock;

jest.mock('@/components/delegation/DelegationFormParts', () => {
  const React = require('react');
  submitGroupsMock = jest.fn(() => null);
  return {
    __esModule: true,
    DelegationCloseButton: (p: any) => <button data-testid="close" onClick={p.onHide}>x</button>,
    DelegationFormOriginalDelegatorFormGroup: (p: any) => <div data-testid="original">{p.subdelegation.originalDelegator}</div>,
    DelegationFormLabel: ({ title }: any) => <label>{title}</label>,
    DelegationAddressDisabledInput: ({ address }: any) => <input data-testid="disabled-address" value={address} readOnly />,
    DelegationFormCollectionFormGroup: ({ collection, setCollection }: any) => (
      <select data-testid="collection" value={collection} onChange={e => setCollection(e.target.value)}>
        <option value="0">Select</option>
        <option value="1">Col1</option>
      </select>
    ),
    DelegationFormDelegateAddressFormGroup: ({ setAddress, title }: any) => (
      <input data-testid="delegate" aria-label={title} onChange={e => setAddress(e.target.value)} />
    ),
    DelegationSubmitGroups: submitGroupsMock,
  };
});

const baseProps = { address: '0xabc', ens: null, onHide: jest.fn(), onSetToast: jest.fn() };

beforeEach(() => {
  submitGroupsMock.mockClear();
});

describe('NewSubDelegationComponent', () => {
  it('renders without subdelegation', () => {
    render(<NewSubDelegationComponent {...baseProps} />);
    expect(screen.queryByTestId('original')).toBeNull();
    const params = submitGroupsMock.mock.calls[0][0].writeParams;
    expect(params.functionName).toBeUndefined();
  });

  it('handles subdelegation and passes write params', async () => {
    const user = userEvent.setup();
    const collection = { title: 'Any', display: 'Any', contract: '0x1', preview: '' };
    render(
      <NewSubDelegationComponent {...baseProps} subdelegation={{ originalDelegator: '0xdef', collection }} />
    );
    expect(screen.getByTestId('original')).toHaveTextContent('0xdef');

    await user.selectOptions(screen.getByTestId('collection'), '1');
    await user.type(screen.getByTestId('delegate'), '0x1111111111111111111111111111111111111111');

    const params = submitGroupsMock.mock.calls.at(-1)[0].writeParams;
    expect(params.args[0]).toBe('0xdef');
    expect(params.args[1]).toBe('1');
    expect(params.args[2]).toBe('0x1111111111111111111111111111111111111111');
    expect(params.functionName).toBe('registerDelegationAddressUsingSubDelegation');
  });
});
