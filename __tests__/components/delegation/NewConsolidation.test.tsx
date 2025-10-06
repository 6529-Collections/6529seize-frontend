import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewConsolidationComponent from '@/components/delegation/NewConsolidation';

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <svg data-testid="icon" /> }));

let submitGroupsMock: jest.Mock;

jest.mock('@/components/delegation/DelegationFormParts', () => {
  const React = require('react');
  submitGroupsMock = jest.fn(() => null);
  return {
    __esModule: true,
    DelegationCloseButton: (props: any) => <button data-testid="close" onClick={props.onHide}>x</button>,
    DelegationFormOriginalDelegatorFormGroup: (props: any) => <div data-testid="original">{props.subdelegation.originalDelegator}</div>,
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

describe('NewConsolidationComponent', () => {
  it('renders without subdelegation', () => {
    render(<NewConsolidationComponent {...baseProps} />);
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Register Consolidation');
    expect(screen.queryByTestId('original')).toBeNull();
    const params = (submitGroupsMock.mock.calls[0] as any)[0].writeParams;
    expect(params.functionName).toBeUndefined();
  });

  it('handles subdelegation and passes write params', async () => {
    const user = userEvent.setup();
    const collection = { title: 'Any', display: 'Any', contract: '0x1', preview: '' };
    render(
      <NewConsolidationComponent
        {...baseProps}
        subdelegation={{ originalDelegator: '0xdef', collection }}
      />
    );
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Register Consolidation as Delegation Manager');
    expect(screen.getByTestId('original')).toHaveTextContent('0xdef');

    await user.selectOptions(screen.getByTestId('collection'), '1');
    await user.type(screen.getByTestId('delegate'), '0x1111111111111111111111111111111111111111');

    const params = (submitGroupsMock.mock.calls.at(-1) as any)[0].writeParams;
    expect(params.args[0]).toBe('0xdef');
    expect(params.args[1]).toBe('1');
    expect(params.args[2]).toBe('0x1111111111111111111111111111111111111111');
    expect(params.functionName).toBe('registerDelegationAddressUsingSubDelegation');
  });
});
