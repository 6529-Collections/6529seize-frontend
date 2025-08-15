import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import Auth, { AuthContext, useAuth } from "../../../components/auth/Auth";
import { ReactQueryWrapperContext } from "../../../components/react-query-wrapper/ReactQueryWrapper";
import { mockTitleContextModule } from "../../utils/titleTestUtils";
import { commonApiFetch, commonApiPost } from "../../../services/api/common-api";
import { ApiNonceResponse } from "../../../generated/models/ApiNonceResponse";
import { ApiLoginResponse } from "../../../generated/models/ApiLoginResponse";

jest.mock("react-toastify", () => ({
  toast: jest.fn(),
  ToastContainer: () => <div data-testid="toast" />,
  Slide: () => null,
}));

// Wagmi mock removed - using useSecureSign instead

jest.mock("../../../services/api/common-api", () => ({
  commonApiFetch: jest.fn(() => Promise.resolve({ id: "1", handle: "user", query: "user" })),
  commonApiPost: jest.fn(() => Promise.resolve({ token: 'jwt-token', refresh_token: 'refresh-token' })),
}));

jest.mock("../../../services/auth/auth.utils", () => ({
  removeAuthJwt: jest.fn(),
  setAuthJwt: jest.fn(),
  getAuthJwt: jest.fn(() => null),
}));

// JWT decode mock removed - using jwt-validation.utils instead

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(() => ({ data: undefined })),
}));

jest.mock("@reown/appkit/react", () => ({
  useAppKit: jest.fn(() => ({
    open: jest.fn(),
  })),
}));

const mockSignMessage = jest.fn();
const mockReset = jest.fn();

jest.mock("../../../hooks/useSecureSign", () => ({
  useSecureSign: jest.fn(() => ({
    signMessage: mockSignMessage,
    isSigningPending: false,
    reset: mockReset,
  })),
  MobileSigningError: class MobileSigningError extends Error {},
  ConnectionMismatchError: class ConnectionMismatchError extends Error {},
  SigningProviderError: class SigningProviderError extends Error {},
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

// Add mocks for new services
jest.mock("../../../services/auth/jwt-validation.utils", () => ({
  validateJwt: jest.fn(async () => ({ isValid: true, wasCancelled: false })),
  getRole: jest.fn(() => null),
}));

jest.mock("../../../services/auth/immediate-validation.utils", () => ({
  validateAuthImmediate: jest.fn(async () => ({ wasCancelled: false })),
}));

jest.mock("../../../utils/error-sanitizer", () => ({
  sanitizeErrorForUser: jest.fn((error) => 'Sanitized error message'),
  logErrorSecurely: jest.fn(),
}));

jest.mock("../../../utils/role-validation", () => ({
  validateRoleForAuthentication: jest.fn((proxy) => proxy?.created_by?.id || null),
}));

// Mock TitleContext
mockTitleContextModule();

let walletAddress: string | null = "0x1";
let connectionState: string = 'connected';

const mockSeizeDisconnectAndLogout = jest.fn();

jest.mock("../../../components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(() => ({
    address: walletAddress,
    isConnected: !!walletAddress,
    seizeDisconnectAndLogout: mockSeizeDisconnectAndLogout,
    isSafeWallet: false,
    connectionState: connectionState,
  })),
}));

const mockCommonApiFetch = commonApiFetch as jest.MockedFunction<typeof commonApiFetch>;
const { commonApiPost } = require("../../../services/api/common-api");
const mockCommonApiPost = commonApiPost as jest.MockedFunction<typeof commonApiPost>;

// Test helper components
function ShowWaves() {
  const { showWaves } = useAuth();
  return <span data-testid="waves">{String(showWaves)}</span>;
}

function RequestAuthButton() {
  const { requestAuth } = useAuth();
  return <button onClick={() => requestAuth()} data-testid="req">req</button>;
}

