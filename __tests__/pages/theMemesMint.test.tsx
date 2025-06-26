import React from 'react';
import { render, screen } from '@testing-library/react';
import TheMemesMint, { getServerSideProps } from '../../pages/the-memes/mint';
import { AuthContext } from '../../components/auth/Auth';
import { getCommonHeaders } from '../../helpers/server.helpers';
import { commonApiFetch } from '../../services/api/common-api';

jest.mock('next/dynamic', () => () => (props: any) => <div data-testid="dynamic" {...props} />);
jest.mock('../../helpers/server.helpers');
jest.mock('../../services/api/common-api');
jest.mock('../../styles/Home.module.scss', () => ({ main: 'main-class' }));

// Mock TitleContext
jest.mock('../../contexts/TitleContext', () => ({
  useTitle: () => ({
    title: 'Test Title',  
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));


const nft = { id: 1, name: 'Meme', mint_date: '2020-01-01' } as any;

describe('TheMemesMint page', () => {
  const setTitle = jest.fn();

  it('renders minting component and sets title', () => {
    render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <TheMemesMint pageProps={{ nft }} />
      </AuthContext.Provider>
    );
    // Title is set via TitleContext hooks
    const dynamic = screen.getByTestId('dynamic');
    expect(dynamic.getAttribute('title')).toBe('The Memes #1');
  });

  it('exports metadata', () => {
    expect(TheMemesMint.metadata).toEqual({
      title: 'Mint | The Memes',
      ogImage: `${process.env.BASE_ENDPOINT}/memes-preview.png`,
      twitterCard: 'summary_large_image',
    });
  });
});

describe('TheMemesMint getServerSideProps', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns nft data', async () => {
    (getCommonHeaders as jest.Mock).mockReturnValue({ h: '1' });
    (commonApiFetch as jest.Mock).mockResolvedValue(nft);
    const result = await getServerSideProps({} as any, null as any, null as any);
    expect(commonApiFetch).toHaveBeenCalledWith({ endpoint: 'memes_latest', headers: { h: '1' } });
    expect(result).toEqual({ props: { nft } });
  });
});
