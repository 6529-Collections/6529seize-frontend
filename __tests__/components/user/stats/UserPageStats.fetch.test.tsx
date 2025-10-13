import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageStatsClient from '@/components/user/stats/UserPageStatsClient';
import { commonApiFetch } from '@/services/api/common-api';

jest.mock('@/components/user/stats/UserPageStatsCollected', () => () => <div data-testid="collected" />);
jest.mock('@/components/user/stats/activity/UserPageActivityWrapper', () => () => <div data-testid="activity" />);
jest.mock('@/components/user/stats/UserPageStatsActivityOverview', () => () => <div data-testid="overview" />);
jest.mock('@/components/user/stats/UserPageStatsBoostBreakdown', () => () => <div data-testid="boost" />);
jest.mock('@/components/user/stats/tags/UserPageStatsTags', () => () => <div data-testid="tags" />);

jest.mock('@/components/user/utils/addresses-select/UserAddressesSelectDropdown', () => ({ onActiveAddress }: any) => (
  <button onClick={() => onActiveAddress('0xabc')} data-testid="dropdown" />
));

jest.mock('@/services/api/common-api');
const apiMock = commonApiFetch as jest.Mock;

describe('UserPageStatsClient data fetching', () => {
  beforeEach(() => {
    apiMock.mockClear();
    apiMock.mockResolvedValue({});
  });

  it('fetches data when address changes', async () => {
    const profile: any = { wallets: [{ wallet: '0x1' }], consolidation_key: 'k' };
    render(
      <UserPageStatsClient
        profile={profile}
        initialSeasons={[{} as any]}
        initialTdh={{} as any}
        initialOwnerBalance={{} as any}
        initialBalanceMemes={[]}
      />
    );

    expect(apiMock).not.toHaveBeenCalled();
    userEvent.click(screen.getByTestId('dropdown'));
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(3));
    expect(apiMock.mock.calls[0][0]).toMatchObject({ endpoint: 'tdh/wallet/0xabc' });
    expect(apiMock.mock.calls[1][0]).toMatchObject({ endpoint: 'owners-balances/wallet/0xabc' });
    expect(apiMock.mock.calls[2][0]).toMatchObject({
      endpoint: 'owners-balances/wallet/0xabc/memes',
    });
  });

  it('fetches seasons on mount when initial data missing', async () => {
    const profile: any = { wallets: [{ wallet: '0x1' }] };
    render(
      <UserPageStatsClient
        profile={profile}
        initialSeasons={[]}
        initialTdh={undefined}
        initialOwnerBalance={undefined}
        initialBalanceMemes={[]}
      />
    );

    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    expect(apiMock.mock.calls[0][0]).toMatchObject({ endpoint: 'new_memes_seasons' });
  });
});
