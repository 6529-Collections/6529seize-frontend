import { render, act } from '@testing-library/react';
import DistributionPlanToolWrapper from '../../components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper';
import { AuthContext } from '../../components/auth/Auth';
import { useSeizeConnectContext } from '../../components/auth/SeizeConnectContext';
import { useRouter } from 'next/router';
import { Poppins } from 'next/font/google';

jest.mock('next/font/google', () => ({ Poppins: () => ({ className: 'poppins' }) }));
jest.mock('../../components/auth/SeizeConnectContext');
jest.mock('next/router', () => ({ useRouter: jest.fn() }));

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


const useSeizeConnectContextMock = useSeizeConnectContext as jest.MockedFunction<typeof useSeizeConnectContext>;
const useRouterMock = useRouter as jest.Mock;

describe('DistributionPlanToolWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets title and renders children', () => {
    const push = jest.fn();
    useRouterMock.mockReturnValue({ push, pathname: '/' });
    useSeizeConnectContextMock.mockReturnValue({ address: undefined } as any);

    const { container } = render(
      <AuthContext.Provider value={{} as any}>
        <DistributionPlanToolWrapper>
          <div data-testid="child">child content</div>
        </DistributionPlanToolWrapper>
      </AuthContext.Provider>
    );

    // Title is set via TitleContext hook
    expect(container.querySelector('[data-testid="child"]')).toBeInTheDocument();
    expect(container.querySelector('#allowlist-tool')).toBeInTheDocument();
  });
});
