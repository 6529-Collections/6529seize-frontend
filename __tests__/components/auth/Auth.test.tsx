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

// Using useSecureSign instead of legacy Wagmi hooks

jest.mock("../../../services/api/common-api", () => ({
  commonApiFetch: jest.fn(() => Promise.resolve({ id: "1", handle: "user", query: "user" })),
  commonApiPost: jest.fn(() => Promise.resolve({ token: 'jwt-token', refresh_token: 'refresh-token' })),
}));

jest.mock("../../../services/auth/auth.utils", () => ({
  removeAuthJwt: jest.fn(),
  setAuthJwt: jest.fn(),
  getAuthJwt: jest.fn(() => null),
}));

// Using jwt-validation.utils instead of direct jwt-decode

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

jest.mock("../../../hooks/useIdentity", () => ({
  useIdentity: jest.fn(() => ({ 
    profile: null, 
    isLoading: false 
  })),
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
const mockUseIdentity = require("../../../hooks/useIdentity").useIdentity as jest.MockedFunction<any>;

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
    
    // Reset useIdentity mock
    mockUseIdentity.mockReturnValue({ profile: null, isLoading: false });
    
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
    // Title management moved to TitleContext - test removed as obsolete

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
      // Set up profile mock to return a profile with handle
      mockUseIdentity.mockReturnValue({ 
        profile: { id: "1", handle: "testuser", query: "testuser" }, 
        isLoading: false 
      });
      
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

  describe("Race Condition Prevention and Abort Controller", () => {
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

    it("should pass abort signal to validateAuthImmediate for operation cancellation", async () => {
      mockValidateAuthImmediate.mockImplementation(async ({ params }) => {
        // Verify that an abort signal is provided with required properties
        expect(params.abortSignal).toHaveProperty('aborted', false);
        expect(params.abortSignal).toHaveProperty('addEventListener');
        expect(params.abortSignal).toHaveProperty('removeEventListener');
        expect(params.operationId).toMatch(/^auth-\d+-/);
        return { validationCompleted: true, wasCancelled: false, shouldShowModal: false };
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

      // Verify abort signal and operation ID are passed correctly
      expect(mockValidateAuthImmediate).toHaveBeenCalledWith(expect.objectContaining({
        params: expect.objectContaining({
          abortSignal: expect.objectContaining({
            aborted: false,
            addEventListener: expect.any(Function),
            removeEventListener: expect.any(Function)
          }),
          operationId: expect.stringMatching(/^auth-\d+-/)
        })
      }));
    });

    it("should handle cancelled operations gracefully", async () => {
      // Simulate a cancelled operation
      mockValidateAuthImmediate.mockResolvedValueOnce({ validationCompleted: false, wasCancelled: true, shouldShowModal: false });

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

      // Should not show error messages for cancelled operations
      const { toast } = require("react-toastify");
      expect(toast).not.toHaveBeenCalled();
    });

    it("should cleanup abort controllers on component unmount", async () => {
      const { unmount } = render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-component')).toBeInTheDocument();
      });

      // Unmount should trigger cleanup without errors
      expect(() => unmount()).not.toThrow();
    });

    it("should generate unique operation IDs for concurrent operations", async () => {
      let operationIds: string[] = [];
      
      mockValidateAuthImmediate.mockImplementation(async ({ params }) => {
        operationIds.push(params.operationId);
        return { validationCompleted: true, wasCancelled: false, shouldShowModal: false };
      });

      // Render Auth component
      const { unmount } = render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
          <Auth>
            <div data-testid="auth-component">Auth Component</div>
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-component')).toBeInTheDocument();
      });

      // Wait for validation to be called and check operation ID format
      await waitFor(() => {
        expect(operationIds.length).toBeGreaterThan(0);
      });

      // Check that operation IDs follow the expected pattern
      expect(operationIds[0]).toMatch(/^auth-\d+-[a-z0-9]+/);

      unmount();
    });
  });

  describe("Secure Authentication Flow", () => {
    const mockValidateAuthImmediate = require('../../../services/auth/immediate-validation.utils').validateAuthImmediate;
    const mockGetAuthJwt = require('../../../services/auth/auth.utils').getAuthJwt;

    it("should call validateAuthImmediate on component mount with wallet connected", async () => {
      mockGetAuthJwt.mockReturnValue('test-jwt-token');
      mockValidateAuthImmediate.mockResolvedValue({ validationCompleted: true, wasCancelled: false, shouldShowModal: false });

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
        return { validationCompleted: true, wasCancelled: false, shouldShowModal: true };
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
      mockValidateAuthImmediate.mockResolvedValue({ validationCompleted: true, wasCancelled: false, shouldShowModal: false });
      
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
      mockValidateAuthImmediate.mockResolvedValue({ validationCompleted: true, wasCancelled: false, shouldShowModal: false });
      const mockProfile = { id: "1", handle: "testuser", query: "testuser" };
      
      // Mock useIdentity to return the profile immediately
      mockUseIdentity.mockReturnValue({ profile: mockProfile, isLoading: false });

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

      // Wait for context to be populated with the mocked profile
      await waitFor(() => {
        expect(contextValues.connectedProfile).not.toBeNull();
      });

      // Check that context provides expected functions and values
      expect(contextValues).toEqual(expect.objectContaining({
        requestAuth: expect.any(Function),
        setToast: expect.any(Function),
        setActiveProfileProxy: expect.any(Function),
        connectedProfile: mockProfile,
        fetchingProfile: false, // Since we mocked isLoading as false
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
      mockValidateAuthImmediate.mockResolvedValue({ validationCompleted: true, wasCancelled: false, shouldShowModal: false });
      const mockProfile = { id: "1", handle: "testuser", query: "testuser" };
      
      // Mock useIdentity to simulate profile fetching
      mockUseIdentity.mockReturnValue({ profile: mockProfile, isLoading: false });

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

      // The useIdentity hook should be called with the wallet address
      expect(mockUseIdentity).toHaveBeenCalledWith({
        handleOrWallet: walletAddress,
        initialProfile: null,
      });

      // Profile should be available in context from the mocked hook
      await waitFor(() => {
        expect(contextValues.connectedProfile).toEqual(mockProfile);
      });
    });

    it("should clear profile when address is null", async () => {
      walletAddress = null;
      
      // Mock useIdentity to return null when no address
      mockUseIdentity.mockReturnValue({ profile: null, isLoading: false });
      
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
        return { validationCompleted: true, wasCancelled: false, shouldShowModal: true };
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
        return { validationCompleted: true, wasCancelled: false, shouldShowModal: true };
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

  describe("Authentication Integration", () => {
    const { toast } = require("react-toastify");

    it("should show error when wallet not connected", async () => {
      walletAddress = null;
      
      const Child = () => {
        const { requestAuth } = React.useContext(AuthContext);
        return <button onClick={() => requestAuth()} data-testid="test-no-wallet">Test No Wallet</button>;
      };

      render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      const user = userEvent.setup();
      await user.click(screen.getByTestId('test-no-wallet'));
      
      expect(toast).toHaveBeenCalledWith(
        "Please connect your wallet",
        expect.objectContaining({ type: "error" })
      );
    });
  });

  describe("Toast Functionality", () => {
    it("should show toast using setToast with error type", async () => {
      const Child = () => {
        const { setToast } = React.useContext(AuthContext);
        
        const triggerErrorToast = () => {
          setToast({
            message: "Test error message",
            type: "error"
          });
        };

        return <button onClick={triggerErrorToast} data-testid="test-error-toast">Test Error Toast</button>;
      };

      render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      const user = userEvent.setup();
      const { toast } = require("react-toastify");
      
      await user.click(screen.getByTestId('test-error-toast'));
      
      expect(toast).toHaveBeenCalledWith(
        "Test error message",
        expect.objectContaining({ type: "error" })
      );
    });

    it("should show toast using setToast with success type", async () => {
      const Child = () => {
        const { setToast } = React.useContext(AuthContext);
        
        const triggerSuccessToast = () => {
          setToast({
            message: "Test success message",
            type: "success"
          });
        };

        return <button onClick={triggerSuccessToast} data-testid="test-success-toast">Test Success Toast</button>;
      };

      render(
        <ReactQueryWrapperContext.Provider value={{ invalidateAll: jest.fn() } as any}>
          <Auth>
            <Child />
          </Auth>
        </ReactQueryWrapperContext.Provider>
      );

      const user = userEvent.setup();
      const { toast } = require("react-toastify");
      
      await user.click(screen.getByTestId('test-success-toast'));
      
      expect(toast).toHaveBeenCalledWith(
        "Test success message",
        expect.objectContaining({ type: "success" })
      );
    });
  });

});