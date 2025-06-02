import { render, screen } from '@testing-library/react';
import { CommunityDownloadsComponentRow } from '../../../components/community-downloads/CommunityDownloadsHelpers';

function renderRow(date: string) {
  return render(
    <table>
      <tbody>
        <CommunityDownloadsComponentRow date={date} url="http://x" />
      </tbody>
    </table>
  );
}

describe('CommunityDownloadsComponentRow', () => {
  it('formats YYYYMMDD dates', () => {
    renderRow('20230102');
    expect(screen.getByText(new Date(2023,0,2).toDateString())).toBeInTheDocument();
  });

  it('formats ISO dates', () => {
    const d = new Date('2023-02-03T00:00:00Z');
    renderRow(d.toISOString());
    expect(screen.getByText(d.toDateString())).toBeInTheDocument();
  });
});