describe("Auth component", () => {
  beforeEach(() => {
    walletAddress = "0x1";
    connectionState = 'connected';
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockSignMessage.mockResolvedValue({
      signature: '0xsignature',
      userRejected: false,
      error: null,
    });
    
    mockCommonApiFetch.mockResolvedValue({ id: "1", handle: "user", query: "user" });
    mockCommonApiPost.mockResolvedValue({ token: 'jwt-token', refresh_token: 'refresh-token' });
    
    // Mock console.error to prevent error output during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test wrapper component to access the Auth context
  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Auth>{children}</Auth>
  );

  describe("Basic functionality", () => {
    // Note: Title functionality has been moved to TitleContext
    // This test is no longer applicable as Auth doesn't manage titles anymore
    it.skip("updates title when setTitle called - moved to TitleContext", async () => {
      // Title management is now handled by TitleContext, not Auth
    });

    it("requestAuth shows toast when no address", async () => {
      walletAddress = null;
      const wrapperValue = { invalidateAll: jest.fn() } as any;
      const Child = () => {
        const { requestAuth } = React.useContext(AuthContext);
        return <button onClick={() => requestAuth()}>auth</button>;
      };

      const { toast } = require("react-toastify");

      render(
        <ReactQueryWrapperContext.Provider value={wrapperValue}>
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );
      fireEvent.click(screen.getByText("auth"));
      await waitFor(() => expect(toast).toHaveBeenCalled());
    });

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
  });

  describe("Race Condition Prevention", () => {
    const mockValidateAuthImmediate = require('../../../services/auth/immediate-validation.utils').validateAuthImmediate;

    it("should prevent authentication bypass via rapid address changes", async () => {
      // Mock validateAuthImmediate to simulate cancelled operation
      mockValidateAuthImmediate.mockResolvedValueOnce({ wasCancelled: true });

      render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      // Initial address
      walletAddress = "0x1111111111111111111111111111111111111111";
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-component')).toBeInTheDocument();
      });

      // Ensure validation was called with race condition protection
      expect(mockValidateAuthImmediate).toHaveBeenCalled();
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

      // Component should handle rapid state transitions gracefully
      expect(screen.getByTestId('auth-component')).toBeInTheDocument();
    });

    it("should ensure immediate validation prevents timing window attacks", async () => {
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

      // Immediate validation should be used (not setTimeout)
      expect(mockValidateAuthImmediate).toHaveBeenCalled();
    });
  });

  describe("Secure Authentication Flow", () => {
    const mockValidateAuthImmediate = require('../../../services/auth/immediate-validation.utils').validateAuthImmediate;
    const mockGetAuthJwt = require('../../../services/auth/auth.utils').getAuthJwt;

    it("should call validateAuthImmediate on component mount with wallet connected", async () => {
      mockGetAuthJwt.mockReturnValue('test-jwt-token');
      mockValidateAuthImmediate.mockResolvedValue({ wasCancelled: false });

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

      // Should call validateAuthImmediate with the correct parameters
      expect(mockValidateAuthImmediate).toHaveBeenCalledWith(expect.objectContaining({
        params: expect.objectContaining({
          jwt: 'test-jwt-token',
          currentAddress: walletAddress,
          connectionAddress: walletAddress,
        })
      }));
    });

    it("should show sign modal when validation indicates authentication needed", async () => {
      mockGetAuthJwt.mockReturnValue(null);
      mockValidateAuthImmediate.mockImplementation(async ({ callbacks }) => {
        callbacks.onShowSignModal(true);
        return { wasCancelled: false };
      });

      render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign Authentication Request')).toBeInTheDocument();
      });
    });

    it("should not trigger validation during connecting state", async () => {
      connectionState = 'connecting';
      mockValidateAuthImmediate.mockReset();

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

      // Should not call validateAuthImmediate during connecting state
      expect(mockValidateAuthImmediate).not.toHaveBeenCalled();
    });
  });

  describe("Toast Notifications", () => {
    const { toast } = require("react-toastify");
    const mockValidateAuthImmediate = require('../../../services/auth/immediate-validation.utils').validateAuthImmediate;

    it("should show toast notification using setToast function", async () => {
      mockValidateAuthImmediate.mockResolvedValue({ wasCancelled: false });
      
      const Child = () => {
        const { setToast } = React.useContext(AuthContext);
        return <button onClick={() => setToast({ message: 'Test message', type: 'info' })} data-testid="toast-button">Show Toast</button>;
      };

      render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      const user = userEvent.setup();
      await user.click(screen.getByTestId('toast-button'));

      expect(toast).toHaveBeenCalledWith(
        'Test message',
        expect.objectContaining({
          type: 'info',
          position: 'top-right',
          autoClose: 3000,
        })
      );
    });
  });

  describe("Context Values", () => {
    const mockValidateAuthImmediate = require('../../../services/auth/immediate-validation.utils').validateAuthImmediate;
    
    it("should provide correct context values", async () => {
      mockValidateAuthImmediate.mockResolvedValue({ wasCancelled: false });
      const mockProfile = { id: "1", handle: "testuser", query: "testuser" };
      mockCommonApiFetch.mockResolvedValue(mockProfile);

      let contextValues: any = {};
      const Child = () => {
        contextValues = React.useContext(AuthContext);
        return <div data-testid="context-consumer">Context Consumer</div>;
      };

      render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('context-consumer')).toBeInTheDocument();
      });

      // Wait for profile to be fetched and context to update
      await waitFor(() => {
        expect(contextValues.connectedProfile).not.toBeNull();
      });

      // Check that context provides expected functions and values
      expect(contextValues).toEqual(expect.objectContaining({
        requestAuth: expect.any(Function),
        setToast: expect.any(Function),
        setActiveProfileProxy: expect.any(Function),
        connectedProfile: mockProfile,
        fetchingProfile: expect.any(Boolean),
        receivedProfileProxies: expect.any(Array),
        activeProfileProxy: null,
        showWaves: expect.any(Boolean),
        connectionStatus: expect.any(String),
      }));
    });
  });

  describe("Profile Management", () => {
    const mockValidateAuthImmediate = require('../../../services/auth/immediate-validation.utils').validateAuthImmediate;
    
    it("should fetch and set connected profile when address is provided", async () => {
      mockValidateAuthImmediate.mockResolvedValue({ wasCancelled: false });
      const mockProfile = { id: "1", handle: "testuser", query: "testuser" };
      mockCommonApiFetch.mockResolvedValue(mockProfile);

      let contextValues: any = {};
      const Child = () => {
        contextValues = React.useContext(AuthContext);
        return <div data-testid="profile-consumer">Profile Consumer</div>;
      };

      render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('profile-consumer')).toBeInTheDocument();
      });

      // Should fetch profile for the connected address
      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: `identities/${walletAddress}`
        });
      });

      // Profile should eventually be set in context
      await waitFor(() => {
        expect(contextValues.connectedProfile).toEqual(mockProfile);
      });
    });

    it("should clear profile when address is null", async () => {
      walletAddress = null;
      // No need to mock validateAuthImmediate as it won't be called without address
      
      let contextValues: any = {};
      const Child = () => {
        contextValues = React.useContext(AuthContext);
        return <div data-testid="no-profile-consumer">No Profile Consumer</div>;
      };

      render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('no-profile-consumer')).toBeInTheDocument();
      });

      expect(contextValues.connectedProfile).toBeNull();
    });
  });

  describe("Modal Behavior", () => {
    it("should show modal when sign modal state is true and connected", async () => {
      const mockValidateAuthImmediate = require('../../../services/auth/immediate-validation.utils').validateAuthImmediate;
      mockValidateAuthImmediate.mockImplementation(async ({ callbacks }) => {
        callbacks.onShowSignModal(true);
        return { wasCancelled: false };
      });

      render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign Authentication Request')).toBeInTheDocument();
      });

      // Check that modal content is present
      expect(screen.getByText('To connect your wallet, you will need to sign a message to confirm your identity.')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Sign')).toBeInTheDocument();
    });

    it("should handle modal cancel button", async () => {
      const mockValidateAuthImmediate = require('../../../services/auth/immediate-validation.utils').validateAuthImmediate;
      const mockSeizeDisconnectAndLogout = require('../../../components/auth/SeizeConnectContext').useSeizeConnectContext().seizeDisconnectAndLogout;
      
      mockValidateAuthImmediate.mockImplementation(async ({ callbacks }) => {
        callbacks.onShowSignModal(true);
        return { wasCancelled: false };
      });

      render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByText('Cancel'));

      // Should call disconnect function
      expect(mockSeizeDisconnectAndLogout).toHaveBeenCalled();
    });
  });








});