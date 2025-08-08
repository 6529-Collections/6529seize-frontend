/**
 * Tests for BASE_ENDPOINT validation in constants.ts
 * 
 * These tests ensure that the validateBaseEndpoint function properly:
 * - Fails fast when environment variable is missing
 * - Validates URL format
 * - Enforces HTTPS in production
 * - Validates against domain allowlist
 * - Allows valid configurations
 */

// Mock process.env before importing constants
const originalEnv = process.env;

describe('validateBaseEndpoint', () => {
  beforeEach(() => {
    // Reset process.env before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('throws error when NEXT_PUBLIC_BASE_ENDPOINT is missing', () => {
    // Remove the environment variable
    delete process.env.NEXT_PUBLIC_BASE_ENDPOINT;
    
    expect(() => {
      require('../constants');
    }).toThrow('NEXT_PUBLIC_BASE_ENDPOINT environment variable is required');
  });

  it('throws error when NEXT_PUBLIC_BASE_ENDPOINT is empty string', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = '';
    
    expect(() => {
      require('../constants');
    }).toThrow('NEXT_PUBLIC_BASE_ENDPOINT environment variable is required');
  });

  it('throws error for invalid URL format', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'not-a-url';
    
    expect(() => {
      require('../constants');
    }).toThrow('NEXT_PUBLIC_BASE_ENDPOINT contains invalid URL format: not-a-url');
  });

  it('throws error for malformed URLs', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'https://';
    
    expect(() => {
      require('../constants');
    }).toThrow('NEXT_PUBLIC_BASE_ENDPOINT contains invalid URL format');
  });

  it('throws error for non-HTTPS URLs in production (except localhost)', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'http://example.com';
    
    expect(() => {
      require('../constants');
    }).toThrow('NEXT_PUBLIC_BASE_ENDPOINT must use HTTPS protocol in production');
  });

  it('throws error for FTP protocol', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'ftp://6529.io';
    
    expect(() => {
      require('../constants');
    }).toThrow('NEXT_PUBLIC_BASE_ENDPOINT must use HTTPS protocol in production');
  });

  it('throws error for non-allowlisted domain', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'https://malicious.com';
    
    expect(() => {
      require('../constants');
    }).toThrow('NEXT_PUBLIC_BASE_ENDPOINT domain not in allowlist. Got: malicious.com');
  });

  it('throws error for subdomain of non-allowlisted domain', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'https://fake.malicious.com';
    
    expect(() => {
      require('../constants');
    }).toThrow('NEXT_PUBLIC_BASE_ENDPOINT domain not in allowlist. Got: fake.malicious.com');
  });

  it('throws error for domain that ends with allowlisted domain but is not a subdomain', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'https://fake6529.io';
    
    expect(() => {
      require('../constants');
    }).toThrow('NEXT_PUBLIC_BASE_ENDPOINT domain not in allowlist. Got: fake6529.io');
  });

  // Valid configuration tests
  it('accepts valid HTTPS URL with 6529.io domain', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'https://6529.io';
    
    expect(() => {
      const constants = require('../constants');
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe('https://6529.io');
    }).not.toThrow();
  });

  it('accepts valid HTTPS URL with www.6529.io domain', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'https://www.6529.io';
    
    expect(() => {
      const constants = require('../constants');
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe('https://www.6529.io');
    }).not.toThrow();
  });

  it('accepts valid HTTPS URL with staging.6529.io domain', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'https://staging.6529.io';
    
    expect(() => {
      const constants = require('../constants');
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe('https://staging.6529.io');
    }).not.toThrow();
  });

  it('accepts HTTP localhost URLs', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'http://localhost:3000';
    
    expect(() => {
      const constants = require('../constants');
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe('http://localhost:3000');
    }).not.toThrow();
  });

  it('accepts HTTP 127.0.0.1 URLs', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'http://127.0.0.1:3000';
    
    expect(() => {
      const constants = require('../constants');
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe('http://127.0.0.1:3000');
    }).not.toThrow();
  });

  it('accepts HTTPS localhost URLs', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'https://localhost:3000';
    
    expect(() => {
      const constants = require('../constants');
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe('https://localhost:3000');
    }).not.toThrow();
  });

  it('accepts valid subdomain of allowlisted domain', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'https://api.6529.io';
    
    expect(() => {
      const constants = require('../constants');
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe('https://api.6529.io');
    }).not.toThrow();
  });

  it('accepts URLs with paths and query parameters', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'https://6529.io/app?ref=test';
    
    expect(() => {
      const constants = require('../constants');
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe('https://6529.io/app?ref=test');
    }).not.toThrow();
  });

  it('validates immediately on module import (fail-fast behavior)', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'invalid-url';
    
    // The error should be thrown immediately when the module is imported
    // not when the constant is accessed
    expect(() => {
      require('../constants');
    }).toThrow();
  });

  it('exports VALIDATED_BASE_ENDPOINT constant for valid configuration', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'https://6529.io';
    
    const constants = require('../constants');
    expect(constants.VALIDATED_BASE_ENDPOINT).toBe('https://6529.io');
    expect(typeof constants.VALIDATED_BASE_ENDPOINT).toBe('string');
  });

  // Edge case tests
  it('handles URLs with non-standard ports', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'https://staging.6529.io:8080';
    
    expect(() => {
      const constants = require('../constants');
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe('https://staging.6529.io:8080');
    }).not.toThrow();
  });

  it('handles URLs with trailing slashes', () => {
    process.env.NEXT_PUBLIC_BASE_ENDPOINT = 'https://6529.io/';
    
    expect(() => {
      const constants = require('../constants');
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe('https://6529.io/');
    }).not.toThrow();
  });
});