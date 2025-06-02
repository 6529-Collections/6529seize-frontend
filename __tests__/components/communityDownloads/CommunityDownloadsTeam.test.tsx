import { render, screen } from '@testing-library/react';
import CommunityDownloadsTeam from '../../../components/community-downloads/CommunityDownloadsTeam';

jest.mock('../../../components/community-downloads/CommunityDownloadsHelpers', () => ({
  formatDate: (date: string) => date,
  DownloadsLayout: ({ children }: any) => <div>{children}</div>,
  DownloadsTable: ({ data, renderRow }: any) => (
    <div>
      {data.map((item: any, idx: number) => (
        <div key={idx} data-testid="row">{renderRow(item)}</div>
      ))}
    </div>
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
