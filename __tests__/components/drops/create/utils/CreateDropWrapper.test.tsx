import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateDropWrapper from '../../../../../components/drops/create/utils/CreateDropWrapper';
import { WalletValidationError } from '../../../../../src/errors/wallet';
import { CreateDropType, CreateDropViewType } from '../../../../../components/drops/create/types';

// Mock the SeizeConnectContext
const mockUseSeizeConnectContext = jest.fn();
jest.mock('@/components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: () => mockUseSeizeConnectContext()
}));

// Mock react-use breakpoint
jest.mock('react-use', () => ({
  createBreakpoint: () => () => 'LG'
}));

// Mock lexical
jest.mock('@lexical/markdown', () => ({
  $convertToMarkdownString: () => '',
  TRANSFORMERS: []
}));

// Mock transformers
jest.mock('../../../../../components/drops/create/lexical/transformers/MentionTransformer', () => ({
  MENTION_TRANSFORMER: {}
}));

jest.mock('../../../../../components/drops/create/lexical/transformers/HastagTransformer', () => ({
  HASHTAG_TRANSFORMER: {}
}));

jest.mock('../../../../../components/drops/create/lexical/transformers/ImageTransformer', () => ({
  IMAGE_TRANSFORMER: {}
}));

// Mock components
jest.mock('../../../../../components/drops/create/compact/CreateDropCompact', () => {
  return React.forwardRef((props: any, ref: any) => {
    return <div data-testid="create-drop-compact">Compact View</div>;
  });
});

jest.mock('../../../../../components/drops/create/full/CreateDropFull', () => {
  return React.forwardRef((props: any, ref: any) => {
    return <div data-testid="create-drop-full">Full View</div>;
  });
});

jest.mock('../../../../../components/utils/animation/CommonAnimationHeight', () => {
  return ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
});

