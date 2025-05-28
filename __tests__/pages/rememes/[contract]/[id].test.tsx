import { render } from '@testing-library/react';
import ReMeme, { getServerSideProps } from '../../../../pages/rememes/[contract]/[id]';
import { AuthContext } from '../../../../components/auth/Auth';
import { fetchUrl } from '../../../../services/6529api';

// Mock dependencies
jest.mock('../../../../services/6529api');
jest.mock('next/dynamic', () => {
  return () => {
    const DynamicComponent = () => <div data-testid="rememe-page-component">RememePageComponent</div>;
    DynamicComponent.displayName = 'RememePageComponent';
    return DynamicComponent;
  };
});

const mockFetchUrl = fetchUrl as jest.MockedFunction<typeof fetchUrl>;

describe('ReMeme Page', () => {
  const mockSetTitle = jest.fn();
  
  const mockAuthContext = {
    setTitle: mockSetTitle,
    connectedProfile: null,
    activeProfileProxy: null,
    receivedProfileProxies: [],
    givenProfileProxies: [],
    showWaves: true,
    setShowWaves: jest.fn(),
    setConnectedProfile: jest.fn(),
    setActiveProfileProxy: jest.fn(),
    receivedProfileProxiesLoading: false,
    givenProfileProxiesLoading: false,
    requestAuth: jest.fn(),
    setRequestAuth: jest.fn()
  };

  const defaultProps = {
    pageProps: {
      contract: '0x123',
      id: '1',
      name: 'Test ReMeme',
      image: 'test-image.jpg'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders main container with correct styling', () => {
      const { container } = render(
        <AuthContext.Provider value={mockAuthContext}>
          <ReMeme {...defaultProps} />
        </AuthContext.Provider>
      );

      expect(container.querySelector('main')).toHaveClass('main');
    });

    it('renders RememePageComponent with correct props', () => {
      const { getByTestId } = render(
        <AuthContext.Provider value={mockAuthContext}>
          <ReMeme {...defaultProps} />
        </AuthContext.Provider>
      );

      expect(getByTestId('rememe-page-component')).toBeInTheDocument();
    });

    it('sets page title on mount', () => {
      render(
        <AuthContext.Provider value={mockAuthContext}>
          <ReMeme {...defaultProps} />
        </AuthContext.Provider>
      );

      expect(mockSetTitle).toHaveBeenCalledWith({
        title: 'Test ReMeme | ReMemes | 6529.io'
      });
    });
  });

  describe('getServerSideProps', () => {
    const mockReq = {
      query: {
        contract: '0x123',
        id: '456'
      }
    };

    beforeEach(() => {
      process.env.API_ENDPOINT = 'https://api.test.com';
      process.env.BASE_ENDPOINT = 'https://test.com';
    });

    it('returns props with formatted address when API returns no data', async () => {
      mockFetchUrl.mockResolvedValue({ data: [] });

      const result = await getServerSideProps(mockReq, {}, {});

      expect(mockFetchUrl).toHaveBeenCalledWith(
        'https://api.test.com/api/rememes?contract=0x123&id=456'
      );

      expect(result).toEqual({
        props: {
          contract: '0x123',
          id: '456',
          name: '0x123 #456',
          image: 'https://test.com/6529io.png',
          metadata: {
            title: '0x123 #456',
            ogImage: 'https://test.com/6529io.png',
            description: 'ReMemes',
            twitterCard: 'summary_large_image'
          }
        }
      });
    });

    it('returns props with API data when available', async () => {
      mockFetchUrl.mockResolvedValue({
        data: [{
          metadata: { name: 'Custom ReMeme Name' },
          image: 'https://custom-image.jpg'
        }]
      });

      const result = await getServerSideProps(mockReq, {}, {});

      expect(result).toEqual({
        props: {
          contract: '0x123',
          id: '456',
          name: 'Custom ReMeme Name',
          image: 'https://custom-image.jpg',
          metadata: {
            title: 'Custom ReMeme Name',
            ogImage: 'https://custom-image.jpg',
            description: 'ReMemes',
            twitterCard: 'summary_large_image'
          }
        }
      });
    });

    it('handles API data without metadata name', async () => {
      mockFetchUrl.mockResolvedValue({
        data: [{
          image: 'https://custom-image.jpg'
        }]
      });

      const result = await getServerSideProps(mockReq, {}, {});

      expect(result.props.name).toBe('0x123 #456');
      expect(result.props.image).toBe('https://custom-image.jpg');
    });

    it('handles API data without image', async () => {
      mockFetchUrl.mockResolvedValue({
        data: [{
          metadata: { name: 'Custom Name' }
        }]
      });

      const result = await getServerSideProps(mockReq, {}, {});

      expect(result.props.name).toBe('Custom Name');
      expect(result.props.image).toBe('https://test.com/6529io.png');
    });

    it('uses fallback image in og metadata when image is null', async () => {
      mockFetchUrl.mockResolvedValue({
        data: [{
          metadata: { name: 'Test Name' },
          image: null
        }]
      });

      const result = await getServerSideProps(mockReq, {}, {});

      expect(result.props.metadata.ogImage).toBe('https://test.com/6529io.png');
    });

    it('handles API fetch failure gracefully', async () => {
      mockFetchUrl.mockResolvedValue(null);

      const result = await getServerSideProps(mockReq, {}, {});

      expect(result.props.name).toBe('0x123 #456');
      expect(result.props.image).toBe('https://test.com/6529io.png');
    });
  });
});