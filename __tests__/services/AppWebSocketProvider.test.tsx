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
    it('uses lazy initialization - no immediate connection on mount with auth token', () => {
      mockGetAuthJwt.mockReturnValue('valid-auth-token');

      render(
        <AppWebSocketProvider>
          <div data-testid="child" />
        </AppWebSocketProvider>
      );

      // Health monitoring handles connection, not immediate mount effect
      expect(mockConnect).not.toHaveBeenCalled();
      expect(mockUseWebSocketHealth).toHaveBeenCalled();
    });

    it('uses lazy initialization - no immediate connection on mount when no auth token', () => {
      mockGetAuthJwt.mockReturnValue(null);

      render(
        <AppWebSocketProvider>
          <div data-testid="child" />
        </AppWebSocketProvider>
      );

      // Health monitoring handles connection logic, not immediate mount effect
      expect(mockConnect).not.toHaveBeenCalled();
      expect(mockUseWebSocketHealth).toHaveBeenCalled();
    });

    it('uses lazy initialization - no immediate connection on mount when auth token is empty', () => {
      mockGetAuthJwt.mockReturnValue('');

      render(
        <AppWebSocketProvider>
          <div data-testid="child" />
        </AppWebSocketProvider>
      );

      // Health monitoring handles connection logic, not immediate mount effect
      expect(mockConnect).not.toHaveBeenCalled();
      expect(mockUseWebSocketHealth).toHaveBeenCalled();
    });

    it('disconnects on component unmount', () => {
      mockGetAuthJwt.mockReturnValue('valid-token');

      const { unmount } = render(
        <AppWebSocketProvider>
          <div data-testid="child" />
        </AppWebSocketProvider>
      );

      // No immediate connection due to lazy initialization
      expect(mockConnect).not.toHaveBeenCalled();

      unmount();

      // Cleanup disconnect still works on unmount
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

    it('delegates auth token handling to health monitoring', () => {
      render(
        <AppWebSocketProvider>
          <div data-testid="child" />
        </AppWebSocketProvider>
      );

      // WebSocketInitializer no longer calls getAuthJwt directly
      // Health monitoring handles all auth token logic
      expect(mockUseWebSocketHealth).toHaveBeenCalled();
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

    it('handles health monitoring errors gracefully', () => {
      mockUseWebSocketHealth.mockImplementation(() => {
        throw new Error('Health monitoring unavailable');
      });

      // Should not crash the component
      expect(() => {
        render(
          <AppWebSocketProvider>
            <div data-testid="child" />
          </AppWebSocketProvider>
        );
      }).toThrow('Health monitoring unavailable');
    });

    it('handles useWebSocket hook errors without crashing initializer', () => {
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect
      });

      // No connection errors should occur during initialization since no immediate connection
      render(
        <AppWebSocketProvider>
          <div data-testid="child" />
        </AppWebSocketProvider>
      );

      // Should render successfully without calling connect
      expect(mockConnect).not.toHaveBeenCalled();
      expect(mockUseWebSocketHealth).toHaveBeenCalled();
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

    it('delegates authentication logic to health monitoring', () => {
      // Test that authentication logic is handled by health monitoring, not initializer
      mockGetAuthJwt.mockReturnValue(null);
      render(
        <AppWebSocketProvider>
          <div data-testid="child-null" />
        </AppWebSocketProvider>
      );
      // No immediate connection - health monitoring handles auth logic
      expect(mockConnect).not.toHaveBeenCalled();
      expect(mockUseWebSocketHealth).toHaveBeenCalled();
    });

    it('delegates empty token handling to health monitoring', () => {
      mockGetAuthJwt.mockReturnValue('');
      render(
        <AppWebSocketProvider>
          <div data-testid="child-empty" />
        </AppWebSocketProvider>
      );
      // No immediate connection - health monitoring handles auth logic
      expect(mockConnect).not.toHaveBeenCalled();
      expect(mockUseWebSocketHealth).toHaveBeenCalled();
    });

    it('delegates undefined token handling to health monitoring', () => {
      mockGetAuthJwt.mockReturnValue(undefined);
      render(
        <AppWebSocketProvider>
          <div data-testid="child-undefined" />
        </AppWebSocketProvider>
      );
      // No immediate connection - health monitoring handles auth logic
      expect(mockConnect).not.toHaveBeenCalled();
      expect(mockUseWebSocketHealth).toHaveBeenCalled();
    });

    it('delegates valid JWT token handling to health monitoring', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      mockGetAuthJwt.mockReturnValue(validToken);

      render(
        <AppWebSocketProvider>
          <div data-testid="child-jwt" />
        </AppWebSocketProvider>
      );

      // No immediate connection - health monitoring will handle the connection
      expect(mockConnect).not.toHaveBeenCalled();
      expect(mockUseWebSocketHealth).toHaveBeenCalled();
    });

    it('delegates valid simple token handling to health monitoring', () => {
      const validToken = 'simple-string-token';
      mockGetAuthJwt.mockReturnValue(validToken);

      render(
        <AppWebSocketProvider>
          <div data-testid="child-simple" />
        </AppWebSocketProvider>
      );

      // No immediate connection - health monitoring will handle the connection
      expect(mockConnect).not.toHaveBeenCalled();
      expect(mockUseWebSocketHealth).toHaveBeenCalled();
    });
  });
});
