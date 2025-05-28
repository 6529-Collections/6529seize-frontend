import React from 'react';
import { render, screen } from '@testing-library/react';
import ReMeme, { getServerSideProps } from '../../pages/rememes/[contract]/[id]';
import { AuthContext } from '../../components/auth/Auth';
import { fetchUrl } from '../../services/6529api';
import { formatAddress } from '../../helpers/Helpers';

jest.mock('next/dynamic', () => () => () => <div data-testid="rememe-page-component" />);
jest.mock('../../services/6529api');
jest.mock('../../helpers/Helpers');

const mockSetTitle = jest.fn();

const TestProvider: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <AuthContext.Provider value={{ setTitle: mockSetTitle } as any}>
    {children}
  </AuthContext.Provider>
);

describe('ReMeme page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders RememePageComponent with correct props', () => {
    const pageProps = {
      contract: '0x123abc',
      id: '456',
      name: 'Test ReMeme',
      image: 'test-image.png'
    };

    render(
      <TestProvider>
        <ReMeme pageProps={pageProps} />
      </TestProvider>
    );

    expect(screen.getByTestId('rememe-page-component')).toBeInTheDocument();
  });

  it('sets page title on mount', () => {
    const pageProps = {
      contract: '0x123abc',
      id: '456',
      name: 'Test ReMeme',
      image: 'test-image.png'
    };

    render(
      <TestProvider>
        <ReMeme pageProps={pageProps} />
      </TestProvider>
    );

    expect(mockSetTitle).toHaveBeenCalledWith({
      title: 'Test ReMeme | ReMemes | 6529.io'
    });
  });
});

describe('ReMeme getServerSideProps', () => {
  const mockFormatAddress = formatAddress as jest.MockedFunction<typeof formatAddress>;
  const mockFetchUrl = fetchUrl as jest.MockedFunction<typeof fetchUrl>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_ENDPOINT = 'https://api.test.com';
    process.env.BASE_ENDPOINT = 'https://test.com';
    mockFormatAddress.mockReturnValue('0x123...abc');
  });

  it('returns props with rememe data when API returns data', async () => {
    const mockResponse = {
      data: [{
        metadata: { name: 'Custom ReMeme Name' },
        image: 'https://test.com/custom-image.png'
      }]
    };
    mockFetchUrl.mockResolvedValue(mockResponse);

    const req = { query: { contract: '0x123abc', id: '456' } };
    const result = await getServerSideProps(req, {}, {});

    expect(mockFetchUrl).toHaveBeenCalledWith(
      'https://api.test.com/api/rememes?contract=0x123abc&id=456'
    );
    expect(result).toEqual({
      props: {
        contract: '0x123abc',
        id: '456',
        name: 'Custom ReMeme Name',
        image: 'https://test.com/custom-image.png',
        metadata: {
          title: 'Custom ReMeme Name',
          ogImage: 'https://test.com/custom-image.png',
          description: 'ReMemes',
          twitterCard: 'summary_large_image'
        }
      }
    });
  });

  it('returns props with default name and image when API returns empty data', async () => {
    const mockResponse = { data: [] };
    mockFetchUrl.mockResolvedValue(mockResponse);

    const req = { query: { contract: '0x123abc', id: '456' } };
    const result = await getServerSideProps(req, {}, {});

    expect(mockFormatAddress).toHaveBeenCalledWith('0x123abc');
    expect(result).toEqual({
      props: {
        contract: '0x123abc',
        id: '456',
        name: '0x123...abc #456',
        image: 'https://test.com/6529io.png',
        metadata: {
          title: '0x123...abc #456',
          ogImage: 'https://test.com/6529io.png',
          description: 'ReMemes',
          twitterCard: 'summary_large_image'
        }
      }
    });
  });

  it('returns props with default values when API returns null', async () => {
    mockFetchUrl.mockResolvedValue(null);

    const req = { query: { contract: '0x123abc', id: '456' } };
    const result = await getServerSideProps(req, {}, {});

    expect(result).toEqual({
      props: {
        contract: '0x123abc',
        id: '456',
        name: '0x123...abc #456',
        image: 'https://test.com/6529io.png',
        metadata: {
          title: '0x123...abc #456',
          ogImage: 'https://test.com/6529io.png',
          description: 'ReMemes',
          twitterCard: 'summary_large_image'
        }
      }
    });
  });

  it('handles data with partial metadata', async () => {
    const mockResponse = {
      data: [{
        metadata: {},
        image: 'https://test.com/partial-image.png'
      }]
    };
    mockFetchUrl.mockResolvedValue(mockResponse);

    const req = { query: { contract: '0x123abc', id: '456' } };
    const result = await getServerSideProps(req, {}, {});

    expect(result).toEqual({
      props: {
        contract: '0x123abc',
        id: '456',
        name: '0x123...abc #456',
        image: 'https://test.com/partial-image.png',
        metadata: {
          title: '0x123...abc #456',
          ogImage: 'https://test.com/partial-image.png',
          description: 'ReMemes',
          twitterCard: 'summary_large_image'
        }
      }
    });
  });

  it('uses fallback ogImage when image is null', async () => {
    const mockResponse = {
      data: [{
        metadata: { name: 'Test Name' },
        image: null
      }]
    };
    mockFetchUrl.mockResolvedValue(mockResponse);

    const req = { query: { contract: '0x123abc', id: '456' } };
    const result = await getServerSideProps(req, {}, {});

    // When image is null, it falls back to the default image (6529io.png), not the re-memes fallback
    expect(result.props.metadata.ogImage).toBe('https://test.com/6529io.png');
  });
});