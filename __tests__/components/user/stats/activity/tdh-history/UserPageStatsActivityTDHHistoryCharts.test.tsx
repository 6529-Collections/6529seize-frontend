import { render, screen } from '@testing-library/react';
import UserPageStatsActivityTDHHistoryCharts from '@/components/user/stats/activity/tdh-history/UserPageStatsActivityTDHHistoryCharts';
import type { TDHHistory } from '@/entities/ITDH';

jest.mock('@/components/user/stats/activity/tdh-history/UserPageStatsActivityTDHHistoryChart', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="chart">{props.data.title}</div>,
}));

describe('UserPageStatsActivityTDHHistoryCharts', () => {
  it('renders no charts when history is empty', () => {
    render(<UserPageStatsActivityTDHHistoryCharts tdhHistory={[]} />);
    expect(screen.queryByTestId('chart')).toBeNull();
  });

  it('creates charts from history data', () => {
    const history: TDHHistory[] = [
      {
        date: new Date('2024-01-01'),
        boosted_tdh: 1,
        net_boosted_tdh: 2,
        created_boosted_tdh: 3,
        destroyed_boosted_tdh: 4,
      } as TDHHistory,
      {
        date: new Date('2024-01-02'),
        boosted_tdh: 2,
        net_boosted_tdh: 3,
        created_boosted_tdh: 4,
        destroyed_boosted_tdh: 5,
      } as TDHHistory,
    ];
    render(<UserPageStatsActivityTDHHistoryCharts tdhHistory={history} />);
    const charts = screen.getAllByTestId('chart');
    expect(charts).toHaveLength(4);
    expect(charts[0]).toHaveTextContent('Total TDH');
  });
});
