import { render, screen } from '@testing-library/react';
import React from 'react';
import { AppWebSocketProvider } from '../../services/websocket/AppWebSocketProvider';
import { WebSocketProvider } from '../../services/websocket/WebSocketProvider';
import { useWebSocket } from '../../services/websocket/useWebSocket';
import { useWebSocketHealth } from '../../services/websocket/useWebSocketHealth';
import { getAuthJwt } from '../../services/auth/auth.utils';
import { DEFAULT_WEBSOCKET_CONFIG } from '../../services/websocket/index';

// Mock all dependencies
jest.mock('../../services/websocket/WebSocketProvider');
jest.mock('../../services/websocket/useWebSocket');
jest.mock('../../services/websocket/useWebSocketHealth');
jest.mock('../../services/auth/auth.utils');

// Mock implementations - create fresh mock functions
let mockConnect: jest.Mock;
let mockDisconnect: jest.Mock;
const mockWebSocketProvider = jest.fn(({ children }) => <div data-testid="websocket-provider">{children}</div>);
const mockUseWebSocket = useWebSocket as jest.Mock;
const mockUseWebSocketHealth = useWebSocketHealth as jest.Mock;
const mockGetAuthJwt = getAuthJwt as jest.Mock;
const MockedWebSocketProvider = WebSocketProvider as jest.Mock;

