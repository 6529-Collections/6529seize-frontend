import { SecurityEventType } from "@/src/types/security";
import {
  createConnectionEventContext,
  createValidationEventContext,
  logError,
  logSecurityEvent,
} from "@/src/utils/security-logger";

let mockConsoleDebug: jest.SpyInstance;
let mockConsoleWarn: jest.SpyInstance;
let mockConsoleError: jest.SpyInstance;

beforeEach(() => {
  // Create fresh mocks for each test
  mockConsoleDebug = jest.spyOn(console, "debug").mockImplementation(() => {});
  mockConsoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
  mockConsoleError = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  // Restore original console methods
  mockConsoleDebug.mockRestore();
  mockConsoleWarn.mockRestore();
  mockConsoleError.mockRestore();
});

describe("Security Logger", () => {
  describe("logSecurityEvent", () => {
    it("should not log when security logging is disabled", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.ENABLE_SECURITY_LOGGING = "false";

      const context = createConnectionEventContext("test-source");
      logSecurityEvent(SecurityEventType.WALLET_CONNECTION_ATTEMPT, context);

      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });

    it("should log when security logging is enabled in development", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.NODE_ENV = "development";
      publicEnv.ENABLE_SECURITY_LOGGING = "true";

      const context = createConnectionEventContext("test-source");
      logSecurityEvent(SecurityEventType.WALLET_CONNECTION_ATTEMPT, context);

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        "[SEIZE_SECURITY_EVENT]",
        expect.objectContaining({
          eventType: SecurityEventType.WALLET_CONNECTION_ATTEMPT,
          source: "test-source",
          timestamp: expect.any(String),
          userAgent: expect.any(String),
        })
      );
    });

    it("should never log in production even when enabled", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.NODE_ENV = "production";
      publicEnv.ENABLE_SECURITY_LOGGING = "true";

      const context = createConnectionEventContext("test-source");
      logSecurityEvent(SecurityEventType.WALLET_CONNECTION_ATTEMPT, context);

      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });

    it("should throw error when context contains wallet address", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.ENABLE_SECURITY_LOGGING = "true";

      // Create malicious context with wallet address
      const maliciousContext = {
        ...createConnectionEventContext("test-source"),
        address: "0x742d35Cc6634C0532925a3b8D362Ad5C32B8B73D", // This should trigger validation error
      };

      expect(() => {
        logSecurityEvent(
          SecurityEventType.WALLET_CONNECTION_ATTEMPT,
          maliciousContext as any
        );
      }).toThrow(
        "SECURITY VIOLATION: SecurityEventContext contains wallet address"
      );
    });

    it("should throw error when context contains potential token", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.ENABLE_SECURITY_LOGGING = "true";

      // Create malicious context with potential token
      const maliciousContext = {
        ...createConnectionEventContext("test-source"),
        token: "1234567890abcdef1234567890abcdef12345678", // Long hex string
      };

      expect(() => {
        logSecurityEvent(
          SecurityEventType.WALLET_CONNECTION_ATTEMPT,
          maliciousContext as any
        );
      }).toThrow(
        "SECURITY VIOLATION: SecurityEventContext contains potential token/key"
      );
    });

    it("should throw error when context contains JWT token", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.ENABLE_SECURITY_LOGGING = "true";

      // Create malicious context with JWT
      const maliciousContext = {
        ...createConnectionEventContext("test-source"),
        jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
      };

      expect(() => {
        logSecurityEvent(
          SecurityEventType.WALLET_CONNECTION_ATTEMPT,
          maliciousContext as any
        );
      }).toThrow("SECURITY VIOLATION: SecurityEventContext contains JWT token");
    });
  });

  describe("logError", () => {
    it("should sanitize wallet addresses in error messages", () => {
      const error = new Error(
        "Failed to connect wallet 0x742d35Cc6634C0532925a3b8D362Ad5C32B8B73D"
      );
      logError("test-context", error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          message: "Failed to connect wallet 0x***REDACTED***",
        })
      );
    });

    it("should sanitize potential tokens in error messages", () => {
      const error = new Error(
        "Invalid token: 1234567890abcdef1234567890abcdef12345678"
      );
      logError("test-context", error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          message: "Invalid token: ***TOKEN***",
        })
      );
    });

    it("should sanitize JWT tokens in error messages", () => {
      const error = new Error(
        "Auth failed: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc"
      );
      logError("test-context", error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          message: "Auth failed: ***JWT***",
        })
      );
    });

    it("should include stack trace in development but sanitized", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.NODE_ENV = "development";

      const error = new Error(
        "Failed with address 0x742d35Cc6634C0532925a3b8D362Ad5C32B8B73D"
      );
      error.stack = String.raw`Error: Failed with address 0x742d35Cc6634C0532925a3b8D362Ad5C32B8B73D\n    at test`;

      logError("test-context", error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          stack: String.raw`Error: Failed with address 0x***REDACTED***\n    at test`,
        })
      );
    });

    it("should not include stack trace in production", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.NODE_ENV = "production";

      const error = new Error("Test error");
      error.stack = String.raw`Error: Test error\n    at test`;

      logError("test-context", error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          message: "Test error",
          // Should not contain stack property in production
        })
      );

      expect(mockConsoleError.mock.calls[0][1]).not.toHaveProperty("stack");
    });

    it("should handle error with custom code property", () => {
      const errorWithCode = new Error("Custom error") as Error & {
        code: string;
      };
      errorWithCode.code = "WALLET_CONNECTION_FAILED";

      logError("test-context", errorWithCode);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          message: "Custom error",
          code: "WALLET_CONNECTION_FAILED",
        })
      );
    });

    it("should handle error with string cause", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.NODE_ENV = "development";

      const errorWithCause = new Error("Main error");
      (errorWithCause as any).cause = "String cause message";

      logError("test-context", errorWithCause);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          message: "Main error",
          cause: "String cause message",
        })
      );
    });

    it("should handle error with Error object cause", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.NODE_ENV = "development";

      const causeError = new Error(
        "Cause error with address 0x742d35Cc6634C0532925a3b8D362Ad5C32B8B73D"
      );
      const mainError = new Error("Main error");
      (mainError as any).cause = causeError;

      logError("test-context", mainError);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          message: "Main error",
          cause: "Cause error with address 0x***REDACTED***",
        })
      );
    });

    it("should handle error with plain object cause", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.NODE_ENV = "development";

      const mainError = new Error("Main error");
      (mainError as any).cause = { status: 404, reason: "Not found" };

      logError("test-context", mainError);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          message: "Main error",
          cause: '{"status":404,"reason":"Not found"}',
        })
      );
    });

    it("should handle error with circular reference in cause", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.NODE_ENV = "development";

      const circularObj: any = { name: "circular" };
      circularObj.self = circularObj;

      const mainError = new Error("Main error");
      (mainError as any).cause = circularObj;

      logError("test-context", mainError);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          message: "Main error",
          cause: "Complex error cause",
        })
      );
    });

    it("should handle error with non-object cause", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.NODE_ENV = "development";

      const mainError = new Error("Main error");
      (mainError as any).cause = 12345;

      logError("test-context", mainError);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          message: "Main error",
          cause: "12345",
        })
      );
    });
  });

  describe("createConnectionEventContext", () => {
    it("should create context with required fields only", () => {
      const context = createConnectionEventContext("test-source");

      expect(context).toEqual({
        timestamp: expect.any(String),
        source: "test-source",
        userAgent: expect.any(String),
      });
    });

    it("should create valid ISO timestamp", () => {
      const context = createConnectionEventContext("test-source");
      const timestamp = new Date(context.timestamp);

      expect(timestamp.toISOString()).toBe(context.timestamp);
    });
  });

  describe("createValidationEventContext", () => {
    it("should create context with validation fields", () => {
      const context = createValidationEventContext(
        "test-source",
        true,
        42,
        "hex_prefixed"
      );

      expect(context).toEqual({
        timestamp: expect.any(String),
        source: "test-source",
        valid: true,
        addressLength: 42,
        addressFormat: "hex_prefixed",
        userAgent: expect.any(String),
      });
    });

    it("should create minimal context when optional fields omitted", () => {
      const context = createValidationEventContext("test-source", false);

      expect(context).toEqual({
        timestamp: expect.any(String),
        source: "test-source",
        valid: false,
        addressLength: undefined,
        addressFormat: undefined,
        userAgent: expect.any(String),
      });
    });
  });

  describe("Additional sanitization edge cases", () => {
    it("should sanitize multiple addresses in same message", () => {
      const error = new Error(
        "Transfer from 0x742d35Cc6634C0532925a3b8D362Ad5C32B8B73D to 0x1234567890123456789012345678901234567890 failed"
      );
      logError("test-context", error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          message: "Transfer from 0x***REDACTED*** to 0x***REDACTED*** failed",
        })
      );
    });

    it("should sanitize hex data of different lengths", () => {
      const error = new Error("Data: 0x12345678 and 0x1234567890abcdef");
      logError("test-context", error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          message: "Data: 0x***HEX*** and 0x***HEX***",
        })
      );
    });

    it("should sanitize mixed case hex addresses", () => {
      const error = new Error(
        "Mixed case: 0x742D35Cc6634C0532925a3b8D362Ad5C32B8B73D"
      );
      logError("test-context", error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          message: "Mixed case: 0x***REDACTED***",
        })
      );
    });

    it("should sanitize partial JWT tokens", () => {
      const error = new Error("JWT: eyJhbGciOiJIUzI1NiJ9.payload.incomplete");
      logError("test-context", error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          message: "JWT: ***JWT***",
        })
      );
    });
  });

  describe("Environment-specific behavior", () => {
    it("should include userAgent in development", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.NODE_ENV = "development";
      publicEnv.ENABLE_SECURITY_LOGGING = "true";

      const context = createConnectionEventContext("test-source");
      logSecurityEvent(SecurityEventType.WALLET_CONNECTION_ATTEMPT, context);

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        "[SEIZE_SECURITY_EVENT]",
        expect.objectContaining({
          userAgent: expect.stringContaining("Mozilla"),
        })
      );
    });

    it("should handle server-side environment without navigator", () => {
      const originalNavigator = global.navigator;
      delete (global as any).navigator;

      const context = createConnectionEventContext("server-side-test");

      expect(context.userAgent).toBe("server-side");

      // Restore navigator
      (global as any).navigator = originalNavigator;
    });

    it("should handle server-side environment in logSecurityEvent", () => {
      const originalNavigator = global.navigator;
      delete (global as any).navigator;

      const { publicEnv } = require("@/config/env");
      publicEnv.NODE_ENV = "development";
      publicEnv.ENABLE_SECURITY_LOGGING = "true";

      const context = createConnectionEventContext("server-side-security");
      logSecurityEvent(SecurityEventType.WALLET_CONNECTION_ATTEMPT, context);

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        "[SEIZE_SECURITY_EVENT]",
        expect.objectContaining({
          userAgent: "server-side",
        })
      );

      // Restore navigator
      (global as any).navigator = originalNavigator;
    });

    it("should handle server-side environment in logError", () => {
      const originalNavigator = global.navigator;
      delete (global as any).navigator;

      const error = new Error("Server-side error");
      logError("server-side-context", error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          userAgent: "server-side",
        })
      );

      // Restore navigator
      (global as any).navigator = originalNavigator;
    });

    it("should handle server-side environment in production logError", () => {
      const originalNavigator = global.navigator;

      delete (global as any).navigator;
      const { publicEnv } = require("@/config/env");
      publicEnv.NODE_ENV = "production";

      const error = new Error("Production server-side error");
      logError("production-server-context", error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          userAgent: "server-side",
          message: "Production server-side error",
        })
      );

      // Should not have stack property in production
      expect(mockConsoleError.mock.calls.at(-1)?.[1]).not.toHaveProperty(
        "stack"
      );

      // Restore environment
      (global as any).navigator = originalNavigator;
    });

    it("should handle context creation helpers server-side", () => {
      const originalNavigator = global.navigator;
      delete (global as any).navigator;

      const connectionContext = createConnectionEventContext("server-test");
      const validationContext = createValidationEventContext(
        "server-test",
        true,
        42
      );

      expect(connectionContext.userAgent).toBe("server-side");
      expect(validationContext.userAgent).toBe("server-side");

      // Restore navigator
      (global as any).navigator = originalNavigator;
    });
  });

  describe("Security validation edge cases", () => {
    it("should detect addresses in nested objects", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.ENABLE_SECURITY_LOGGING = "true";

      const maliciousContext = {
        ...createConnectionEventContext("test-source"),
        metadata: {
          wallet: {
            address: "0x742d35Cc6634C0532925a3b8D362Ad5C32B8B73D",
          },
        },
      };

      expect(() => {
        logSecurityEvent(
          SecurityEventType.WALLET_CONNECTION_ATTEMPT,
          maliciousContext as any
        );
      }).toThrow(
        "SECURITY VIOLATION: SecurityEventContext contains wallet address"
      );
    });

    it("should detect partial addresses that could be used for fingerprinting", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.ENABLE_SECURITY_LOGGING = "true";

      const maliciousContext = {
        ...createConnectionEventContext("test-source"),
        partialAddress: "0x742d35Cc6634C0532925a3b8D362Ad5C", // Partial but still identifiable
      };

      expect(() => {
        logSecurityEvent(
          SecurityEventType.WALLET_CONNECTION_ATTEMPT,
          maliciousContext as any
        );
      }).toThrow(
        "SECURITY VIOLATION: SecurityEventContext contains potential token/key"
      );
    });

    it("should allow safe diagnostic data", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.NODE_ENV = "development";
      publicEnv.ENABLE_SECURITY_LOGGING = "true";

      const safeContext = createValidationEventContext(
        "test-source",
        true,
        42,
        "hex_prefixed"
      );

      // Should not throw
      expect(() => {
        logSecurityEvent(
          SecurityEventType.ADDRESS_VALIDATION_SUCCESS,
          safeContext
        );
      }).not.toThrow();

      expect(mockConsoleWarn).toHaveBeenCalled();
    });

    it("should detect lowercase hex addresses", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.ENABLE_SECURITY_LOGGING = "true";

      const maliciousContext = {
        ...createConnectionEventContext("test-source"),
        data: "0x742d35cc6634c0532925a3b8d362ad5c32b8b73d", // lowercase
      };

      expect(() => {
        logSecurityEvent(
          SecurityEventType.WALLET_CONNECTION_ATTEMPT,
          maliciousContext as any
        );
      }).toThrow(
        "SECURITY VIOLATION: SecurityEventContext contains wallet address"
      );
    });

    it("should detect tokens without 0x prefix", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.ENABLE_SECURITY_LOGGING = "true";

      const maliciousContext = {
        ...createConnectionEventContext("test-source"),
        suspiciousData:
          "742d35cc6634c0532925a3b8d362ad5c32b8b73dabcdef1234567890",
      };

      expect(() => {
        logSecurityEvent(
          SecurityEventType.WALLET_CONNECTION_ATTEMPT,
          maliciousContext as any
        );
      }).toThrow(
        "SECURITY VIOLATION: SecurityEventContext contains potential token/key"
      );
    });

    it("should detect deeply nested sensitive data", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.ENABLE_SECURITY_LOGGING = "true";

      const deeplyNestedContext = {
        ...createConnectionEventContext("test-source"),
        metadata: {
          nested: {
            deeper: {
              wallet: {
                info: {
                  addr: "0x742d35Cc6634C0532925a3b8D362Ad5C32B8B73D",
                },
              },
            },
          },
        },
      };

      expect(() => {
        logSecurityEvent(
          SecurityEventType.WALLET_CONNECTION_ATTEMPT,
          deeplyNestedContext as any
        );
      }).toThrow(
        "SECURITY VIOLATION: SecurityEventContext contains wallet address"
      );
    });

    it("should detect JWT tokens in arrays", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.ENABLE_SECURITY_LOGGING = "true";

      const maliciousContext = {
        ...createConnectionEventContext("test-source"),
        tokens: [
          "safe-value",
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature",
        ],
      };

      expect(() => {
        logSecurityEvent(
          SecurityEventType.WALLET_CONNECTION_ATTEMPT,
          maliciousContext as any
        );
      }).toThrow("SECURITY VIOLATION: SecurityEventContext contains JWT token");
    });

    it("should validate empty string context values are safe", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.NODE_ENV = "development";
      publicEnv.ENABLE_SECURITY_LOGGING = "true";

      const safeContext = {
        ...createConnectionEventContext("test-source"),
        emptyString: "",
        nullValue: null,
        undefinedValue: undefined,
      };

      expect(() => {
        logSecurityEvent(
          SecurityEventType.WALLET_CONNECTION_ATTEMPT,
          safeContext as any
        );
      }).not.toThrow();

      expect(mockConsoleWarn).toHaveBeenCalled();
    });
  });

  describe("Complete security event type coverage", () => {
    beforeEach(() => {
      const { publicEnv } = require("@/config/env");
      publicEnv.NODE_ENV = "development";
      publicEnv.ENABLE_SECURITY_LOGGING = "true";
    });

    it("should log WALLET_MODAL_OPENED events", () => {
      const context = createConnectionEventContext("modal-component");
      logSecurityEvent(SecurityEventType.WALLET_MODAL_OPENED, context);

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        "[SEIZE_SECURITY_EVENT]",
        expect.objectContaining({
          eventType: SecurityEventType.WALLET_MODAL_OPENED,
          source: "modal-component",
        })
      );
    });

    it("should log INVALID_ADDRESS_DETECTED events", () => {
      const context = createValidationEventContext("validator", false);
      logSecurityEvent(SecurityEventType.INVALID_ADDRESS_DETECTED, context);

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        "[SEIZE_SECURITY_EVENT]",
        expect.objectContaining({
          eventType: SecurityEventType.INVALID_ADDRESS_DETECTED,
          valid: false,
        })
      );
    });

    it("should log WALLET_DISCONNECTION events", () => {
      const context = createConnectionEventContext("disconnect-handler");
      logSecurityEvent(SecurityEventType.WALLET_DISCONNECTION, context);

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        "[SEIZE_SECURITY_EVENT]",
        expect.objectContaining({
          eventType: SecurityEventType.WALLET_DISCONNECTION,
        })
      );
    });

    it("should log AUTH_CLEANUP_FAILURE events", () => {
      const context = {
        timestamp: new Date().toISOString(),
        source: "auth-cleanup",
        errorCode: "CLEANUP_FAILED",
      };
      logSecurityEvent(SecurityEventType.AUTH_CLEANUP_FAILURE, context);

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        "[SEIZE_SECURITY_EVENT]",
        expect.objectContaining({
          eventType: SecurityEventType.AUTH_CLEANUP_FAILURE,
          errorCode: "CLEANUP_FAILED",
        })
      );
    });

    it("should log INITIALIZATION_ERROR events", () => {
      const context = {
        timestamp: new Date().toISOString(),
        source: "initialization",
        errorCode: "INIT_TIMEOUT",
      };
      logSecurityEvent(SecurityEventType.INITIALIZATION_ERROR, context);

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        "[SEIZE_SECURITY_EVENT]",
        expect.objectContaining({
          eventType: SecurityEventType.INITIALIZATION_ERROR,
          errorCode: "INIT_TIMEOUT",
        })
      );
    });
  });

  describe("SecurityEventContext validation completeness", () => {
    it("should validate context with all optional fields populated", () => {
      const { publicEnv } = require("@/config/env");
      publicEnv.NODE_ENV = "development";
      publicEnv.ENABLE_SECURITY_LOGGING = "true";

      // Create context with all possible safe fields
      const fullContext = {
        timestamp: new Date().toISOString(),
        source: "full-test",
        valid: true,
        addressLength: 42,
        addressFormat: "hex_prefixed" as const,
        walletName: "MetaMask",
        errorCode: "SUCCESS",
        userAgent: "test-agent",
      };

      expect(() => {
        logSecurityEvent(
          SecurityEventType.ADDRESS_VALIDATION_SUCCESS,
          fullContext
        );
      }).not.toThrow();

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        "[SEIZE_SECURITY_EVENT]",
        expect.objectContaining({
          eventType: SecurityEventType.ADDRESS_VALIDATION_SUCCESS,
          source: "full-test",
          valid: true,
          addressLength: 42,
          addressFormat: "hex_prefixed",
          walletName: "MetaMask",
          errorCode: "SUCCESS",
        })
      );
    });
  });

  describe("Error handling edge cases", () => {
    it("should handle malformed Error object gracefully", () => {
      const malformedError = {
        name: "CustomError",
        message:
          "Test message with address 0x742d35Cc6634C0532925a3b8D362Ad5C32B8B73D",
      } as Error;

      expect(() => {
        logError("test-context", malformedError);
      }).not.toThrow();

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          message: "Test message with address 0x***REDACTED***",
          name: "CustomError",
        })
      );
    });

    it("should handle Error with no message", () => {
      const errorNoMessage = new Error();
      errorNoMessage.message = "";

      logError("empty-message-test", errorNoMessage);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[SEIZE_CONNECT_ERROR]",
        expect.objectContaining({
          message: "",
          context: "empty-message-test",
        })
      );
    });
  });

  describe("Timestamp validation", () => {
    it("should create valid ISO timestamps in context creators", () => {
      const connectionContext = createConnectionEventContext("timestamp-test");
      const validationContext = createValidationEventContext(
        "timestamp-test",
        true
      );

      // Verify all timestamps are valid ISO strings
      expect(() => new Date(connectionContext.timestamp)).not.toThrow();
      expect(() => new Date(validationContext.timestamp)).not.toThrow();

      // Verify timestamps are recent (within last second)
      const now = Date.now();
      const connectionTime = new Date(connectionContext.timestamp).getTime();
      const validationTime = new Date(validationContext.timestamp).getTime();

      expect(now - connectionTime).toBeLessThan(1000);
      expect(now - validationTime).toBeLessThan(1000);
    });
  });
});
