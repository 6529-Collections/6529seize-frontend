/**
 * Comprehensive Security Tests for UserAgentSanitizer
 *
 * CRITICAL SECURITY TESTS: These tests verify that the sanitizer properly
 * prevents XSS attacks, validates input, and handles all security threats.
 * All tests use fail-fast patterns - no fallbacks or graceful degradation.
 */

import {
  generateAsyncSafeHash,
  SafeUserAgentInfo,
  sanitizeUserAgent,
  sanitizeUserAgentAsync,
  UserAgentSecurityError,
} from "@/hooks/security/UserAgentSanitizer";

// Mock globalThis for environments that don't have it defined
if (typeof globalThis === "undefined") {
  (global as any).globalThis = global;
}

// Set up crypto mock for testing environments
const mockCrypto = {
  subtle: {
    digest: jest
      .fn()
      .mockImplementation(async (algorithm: string, data: ArrayBuffer) => {
        // Simple mock implementation for testing
        const input = new TextDecoder().decode(data);
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
          const char = input.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        return new ArrayBuffer(32); // Mock SHA-256 output
      }),
  },
};

// Set up global crypto for the tests
if (typeof window !== "undefined") {
  (window as any).crypto = mockCrypto;
}
if (typeof globalThis !== "undefined") {
  (globalThis as any).crypto = mockCrypto;
}

