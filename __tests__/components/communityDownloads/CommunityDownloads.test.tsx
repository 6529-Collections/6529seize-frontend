import { render, screen } from '@testing-library/react';
import CommunityDownloads from '../../../components/communityDownloads/CommunityDownloads';
import useCapacitor from '../../../hooks/useCapacitor';

jest.mock('../../../hooks/useCapacitor');

const mockUseCapacitor = useCapacitor as jest.MockedFunction<typeof useCapacitor>;

describe('CommunityDownloads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows Meme Subscriptions link when platform is not ios', () => {
    mockUseCapacitor.mockReturnValue({ platform: 'web' } as any);
    render(<CommunityDownloads />);
    expect(screen.getByRole('link', { name: /Meme Subscriptions/i })).toBeInTheDocument();
  });

  it('hides Meme Subscriptions link on ios platform', () => {
    mockUseCapacitor.mockReturnValue({ platform: 'ios' } as any);
    render(<CommunityDownloads />);
    expect(screen.queryByRole('link', { name: /Meme Subscriptions/i })).not.toBeInTheDocument();
  });

  it('renders other download links with correct hrefs', () => {
    mockUseCapacitor.mockReturnValue({ platform: 'web' } as any);
    render(<CommunityDownloads />);
    expect(screen.getByRole('link', { name: 'Network Metrics' })).toHaveAttribute('href', '/open-data/network-metrics');
    expect(screen.getByRole('link', { name: 'Consolidated Network Metrics' })).toHaveAttribute('href', '/open-data/consolidated-network-metrics');
    expect(screen.getByRole('link', { name: 'Rememes' })).toHaveAttribute('href', '/open-data/rememes');
    expect(screen.getByRole('link', { name: 'Team' })).toHaveAttribute('href', '/open-data/team');
    expect(screen.getByRole('link', { name: 'Royalties' })).toHaveAttribute('href', '/open-data/royalties');
  });
});
