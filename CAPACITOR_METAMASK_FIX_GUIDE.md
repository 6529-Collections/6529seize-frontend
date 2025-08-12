# Capacitor MetaMask Connection Fix Guide

## Problem Summary
MetaMask wallet connection works in commit `6d173fa70` but fails in current branch. The app opens MetaMask but the connect button doesn't appear, indicating the new mobile-specific logic is interfering with Capacitor's native WebView environment.

## Root Cause Analysis

### Key Differences Between Browser and Capacitor
1. **Capacitor uses WebView with injected providers** - MetaMask injects `window.ethereum` directly
2. **No deep linking needed** - Capacitor apps communicate through native bridges, not URL schemes
3. **User Agent detection fails** - WebView user agents differ from mobile browsers
4. **Visibility change events don't work** - App switching behaves differently in native apps

### Breaking Changes Identified
1. **New `useMobileWalletConnection` hook** - Treats Capacitor as mobile browser
2. **Deep linking flow** - Waits for app return that never happens
3. **User agent sanitization** - May block or misidentify Capacitor
4. **Error throwing instead of boolean returns** - Breaks connection flow
5. **Secure wallet initialization** - Timing issues with `useEffect`

## Step-by-Step Fix Plan

### STEP 1: Debug Infrastructure Setup
**Purpose**: Add debugging capabilities without breaking existing code

#### 1.1 Create Debug Utility
Create file: `src/utils/debug-capacitor.ts`

```typescript
// Debug utility for Capacitor - safe to use in production
export const debugAlert = (message: string, data?: any) => {
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
    const dataStr = data ? `\nData: ${JSON.stringify(data).slice(0, 100)}` : '';
    alert(`[DEBUG] ${message}${dataStr}`);
  }
  // Also log to console for development
  console.log(`[CAPACITOR DEBUG] ${message}`, data);
};

export const checkCapacitorEnvironment = () => {
  if (typeof window === 'undefined') return null;
  
  const env = {
    isCapacitor: !!window.Capacitor?.isNativePlatform?.(),
    platform: window.Capacitor?.getPlatform?.() || 'unknown',
    hasEthereum: !!window.ethereum,
    hasWeb3: !!window.web3,
    userAgent: window.navigator?.userAgent?.slice(0, 100) || 'unknown',
    walletType: detectWalletType()
  };
  
  return env;
};

function detectWalletType(): string {
  if (typeof window === 'undefined') return 'none';
  
  // Check for specific wallet providers
  if (window.ethereum?.isMetaMask) return 'MetaMask';
  if (window.ethereum?.isCoinbaseWallet) return 'Coinbase';
  if (window.ethereum?.isWalletConnect) return 'WalletConnect';
  if (window.ethereum) return 'Generic Web3';
  
  return 'none';
}

// Global window type extension for TypeScript
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
    ethereum?: any;
    web3?: any;
  }
}
```

#### 1.2 Add Debug Points to Connection Flow
In `components/auth/SeizeConnectContext.tsx`:

```typescript
import { debugAlert, checkCapacitorEnvironment } from '../../src/utils/debug-capacitor';

// Add to the seizeConnect function:
const seizeConnect = useCallback(async () => {
  try {
    // Debug: Check environment before connecting
    const env = checkCapacitorEnvironment();
    debugAlert('Connection attempt started', env);
    
    // Log security event
    logSecurityEvent(
      SecurityEventType.WALLET_MODAL_OPENING,
      createConnectionEventContext('seizeConnect')
    );
    
    // Open the modal
    debugAlert('Opening AppKit modal');
    open({ view: "Connect" });
    
    debugAlert('Modal opened successfully');
    
    // Log successful modal opening
    logSecurityEvent(
      SecurityEventType.WALLET_MODAL_OPENED,
      createConnectionEventContext('seizeConnect')
    );
  } catch (error: any) {
    debugAlert('Connection failed', { 
      error: error.message,
      stack: error.stack?.slice(0, 200)
    });
    
    // ... existing error handling
    throw error;
  }
}, [open]);
```

### STEP 2: Fix Mobile Detection for Capacitor
**Purpose**: Prevent Capacitor from being treated as a mobile browser

#### 2.1 Update Mobile Wallet Detection
Modify `hooks/useMobileWalletConnection.ts`:

