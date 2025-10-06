import { render, screen } from '@testing-library/react';
import NewAssignPrimaryAddress from '@/components/delegation/NewAssignPrimaryAddress';
import { AuthContext } from '@/components/auth/Auth';
import { useQuery } from '@tanstack/react-query';

jest.mock('@tanstack/react-query');
jest.mock('@/components/delegation/DelegationFormParts', () => ({
  DelegationCloseButton: (p: any) => <button onClick={p.onHide}>x</button>,
  DelegationFormOriginalDelegatorFormGroup: () => <div />,
  DelegationFormLabel: () => <div />,
  DelegationAddressDisabledInput: () => <div />,
  DelegationSubmitGroups: () => <div />,
  DelegationFormOptionsFormGroup: () => <div />,
}));
jest.mock('@/components/dotLoader/DotLoader', () => () => <div data-testid="loader" />);

const useQueryMock = useQuery as jest.Mock;

function renderComp(profile: any, queryReturn: any) {
  useQueryMock.mockReturnValue(queryReturn);
  return render(
    <AuthContext.Provider value={{ connectedProfile: profile } as any}>
      <NewAssignPrimaryAddress address="0x1" ens={null} onHide={jest.fn()} onSetToast={jest.fn()} />
    </AuthContext.Provider>
  );
}

test('prompts to connect wallet when no profile', () => {
  renderComp(null, {});
  expect(screen.getByText('Connect Wallet to continue')).toBeInTheDocument();
});

test('shows loader when fetching data', () => {
  renderComp({}, { isFetching: true, data: null });
  expect(screen.getByTestId('loader')).toBeInTheDocument();
});

test('shows consolidation requirement message', () => {
  renderComp({}, { isFetching: false, data: { consolidation_key: 'abc', address: 'x', ens: '' } });
  expect(screen.getByText(/You must have a consolidation/)).toBeInTheDocument();
});
