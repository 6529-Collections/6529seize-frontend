import { render, screen } from '@testing-library/react';
import CommunityDownloadsTeam from '../../../components/communityDownloads/CommunityDownloadsTeam';

jest.mock('../../../components/communityDownloads/CommunityDownloadsComponent', () => ({
  __esModule: true,
  CommunityDownloadsComponentRow: ({ date, url }: any) => (
    <tr data-testid="row"><td>{date}</td><td>{url}</td></tr>
  ),
}));

describe('CommunityDownloadsTeam', () => {
  it('lists static downloads', () => {
    render(<CommunityDownloadsTeam />);
    const rows = screen.getAllByTestId('row');
    expect(rows).toHaveLength(3);
    expect(screen.queryByText('Nothing here yet')).not.toBeInTheDocument();
  });
});
