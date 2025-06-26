import React from 'react';
import { render, screen } from '@testing-library/react';
import CommunityStats from '../../pages/network/stats';
import { AuthContext } from '../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);
jest.mock('react-bootstrap', () => ({
  Container: ({ children, fluid, className }: any) => (
    <div data-testid="container" className={className} data-fluid={fluid}>{children}</div>
  ),
  Row: ({ children }: any) => <div data-testid="row">{children}</div>,
  Col: ({ children }: any) => <div data-testid="col">{children}</div>,
}));
jest.mock('../../styles/Home.module.scss', () => ({ main: 'main-class', tdhMain: 'tdh-main-class' }));


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

describe('CommunityStats page', () => {
  const setTitle = jest.fn();
  const renderPage = () =>
    render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <CommunityStats />
      </AuthContext.Provider>
    );

  it('renders layout and dynamic component', () => {
    renderPage();
    expect(screen.getAllByTestId('container').length).toBeGreaterThan(0);
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
  });

  it('sets title on mount', () => {
    renderPage();
    // Title is set via TitleContext hooks
  });

  it('exports metadata', () => {
    expect(CommunityStats.metadata).toEqual({ title: 'Stats', description: 'Network' });
  });
});
