import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import React from 'react';
import ConsolidationUseCases from '../../pages/consolidation-use-cases';
import { getServerSideProps as getGroupsProps } from '../../pages/[user]/groups';
import { getServerSideProps as getStatsProps } from '../../pages/[user]/stats';
import OpenMetaverse from '../../pages/about/open-metaverse';
import Tweetstorms from '../../pages/education/tweetstorms';
import MemeLab from '../../pages/meme-lab';
import FamPage from '../../pages/museum/6529-fam';
import BalladOfGhosts from '../../pages/museum/6529-fund-szn1/ballad-of-ghosts';
import DeadRingers from '../../pages/museum/6529-fund-szn1/dead-ringers';
import GenesisPage from '../../pages/museum/6529-fund-szn1/genesis';
import { AuthContext } from '../../components/auth/Auth';


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

jest.mock('../../hooks/useIdentity', () => ({
  useIdentity: () => ({ profile: { handle: 'alice' }, isLoading: false }),
}));

jest.mock('../../helpers/server.helpers', () => ({
  getCommonHeaders: jest.fn(() => ({})),
  getUserProfile: jest.fn(() => Promise.resolve({ handle: 'alice' })),
  userPageNeedsRedirect: jest.fn(() => false),
  getMetadataForUserPage: jest.fn(() => 'meta'),
}));

const TestProvider: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <AuthContext.Provider value={{ setTitle: jest.fn() } as any}>{children}</AuthContext.Provider>
);

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ status: 200, text: () => Promise.resolve('<div>html</div>') })
  ) as any;
});

describe('additional static pages render', () => {
  it('renders Consolidation Use Cases page', () => {
    render(
      <TestProvider>
        <ConsolidationUseCases />
      </TestProvider>
    );
    expect(screen.getByText(/Consolidation/i)).toBeInTheDocument();
  });

  it('getServerSideProps for groups returns props', async () => {
    const result = await getGroupsProps({ query: { user: 'alice' } } as any, null as any, null as any);
    expect(result).toEqual({ props: { profile: { handle: 'alice' }, metadata: 'meta' } });
  });

  it('getServerSideProps for stats returns props', async () => {
    const result = await getStatsProps({ query: { user: 'alice' } } as any, null as any, null as any);
    expect(result).toEqual({ props: { profile: { handle: 'alice' }, metadata: 'meta' } });
  });

  it('renders Open Metaverse page', () => {
    const { container } = render(<OpenMetaverse />);
    expect(container).toBeInTheDocument();
  });

  it('renders Tweetstorms page', () => {
    const { container } = render(<Tweetstorms />);
    expect(container).toBeInTheDocument();
  });

  it('renders Meme Lab page', () => {
    const { container } = render(<TestProvider><MemeLab /></TestProvider>);
    expect(container).toBeInTheDocument();
  });

  it('renders 6529 fam museum page', () => {
    render(<FamPage />);
    expect(screen.getAllByText(/6529 FAM/i).length).toBeGreaterThan(0);
  });

  it('renders Ballad of Ghosts page', () => {
    render(<BalladOfGhosts />);
    expect(screen.getAllByText(/BALLAD OF GHOSTS/i).length).toBeGreaterThan(0);
  });

  it('renders Dead Ringers page', () => {
    render(<DeadRingers />);
    expect(screen.getAllByText(/DEAD RINGERS/i).length).toBeGreaterThan(0);
  });

  it('renders Genesis museum page', () => {
    render(<GenesisPage />);
    expect(screen.getAllByText(/GENESIS/i).length).toBeGreaterThan(0);
  });
});
