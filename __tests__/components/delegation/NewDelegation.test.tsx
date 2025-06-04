import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewDelegation from '../../../components/delegation/NewDelegation';

jest.mock('../../../components/delegation/DelegationFormParts', () => ({
  DelegationExpiryCalendar: () => <div data-testid="calendar" />,
  DelegationTokenSelection: () => <div data-testid="token" />,
  DelegationCloseButton: () => <div />,
  DelegationFormOriginalDelegatorFormGroup: () => <div />,
  DelegationFormLabel: ({ title }: any) => <label>{title}</label>,
  DelegationAddressDisabledInput: () => <input disabled />,
  DelegationFormCollectionFormGroup: ({ setCollection }: any) => (
    <input data-testid="collection" onChange={e => setCollection(e.target.value)} />
  ),
  DelegationFormDelegateAddressFormGroup: ({ setAddress }: any) => (
    <input data-testid="delegate" onChange={e => setAddress(e.target.value)} />
  ),
  DelegationSubmitGroups: () => <div />
}));

describe('NewDelegation component', () => {
  it('toggles expiry calendar and token input', async () => {
    render(
      <NewDelegation address="0x1" ens={null} onHide={() => {}} onSetToast={() => {}} />
    );
    const radios = screen.getAllByRole('radio');
    await userEvent.click(radios[1]);
    expect(screen.getByTestId('calendar')).toBeInTheDocument();

    const tokenRadios = screen.getAllByRole('radio');
    await userEvent.click(tokenRadios[3]);
    expect(screen.getByTestId('token')).toBeInTheDocument();
  });

  it('calls query setters on changes', async () => {
    const setCollectionQuery = jest.fn();
    const setUseCaseQuery = jest.fn();
    render(
      <NewDelegation address="0x1" ens={null} onHide={() => {}} onSetToast={() => {}} setCollectionQuery={setCollectionQuery} setUseCaseQuery={setUseCaseQuery} />
    );
    await userEvent.type(screen.getByTestId('collection'), '123');
    expect(setCollectionQuery).toHaveBeenCalledWith('123');
    await userEvent.selectOptions(screen.getByRole('combobox'), '1');
    expect(setUseCaseQuery).toHaveBeenCalledWith(1);
  });
});
