import { render, waitFor } from '@testing-library/react';
import React from 'react';
import UserPageStatsActivityOverview, { printEthValue } from '../../../../components/user/stats/UserPageStatsActivityOverview';
import { commonApiFetch } from '../../../../services/api/common-api';

jest.mock('../../../../services/api/common-api', () => ({
  commonApiFetch: jest.fn(() => Promise.resolve({}))
}));

const profile: any = { wallets: [{ wallet: '0xabc' }] };

describe('UserPageStatsActivityOverview', () => {
  it('calls API on mount', async () => {
    render(<UserPageStatsActivityOverview profile={profile} activeAddress={null} />);
    await waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(2));
    expect((commonApiFetch as jest.Mock).mock.calls[0][0].endpoint).toContain('aggregated-activity/wallet/0xabc');
  });

  it('printEthValue formats value', () => {
    expect(printEthValue(undefined)).toBe('-');
    expect(printEthValue(1.234)).toBe('1.23');
  });
});