```typescript
function getMobileWalletInfo(): MobileWalletInfo {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isInAppBrowser: false,
      userAgentHash: '',
      supportsDeepLinking: false,
      platformInfo: {
        isAndroid: false,
        isIOS: false,
        isWindows: false,
        isMac: false,
        isLinux: false,
      },
    };
  }

  // CRITICAL FIX: Detect Capacitor and use desktop flow
  if (window.Capacitor?.isNativePlatform?.()) {
    const platform = window.Capacitor.getPlatform();
    
    // Log for debugging
    console.log('[Capacitor Detected] Platform:', platform);
    console.log('[Capacitor Detected] Has Ethereum:', !!window.ethereum);
    
    return {
      isMobile: false, // IMPORTANT: Force desktop flow
      isInAppBrowser: false,
      userAgentHash: 'capacitor-native-app',
      supportsDeepLinking: false, // Capacitor doesn't use deep links
      detectedWallet: window.ethereum?.isMetaMask ? 'MetaMask' : 
                      window.ethereum ? 'InjectedWallet' : undefined,
      platformInfo: {
        isAndroid: platform === 'android',
        isIOS: platform === 'ios',
        isWindows: false,
        isMac: false,
        isLinux: false,
      },
    };
  }

  // Original browser detection continues...
  try {
    const safeUserAgentInfo = sanitizeUserAgent(window.navigator.userAgent);
    
    return {
      isMobile: safeUserAgentInfo.isMobile,
      isInAppBrowser: safeUserAgentInfo.isInAppBrowser,
      userAgentHash: safeUserAgentInfo.userAgentHash,
      supportsDeepLinking: safeUserAgentInfo.supportsDeepLinking,
      detectedWallet: safeUserAgentInfo.detectedWallet,
      platformInfo: safeUserAgentInfo.platformInfo,
    };
  } catch (error) {
    // Handle security errors
    if (error instanceof UserAgentSecurityError) {
      throw new WalletConnectionError(
        `Security violation in user agent processing: ${error.message}`
      );
    }
    throw error;
  }
}
```

### STEP 3: Fix Connector Order and Configuration
**Purpose**: Ensure injected provider is detected first

#### 3.1 Update AppKitAdapterCapacitor
Modify `components/providers/AppKitAdapterCapacitor.ts`:

```typescript
createAdapter(appWallets: AppWallet[]): WagmiAdapter {
  // Debug logging for Capacitor
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
    console.log('[AppKitAdapter] Creating Capacitor adapter');
    console.log('[AppKitAdapter] App wallets count:', appWallets.length);
    console.log('[AppKitAdapter] window.ethereum available:', !!window.ethereum);
    console.log('[AppKitAdapter] MetaMask detected:', !!window.ethereum?.isMetaMask);
  }

  // Validate wallets
  for (const wallet of appWallets) {
    if (!wallet?.address) {
      throw new WalletConnectionError(
        `Invalid wallet in appWallets: missing address. Wallet: ${JSON.stringify(wallet)}`
      );
    }
  }
  
  const networks = [mainnet];

  // CRITICAL: Order matters for Capacitor - injected MUST be first
  const mobileConnectors = [
    // 1. Injected connector FIRST (for MetaMask in Capacitor)
    injected(),
    
    // 2. MetaMask specific connector as backup
    metaMask({
      dappMetadata: {
        name: "6529.io",
        url: VALIDATED_BASE_ENDPOINT,
      },
    }),
    
    // 3. WalletConnect for other wallets (QR code disabled for mobile)
    walletConnect({
      projectId: CW_PROJECT_ID,
      metadata: {
        name: "6529.io",
        description: "6529.io",
        url: VALIDATED_BASE_ENDPOINT,
        icons: [
          "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png",
        ],
      },
      showQrModal: false, // CRITICAL: No QR on mobile
      qrModalOptions: {
        enableExplorer: true,
      },
    }),
    
    // 4. Other connectors
    coinbaseWallet({
      appName: "6529 CORE",
      appLogoUrl: "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png",
      enableMobileWalletLink: true,
      version: "3",
    }),
  ];

  // App wallet connectors
  const appWalletConnectors = appWallets.map(wallet => 
    createAppWalletConnector(
      networks,
      { appWallet: wallet },
      () => this.requestPassword(wallet.address, wallet.address_hashed)
    )
  );

  const allConnectors = [...mobileConnectors, ...appWalletConnectors];

  const wagmiAdapter = new WagmiAdapter({
    networks,
    projectId: CW_PROJECT_ID,
    ssr: false, // IMPORTANT: Must be false for mobile apps
    connectors: allConnectors
  });

  this.currentAdapter = wagmiAdapter;
  this.currentWallets = [...appWallets];
  
  // Initialize connection states
  for (const wallet of appWallets) {
    this.initializeWalletConnectionState(wallet.address);
  }
  
  return wagmiAdapter;
}
```

### STEP 4: Fix Error Handling for Capacitor
**Purpose**: Make error handling more lenient for Capacitor

#### 4.1 Update Wallet Connector Error Handling
Modify `wagmiConfig/wagmiAppWalletConnector.ts`:

