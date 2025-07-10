import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserProfileTooltip from '../../../../../components/user/utils/profile/UserProfileTooltip';

jest.mock('../../../../../components/drops/create/utils/DropPfp', () => ({ __esModule: true, default: () => <div data-testid="pfp" /> }));
jest.mock('../../../../../hooks/useIdentity', () => ({ useIdentity: () => ({ profile: { handle: 'alice', pfp: 'a', tdh: 1, level: 2, cic: 3, rep: 4, consolidation_key: 'key' } }) }));
jest.mock('../../../../../hooks/useIdentityBalance', () => ({ useIdentityBalance: () => ({ data: { total_balance: 5 } }) }));

describe('UserProfileTooltip', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('renders profile information', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserProfileTooltip user="alice" />
      </QueryClientProvider>
    );
    expect(screen.getByTestId('pfp')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('TDH')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('NIC')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('REP')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Balance')).toBeInTheDocument();
  });
});
