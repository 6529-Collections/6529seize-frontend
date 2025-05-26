import { render, screen, waitFor } from '@testing-library/react';
import CommunityStats from '../../../components/communityStats/CommunityStats';
import { fetchUrl } from '../../../services/6529api';
import { numberWithCommas } from '../../../helpers/Helpers';

jest.mock('../../../services/6529api', () => ({ fetchUrl: jest.fn() }));
jest.mock('react-chartjs-2', () => ({ Bar: () => <div data-testid="bar" /> }));

const mockFetch = fetchUrl as jest.Mock;

describe('CommunityStats', () => {
  const originalEndpoint = process.env.API_ENDPOINT;

  beforeEach(() => {
    mockFetch.mockReset();
    process.env.API_ENDPOINT = 'https://api.test';
  });

  afterAll(() => {
    process.env.API_ENDPOINT = originalEndpoint;
  });

  it('fetches data and displays stats with checkpoint estimates', async () => {
    const history = [
      {
        date: new Date('2023-01-01'),
        total_boosted_tdh: 100000000,
        total_tdh: 200000000,
        total_tdh__raw: 300000000,
        net_boosted_tdh: 10000000,
        net_tdh: 20000000,
        net_tdh__raw: 30000000,
        created_boosted_tdh: 5000000,
        created_tdh: 10000000,
        created_tdh__raw: 15000000,
        destroyed_boosted_tdh: 1000000,
        destroyed_tdh: 2000000,
        destroyed_tdh__raw: 3000000,
      },
    ];

    mockFetch.mockResolvedValue({ data: history });

    render(<CommunityStats />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test/api/tdh_global_history?page_size=10&page=1'
    );

    await screen.findByText(numberWithCommas(history[0].total_boosted_tdh));
    expect(
      screen.getByText(numberWithCommas(history[0].total_boosted_tdh))
    ).toBeInTheDocument();

    const rows = screen.getAllByText(/Estimated days until/);
    expect(rows).toHaveLength(3);
    expect(screen.getByText(/Estimated days until 250M/)).toBeInTheDocument();
  });
});