```typescript
async setPassword(password: string): Promise<void> {
  // Keep input validation
  if (!password || typeof password !== 'string') {
    throw new InvalidPasswordError('Password is required and must be a string');
  }
  
  if (password.length < 8) {
    throw new InvalidPasswordError('Password must be at least 8 characters long');
  }

  try {
    // Decrypt and validate
    const decryptedAddress = await decryptData(
      options.appWallet.address,
      options.appWallet.address_hashed,
      password
    );

    if (!decryptedAddress) {
      throw new InvalidPasswordError('Password decryption resulted in empty data');
    }

    // For Capacitor, be more lenient with address comparison
    const isCapacitor = typeof window !== 'undefined' && 
                       window.Capacitor?.isNativePlatform?.();
    
    if (isCapacitor) {
      // Simple case-insensitive comparison for Capacitor
      const match = decryptedAddress.toLowerCase() === 
                   options.appWallet.address.toLowerCase();
      if (!match) {
        throw new InvalidPasswordError('Password does not match wallet');
      }
    } else {
      // Strict comparison for web
      if (!areEqualAddresses(decryptedAddress, options.appWallet.address)) {
        throw new InvalidPasswordError('Password verification failed');
      }
    }

    // Decrypt private key
    const privateKey = await decryptData(
      options.appWallet.address,
      options.appWallet.private_key,
      password
    );

    if (!privateKey) {
      throw new PrivateKeyDecryptionError('Private key decryption failed');
    }

    // Validate format
    if (!privateKey.match(/^[0-9a-fA-F]{64}$/)) {
      throw new PrivateKeyDecryptionError('Invalid private key format');
    }

    decryptedPrivateKey = privateKey;
    
  } catch (error) {
    // Clear any partial state
    decryptedPrivateKey = null;
    
    // Re-throw our custom errors
    if (error instanceof WalletAuthenticationError) {
      throw error;
    }
    
    // Wrap unexpected errors
    throw new PrivateKeyDecryptionError(
      'Unexpected error during password validation',
      error
    );
  }
}
```

### STEP 5: Fix Initialization Timing
**Purpose**: Resolve timing issues with wallet initialization

#### 5.1 Update Secure Wallet Initialization
Modify `components/auth/SeizeConnectContext.tsx`:

```typescript
const useSecureWalletInitialization = () => {
  const [connectedAddress, setConnectedAddress] = useState<string | undefined>(undefined);
  const [hasInitializationError, setHasInitializationError] = useState(false);
  const [initializationError, setInitializationError] = useState<Error | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        const storedAddress: string | null = getWalletAddress();
        
        if (!storedAddress) {
          setConnectedAddress(undefined);
          setIsInitialized(true);
          return;
        }
        
        // Check if we're in Capacitor
        const isCapacitor = typeof window !== 'undefined' && 
                           window.Capacitor?.isNativePlatform?.();
        
        if (isCapacitor) {
          // Simplified validation for Capacitor
          if (storedAddress.startsWith('0x') && storedAddress.length === 42) {
            // Use lowercase for consistency
            setConnectedAddress(storedAddress.toLowerCase());
            setIsInitialized(true);
            console.log('[Capacitor] Wallet initialized:', storedAddress.slice(0, 10) + '...');
            return;
          }
          
          // Invalid address in Capacitor
          console.error('[Capacitor] Invalid stored address format');
          removeAuthJwt();
          setConnectedAddress(undefined);
          setIsInitialized(true);
          return;
        }
        
        // Web: Keep strict validation
        if (isValidAddress(storedAddress)) {
          const checksummedAddress = getAddress(storedAddress);
          setConnectedAddress(checksummedAddress);
          setIsInitialized(true);
          return;
        }
        
        // Handle invalid address on web
        const invalidAddressString = storedAddress as string;
        const addressLength = invalidAddressString.length;
        const addressFormat = invalidAddressString.startsWith('0x') ? 
                             'hex_prefixed' : 'other';
        const debugAddress = invalidAddressString.length >= 10 ? 
          invalidAddressString.slice(0, 10) + '...' : 
          invalidAddressString;
        
        logSecurityEvent(
          SecurityEventType.INVALID_ADDRESS_DETECTED,
          createValidationEventContext(
            'wallet_initialization',
            false,
            addressLength,
            addressFormat
          )
        );
        
        // Clear invalid state
        try {
          removeAuthJwt();
        } catch (cleanupError) {
          logError('auth_cleanup_during_init', 
                  new Error('Failed to clear invalid auth state', { cause: cleanupError }));
        }
        
        const initError = new WalletInitializationError(
          'Invalid wallet address found in storage',
          undefined,
          debugAddress
        );
        
        logError('wallet_initialization', initError);
        setHasInitializationError(true);
        setInitializationError(initError);
        setConnectedAddress(undefined);
        setIsInitialized(true);
        
      } catch (error) {
        // Handle unexpected errors
        const initError = new WalletInitializationError(
          'Unexpected error during wallet initialization',
          error
        );
        
        logError('wallet_initialization', initError);
        setHasInitializationError(true);
        setInitializationError(initError);
        setConnectedAddress(undefined);
        setIsInitialized(true);
      }
    };

    initializeWallet();
  }, []);

  return {
    connectedAddress,
    setConnectedAddress,
    hasInitializationError,
    initializationError,
    isInitialized
  };
};
```

