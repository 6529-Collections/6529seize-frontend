import { render } from '@testing-library/react';
import CommunityDownloadsRememes from '../../../components/community-downloads/CommunityDownloadsRememes';
import CommunityDownloadsComponent from '../../../components/community-downloads/CommunityDownloadsComponent';

jest.mock('../../../components/community-downloads/CommunityDownloadsComponent');

const mockComponent = CommunityDownloadsComponent as jest.MockedFunction<typeof CommunityDownloadsComponent>;

describe('CommunityDownloadsRememes', () => {
  const originalEnv = process.env.API_ENDPOINT;
  beforeEach(() => {
    mockComponent.mockClear();
    process.env.API_ENDPOINT = 'http://api.test';
  });
  afterAll(() => {
    process.env.API_ENDPOINT = originalEnv;
  });

  it('renders CommunityDownloadsComponent with rememe data', () => {
    render(<CommunityDownloadsRememes />);
    expect(mockComponent).toHaveBeenCalledTimes(1);
    expect(mockComponent.mock.calls[0][0]).toEqual({
      title: 'Rememes',
      url: 'http://api.test/api/rememes_uploads',
    });
  });
});
