import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageStats from '../../../../components/user/stats/UserPageStats';
import { commonApiFetch } from '../../../../services/api/common-api';

jest.mock('../../../../components/user/stats/UserPageStatsCollected', () => () => <div data-testid="collected" />);
jest.mock('../../../../components/user/stats/activity/UserPageActivityWrapper', () => () => <div data-testid="activity" />);
jest.mock('../../../../components/user/stats/UserPageStatsActivityOverview', () => () => <div data-testid="overview" />);
jest.mock('../../../../components/user/stats/UserPageStatsBoostBreakdown', () => () => <div data-testid="boost" />);
jest.mock('../../../../components/user/stats/tags/UserPageStatsTags', () => () => <div data-testid="tags" />);

jest.mock('../../../../components/user/utils/addresses-select/UserAddressesSelectDropdown', () => ({ onActiveAddress }: any) => (
  <button onClick={() => onActiveAddress('0xabc')} data-testid="dropdown" />
));

jest.mock('../../../../services/api/common-api');
const apiMock = commonApiFetch as jest.Mock;

describe('UserPageStats data fetching', () => {
  beforeEach(() => {
    apiMock.mockResolvedValue({});
  });

  it('calls APIs with initial and updated address', async () => {
    const profile: any = { wallets: [{ wallet: '0x1' }], consolidation_key: 'k' };
    render(<UserPageStats profile={profile} />);

    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(4));
    expect(apiMock.mock.calls[0][0]).toMatchObject({ endpoint: 'new_memes_seasons' });
    expect(apiMock.mock.calls[1][0]).toMatchObject({ endpoint: 'tdh/consolidation/k' });
    expect(apiMock.mock.calls[2][0]).toMatchObject({ endpoint: 'owners-balances/consolidation/k' });
    expect(apiMock.mock.calls[3][0]).toMatchObject({ endpoint: 'owners-balances/consolidation/k/memes' });

    apiMock.mockClear();
    userEvent.click(screen.getByTestId('dropdown'));
    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    expect(apiMock.mock.calls[0][0]).toMatchObject({ endpoint: 'tdh/wallet/0xabc' });
  });
});