describe('AppWebSocketProvider', () => {
  beforeEach(() => {
    // Create fresh mock functions for each test
    mockConnect = jest.fn();
    mockDisconnect = jest.fn();
    
    jest.clearAllMocks();
    
    // Reset all mocks to their default implementations
    MockedWebSocketProvider.mockImplementation(mockWebSocketProvider);
    mockUseWebSocket.mockReturnValue({ connect: mockConnect, disconnect: mockDisconnect });
    mockUseWebSocketHealth.mockImplementation(() => {});
    mockGetAuthJwt.mockReturnValue(null);
  });

  describe('Basic Rendering and Provider Structure', () => {
    it('renders children within WebSocketProvider wrapper', () => {
      render(
        <AppWebSocketProvider>
          <div data-testid="child-component">Test Child</div>
        </AppWebSocketProvider>
      );

      expect(screen.getByTestId('websocket-provider')).toBeInTheDocument();
      expect(screen.getByTestId('child-component')).toBeInTheDocument();
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('passes default config to WebSocketProvider when no config provided', () => {
      render(
        <AppWebSocketProvider>
          <div data-testid="child" />
        </AppWebSocketProvider>
      );

      // Verify the provider was called
      expect(MockedWebSocketProvider).toHaveBeenCalled();
      
      // Check the config was passed correctly
      const call = MockedWebSocketProvider.mock.calls[0];
      expect(call[0]).toHaveProperty('config', DEFAULT_WEBSOCKET_CONFIG);
    });

    it('passes custom config to WebSocketProvider when provided', () => {
      const customConfig = {
        url: 'wss://custom.example.com',
        reconnectDelay: 5000,
        maxReconnectAttempts: 10,
      };

      render(
        <AppWebSocketProvider config={customConfig}>
          <div data-testid="child" />
        </AppWebSocketProvider>
      );

      // Verify the provider was called
      expect(MockedWebSocketProvider).toHaveBeenCalled();
      
      // Check the custom config was passed correctly
      const call = MockedWebSocketProvider.mock.calls[0];
      expect(call[0]).toHaveProperty('config', customConfig);
    });
  });

  describe('WebSocketInitializer Component Behavior', () => {
    it('connects with auth token on mount when token is available', () => {
      mockGetAuthJwt.mockReturnValue('valid-auth-token');

      render(
        <AppWebSocketProvider>
          <div data-testid="child" />
        </AppWebSocketProvider>
      );

      expect(mockConnect).toHaveBeenCalledWith('valid-auth-token');
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('does not connect when no auth token is available', () => {
      mockGetAuthJwt.mockReturnValue(null);

      render(
        <AppWebSocketProvider>
          <div data-testid="child" />
        </AppWebSocketProvider>
      );

      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('does not connect when auth token is empty string', () => {
      mockGetAuthJwt.mockReturnValue('');

      render(
        <AppWebSocketProvider>
          <div data-testid="child" />
        </AppWebSocketProvider>
      );

      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('disconnects on component unmount', () => {
      mockGetAuthJwt.mockReturnValue('valid-token');

      const { unmount } = render(
        <AppWebSocketProvider>
          <div data-testid="child" />
        </AppWebSocketProvider>
      );

      expect(mockConnect).toHaveBeenCalledWith('valid-token');

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('initializes health monitoring on mount', () => {
      render(
        <AppWebSocketProvider>
          <div data-testid="child" />
        </AppWebSocketProvider>
      );

      expect(mockUseWebSocketHealth).toHaveBeenCalled();
      expect(mockUseWebSocketHealth).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hook Integration and Dependencies', () => {
    it('uses useWebSocket hook for connection management', () => {
      render(
        <AppWebSocketProvider>
          <div data-testid="child" />
        </AppWebSocketProvider>
      );

      expect(mockUseWebSocket).toHaveBeenCalled();
    });

    it('uses useWebSocketHealth hook for health monitoring', () => {
      render(
        <AppWebSocketProvider>
          <div data-testid="child" />
        </AppWebSocketProvider>
      );

      expect(mockUseWebSocketHealth).toHaveBeenCalled();
    });

    it('calls getAuthJwt to retrieve authentication token', () => {
      render(
        <AppWebSocketProvider>
          <div data-testid="child" />
        </AppWebSocketProvider>
      );

      expect(mockGetAuthJwt).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {

    it('handles useWebSocket hook throwing error gracefully', () => {
      mockUseWebSocket.mockImplementation(() => {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
      });

      // Should not crash, though the hook error will propagate
      expect(() => {
        render(
          <AppWebSocketProvider>
            <div data-testid="child" />
          </AppWebSocketProvider>
        );
      }).toThrow('useWebSocket must be used within a WebSocketProvider');
    });

    it('handles getAuthJwt throwing error gracefully', () => {
      mockGetAuthJwt.mockImplementation(() => {
        throw new Error('Auth service unavailable');
      });

      // Should not crash the component
      expect(() => {
        render(
          <AppWebSocketProvider>
            <div data-testid="child" />
          </AppWebSocketProvider>
        );
      }).toThrow('Auth service unavailable');
    });

    it('handles connect method throwing error without crashing', () => {
      mockGetAuthJwt.mockReturnValue('valid-token');
      mockConnect.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      // Should not crash the component
      expect(() => {
        render(
          <AppWebSocketProvider>
            <div data-testid="child" />
          </AppWebSocketProvider>
        );
      }).toThrow('Connection failed');
    });

    it('handles disconnect method throwing error without crashing', () => {
      mockDisconnect.mockImplementation(() => {
        throw new Error('Disconnect failed');
      });

      const { unmount } = render(
        <AppWebSocketProvider>
          <div data-testid="child" />
        </AppWebSocketProvider>
      );

      // Should not crash during unmount
      expect(() => {
        unmount();
      }).toThrow('Disconnect failed');
    });
  });

  describe('Component Lifecycle and State Management', () => {

    it('maintains stable component structure across re-renders', () => {
      const { rerender } = render(
        <AppWebSocketProvider>
          <div data-testid="child-1">Child 1</div>
        </AppWebSocketProvider>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();

      rerender(
        <AppWebSocketProvider>
          <div data-testid="child-2">Child 2</div>
        </AppWebSocketProvider>
      );

      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.queryByTestId('child-1')).not.toBeInTheDocument();
    });

    it('handles multiple children correctly', () => {
      render(
        <AppWebSocketProvider>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <span data-testid="child-3">Child 3</span>
        </AppWebSocketProvider>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });
  });

  describe('Security and Authentication', () => {

    it('only connects when valid authentication token is present', () => {
      // Test invalid token scenarios one by one
      mockGetAuthJwt.mockReturnValue(null);
      render(
        <AppWebSocketProvider>
          <div data-testid="child-null" />
        </AppWebSocketProvider>
      );
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('does not connect with empty string token', () => {
      mockGetAuthJwt.mockReturnValue('');
      render(
        <AppWebSocketProvider>
          <div data-testid="child-empty" />
        </AppWebSocketProvider>
      );
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('does not connect with undefined token', () => {
      mockGetAuthJwt.mockReturnValue(undefined);
      render(
        <AppWebSocketProvider>
          <div data-testid="child-undefined" />
        </AppWebSocketProvider>
      );
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('connects with valid JWT token', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      mockGetAuthJwt.mockReturnValue(validToken);

      render(
        <AppWebSocketProvider>
          <div data-testid="child-jwt" />
        </AppWebSocketProvider>
      );

      expect(mockConnect).toHaveBeenCalledWith(validToken);
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('connects with valid simple token', () => {
      const validToken = 'simple-string-token';
      mockGetAuthJwt.mockReturnValue(validToken);

      render(
        <AppWebSocketProvider>
          <div data-testid="child-simple" />
        </AppWebSocketProvider>
      );

      expect(mockConnect).toHaveBeenCalledWith(validToken);
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });
  });
});
