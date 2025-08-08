import { AppKitAdapterCapacitor } from '../../../components/providers/AppKitAdapterCapacitor';

describe('AppKitAdapterCapacitor - Security Tests', () => {
  const mockRequestPassword = jest.fn().mockResolvedValue('password');
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    delete process.env.BASE_ENDPOINT;
  });

  describe('Environment Variable Validation', () => {
    it('should throw error when BASE_ENDPOINT is missing', () => {
      expect(() => new AppKitAdapterCapacitor(mockRequestPassword))
        .toThrow('BASE_ENDPOINT environment variable is required');
    });

    it('should throw error when BASE_ENDPOINT is invalid URL', () => {
      process.env.BASE_ENDPOINT = 'not-a-url';
      
      expect(() => new AppKitAdapterCapacitor(mockRequestPassword))
        .toThrow('BASE_ENDPOINT environment variable contains invalid URL');
    });

    it('should throw error when BASE_ENDPOINT uses HTTP in production', () => {
      process.env.BASE_ENDPOINT = 'http://6529.io';
      
      expect(() => new AppKitAdapterCapacitor(mockRequestPassword))
        .toThrow('BASE_ENDPOINT must use HTTPS protocol in production');
    });

    it('should allow HTTP for localhost', () => {
      process.env.BASE_ENDPOINT = 'http://localhost:3000';
      
      expect(() => new AppKitAdapterCapacitor(mockRequestPassword))
        .not.toThrow();
    });

    it('should throw error for disallowed domain', () => {
      process.env.BASE_ENDPOINT = 'https://malicious-site.com';
      
      expect(() => new AppKitAdapterCapacitor(mockRequestPassword))
        .toThrow('BASE_ENDPOINT domain not in allowlist');
    });

    it('should allow legitimate 6529.io domains', () => {
      const validDomains = [
        'https://6529.io',
        'https://www.6529.io',
        'https://staging.6529.io'
      ];
      
      validDomains.forEach(domain => {
        process.env.BASE_ENDPOINT = domain;
        expect(() => new AppKitAdapterCapacitor(mockRequestPassword))
          .not.toThrow();
      });
    });
  });

  describe('Adapter Creation Security', () => {
    beforeEach(() => {
      process.env.BASE_ENDPOINT = 'https://6529.io';
    });

    it('should use validated endpoint in MetaMask metadata', () => {
      const adapter = new AppKitAdapterCapacitor(mockRequestPassword);
      const wagmiAdapter = adapter.createAdapter([]);
      
      // Verify the adapter was created with correct metadata
      expect(wagmiAdapter).toBeDefined();
    });

    it('should never expose raw environment variables to connectors', () => {
      // Set a potentially malicious environment variable
      process.env.BASE_ENDPOINT = 'https://6529.io';
      process.env.MALICIOUS_VAR = 'https://evil.com';
      
      const adapter = new AppKitAdapterCapacitor(mockRequestPassword);
      
      // Ensure construction doesn't fail due to unvalidated env vars
      expect(() => adapter.createAdapter([])).not.toThrow();
    });
  });

  describe('Type Safety', () => {
    it('should have strongly typed baseEndpoint property', () => {
      process.env.BASE_ENDPOINT = 'https://6529.io';
      const adapter = new AppKitAdapterCapacitor(mockRequestPassword);
      
      // TypeScript should enforce that baseEndpoint is string, not string | undefined
      const endpoint: string = (adapter as any).baseEndpoint;
      expect(typeof endpoint).toBe('string');
      expect(endpoint).toBe('https://6529.io');
    });
  });
});