import { SecurityEventType } from '../../src/types/security';
import {
  logSecurityEvent,
  logError,
  createConnectionEventContext,
  createValidationEventContext,
  createErrorEventContext
} from '../../src/utils/security-logger';

// Mock console methods to capture logs
const originalConsoleDebug = console.debug;
const originalConsoleError = console.error;
const originalNodeEnv = process.env.NODE_ENV;
const originalSecurityLogging = process.env.ENABLE_SECURITY_LOGGING;

let mockConsoleDebug: jest.SpyInstance;
let mockConsoleError: jest.SpyInstance;

beforeEach(() => {
  // Reset environment variables
  process.env.NODE_ENV = 'test';
  process.env.ENABLE_SECURITY_LOGGING = 'false';
  
  // Create fresh mocks for each test
  mockConsoleDebug = jest.spyOn(console, 'debug').mockImplementation(() => {});
  mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  // Restore original console methods
  mockConsoleDebug.mockRestore();
  mockConsoleError.mockRestore();
  
  // Restore original environment
  process.env.NODE_ENV = originalNodeEnv;
  process.env.ENABLE_SECURITY_LOGGING = originalSecurityLogging;
});

describe('Security Logger', () => {
  describe('logSecurityEvent', () => {
    it('should not log when security logging is disabled', () => {
      process.env.ENABLE_SECURITY_LOGGING = 'false';
      
      const context = createConnectionEventContext('test-source');
      logSecurityEvent(SecurityEventType.WALLET_CONNECTION_ATTEMPT, context);
      
      expect(mockConsoleDebug).not.toHaveBeenCalled();
    });

    it('should log when security logging is enabled in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.ENABLE_SECURITY_LOGGING = 'true';
      
      const context = createConnectionEventContext('test-source');
      logSecurityEvent(SecurityEventType.WALLET_CONNECTION_ATTEMPT, context);
      
      expect(mockConsoleDebug).toHaveBeenCalledWith('[SEIZE_SECURITY_EVENT]', expect.objectContaining({
        eventType: SecurityEventType.WALLET_CONNECTION_ATTEMPT,
        source: 'test-source',
        timestamp: expect.any(String),
        userAgent: expect.any(String)
      }));
    });

    it('should never log in production even when enabled', () => {
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_SECURITY_LOGGING = 'true';
      
      const context = createConnectionEventContext('test-source');
      logSecurityEvent(SecurityEventType.WALLET_CONNECTION_ATTEMPT, context);
      
      expect(mockConsoleDebug).not.toHaveBeenCalled();
    });

    it('should throw error when context contains wallet address', () => {
      process.env.ENABLE_SECURITY_LOGGING = 'true';
      
      // Create malicious context with wallet address
      const maliciousContext = {
        ...createConnectionEventContext('test-source'),
        address: '0x742d35Cc6634C0532925a3b8D362Ad5C32B8B73D' // This should trigger validation error
      };
      
      expect(() => {
        logSecurityEvent(SecurityEventType.WALLET_CONNECTION_ATTEMPT, maliciousContext as any);
      }).toThrow('SECURITY VIOLATION: SecurityEventContext contains wallet address');
    });

    it('should throw error when context contains potential token', () => {
      process.env.ENABLE_SECURITY_LOGGING = 'true';
      
      // Create malicious context with potential token
      const maliciousContext = {
        ...createConnectionEventContext('test-source'),
        token: '1234567890abcdef1234567890abcdef12345678' // Long hex string
      };
      
      expect(() => {
        logSecurityEvent(SecurityEventType.WALLET_CONNECTION_ATTEMPT, maliciousContext as any);
      }).toThrow('SECURITY VIOLATION: SecurityEventContext contains potential token/key');
    });

    it('should throw error when context contains JWT token', () => {
      process.env.ENABLE_SECURITY_LOGGING = 'true';
      
      // Create malicious context with JWT
      const maliciousContext = {
        ...createConnectionEventContext('test-source'),
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ'
      };
      
      expect(() => {
        logSecurityEvent(SecurityEventType.WALLET_CONNECTION_ATTEMPT, maliciousContext as any);
      }).toThrow('SECURITY VIOLATION: SecurityEventContext contains JWT token');
    });
  });

  describe('logError', () => {
    it('should sanitize wallet addresses in error messages', () => {
      const error = new Error('Failed to connect wallet 0x742d35Cc6634C0532925a3b8D362Ad5C32B8B73D');
      logError('test-context', error);
      
      expect(mockConsoleError).toHaveBeenCalledWith('[SEIZE_CONNECT_ERROR]', expect.objectContaining({
        message: 'Failed to connect wallet 0x***REDACTED***'
      }));
    });

    it('should sanitize potential tokens in error messages', () => {
      const error = new Error('Invalid token: 1234567890abcdef1234567890abcdef12345678');
      logError('test-context', error);
      
      expect(mockConsoleError).toHaveBeenCalledWith('[SEIZE_CONNECT_ERROR]', expect.objectContaining({
        message: 'Invalid token: ***TOKEN***'
      }));
    });

    it('should sanitize JWT tokens in error messages', () => {
      const error = new Error('Auth failed: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc');
      logError('test-context', error);
      
      expect(mockConsoleError).toHaveBeenCalledWith('[SEIZE_CONNECT_ERROR]', expect.objectContaining({
        message: 'Auth failed: ***JWT***'
      }));
    });

    it('should include stack trace in development but sanitized', () => {
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Failed with address 0x742d35Cc6634C0532925a3b8D362Ad5C32B8B73D');
      error.stack = 'Error: Failed with address 0x742d35Cc6634C0532925a3b8D362Ad5C32B8B73D\\n    at test';
      
      logError('test-context', error);
      
      expect(mockConsoleError).toHaveBeenCalledWith('[SEIZE_CONNECT_ERROR]', expect.objectContaining({
        stack: 'Error: Failed with address 0x***REDACTED***\\n    at test'
      }));
    });

    it('should not include stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Test error');
      error.stack = 'Error: Test error\\n    at test';
      
      logError('test-context', error);
      
      expect(mockConsoleError).toHaveBeenCalledWith('[SEIZE_CONNECT_ERROR]', expect.objectContaining({
        message: 'Test error',
        // Should not contain stack property in production
      }));
      
      expect(mockConsoleError.mock.calls[0][1]).not.toHaveProperty('stack');
    });
  });

  describe('createConnectionEventContext', () => {
    it('should create context with required fields only', () => {
      const context = createConnectionEventContext('test-source');
      
      expect(context).toEqual({
        timestamp: expect.any(String),
        source: 'test-source',
        userAgent: expect.any(String)
      });
    });

    it('should create valid ISO timestamp', () => {
      const context = createConnectionEventContext('test-source');
      const timestamp = new Date(context.timestamp);
      
      expect(timestamp.toISOString()).toBe(context.timestamp);
    });
  });

  describe('createValidationEventContext', () => {
    it('should create context with validation fields', () => {
      const context = createValidationEventContext('test-source', true, 42, 'hex_prefixed');
      
      expect(context).toEqual({
        timestamp: expect.any(String),
        source: 'test-source',
        valid: true,
        addressLength: 42,
        addressFormat: 'hex_prefixed',
        userAgent: expect.any(String)
      });
    });

    it('should create minimal context when optional fields omitted', () => {
      const context = createValidationEventContext('test-source', false);
      
      expect(context).toEqual({
        timestamp: expect.any(String),
        source: 'test-source',
        valid: false,
        addressLength: undefined,
        addressFormat: undefined,
        userAgent: expect.any(String)
      });
    });
  });

  describe('createErrorEventContext', () => {
    it('should create context with error code', () => {
      const context = createErrorEventContext('test-source', 'TEST_ERROR');
      
      expect(context).toEqual({
        timestamp: expect.any(String),
        source: 'test-source',
        errorCode: 'TEST_ERROR',
        userAgent: expect.any(String)
      });
    });

    it('should create context without error code', () => {
      const context = createErrorEventContext('test-source');
      
      expect(context).toEqual({
        timestamp: expect.any(String),
        source: 'test-source',
        errorCode: undefined,
        userAgent: expect.any(String)
      });
    });
  });

  describe('Security validation edge cases', () => {
    it('should detect addresses in nested objects', () => {
      process.env.ENABLE_SECURITY_LOGGING = 'true';
      
      const maliciousContext = {
        ...createConnectionEventContext('test-source'),
        metadata: {
          wallet: {
            address: '0x742d35Cc6634C0532925a3b8D362Ad5C32B8B73D'
          }
        }
      };
      
      expect(() => {
        logSecurityEvent(SecurityEventType.WALLET_CONNECTION_ATTEMPT, maliciousContext as any);
      }).toThrow('SECURITY VIOLATION: SecurityEventContext contains wallet address');
    });

    it('should detect partial addresses that could be used for fingerprinting', () => {
      process.env.ENABLE_SECURITY_LOGGING = 'true';
      
      const maliciousContext = {
        ...createConnectionEventContext('test-source'),
        partialAddress: '0x742d35Cc6634C0532925a3b8D362Ad5C' // Partial but still identifiable
      };
      
      expect(() => {
        logSecurityEvent(SecurityEventType.WALLET_CONNECTION_ATTEMPT, maliciousContext as any);
      }).toThrow('SECURITY VIOLATION: SecurityEventContext contains potential token/key');
    });

    it('should allow safe diagnostic data', () => {
      process.env.ENABLE_SECURITY_LOGGING = 'true';
      
      const safeContext = createValidationEventContext('test-source', true, 42, 'hex_prefixed');
      
      // Should not throw
      expect(() => {
        logSecurityEvent(SecurityEventType.ADDRESS_VALIDATION_SUCCESS, safeContext);
      }).not.toThrow();
      
      expect(mockConsoleDebug).toHaveBeenCalled();
    });
  });
});