import { Page } from "@playwright/test";

// Interface for mock signature response
interface MockSignatureResponse {
  success: boolean;
  signature?: string;
  error?: string;
}

/**
 * Sets up mocking for wallet signature requests
 * This allows testing the entire flow including wallet signature
 */
export async function setupWalletMock(page: Page, response: MockSignatureResponse = { success: true, signature: "0x1234567890abcdef" }) {
  // Mock the wagmi hooks response
  await page.addInitScript(`() => {
    // Store the original window.ethereum
    const originalEthereum = window.ethereum;
    
    // Mock implementation
    window.ethereum = {
      ...originalEthereum,
      request: async ({ method, params }: { method: string; params: any[] }) => {
        // Mock common wallet methods
        if (method === "eth_requestAccounts") {
          return ["0x1234567890123456789012345678901234567890"];
        }
        
        if (method === "eth_accounts") {
          return ["0x1234567890123456789012345678901234567890"];
        }
        
        if (method === "personal_sign" || method === "eth_sign") {
          // This would be called by the signMessage function
          return "0x1234567890abcdef"; // Mock signature
        }
        
        if (method === "eth_chainId") {
          return "0x1"; // Ethereum mainnet
        }
        
        // Fall back to original implementation if available
        if (originalEthereum && originalEthereum.request) {
          return originalEthereum.request({ method, params });
        }
        
        return null;
      }
    };
    
    // Mock wagmi hooks
    if (!window.__TEST_HOOKS__) {
      window.__TEST_HOOKS__ = {};
    }
    
    // Mock signMessage hook response
    window.__TEST_HOOKS__.mockSignMessageResult = ${JSON.stringify(response)};
    
    // Override any hook implementations that might be loaded later
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj, prop, descriptor) {
      // Capture any attempts to define the signMessage hook
      if (prop === "useSignMessage" || prop === "signMessage") {
        const original = descriptor.value;
        descriptor.value = function(...args: any[]) {
          const result = original ? original.apply(this, args) : {};
          // Override with our mock
          return {
            ...result,
            signMessageAsync: async () => window.__TEST_HOOKS__.mockSignMessageResult.signature,
            isLoading: false,
            isSuccess: window.__TEST_HOOKS__.mockSignMessageResult.success,
            isError: !window.__TEST_HOOKS__.mockSignMessageResult.success,
            error: window.__TEST_HOOKS__.mockSignMessageResult.error
          };
        };
      }
      return originalDefineProperty.call(this, obj, prop, descriptor);
    };
  }`);
}

/**
 * Sets up mocking for a wallet signature rejection
 */
export async function setupWalletRejection(page: Page) {
  return setupWalletMock(page, { 
    success: false, 
    error: "User rejected request" 
  });
}

/**
 * Sets up mocking for a wallet connection error
 */
export async function setupWalletConnectionError(page: Page) {
  await page.addInitScript(() => {
    // Override ethereum provider to simulate connection error
    window.ethereum = undefined;
    
    // Mock wagmi hooks to indicate error
    if (!window.__TEST_HOOKS__) {
      window.__TEST_HOOKS__ = {};
    }
    
    window.__TEST_HOOKS__.connectionError = true;
  });
}

// Add the type declaration for the test hooks
declare global {
  interface Window {
    ethereum?: any;
    __TEST_HOOKS__?: {
      mockSignMessageResult?: MockSignatureResponse;
      connectionError?: boolean;
    };
  }
}
