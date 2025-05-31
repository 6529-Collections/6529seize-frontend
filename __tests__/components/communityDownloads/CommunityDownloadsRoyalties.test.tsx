import { render } from '@testing-library/react';
import CommunityDownloadsRoyalties from '../../../components/communityDownloads/CommunityDownloadsRoyalties';
import CommunityDownloadsComponent from '../../../components/communityDownloads/CommunityDownloadsComponent';

jest.mock('../../../components/communityDownloads/CommunityDownloadsComponent');

const mockComponent = CommunityDownloadsComponent as jest.MockedFunction<typeof CommunityDownloadsComponent>;

describe('CommunityDownloadsRoyalties', () => {
  const originalEnv = process.env.API_ENDPOINT;
  beforeEach(() => {
    mockComponent.mockClear();
    process.env.API_ENDPOINT = 'http://api.test';
  });
  afterAll(() => {
    process.env.API_ENDPOINT = originalEnv;
  });

  it('renders CommunityDownloadsComponent with royalties data', () => {
    render(<CommunityDownloadsRoyalties />);
    expect(mockComponent).toHaveBeenCalledTimes(1);
    expect(mockComponent.mock.calls[0][0]).toEqual({
      title: 'Royalties',
      url: 'http://api.test/api/royalties/uploads',
    });
  });
});
