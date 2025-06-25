import { render, screen } from '@testing-library/react';
import React from 'react';
import GroupsPage from '../../pages/network/groups';
import CommunityMetrics from '../../pages/network/metrics';
import { AuthContext } from '../../components/auth/Auth';

jest.mock('next/router', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() })
}));

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
  usePathname: () => '/network'
}));

jest.mock('../../components/groups/page/Groups', () => () => (
  <div data-testid="groups-component">Groups Component</div>
));

const mockAuthContext = {
  connectedProfile: null,
  activeProfileProxy: null,
  requestAuth: jest.fn()
} as any;

function renderWithAuth(component: React.ReactElement) {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      {component}
    </AuthContext.Provider>
  );
}


// Mock TitleContext
const mockSetTitle = jest.fn();
jest.mock('../../contexts/TitleContext', () => ({
  useTitle: () => ({
    title: 'Test Title',
    setTitle: mockSetTitle,
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: () => mockSetTitle,
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('network pages render', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Groups page', () => {
    renderWithAuth(<GroupsPage />);
    expect(screen.getByTestId('groups-component')).toBeInTheDocument();
  });

  it('renders Community Metrics page', () => {
    renderWithAuth(<CommunityMetrics />);
    expect(screen.getByText('Network')).toBeInTheDocument();
    expect(screen.getByText('Metrics')).toBeInTheDocument();
    expect(screen.getByText(/Background/i)).toBeInTheDocument();
    expect(screen.getByText(/Metrics Definitions/i)).toBeInTheDocument();
  });

  it('displays TDH calculation details in metrics page', () => {
    renderWithAuth(<CommunityMetrics />);
    expect(screen.getByText(/Total Days Held/i)).toBeInTheDocument();
    expect(screen.getByText(/Cards Collected/i)).toBeInTheDocument();
    expect(screen.getByText(/Unique Memes/i)).toBeInTheDocument();
  });

  it('shows metadata for Groups page', () => {
    expect(GroupsPage.metadata).toEqual({
      title: 'Groups',
      description: 'Network'
    });
  });

  it('shows metadata for Metrics page', () => {
    expect(CommunityMetrics.metadata).toEqual({
      title: 'Metrics',
      description: 'Network'
    });
  });
});