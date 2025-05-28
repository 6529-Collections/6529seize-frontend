import React from 'react';
import { render, screen } from '@testing-library/react';
import GradientPage, { getServerSideProps } from '../../pages/6529-gradient/[id]';
import { AuthContext } from '../../components/auth/Auth';
import { fetchUrl } from '../../services/6529api';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);
jest.mock('../../services/6529api');

const TestProvider: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <AuthContext.Provider value={{ setTitle: jest.fn() } as any}>{children}</AuthContext.Provider>
);

describe('GradientPage', () => {
  it('renders gradient component', () => {
    render(
      <TestProvider>
        <GradientPage pageProps={{ id: '1', name: 'Gradient #1', image: 'img', metadata: {} }} />
      </TestProvider>
    );
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
  });
});

describe('GradientPage getServerSideProps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns data from api', async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({ data: [{ name: 'G1', thumbnail: 't.png' }] });
    const result = await getServerSideProps({ query: { id: '5' } } as any, null as any, null as any);
    expect(result).toEqual({
      props: {
        id: '5',
        name: 'G1',
        image: 't.png',
        metadata: { title: 'G1', ogImage: 't.png', description: '6529 Gradient' },
      },
    });
  });

  it('uses defaults when api empty', async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({ data: [] });
    process.env.BASE_ENDPOINT = 'http://base';
    const result = await getServerSideProps({ query: { id: '8' } } as any, null as any, null as any);
    expect(result).toEqual({
      props: {
        id: '8',
        name: 'Gradient #8',
        image: 'http://base/6529io.png',
        metadata: { title: 'Gradient #8', ogImage: 'http://base/6529io.png', description: '6529 Gradient' },
      },
    });
  });
});
