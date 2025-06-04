import React from 'react';
import { render, screen } from '@testing-library/react';
import UserPageStatsActivityDistributionsTableItem from '../../../../../../components/user/stats/activity/distributions/UserPageStatsActivityDistributionsTableItem';
import { formatNumberWithCommasOrDash, getTimeAgo } from '../../../../../../helpers/Helpers';

jest.mock('../../../../../../helpers/Helpers');
const formatMock = formatNumberWithCommasOrDash as jest.Mock;
const timeAgoMock = getTimeAgo as jest.Mock;

beforeEach(() => {
  formatMock.mockImplementation((v) => v.toString());
  timeAgoMock.mockReturnValue('1d ago');
});

describe('UserPageStatsActivityDistributionsTableItem', () => {
  const item = {
    collection: 'MEMES',
    tokenId: 1,
    name: 'Test',
    wallet: '0x1',
    phases: [1,2],
    amountMinted: 3,
    amountTotal: 4,
    date: '2020-01-01'
  } as any;

  it('renders info', () => {
    render(<table><tbody><UserPageStatsActivityDistributionsTableItem item={item} /></tbody></table>);
    expect(screen.getByText('The Memes')).toBeInTheDocument();
    expect(screen.getByText('# 1')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('0x1')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('1d ago')).toBeInTheDocument();
  });
});
