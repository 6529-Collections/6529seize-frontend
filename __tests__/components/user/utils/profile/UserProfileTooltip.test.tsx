import { render, screen } from '@testing-library/react';
import UserProfileTooltip from '../../../../../components/user/utils/profile/UserProfileTooltip';

jest.mock('../../../../../components/drops/create/utils/DropPfp', () => ({ __esModule: true, default: () => <div data-testid="pfp" /> }));
jest.mock('../../../../../hooks/useIdentity', () => ({ useIdentity: () => ({ profile: { handle: 'alice', pfp: 'a', tdh: 1, level: 2, cic: 3, rep: 4, consolidation_key: 'key' } }) }));
jest.mock('../../../../../hooks/useIdentityBalance', () => ({ useIdentityBalance: () => ({ data: { total_balance: 5 } }) }));

describe('UserProfileTooltip', () => {
  it('renders profile information', () => {
    render(<UserProfileTooltip user="alice" />);
    expect(screen.getByTestId('pfp')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('TDH: 1')).toBeInTheDocument();
    expect(screen.getByText('Level: 2')).toBeInTheDocument();
    expect(screen.getByText('NIC: 3')).toBeInTheDocument();
    expect(screen.getByText('REP: 4')).toBeInTheDocument();
    expect(screen.getByText('Balance: 5')).toBeInTheDocument();
  });
});
