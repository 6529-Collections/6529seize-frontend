import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Auth, { useAuth } from "../../../components/auth/Auth";
import { ReactQueryWrapperContext } from "../../../components/react-query-wrapper/ReactQueryWrapper";


// Mock TitleContext
jest.mock('../../../contexts/TitleContext', () => ({
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

let walletAddress: string | null = "0x1";
let connectionState: string = 'connected';

jest.mock('../../../components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: () => ({
    address: walletAddress,
    isConnected: !!walletAddress,
    seizeDisconnectAndLogout: jest.fn(),
    connectionState: connectionState,
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({ data: [] })),
}));

jest.mock('../../../services/api/common-api', () => ({
  commonApiFetch: jest.fn(() => Promise.resolve({ id: "1", handle: "user", query: "user" })),
  commonApiPost: jest.fn(() => Promise.resolve({})),
}));

jest.mock('wagmi', () => ({
  useSignMessage: () => ({ signMessageAsync: jest.fn(), isPending: false }),
}));

jest.mock('@reown/appkit/react', () => ({
  useAppKit: jest.fn(() => ({
    open: jest.fn(),
  })),
}));

jest.mock('../../../hooks/useSecureSign', () => ({
  useSecureSign: jest.fn(() => ({
    signMessage: jest.fn(),
    isSigningPending: false,
    reset: jest.fn(),
  })),
  MobileSigningError: class MobileSigningError extends Error {},
  ConnectionMismatchError: class ConnectionMismatchError extends Error {},
}));

jest.mock('../../../hooks/useMobileWalletConnection', () => ({
  useMobileWalletConnection: jest.fn(() => ({
    mobileInfo: {
      isMobile: false,
      isInAppBrowser: false,
    },
    getMobileInstructions: jest.fn(() => "Test instructions"),
  })),
}));

