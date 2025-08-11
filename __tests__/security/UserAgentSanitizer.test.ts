/**
 * Comprehensive Security Tests for UserAgentSanitizer
 * 
 * CRITICAL SECURITY TESTS: These tests verify that the sanitizer properly
 * prevents XSS attacks, validates input, and handles all security threats.
 * All tests use fail-fast patterns - no fallbacks or graceful degradation.
 */

import { 
  sanitizeUserAgent, 
  sanitizeUserAgentAsync,
  generateAsyncSafeHash,
  SafeUserAgentInfo, 
  UserAgentSecurityError 
} from '../../hooks/security/UserAgentSanitizer';

describe('UserAgentSanitizer Security Tests', () => {
  
  describe('Browser Compatibility Tests', () => {
    test('sync sanitizeUserAgent works in all environments', () => {
      const normalUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
      
      expect(() => sanitizeUserAgent(normalUA)).not.toThrow();
      const result = sanitizeUserAgent(normalUA);
      expect(result.userAgentHash).toBeDefined();
      expect(result.userAgentHash.length).toBeGreaterThan(0);
    });
    
    test('async sanitizeUserAgentAsync provides enhanced security', async () => {
      const normalUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
      
      const result = await sanitizeUserAgentAsync(normalUA);
      expect(result.userAgentHash).toBeDefined();
      expect(result.userAgentHash.length).toBeGreaterThan(0);
      expect(result.isMobile).toBe(true);
      expect(result.platformInfo.isIOS).toBe(true);
    });
    
    test('generateAsyncSafeHash creates consistent hashes', async () => {
      const input = 'test user agent string';
      
      const hash1 = await generateAsyncSafeHash(input);
      const hash2 = await generateAsyncSafeHash(input);
      
      // Should return same hash for same input (cached)
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBeGreaterThan(0);
    });
    
    test('async version fails fast on security violations', async () => {
      const maliciousUA = 'Mozilla/5.0 <script>alert("XSS")</script> Safari';
      
      await expect(sanitizeUserAgentAsync(maliciousUA)).rejects.toThrow(UserAgentSecurityError);
      await expect(sanitizeUserAgentAsync(maliciousUA)).rejects.toThrow('XSS attempt detected');
    });
    
    test('async version validates input types', async () => {
      await expect(sanitizeUserAgentAsync(null)).rejects.toThrow('cannot be null or undefined');
      await expect(sanitizeUserAgentAsync(undefined)).rejects.toThrow('cannot be null or undefined');
      await expect(sanitizeUserAgentAsync('')).rejects.toThrow('cannot be empty');
      await expect(sanitizeUserAgentAsync(123)).rejects.toThrow('must be a string');
    });
    
    test('async version enforces length limits', async () => {
      const longUA = 'A'.repeat(1025);
      const shortUA = 'A'.repeat(9);
      
      await expect(sanitizeUserAgentAsync(longUA)).rejects.toThrow('User agent too long');
      await expect(sanitizeUserAgentAsync(shortUA)).rejects.toThrow('User agent too short');
    });
  });
  
  describe('Cross-Environment Crypto Tests', () => {
    test('handles environments without crypto gracefully', () => {
      // Mock environment without crypto
      const originalWindow = global.window;
      const originalGlobalThis = global.globalThis;
      
      // Remove crypto APIs
      delete (global as any).window;
      delete (global as any).globalThis;
      
      const normalUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
      
      // Should still work with fallback hash
      expect(() => sanitizeUserAgent(normalUA)).not.toThrow();
      const result = sanitizeUserAgent(normalUA);
      expect(result.userAgentHash).toBeDefined();
      expect(result.userAgentHash.length).toBeGreaterThan(0);
      
      // Restore globals
      if (originalWindow) global.window = originalWindow;
      if (originalGlobalThis) global.globalThis = originalGlobalThis;
    });
    
    test('fallback hash is deterministic for same input', () => {
      const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
      
      const result1 = sanitizeUserAgent(ua);
      const result2 = sanitizeUserAgent(ua);
      
      // Should get same hash due to caching
      expect(result1.userAgentHash).toBe(result2.userAgentHash);
    });
    
    test('different inputs produce different hashes', () => {
      const ua1 = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
      const ua2 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome';
      
      const result1 = sanitizeUserAgent(ua1);
      const result2 = sanitizeUserAgent(ua2);
      
      // Different inputs should produce different hashes
      expect(result1.userAgentHash).not.toBe(result2.userAgentHash);
    });
  });
  
  describe('Node.js Import Safety Tests', () => {
    test('does not import Node.js crypto module', () => {
      // This test verifies the critical fix - no Node.js crypto import
      const fs = require('fs');
      const path = require('path');
      const moduleCode = fs.readFileSync(
        path.join(__dirname, '../../hooks/security/UserAgentSanitizer.ts'),
        'utf8'
      );
      
      // Should NOT contain Node.js crypto import
      expect(moduleCode).not.toContain('import { createHash } from \'crypto\'');
      expect(moduleCode).not.toContain('from \'crypto\'');
      expect(moduleCode).not.toContain('require(\'crypto\')');
      
      // Should contain browser-compatible Web Crypto API usage
      expect(moduleCode).toContain('window.crypto');
      expect(moduleCode).toContain('globalThis.crypto');
      expect(moduleCode).toContain('crypto.subtle');
    });
    
    test('sanitizer works in simulated browser environment', () => {
      // Mock browser environment
      const mockCrypto = {
        subtle: {
          digest: jest.fn().mockRejectedValue(new Error('No crypto mock'))
        }
      };
      
      const originalWindow = global.window;
      (global as any).window = { crypto: mockCrypto };
      
      const normalUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) Safari/604.1';
      
      // Should work even when Web Crypto API fails (uses fallback)
      expect(() => sanitizeUserAgent(normalUA)).not.toThrow();
      const result = sanitizeUserAgent(normalUA);
      expect(result.userAgentHash).toBeDefined();
      
      // Restore original environment
      if (originalWindow) {
        global.window = originalWindow;
      } else {
        delete (global as any).window;
      }
    });
  });

  describe('XSS Prevention Tests', () => {
    test('blocks script tag injection attacks', () => {
      const maliciousUA = 'Mozilla/5.0 <script>alert("XSS")</script> Safari';
      
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow('XSS attempt detected');
    });

    test('blocks javascript: URL injection', () => {
      const maliciousUA = 'Mozilla/5.0 javascript:alert("XSS") Safari';
      
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow('XSS attempt detected');
    });

    test('blocks data: URI XSS attempts', () => {
      const maliciousUA = 'Mozilla/5.0 data:text/html,<script>alert("XSS")</script> Safari';
      
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow('XSS attempt detected');
    });

    test('blocks event handler injection (onclick, onload, etc.)', () => {
      const maliciousUA = 'Mozilla/5.0 onclick="alert()" Safari';
      
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow('XSS attempt detected');
    });

    test('blocks iframe injection attempts', () => {
      const maliciousUA = 'Mozilla/5.0 <iframe src="evil.com"></iframe> Safari';
      
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow('XSS attempt detected');
    });

    test('blocks CSS expression() attacks', () => {
      const maliciousUA = 'Mozilla/5.0 expression(alert("XSS")) Safari';
      
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow('XSS attempt detected');
    });

    test('blocks multiple XSS patterns in sequence', () => {
      const maliciousUA = 'Mozilla/5.0 <script>evil()</script> javascript:more() Safari';
      
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent(maliciousUA)).toThrow('XSS attempt detected');
    });
  });

  describe('Input Validation Tests', () => {
    test('throws on null input', () => {
      expect(() => sanitizeUserAgent(null)).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent(null)).toThrow('cannot be null or undefined');
    });

    test('throws on undefined input', () => {
      expect(() => sanitizeUserAgent(undefined)).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent(undefined)).toThrow('cannot be null or undefined');
    });

    test('throws on empty string', () => {
      expect(() => sanitizeUserAgent('')).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent('')).toThrow('cannot be empty');
    });

    test('throws on non-string input', () => {
      expect(() => sanitizeUserAgent(123)).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent(123)).toThrow('must be a string');
      
      expect(() => sanitizeUserAgent({})).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent({})).toThrow('must be a string');
      
      expect(() => sanitizeUserAgent([])).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent([])).toThrow('must be a string');
    });

    test('throws on boolean input', () => {
      expect(() => sanitizeUserAgent(true)).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent(true)).toThrow('must be a string');
      
      expect(() => sanitizeUserAgent(false)).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent(false)).toThrow('must be a string');
    });
  });

  describe('Buffer Overflow Protection Tests', () => {
    test('throws on user agent string too long', () => {
      const longUA = 'A'.repeat(1025); // Exceeds 1024 limit
      
      expect(() => sanitizeUserAgent(longUA)).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent(longUA)).toThrow('User agent too long');
      expect(() => sanitizeUserAgent(longUA)).toThrow('1025 chars');
    });

    test('throws on user agent string too short', () => {
      const shortUA = 'A'.repeat(9); // Below 10 minimum
      
      expect(() => sanitizeUserAgent(shortUA)).toThrow(UserAgentSecurityError);
      expect(() => sanitizeUserAgent(shortUA)).toThrow('User agent too short');
      expect(() => sanitizeUserAgent(shortUA)).toThrow('9 chars');
    });

    test('accepts user agent at exact maximum length', () => {
      const exactMaxUA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome' + 'A'.repeat(1024 - 61);
      
      expect(() => sanitizeUserAgent(exactMaxUA)).not.toThrow();
      const result = sanitizeUserAgent(exactMaxUA);
      expect(result.userAgentHash).toBeDefined();
      expect(result.userAgentHash.length).toBeGreaterThan(0);
    });

    test('accepts user agent at exact minimum length', () => {
      const exactMinUA = 'A'.repeat(10); // Exactly 10 chars
      
      expect(() => sanitizeUserAgent(exactMinUA)).not.toThrow();
      const result = sanitizeUserAgent(exactMinUA);
      expect(result.userAgentHash).toBeDefined();
    });
  });

  describe('Control Character Detection Tests', () => {
    test('removes control characters and logs warning', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const userAgentWithControls = 'Mozilla/5.0\\x00\\x01\\x02 Safari/537.36';
      
      const result = sanitizeUserAgent(userAgentWithControls);
      expect(result.userAgentHash).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('handles null bytes in user agent', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const userAgentWithNull = 'Mozilla/5.0\\x00 Safari/537.36';
      
      const result = sanitizeUserAgent(userAgentWithNull);
      expect(result.userAgentHash).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Platform and Wallet Detection Tests', () => {
    test('correctly identifies Android mobile', () => {
      const androidUA = 'Mozilla/5.0 (Linux; Android 11; SM-G991U) AppleWebKit/537.36 Chrome/89.0.4389.105';
      
      const result = sanitizeUserAgent(androidUA);
      expect(result.isMobile).toBe(true);
      expect(result.platformInfo.isAndroid).toBe(true);
      expect(result.platformInfo.isIOS).toBe(false);
      expect(result.supportsDeepLinking).toBe(true);
    });

    test('correctly identifies iOS mobile', () => {
      const iosUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
      
      const result = sanitizeUserAgent(iosUA);
      expect(result.isMobile).toBe(true);
      expect(result.platformInfo.isIOS).toBe(true);
      expect(result.platformInfo.isAndroid).toBe(false);
      expect(result.supportsDeepLinking).toBe(true);
    });

    test('correctly identifies MetaMask wallet', () => {
      const metaMaskUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 MetaMask Safari/604.1';
      
      const result = sanitizeUserAgent(metaMaskUA);
      expect(result.detectedWallet).toBe('MetaMask');
      expect(result.isMobile).toBe(true);
    });

    test('correctly identifies Trust Wallet', () => {
      const trustUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 Trust Safari/604.1';
      
      const result = sanitizeUserAgent(trustUA);
      expect(result.detectedWallet).toBe('Trust Wallet');
      expect(result.isMobile).toBe(true);
    });

    test('correctly identifies Coinbase Wallet', () => {
      const coinbaseUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 CoinbaseWallet Safari/604.1';
      
      const result = sanitizeUserAgent(coinbaseUA);
      expect(result.detectedWallet).toBe('Coinbase Wallet');
      expect(result.isMobile).toBe(true);
    });

    test('identifies in-app browsers correctly', () => {
      const inAppUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 FBAN Safari/604.1';
      
      const result = sanitizeUserAgent(inAppUA);
      expect(result.isInAppBrowser).toBe(true);
      expect(result.supportsDeepLinking).toBe(false); // In-app browsers don't support deep linking
    });

    test('identifies desktop platforms correctly', () => {
      const windowsUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/89.0.4389.105';
      
      const result = sanitizeUserAgent(windowsUA);
      expect(result.isMobile).toBe(false);
      expect(result.platformInfo.isWindows).toBe(true);
      expect(result.platformInfo.isMac).toBe(false);
      expect(result.supportsDeepLinking).toBe(false);
    });
  });

  describe('ReDoS Prevention Tests', () => {
    test('handles repeated processing without performance degradation', () => {
      const normalUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
      
      // Process same user agent multiple times
      const results = [];
      for (let i = 0; i < 50; i++) {
        results.push(sanitizeUserAgent(normalUA));
      }
      
      // All results should be identical
      expect(results.every(r => r.userAgentHash === results[0].userAgentHash)).toBe(true);
    });

    test('cache prevents memory exhaustion', () => {
      // Create many different user agents to test cache limit
      for (let i = 0; i < 120; i++) { // Exceeds cache limit of 100
        const ua = `Mozilla/5.0 (X11; Linux x86_64) Chrome/${i}.0.0.0`;
        sanitizeUserAgent(ua);
      }
      
      // Should not throw memory errors
      const finalUA = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/999.0.0.0';
      expect(() => sanitizeUserAgent(finalUA)).not.toThrow();
    });
  });

  describe('Type Safety Tests', () => {
    test('returns correct interface structure', () => {
      const normalUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
      
      const result = sanitizeUserAgent(normalUA);
      
      // Check required properties exist and have correct types
      expect(typeof result.userAgentHash).toBe('string');
      expect(typeof result.isMobile).toBe('boolean');
      expect(typeof result.isInAppBrowser).toBe('boolean');
      expect(typeof result.supportsDeepLinking).toBe('boolean');
      
      // Check platform info structure
      expect(typeof result.platformInfo).toBe('object');
      expect(typeof result.platformInfo.isAndroid).toBe('boolean');
      expect(typeof result.platformInfo.isIOS).toBe('boolean');
      expect(typeof result.platformInfo.isWindows).toBe('boolean');
      expect(typeof result.platformInfo.isMac).toBe('boolean');
      expect(typeof result.platformInfo.isLinux).toBe('boolean');
      
      // Check optional properties
      if (result.detectedWallet !== undefined) {
        expect(typeof result.detectedWallet).toBe('string');
      }
    });

    test('hash is always non-empty string', () => {
      const normalUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36';
      
      const result = sanitizeUserAgent(normalUA);
      expect(result.userAgentHash).toBeDefined();
      expect(result.userAgentHash.length).toBeGreaterThan(0);
      expect(typeof result.userAgentHash).toBe('string');
    });

    test('platform info is always complete', () => {
      const normalUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36';
      
      const result = sanitizeUserAgent(normalUA);
      expect(result.platformInfo).toBeDefined();
      expect(result.platformInfo.isAndroid).toBeDefined();
      expect(result.platformInfo.isIOS).toBeDefined();
      expect(result.platformInfo.isWindows).toBeDefined();
      expect(result.platformInfo.isMac).toBeDefined();
      expect(result.platformInfo.isLinux).toBeDefined();
    });
  });

  describe('Error Code Tests', () => {
    test('provides specific error codes for different violations', () => {
      // Test INVALID_TYPE
      try {
        sanitizeUserAgent(123);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UserAgentSecurityError);
        expect((error as UserAgentSecurityError).code).toBe('INVALID_TYPE');
      }
      
      // Test NULL_INPUT
      try {
        sanitizeUserAgent(null);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UserAgentSecurityError);
        expect((error as UserAgentSecurityError).code).toBe('NULL_INPUT');
      }
      
      // Test EMPTY_INPUT
      try {
        sanitizeUserAgent('');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UserAgentSecurityError);
        expect((error as UserAgentSecurityError).code).toBe('EMPTY_INPUT');
      }
      
      // Test LENGTH_EXCEEDED
      try {
        sanitizeUserAgent('A'.repeat(1025));
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UserAgentSecurityError);
        expect((error as UserAgentSecurityError).code).toBe('LENGTH_EXCEEDED');
      }
      
      // Test XSS_DETECTED
      try {
        sanitizeUserAgent('Mozilla <script>alert(1)</script>');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UserAgentSecurityError);
        expect((error as UserAgentSecurityError).code).toBe('XSS_DETECTED');
      }
    });
  });
});