describe('CreateDropWrapper Wallet Validation', () => {
  let queryClient: QueryClient;
  let component: React.RefObject<any>;

  const mockProfile = {
    id: 'test-profile',
    handle: 'testuser',
    pfp: null,
    cic: 0
  };

  const defaultProps = {
    profile: mockProfile,
    quotedDrop: null,
    type: CreateDropType.DROP,
    loading: false,
    title: null,
    metadata: [],
    mentionedUsers: [],
    referencedNfts: [],
    drop: null,
    viewType: CreateDropViewType.COMPACT,
    showSubmit: true,
    wave: null,
    waveId: null,
    children: null,
    setIsStormMode: jest.fn(),
    setViewType: jest.fn(),
    setDrop: jest.fn(),
    setMentionedUsers: jest.fn(),
    onMentionedUser: jest.fn(),
    setReferencedNfts: jest.fn(),
    setTitle: jest.fn(),
    setMetadata: jest.fn(),
    onSubmitDrop: jest.fn()
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    component = React.createRef();
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CreateDropWrapper ref={component} {...defaultProps} {...props} />
      </QueryClientProvider>
    );
  };

  describe('Wallet validation with undefined address', () => {
    beforeEach(() => {
      mockUseSeizeConnectContext.mockReturnValue({
        address: undefined,
        isSafeWallet: false
      });
    });

    it('throws WalletValidationError when address is undefined', () => {
      renderComponent();
      
      expect(() => {
        component.current?.requestDrop();
      }).toThrow('Wallet validation failed: Wallet connection required for drop creation. Please connect your wallet first.');
    });
  });

  describe('Wallet validation with null address', () => {
    beforeEach(() => {
      mockUseSeizeConnectContext.mockReturnValue({
        address: null,
        isSafeWallet: false
      });
    });

    it('throws WalletValidationError when address is null', () => {
      renderComponent();
      
      expect(() => {
        component.current?.requestDrop();
      }).toThrow('Wallet validation failed: Wallet connection required for drop creation. Please connect your wallet first.');
    });
  });

  describe('Wallet validation with empty string address', () => {
    beforeEach(() => {
      mockUseSeizeConnectContext.mockReturnValue({
        address: '',
        isSafeWallet: false
      });
    });

    it('throws WalletValidationError when address is empty string', () => {
      renderComponent();
      
      expect(() => {
        component.current?.requestDrop();
      }).toThrow('Wallet validation failed: Wallet connection required for drop creation. Please connect your wallet first.');
    });
  });

  describe('Wallet validation with invalid address format', () => {
    beforeEach(() => {
      mockUseSeizeConnectContext.mockReturnValue({
        address: 'invalid-address',
        isSafeWallet: false
      });
    });

    it('throws WalletValidationError when address format is invalid', () => {
      renderComponent();
      
      expect(() => {
        component.current?.requestDrop();
      }).toThrow('Wallet validation failed: Invalid Ethereum address format. Expected 40-character hex string with 0x prefix.');
    });
  });

  describe('Wallet validation with non-string address type', () => {
    beforeEach(() => {
      mockUseSeizeConnectContext.mockReturnValue({
        address: 123, // number instead of string
        isSafeWallet: false
      });
    });

    it('throws WalletValidationError when address type is not string', () => {
      renderComponent();
      
      expect(() => {
        component.current?.requestDrop();
      }).toThrow('Wallet validation failed: Invalid address type received from wallet connection');
    });
  });

  describe('Safe wallet address validation', () => {
    beforeEach(() => {
      mockUseSeizeConnectContext.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890', // valid 42-char address
        isSafeWallet: true
      });
    });

    it('validates Safe wallet address length correctly', () => {
      renderComponent();
      
      expect(() => {
        component.current?.requestDrop();
      }).not.toThrow();
    });

    it('throws WalletValidationError for Safe wallet with invalid length', () => {
      mockUseSeizeConnectContext.mockReturnValue({
        address: '0x123456789012345678901234567890123456789', // 41 chars, invalid
        isSafeWallet: true
      });

      renderComponent();
      
      // This will fail on the hex format validation first since it's not 42 characters
      expect(() => {
        component.current?.requestDrop();
      }).toThrow('Wallet validation failed: Invalid Ethereum address format. Expected 40-character hex string with 0x prefix.');
    });
  });

  describe('Valid address success cases', () => {
    beforeEach(() => {
      mockUseSeizeConnectContext.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isSafeWallet: false
      });
    });

    it('successfully creates drop with valid address', () => {
      renderComponent();
      
      const result = component.current?.requestDrop();
      
      expect(result).toBeDefined();
      expect(result.signer_address).toBe('0x1234567890123456789012345678901234567890');
      expect(result.is_safe_signature).toBe(false);
    });

    it('handles uppercase hex characters correctly', () => {
      mockUseSeizeConnectContext.mockReturnValue({
        address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
        isSafeWallet: false
      });

      renderComponent();
      
      const result = component.current?.requestDrop();
      
      expect(result).toBeDefined();
      expect(result.signer_address).toBe('0x1234567890ABCDEF1234567890ABCDEF12345678');
    });

    it('handles mixed case hex characters correctly', () => {
      mockUseSeizeConnectContext.mockReturnValue({
        address: '0x1234567890aBcDeF1234567890AbCdEf12345678',
        isSafeWallet: false
      });

      renderComponent();
      
      const result = component.current?.requestDrop();
      
      expect(result).toBeDefined();
      expect(result.signer_address).toBe('0x1234567890aBcDeF1234567890AbCdEf12345678');
    });
  });

  describe('Type safety validation', () => {
    it('ensures address is treated as string type', () => {
      mockUseSeizeConnectContext.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isSafeWallet: false
      });

      renderComponent();
      
      const result = component.current?.requestDrop();
      
      expect(typeof result.signer_address).toBe('string');
      expect(result.signer_address.startsWith('0x')).toBe(true);
      expect(result.signer_address.length).toBe(42);
    });
  });

  describe('Integration with drop creation', () => {
    beforeEach(() => {
      mockUseSeizeConnectContext.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isSafeWallet: false
      });
    });

    it('includes validated address in drop configuration', () => {
      renderComponent();
      
      const result = component.current?.requestDrop();
      
      expect(result).toMatchObject({
        signer_address: '0x1234567890123456789012345678901234567890',
        is_safe_signature: false,
        signature: null,
        title: null,
        parts: [],
        mentioned_users: [],
        referenced_nfts: [],
        metadata: []
      });
    });

    it('maintains Safe wallet flag in drop configuration', () => {
      mockUseSeizeConnectContext.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isSafeWallet: true
      });

      renderComponent();
      
      const result = component.current?.requestDrop();
      
      expect(result.is_safe_signature).toBe(true);
      expect(result.signer_address).toBe('0x1234567890123456789012345678901234567890');
    });
  });
});