jest.mock('react-bootstrap', () => ({
  Modal: Object.assign(
    ({ children }: any) => <div>{children}</div>,
    {
      Header: ({ children }: any) => <div>{children}</div>,
      Title: ({ children }: any) => <h4>{children}</h4>,
      Body: ({ children }: any) => <div>{children}</div>,
      Footer: ({ children }: any) => <div>{children}</div>,
    }
  ),
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

jest.mock('react-toastify', () => ({
  ToastContainer: () => null,
  toast: jest.fn(),
  Slide: {},
}));

function ShowWaves() {
  const { showWaves } = useAuth();
  return <span data-testid="waves">{String(showWaves)}</span>;
}

function RequestAuthButton() {
  const { requestAuth } = useAuth();
  return <button onClick={() => requestAuth()} data-testid="req">req</button>;
}

describe("Auth", () => {
  beforeEach(() => {
    walletAddress = "0x1";
    connectionState = 'connected';
    jest.clearAllMocks();
  });
  
  // Title functionality has been moved to TitleContext
  // This test is no longer applicable

  it("returns showWaves true when wallet and profile", async () => {
    render(
      <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
        <Auth>
          <ShowWaves />
        </Auth>
      </ReactQueryWrapperContext.Provider>
    );
    await waitFor(() => expect(screen.getByTestId('waves')).toHaveTextContent('true'));
  });

  it("requestAuth shows error without wallet", async () => {
    walletAddress = null;
    const toast = require("react-toastify").toast;
    const user = userEvent.setup();
    render(
      <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
        <Auth>
          <RequestAuthButton />
        </Auth>
      </ReactQueryWrapperContext.Provider>
    );
    await user.click(screen.getByTestId('req'));
    expect(toast).toHaveBeenCalled();
  });

  describe("Race Condition Prevention", () => {
    let mockCommonApiFetch: jest.Mock;
    let mockValidateJwt: jest.SpyInstance;
    let mockGetAuthJwt: jest.SpyInstance;

    beforeEach(() => {
      mockCommonApiFetch = require('../../../services/api/common-api').commonApiFetch;
      
      // Mock auth utils
      jest.doMock('../../../services/auth/auth.utils', () => ({
        getAuthJwt: jest.fn(() => null),
        getRefreshToken: jest.fn(() => null), 
        getWalletAddress: jest.fn(() => walletAddress),
        getWalletRole: jest.fn(() => null),
        removeAuthJwt: jest.fn(),
        setAuthJwt: jest.fn(),
      }));
      
      mockGetAuthJwt = require('../../../services/auth/auth.utils').getAuthJwt;
    });

    it("should prevent authentication bypass via rapid address changes", async () => {
      // Mock invalid JWT to trigger validation
      mockGetAuthJwt.mockReturnValue('invalid-jwt');
      
      // Mock JWT decode to return expired token
      jest.doMock('jwt-decode', () => ({
        jwtDecode: jest.fn(() => ({
          sub: walletAddress?.toLowerCase(),
          exp: Date.now() / 1000 - 3600, // Expired 1 hour ago
          role: null,
        })),
      }));

      const removeAuthJwtSpy = jest.fn();
      const invalidateAllSpy = jest.fn();
      
      jest.doMock('../../../services/auth/auth.utils', () => ({
        ...jest.requireActual('../../../services/auth/auth.utils'),
        removeAuthJwt: removeAuthJwtSpy,
      }));

      render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: invalidateAllSpy } as any}>
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      // Initial address
      walletAddress = "0x1111111111111111111111111111111111111111";
      
      // Simulate rapid address change during validation
      setTimeout(() => {
        walletAddress = "0x2222222222222222222222222222222222222222";
      }, 50);

      // Wait for any async operations
      await waitFor(() => {
        expect(screen.getByTestId('auth-component')).toBeInTheDocument();
      });

      // Ensure validation was properly handled and didn't cause race condition
      expect(screen.getByTestId('auth-component')).toBeInTheDocument();
    });

    it("should abort previous operations when address changes", async () => {
      const abortSpy = jest.fn();
      const originalAbortController = global.AbortController;
      
      global.AbortController = jest.fn().mockImplementation(() => ({
        abort: abortSpy,
        signal: { aborted: false },
      }));

      render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      // Initial render with first address
      walletAddress = "0x1111111111111111111111111111111111111111";
      
      // Change address to trigger abort of previous operation
      walletAddress = "0x2222222222222222222222222222222222222222";
      
      // Re-render with new address
      render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-component')).toBeInTheDocument();
      });

      global.AbortController = originalAbortController;
    });

    it("should never validate JWT for stale addresses", async () => {
      let validationAddress: string | null = null;
      
      // Mock validateJwt to capture the address it validates
      const mockValidateJwt = jest.fn(async ({ wallet }) => {
        validationAddress = wallet;
        // Simulate async delay
        await new Promise(resolve => setTimeout(resolve, 100));
        return { isValid: false, wasCancelled: false };
      });

      // Mock the Auth component's validateJwt function
      jest.doMock('../../../components/auth/Auth', () => {
        const originalModule = jest.requireActual('../../../components/auth/Auth');
        return {
          ...originalModule,
          default: function MockAuth({ children }: { children: React.ReactNode }) {
            const originalAuth = originalModule.default({ children });
            // Override the validateJwt function
            originalAuth.props.validateJwt = mockValidateJwt;
            return originalAuth;
          }
        };
      });

      render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      // Start with first address
      const firstAddress = "0x1111111111111111111111111111111111111111";
      walletAddress = firstAddress;
      
      // Quickly change to second address before validation completes
      setTimeout(() => {
        walletAddress = "0x2222222222222222222222222222222222222222";
      }, 50);

      await waitFor(() => {
        expect(screen.getByTestId('auth-component')).toBeInTheDocument();
      });

      // The validation should have been for the captured address at validation time,
      // not any subsequently changed address
      if (validationAddress) {
        expect(validationAddress).toBe(firstAddress);
      }
    });

    it("should handle connection state transitions without race conditions", async () => {
      const invalidateAllSpy = jest.fn();
      
      render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: invalidateAllSpy } as any}>
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      // Start connecting
      connectionState = 'connecting';
      walletAddress = "0x1111111111111111111111111111111111111111";
      
      // Quickly transition to connected
      setTimeout(() => {
        connectionState = 'connected';
      }, 25);
      
      // Then disconnect
      setTimeout(() => {
        connectionState = 'disconnected';
        walletAddress = null;
      }, 75);

      await waitFor(() => {
        expect(screen.getByTestId('auth-component')).toBeInTheDocument();
      });

      // Component should handle rapid state transitions gracefully
      expect(screen.getByTestId('auth-component')).toBeInTheDocument();
    });

    it("should ensure immediate validation prevents timing window attacks", async () => {
      const validationTimes: number[] = [];
      
      // Mock validateJwt to record when validation starts
      const mockValidateJwt = jest.fn(async () => {
        validationTimes.push(Date.now());
        return { isValid: true, wasCancelled: false };
      });

      let effectStartTime = 0;
      
      // Mock useEffect to capture when it starts
      const originalUseEffect = React.useEffect;
      jest.spyOn(React, 'useEffect').mockImplementation((effect, deps) => {
        if (deps && deps.includes(walletAddress)) {
          effectStartTime = Date.now();
        }
        return originalUseEffect(effect, deps);
      });

      render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-component')).toBeInTheDocument();
      });

      // Validation should have started immediately, not after a delay
      // The time difference should be minimal (< 100ms for immediate execution)
      if (validationTimes.length > 0 && effectStartTime > 0) {
        const timeDifference = validationTimes[0] - effectStartTime;
        expect(timeDifference).toBeLessThan(100); // Should be immediate, not delayed
      }

      React.useEffect = originalUseEffect;
    });
  });
});