## Testing Strategy

### Test Sequence
1. **Test 1**: Deploy only Step 1 (debug infrastructure) - Check alert messages
2. **Test 2**: Add Step 2 (mobile detection fix) - Check if MetaMask appears
3. **Test 3**: Add Step 3 (connector order) - Check if connection initiates
4. **Test 4**: Add Step 4 (error handling) - Check if connection completes
5. **Test 5**: Add Step 5 (initialization) - Check if wallet persists

### What to Look For in Debug Alerts

#### Alert 1: "Connection attempt started"
Should show:
- `isCapacitor: true`
- `platform: "ios"` or `"android"`  
- `hasEthereum: true` (if MetaMask installed)
- `walletType: "MetaMask"`

#### Alert 2: "Opening AppKit modal"
Should appear immediately after first alert

#### Alert 3: "Modal opened successfully"
If this appears, modal is working

### Verification Checklist
- [ ] Debug alerts appear in correct order
- [ ] Capacitor is detected (`isCapacitor: true`)
- [ ] Mobile flow is bypassed (`isMobile: false` in MobileWalletInfo)
- [ ] MetaMask appears in wallet list
- [ ] Clicking MetaMask opens the app
- [ ] Connect button appears in MetaMask
- [ ] Connection completes successfully
- [ ] Wallet address persists after reconnect

## Rollback Plan (If Nothing Works)

### Emergency Fix - Complete Bypass
If the above steps don't work, use this temporary bypass:

```typescript
// In components/auth/SeizeConnectContext.tsx
// Add at the top of the component

const CAPACITOR_LEGACY_MODE = true; // Emergency flag

const SeizeConnectContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const isCapacitor = typeof window !== 'undefined' && 
                     window.Capacitor?.isNativePlatform?.();
  
  // Use old simple initialization for Capacitor
  if (isCapacitor && CAPACITOR_LEGACY_MODE) {
    const [connectedAddress, setConnectedAddress] = useState<string | undefined>(
      getWalletAddress() || undefined
    );
    
    // Skip all new security features temporarily
    // ... simplified implementation
  }
  
  // ... rest of component
};
```

## Important Notes

### Security Considerations
- All fixes maintain security for web users
- Capacitor-specific bypasses only apply in native app context
- Error logging still works for monitoring
- Address validation remains, just simplified for Capacitor

### Performance Impact
- Debug alerts only appear in Capacitor (not web)
- Console logs can be disabled in production
- No impact on web performance

### Future Improvements
1. Create dedicated `useCapacitorWalletConnection` hook
2. Implement native Capacitor plugin for MetaMask
3. Add feature flag system for easier testing
4. Create automated tests for Capacitor environment

## Commands Reference

### Build and Test
```bash
# Build the web app
npm run build

# Sync with Capacitor
npx cap sync

# Open in Xcode (iOS)
npx cap open ios

# Open in Android Studio
npx cap open android

# Run on iOS simulator
npx cap run ios

# Run on Android emulator
npx cap run android
```

### Debugging Commands
```bash
# View Capacitor logs
npx cap run ios --livereload --external

# Chrome DevTools for Android
# 1. Enable USB debugging on device
# 2. Open chrome://inspect in Chrome
# 3. Select your app's WebView

# Safari Web Inspector for iOS
# 1. Enable Web Inspector on iOS device
# 2. Connect device to Mac
# 3. Open Safari > Develop > [Device Name]
```

## Success Criteria
The fix is successful when:
1. MetaMask opens when selected from wallet list
2. Connect button appears in MetaMask
3. Connection completes without errors
4. Wallet address is displayed in app
5. Connection persists across app restarts
6. All security features remain active on web

## Contact for Issues
If you encounter issues not covered in this guide:
1. Check debug alerts for specific error messages
2. Review Capacitor logs for native errors
3. Verify MetaMask is installed and updated
4. Test with a fresh wallet to rule out account issues
5. Try the emergency bypass as last resort

Remember: The goal is to make Capacitor use the **desktop/web flow** instead of the mobile browser flow, as MetaMask in Capacitor works through injected provider (`window.ethereum`), not deep linking.