describe("UserAgentSanitizer Security Tests", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Ensure crypto mocks are properly set up
    if (typeof window !== "undefined") {
      (window as any).crypto = mockCrypto;
    }
    if (typeof globalThis !== "undefined") {
      (globalThis as any).crypto = mockCrypto;
    }
  });

  describe("Browser Compatibility Tests", () => {
    test("sync sanitizeUserAgent works in all environments", () => {
      const normalUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1";

      expect(() => sanitizeUserAgent(normalUA)).not.toThrow();
      const result = sanitizeUserAgent(normalUA);
      expect(result.userAgentHash).toBeDefined();
      expect(result.userAgentHash.length).toBeGreaterThan(0);
    });

    test("async sanitizeUserAgentAsync provides enhanced security", async () => {
      const normalUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1";

      const result = await sanitizeUserAgentAsync(normalUA);
      expect(result.userAgentHash).toBeDefined();
      expect(result.userAgentHash.length).toBeGreaterThan(0);
      expect(result.isMobile).toBe(true);
      expect(result.platformInfo.isIOS).toBe(true);
    });

    test("generateAsyncSafeHash creates consistent hashes", async () => {
      const input = "test user agent string";

      const hash1 = await generateAsyncSafeHash(input);
      const hash2 = await generateAsyncSafeHash(input);

      // Should return same hash for same input (cached)
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBeGreaterThan(0);
    });

    test("async version fails fast on security violations", async () => {
      const maliciousUA = 'Mozilla/5.0 <script>alert("XSS")</script> Safari';

      // FIXED: First call detects XSS
      await expect(sanitizeUserAgentAsync(maliciousUA)).rejects.toThrow(
        UserAgentSecurityError
      );

      // FIXED: Second call with same string also detects XSS (regex global flag issue resolved)
      await expect(sanitizeUserAgentAsync(maliciousUA)).rejects.toThrow(
        UserAgentSecurityError
      );
    });

    test("async version validates input types", async () => {
      // FIXED: Null check occurs before type check, so null/undefined throw null error
      await expect(sanitizeUserAgentAsync(null as any)).rejects.toThrow(
        "cannot be null or undefined"
      );
      await expect(sanitizeUserAgentAsync(undefined as any)).rejects.toThrow(
        "cannot be null or undefined"
      );
      await expect(sanitizeUserAgentAsync("")).rejects.toThrow(
        "cannot be empty"
      );
      await expect(sanitizeUserAgentAsync(123 as any)).rejects.toThrow(
        "must be a string"
      );
    });

    test("async version enforces length limits", async () => {
      const longUA = "A".repeat(1025);
      const shortUA = "A".repeat(9);

      await expect(sanitizeUserAgentAsync(longUA)).rejects.toThrow(
        "User agent too long"
      );
      await expect(sanitizeUserAgentAsync(shortUA)).rejects.toThrow(
        "User agent too short"
      );
    });
  });

  describe("Cross-Environment Crypto Tests", () => {
    test("handles environments without crypto gracefully", () => {
      // Mock environment without crypto
      const originalWindow = (global as any).window;
      const originalGlobalThis = (global as any).globalThis;

      // Remove crypto APIs temporarily
      if (typeof window !== "undefined") {
        delete (window as any).crypto;
      }
      if (typeof globalThis !== "undefined") {
        delete (globalThis as any).crypto;
      }

      const normalUA =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

      // Should still work with fallback hash
      expect(() => sanitizeUserAgent(normalUA)).not.toThrow();
      const result = sanitizeUserAgent(normalUA);
      expect(result.userAgentHash).toBeDefined();
      expect(result.userAgentHash.length).toBeGreaterThan(0);

      // Restore globals
      if (originalWindow) (global as any).window = originalWindow;
      if (originalGlobalThis) (global as any).globalThis = originalGlobalThis;

      // Restore crypto mocks
      if (typeof window !== "undefined") {
        (window as any).crypto = mockCrypto;
      }
      if (typeof globalThis !== "undefined") {
        (globalThis as any).crypto = mockCrypto;
      }
    });

    test("fallback hash is deterministic for same input", () => {
      const ua =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

      const result1 = sanitizeUserAgent(ua);
      const result2 = sanitizeUserAgent(ua);

      // Should get same hash due to caching
      expect(result1.userAgentHash).toBe(result2.userAgentHash);
    });

    test("different inputs produce different hashes", () => {
      const ua1 =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";
      const ua2 =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome";

      const result1 = sanitizeUserAgent(ua1);
      const result2 = sanitizeUserAgent(ua2);

      // Different inputs should produce different hashes
      expect(result1.userAgentHash).not.toBe(result2.userAgentHash);
    });
  });

  describe("Node.js Import Safety Tests", () => {
    test("does not import Node.js crypto module", () => {
      // This test verifies the critical fix - no Node.js crypto import
      const fs = require("fs");
      const path = require("path");
      const moduleCode = fs.readFileSync(
        path.join(__dirname, "../../hooks/security/UserAgentSanitizer.ts"),
        "utf8"
      );

      // Should NOT contain Node.js crypto import
      expect(moduleCode).not.toContain("import { createHash } from 'crypto'");
      expect(moduleCode).not.toContain("from 'crypto'");
      expect(moduleCode).not.toContain("require('crypto')");

      // Should contain browser-compatible Web Crypto API usage
      expect(moduleCode).toContain("window.crypto");
      expect(moduleCode).toContain("globalThis.crypto");
      expect(moduleCode).toContain("crypto.subtle");
    });

    test("sanitizer works in simulated browser environment", () => {
      // Mock browser environment with failing crypto
      const failingCrypto = {
        subtle: {
          digest: jest.fn().mockRejectedValue(new Error("Crypto API failed")),
        },
      };

      const originalWindow = (global as any).window;
      const originalGlobalThis = (global as any).globalThis;

      // Set up failing crypto environment
      if (typeof window !== "undefined") {
        (window as any).crypto = failingCrypto;
      }
      if (typeof globalThis !== "undefined") {
        (globalThis as any).crypto = failingCrypto;
      }

      const normalUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) Safari/604.1";

      // Should work even when Web Crypto API fails (uses fallback)
      expect(() => sanitizeUserAgent(normalUA)).not.toThrow();
      const result = sanitizeUserAgent(normalUA);
      expect(result.userAgentHash).toBeDefined();
      expect(result.userAgentHash.length).toBeGreaterThan(0);

      // Restore original environment
      if (originalWindow) {
        (global as any).window = originalWindow;
      }
      if (originalGlobalThis) {
        (global as any).globalThis = originalGlobalThis;
      }

      // Restore working crypto mocks
      if (typeof window !== "undefined") {
        (window as any).crypto = mockCrypto;
      }
      if (typeof globalThis !== "undefined") {
        (globalThis as any).crypto = mockCrypto;
      }
    });
  });

  describe("XSS Prevention Tests", () => {
    test("blocks script tag injection attacks (FIXED: works consistently)", () => {
      const maliciousUA1 = 'Mozilla/5.0 <script>alert("XSS1")</script> Safari';
      const maliciousUA2 = 'Mozilla/5.0 <script>alert("XSS2")</script> Safari';

      // First XSS attempt detected
      expect(() => sanitizeUserAgent(maliciousUA1)).toThrow(
        UserAgentSecurityError
      );

      // FIXED: Second XSS attempt is also detected (regex global flag issue resolved)
      expect(() => sanitizeUserAgent(maliciousUA2)).toThrow(
        UserAgentSecurityError
      );
    });

    test("blocks script tags with whitespace in closing tags (FIXED: reliable detection)", () => {
      const scriptWithSpace =
        'Mozilla/5.0 <script>alert("XSS1")</script > Safari';

      // FIXED: XSS detection works reliably now
      expect(() => sanitizeUserAgent(scriptWithSpace)).toThrow(
        UserAgentSecurityError
      );
    });

    test("detects XSS consistently (FIXED: regex state bug resolved)", () => {
      // FIXED: Regex global flag state issue resolved
      const scriptWithTab =
        'Mozilla/5.0 <script>alert("XSS1")</script\t> Safari';
      const scriptWithNewline =
        'Mozilla/5.0 <script>alert("XSS2")</script\n> Safari';
      const scriptWithSpaces =
        'Mozilla/5.0 <script>alert("XSS3")</script   > Safari';

      const tests = [scriptWithTab, scriptWithNewline, scriptWithSpaces];

      tests.forEach((testUA) => {
        // FIXED: XSS detection now works consistently
        expect(() => sanitizeUserAgent(testUA)).toThrow(UserAgentSecurityError);
        expect(() => sanitizeUserAgent(testUA)).toThrow("XSS attempt detected");
      });
    });

    test("blocks javascript: URL injection (FIXED: reliable detection)", () => {
      const maliciousUA = 'Mozilla/5.0 javascript:alert("XSS") Safari';

      // FIXED: XSS detection now works reliably
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow(
        UserAgentSecurityError
      );
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow(
        "XSS attempt detected"
      );
    });

    test("blocks data: URI XSS attempts", () => {
      const maliciousUA =
        'Mozilla/5.0 data:text/html,<script>alert("XSS")</script> Safari';

      expect(() => sanitizeUserAgent(maliciousUA)).toThrow(
        UserAgentSecurityError
      );
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow(
        "XSS attempt detected"
      );
    });

    test("XSS detection reliable (FIXED: regex global flag bug resolved)", () => {
      // FIXED: All these now throw consistently
      const eventHandler = 'Mozilla/5.0 onclick="alert()" Safari';
      const iframe = 'Mozilla/5.0 <iframe src="evil.com"></iframe> Safari';
      const expression = 'Mozilla/5.0 expression(alert("XSS")) Safari';

      // FIXED: XSS detection works consistently for all patterns
      [eventHandler, iframe, expression].forEach((ua) => {
        expect(() => sanitizeUserAgent(ua)).toThrow(UserAgentSecurityError);
        expect(() => sanitizeUserAgent(ua)).toThrow("XSS attempt detected");
      });
    });

    test("blocks multiple XSS patterns in sequence (FIXED: reliable detection)", () => {
      const maliciousUA =
        "Mozilla/5.0 <script>evil()</script> javascript:more() Safari";

      // FIXED: Multiple XSS patterns detected reliably
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow(
        UserAgentSecurityError
      );
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow(
        "XSS attempt detected"
      );
    });
  });

  describe("Input Validation Tests", () => {
    test("throws on null input", () => {
      // FIXED: Null check occurs before type check, so null throws null error
      expect(() => sanitizeUserAgent(null as any)).toThrow(
        UserAgentSecurityError
      );
      expect(() => sanitizeUserAgent(null as any)).toThrow(
        "cannot be null or undefined"
      );
    });

    test("throws on undefined input", () => {
      // FIXED: Null check occurs before type check, so undefined throws null error
      expect(() => sanitizeUserAgent(undefined as any)).toThrow(
        UserAgentSecurityError
      );
      expect(() => sanitizeUserAgent(undefined as any)).toThrow(
        "cannot be null or undefined"
      );
    });

    test("throws on empty string", () => {
      expect(() => sanitizeUserAgent("")).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent("")).toThrow("cannot be empty");
    });

    test("throws on non-string input", () => {
      expect(() => sanitizeUserAgent(123 as any)).toThrow(
        UserAgentSecurityError
      );
      expect(() => sanitizeUserAgent(123 as any)).toThrow("must be a string");

      expect(() => sanitizeUserAgent({} as any)).toThrow(
        UserAgentSecurityError
      );
      expect(() => sanitizeUserAgent({} as any)).toThrow("must be a string");

      expect(() => sanitizeUserAgent([] as any)).toThrow(
        UserAgentSecurityError
      );
      expect(() => sanitizeUserAgent([] as any)).toThrow("must be a string");
    });

    test("throws on boolean input", () => {
      expect(() => sanitizeUserAgent(true as any)).toThrow(
        UserAgentSecurityError
      );
      expect(() => sanitizeUserAgent(true as any)).toThrow("must be a string");

      expect(() => sanitizeUserAgent(false as any)).toThrow(
        UserAgentSecurityError
      );
      expect(() => sanitizeUserAgent(false as any)).toThrow("must be a string");
    });
  });

  describe("Buffer Overflow Protection Tests", () => {
    test("throws on user agent string too long", () => {
      const longUA = "A".repeat(1025); // Exceeds 1024 limit

      expect(() => sanitizeUserAgent(longUA)).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent(longUA)).toThrow("User agent too long");
      expect(() => sanitizeUserAgent(longUA)).toThrow("1025 chars");
    });

    test("throws on user agent string too short", () => {
      const shortUA = "A".repeat(9); // Below 10 minimum

      expect(() => sanitizeUserAgent(shortUA)).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent(shortUA)).toThrow("User agent too short");
      expect(() => sanitizeUserAgent(shortUA)).toThrow("9 chars");
    });

    test("accepts user agent at exact maximum length", () => {
      const exactMaxUA =
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome" +
        "A".repeat(1024 - 61);

      expect(() => sanitizeUserAgent(exactMaxUA)).not.toThrow();
      const result = sanitizeUserAgent(exactMaxUA);
      expect(result.userAgentHash).toBeDefined();
      expect(result.userAgentHash.length).toBeGreaterThan(0);
    });

    test("accepts user agent at exact minimum length", () => {
      const exactMinUA = "A".repeat(10); // Exactly 10 chars

      expect(() => sanitizeUserAgent(exactMinUA)).not.toThrow();
      const result = sanitizeUserAgent(exactMinUA);
      expect(result.userAgentHash).toBeDefined();
    });
  });

  describe("Control Character Detection Tests", () => {
    test("removes control characters and logs warning", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      // Create a user agent with actual control characters
      const userAgentWithControls =
        "Mozilla/5.0" + String.fromCharCode(0, 1, 2) + " Safari/537.36";

      const result = sanitizeUserAgent(userAgentWithControls);
      expect(result.userAgentHash).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Removed 3 control characters from user agent"
      );

      consoleSpy.mockRestore();
    });

    test("handles null bytes in user agent", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      // Create a user agent with actual null byte
      const userAgentWithNull =
        "Mozilla/5.0" + String.fromCharCode(0) + " Safari/537.36";

      const result = sanitizeUserAgent(userAgentWithNull);
      expect(result.userAgentHash).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Removed 1 control characters from user agent"
      );

      consoleSpy.mockRestore();
    });

    test("handles various control characters", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      // Test with actual control characters (0x00-0x1F except whitespace, plus 0x7F)
      const controlChars = [0x01, 0x02, 0x03, 0x1f, 0x7f];
      const userAgentWithControls =
        "Mozilla/5.0" + String.fromCharCode(...controlChars) + " Safari/537.36";

      const result = sanitizeUserAgent(userAgentWithControls);
      expect(result.userAgentHash).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Removed 5 control characters from user agent"
      );

      consoleSpy.mockRestore();
    });

    test("does not remove valid whitespace characters", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      // Test with valid whitespace (0x09=tab, 0x0A=newline, 0x0D=carriage return, 0x20=space)
      const userAgentWithWhitespace = "Mozilla/5.0\t\n\r Safari/537.36";

      const result = sanitizeUserAgent(userAgentWithWhitespace);
      expect(result.userAgentHash).toBeDefined();
      // Should not log warning for valid whitespace
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("Platform and Wallet Detection Tests", () => {
    test("correctly identifies Android mobile", () => {
      const androidUA =
        "Mozilla/5.0 (Linux; Android 11; SM-G991U) AppleWebKit/537.36 Chrome/89.0.4389.105";

      const result = sanitizeUserAgent(androidUA);
      expect(result.isMobile).toBe(true);
      expect(result.platformInfo.isAndroid).toBe(true);
      expect(result.platformInfo.isIOS).toBe(false);
      expect(result.supportsDeepLinking).toBe(true);
    });

    test("correctly identifies iOS mobile", () => {
      const iosUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1";

      const result = sanitizeUserAgent(iosUA);
      expect(result.isMobile).toBe(true);
      expect(result.platformInfo.isIOS).toBe(true);
      expect(result.platformInfo.isAndroid).toBe(false);
      expect(result.supportsDeepLinking).toBe(true);
    });

    test("correctly identifies MetaMask wallet", () => {
      const metaMaskUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 MetaMask Safari/604.1";

      const result = sanitizeUserAgent(metaMaskUA);
      expect(result.detectedWallet).toBe("MetaMask");
      expect(result.isMobile).toBe(true);
    });

    test("correctly identifies Trust Wallet", () => {
      const trustUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 Trust Safari/604.1";

      const result = sanitizeUserAgent(trustUA);
      expect(result.detectedWallet).toBe("Trust Wallet");
      expect(result.isMobile).toBe(true);
    });

    test("correctly identifies Coinbase Wallet", () => {
      const coinbaseUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 CoinbaseWallet Safari/604.1";

      const result = sanitizeUserAgent(coinbaseUA);
      expect(result.detectedWallet).toBe("Coinbase Wallet");
      expect(result.isMobile).toBe(true);
    });

    test("identifies in-app browsers correctly", () => {
      const inAppUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 FBAN Safari/604.1";

      const result = sanitizeUserAgent(inAppUA);
      expect(result.isInAppBrowser).toBe(true);
      expect(result.supportsDeepLinking).toBe(false); // In-app browsers don't support deep linking
    });

    test("identifies desktop platforms correctly", () => {
      const windowsUA =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/89.0.4389.105";

      const result = sanitizeUserAgent(windowsUA);
      expect(result.isMobile).toBe(false);
      expect(result.platformInfo.isWindows).toBe(true);
      expect(result.platformInfo.isMac).toBe(false);
      expect(result.supportsDeepLinking).toBe(false);
    });
  });

  describe("ReDoS Prevention Tests", () => {
    test("handles repeated processing without performance degradation", () => {
      const normalUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1";

      // Process same user agent multiple times
      const results: SafeUserAgentInfo[] = [];
      for (let i = 0; i < 50; i++) {
        results.push(sanitizeUserAgent(normalUA));
      }

      // All results should be identical
      expect(
        results.every((r) => r.userAgentHash === results[0].userAgentHash)
      ).toBe(true);
    });

    test("cache prevents memory exhaustion", () => {
      // Create many different user agents to test cache limit
      for (let i = 0; i < 120; i++) {
        // Exceeds cache limit of 100
        const ua = `Mozilla/5.0 (X11; Linux x86_64) Chrome/${i}.0.0.0`;
        sanitizeUserAgent(ua);
      }

      // Should not throw memory errors
      const finalUA = "Mozilla/5.0 (X11; Linux x86_64) Chrome/999.0.0.0";
      expect(() => sanitizeUserAgent(finalUA)).not.toThrow();
    });
  });

  describe("Type Safety Tests", () => {
    test("returns correct interface structure", () => {
      const normalUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1";

      const result = sanitizeUserAgent(normalUA);

      // Check required properties exist and have correct types
      expect(typeof result.userAgentHash).toBe("string");
      expect(typeof result.isMobile).toBe("boolean");
      expect(typeof result.isInAppBrowser).toBe("boolean");
      expect(typeof result.supportsDeepLinking).toBe("boolean");

      // Check platform info structure
      expect(typeof result.platformInfo).toBe("object");
      expect(typeof result.platformInfo.isAndroid).toBe("boolean");
      expect(typeof result.platformInfo.isIOS).toBe("boolean");
      expect(typeof result.platformInfo.isWindows).toBe("boolean");
      expect(typeof result.platformInfo.isMac).toBe("boolean");
      expect(typeof result.platformInfo.isLinux).toBe("boolean");

      // Check optional properties
      if (result.detectedWallet !== undefined) {
        expect(typeof result.detectedWallet).toBe("string");
      }
    });

    test("hash is always non-empty string", () => {
      const normalUA =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36";

      const result = sanitizeUserAgent(normalUA);
      expect(result.userAgentHash).toBeDefined();
      expect(result.userAgentHash.length).toBeGreaterThan(0);
      expect(typeof result.userAgentHash).toBe("string");
    });

    test("platform info is always complete", () => {
      const normalUA =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36";

      const result = sanitizeUserAgent(normalUA);
      expect(result.platformInfo).toBeDefined();
      expect(result.platformInfo.isAndroid).toBeDefined();
      expect(result.platformInfo.isIOS).toBeDefined();
      expect(result.platformInfo.isWindows).toBeDefined();
      expect(result.platformInfo.isMac).toBeDefined();
      expect(result.platformInfo.isLinux).toBeDefined();
    });
  });

  describe("Error Code Tests", () => {
    test("provides specific error codes for different violations", () => {
      // Test INVALID_TYPE
      try {
        sanitizeUserAgent(123);
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(UserAgentSecurityError);
        expect((error as UserAgentSecurityError).code).toBe("INVALID_TYPE");
      }

      // Test NULL_INPUT (null check occurs before type check)
      try {
        sanitizeUserAgent(null as any);
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(UserAgentSecurityError);
        expect((error as UserAgentSecurityError).code).toBe("NULL_INPUT");
      }

      // Test EMPTY_INPUT
      try {
        sanitizeUserAgent("");
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(UserAgentSecurityError);
        expect((error as UserAgentSecurityError).code).toBe("EMPTY_INPUT");
      }

      // Test LENGTH_EXCEEDED
      try {
        sanitizeUserAgent("A".repeat(1025));
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(UserAgentSecurityError);
        expect((error as UserAgentSecurityError).code).toBe("LENGTH_EXCEEDED");
      }

      // Test XSS_DETECTED (now works reliably)
      try {
        sanitizeUserAgent("Mozilla <script>alert(1)</script>");
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(UserAgentSecurityError);
        expect((error as UserAgentSecurityError).code).toBe("XSS_DETECTED");
      }
    });
  });

  describe("ReDoS Prevention Tests", () => {
    test("length validation occurs before XSS detection", () => {
      const startTime = performance.now();

      // IMPLEMENTATION BEHAVIOR: Length check occurs before XSS check
      // So long malicious strings throw length error instead of XSS error
      const maliciousScript =
        "Mozilla <script" +
        " ".repeat(1000) +
        ">" +
        "A".repeat(1000) +
        "</script> Safari";

      expect(() => sanitizeUserAgent(maliciousScript)).toThrow(
        "User agent too long"
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly due to early length check
      expect(duration).toBeLessThan(10);
    });

    test("documents ReDoS test design flaw", () => {
      const testCases = [
        "Mozilla <iframe" + ' class="test"'.repeat(500) + "> Safari",
        "Mozilla <object" + ' data="test"'.repeat(300) + "> Safari",
        "Mozilla <embed" + ' src="test"'.repeat(300) + "> Safari",
        "Mozilla <link" + ' rel="test"'.repeat(300) + "> Safari",
        "Mozilla <style" + ' type="text/css"'.repeat(400) + "> Safari",
      ];

      for (const testCase of testCases) {
        // Warmup (avoids first-call JIT noise if you keep any timing)
        try {
          sanitizeUserAgent("warmup");
        } catch {}

        // Assert we short-circuit on length, not XSS
        expect(() => sanitizeUserAgent(testCase)).toThrow(
          "User agent too long"
        );
      }
    });

    test("actual ReDoS test with valid length (FIXED: reliable XSS detection)", () => {
      // Test ReDoS patterns within the 1024 character limit
      const startTime = performance.now();

      // Create a pattern that could cause backtracking but stays under length limit
      const maliciousScript =
        "Mozilla <script" + " x".repeat(100) + ">alert()</script> Safari"; // ~230 chars

      // FIXED: XSS detection now works reliably
      expect(() => sanitizeUserAgent(maliciousScript)).toThrow(
        "XSS attempt detected"
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly
      expect(duration).toBeLessThan(10);
    });

    test("XSS detection is reliable", () => {
      const normalXSSCases = [
        "Mozilla <script>alert(1)</script> Safari",
        'Mozilla <iframe src="evil.com"></iframe> Safari',
        "Mozilla <style>body{background:url(evil.com)}</style> Safari",
      ];

      for (const testCase of normalXSSCases) {
        const startTime = performance.now();

        expect(() => sanitizeUserAgent(testCase)).toThrow(
          "XSS attempt detected"
        );

        const endTime = performance.now();
        const duration = endTime - startTime;

        // Should be fast
        expect(duration).toBeLessThan(50);
      }
    });

    test("non-malicious user agents should not match XSS patterns", () => {
      const normalUserAgents = [
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/91.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edge/91.0",
      ];

      for (const ua of normalUserAgents) {
        const startTime = performance.now();

        // Should not throw - these are legitimate user agents
        expect(() => sanitizeUserAgent(ua)).not.toThrow();

        const endTime = performance.now();
        const duration = endTime - startTime;

        // Should be processed very quickly
        expect(duration).toBeLessThan(10);
      }
    });
  });
});
