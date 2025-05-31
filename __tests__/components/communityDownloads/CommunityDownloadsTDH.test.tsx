import { render } from '@testing-library/react';
import CommunityDownloadsTDH, { VIEW } from '../../../components/communityDownloads/CommunityDownloadsTDH';
import CommunityDownloadsComponent from '../../../components/communityDownloads/CommunityDownloadsComponent';

jest.mock('../../../components/communityDownloads/CommunityDownloadsComponent', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="mock" />)
}));

const ComponentMock = CommunityDownloadsComponent as jest.Mock;

describe('CommunityDownloadsTDH', () => {
  beforeEach(() => {
    ComponentMock.mockClear();
    process.env.API_ENDPOINT = 'https://api.test';
  });

  it('uses consolidated uploads for CONSOLIDATION view', () => {
    render(<CommunityDownloadsTDH view={VIEW.CONSOLIDATION} />);
    const props = ComponentMock.mock.calls[0][0];
    expect(props).toEqual(
      expect.objectContaining({
        url: 'https://api.test/api/consolidated_uploads',
        title: 'Consolidated  Network'
      })
    );
  });

  it('uses uploads for WALLET view', () => {
    render(<CommunityDownloadsTDH view={VIEW.WALLET} />);
    const props = ComponentMock.mock.calls[0][0];
    expect(props).toEqual(
      expect.objectContaining({
        url: 'https://api.test/api/uploads',
        title: ' Network'
      })
    );
  });
});
