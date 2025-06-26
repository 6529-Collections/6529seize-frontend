import { render, screen } from '@testing-library/react';
import React from 'react';
import WillowShield from '../../pages/museum/genesis/willow-shield';
import NextGenDistributionPlan from '../../pages/nextgen/collection/[collection]/distribution-plan';
import JoinOm from '../../pages/om/join-om';
import PartnershipRequest from '../../pages/om/partnership-request';
import ConsolidatedMetrics from '../../pages/open-data/consolidated-network-metrics';
import MemeSubscriptions from '../../pages/open-data/meme-subscriptions';
import AddRememes from '../../pages/rememes/add';
import SlideInitiatives from '../../pages/slide-page/6529-initiatives';
import AppWallets from '../../pages/tools/app-wallets';
import { AuthContext } from '../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);
jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), asPath: '/' }) }));
jest.mock('../../services/api/common-api', () => ({
  commonApiFetch: jest.fn(() => Promise.resolve({ data: [] }))
}));
global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) })) as any;

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

const TestProvider: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <AuthContext.Provider value={{ setTitle: jest.fn() } as any}>{children}</AuthContext.Provider>
);

describe('misc pages render', () => {
  it('renders Willow Shield page', () => {
    render(<WillowShield />);
    expect(screen.getAllByText(/WILLOW SHIELD/i).length).toBeGreaterThan(0);
  });

  it('renders NextGen distribution plan page', () => {
    render(<NextGenDistributionPlan pageProps={{ collection: { name: 'name' } }} />);
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
  });

  it('renders Join OM page', () => {
    render(<JoinOm />);
    expect(screen.getAllByText(/JOIN OM GENERATION 1/i).length).toBeGreaterThan(0);
  });

  it('renders partnership request redirect page', () => {
    render(<PartnershipRequest />);
    expect(screen.getByText(/You are being redirected/i)).toBeInTheDocument();
  });

  it('renders consolidated metrics page', () => {
    render(<TestProvider><ConsolidatedMetrics /></TestProvider>);
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
  });

  it('renders meme subscriptions page', () => {
    render(<TestProvider><MemeSubscriptions /></TestProvider>);
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
  });

  it('renders add rememes page', () => {
    render(<TestProvider><AddRememes /></TestProvider>);
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
  });

  it('renders slide initiatives redirect page', () => {
    render(<SlideInitiatives />);
    expect(screen.getByText(/You are being redirected/i)).toBeInTheDocument();
  });

  it('renders app wallets page', () => {
    render(<TestProvider><AppWallets /></TestProvider>);
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
  });
});
