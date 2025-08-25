import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet } from 'viem/chains'
import { CW_PROJECT_ID } from '@/constants'
import { AppWallet } from '../app-wallets/AppWalletsContext'
import { 
  createAppWalletConnector 
} from '@/wagmiConfig/wagmiAppWalletConnector'
import { AdapterError, AdapterCacheError, AdapterCleanupError } from '@/src/errors/adapter'
import { WalletValidationError, WalletSecurityError } from '@/src/errors/wallet-validation'
import { validateWalletSafely } from '@/utils/wallet-validation.utils'

type ConnectionState = 'connecting' | 'connected' | 'disconnected'

export class AppKitAdapterManager {
  private currentAdapter: WagmiAdapter | null = null
  private currentWallets: AppWallet[] = []
  private readonly requestPassword: (address: string, addressHashed: string) => Promise<string>
  private readonly adapterCache = new Map<string, WagmiAdapter>()
  private readonly maxCacheSize = 5
  private readonly connectionStates = new Map<string, ConnectionState>()

  constructor(requestPassword: (address: string, addressHashed: string) => Promise<string>) {
    if (!requestPassword) {
      throw new AdapterError('ADAPTER_005: requestPassword function is required')
    }
    if (typeof requestPassword !== 'function') {
      throw new AdapterError('ADAPTER_006: requestPassword must be a function')
    }
    this.requestPassword = requestPassword
  }

  createAdapter(appWallets: AppWallet[]): WagmiAdapter {
    if (!Array.isArray(appWallets)) {
      throw new AdapterError('ADAPTER_007: appWallets must be an array')
    }

    const networks = [mainnet]

    // Create AppWallet connectors if any exist
    const appWalletConnectors = appWallets.map(wallet => {
      if (!wallet) {
        throw new AdapterError('ADAPTER_008: Invalid wallet object found in appWallets array')
      }
      
      try {
        // FAIL-FAST: Validate wallet security before any processing
        validateWalletSafely(wallet); // Will throw immediately on ANY failure

        return createAppWalletConnector(
          networks,
          { appWallet: wallet },
          () => this.requestPassword(wallet.address, wallet.address_hashed)
        )
      } catch (error) {
        if (error instanceof WalletValidationError || error instanceof WalletSecurityError) {
          // Log for debugging but don't expose sensitive details
          console.error('Wallet validation failed during adapter creation:', {
            errorType: error.name,
            message: error.message
          });
        }
        // Re-throw to prevent silent failures
        throw error;
      }
    })
    
    // Create adapter with all connectors
    const wagmiAdapter = new WagmiAdapter({
      networks,
      projectId: CW_PROJECT_ID,
      ssr: false, // App Router requires this to be false to avoid hydration mismatches
      connectors: appWalletConnectors
    })

    this.currentAdapter = wagmiAdapter
    this.currentWallets = [...appWallets]
    
    return wagmiAdapter
  }

  shouldRecreateAdapter(newWallets: AppWallet[]): boolean {
    if (!Array.isArray(newWallets)) {
      throw new AdapterError('ADAPTER_009: newWallets must be an array')
    }

    if (!this.currentAdapter) return true
    if (newWallets.length !== this.currentWallets.length) return true
    
    const currentAddresses = new Set(this.currentWallets.map(w => {
      if (!w?.address) {
        throw new AdapterError('ADAPTER_010: Invalid wallet in currentWallets array')
      }
      return w.address
    }))
    const newAddresses = new Set(newWallets.map(w => {
      if (!w?.address) {
        throw new AdapterError('ADAPTER_011: Invalid wallet in newWallets array')
      }
      return w.address
    }))
    
    for (const addr of Array.from(newAddresses)) {
      if (!currentAddresses.has(addr)) return true
    }
    
    for (const addr of Array.from(currentAddresses)) {
      if (!newAddresses.has(addr)) return true
    }
    
    return false
  }

  createAdapterWithCache(appWallets: AppWallet[]): WagmiAdapter {
    if (!Array.isArray(appWallets)) {
      throw new AdapterError('ADAPTER_012: appWallets must be an array')
    }

    const cacheKey = this.getCacheKey(appWallets)
    
    if (this.adapterCache.has(cacheKey)) {
      const cachedAdapter = this.adapterCache.get(cacheKey)
      if (!cachedAdapter) {
        throw new AdapterCacheError('CACHE_001: Cached adapter is null or undefined')
      }
      this.currentAdapter = cachedAdapter
      this.currentWallets = [...appWallets]
      return cachedAdapter
    }
    
    const adapter = this.createAdapter(appWallets)
    
    // Maintain cache size limit and cleanup old adapters
    if (this.adapterCache.size >= this.maxCacheSize) {
      const firstKey = Array.from(this.adapterCache.keys())[0]
      if (firstKey) {
        const oldAdapter = this.adapterCache.get(firstKey)
        if (oldAdapter && oldAdapter !== this.currentAdapter) {
          this.performAdapterCleanup(oldAdapter, firstKey)
        }
        this.adapterCache.delete(firstKey)
      }
    }
    
    this.adapterCache.set(cacheKey, adapter)
    return adapter
  }

  private performAdapterCleanup(adapter: WagmiAdapter, cacheKey: string): void {
    if (!adapter) {
      throw new AdapterCleanupError('CLEANUP_001: Cannot cleanup null or undefined adapter')
    }
    if (!cacheKey) {
      throw new AdapterCleanupError('CLEANUP_002: Cannot cleanup adapter without cache key')
    }

    try {
      // Mark adapter as obsolete - explicit cleanup approach
      // Since WagmiAdapter doesn't expose direct cleanup methods, 
      // we rely on proper reference management and garbage collection
      
      // Verify the adapter is not currently active
      if (adapter === this.currentAdapter) {
        throw new AdapterCleanupError(`CLEANUP_003: Cannot cleanup currently active adapter for key: ${cacheKey}`)
      }

      
      // The adapter will be removed from cache by caller
      // Memory cleanup will be handled by garbage collection
      
    } catch (error) {
      throw new AdapterCleanupError(`CLEANUP_004: Failed to cleanup adapter for key ${cacheKey}`, error)
    }
  }

  private getCacheKey(wallets: AppWallet[]): string {
    if (!Array.isArray(wallets)) {
      throw new AdapterError('ADAPTER_013: Cannot generate cache key: wallets must be an array')
    }

    const addresses = wallets.map(w => {
      if (!w?.address) {
        throw new AdapterError('ADAPTER_014: Cannot generate cache key: invalid wallet object')
      }
      return w.address
    })

    if (addresses.length === 0) {
      return 'empty-wallets'
    }

    const sortedAddresses = addresses.toSorted((a, b) => a.localeCompare(b))
    return sortedAddresses.join(',')
  }

  getCurrentAdapter(): WagmiAdapter | null {
    return this.currentAdapter
  }

  getConnectionState(walletAddress: string): ConnectionState {
    if (!walletAddress) {
      throw new AdapterError('ADAPTER_015: walletAddress is required')
    }
    if (typeof walletAddress !== 'string') {
      throw new AdapterError('ADAPTER_016: walletAddress must be a string')
    }

    const state = this.connectionStates.get(walletAddress)
    return state || 'disconnected'
  }

  setConnectionState(walletAddress: string, state: ConnectionState): void {
    if (!walletAddress) {
      throw new AdapterError('ADAPTER_017: walletAddress is required')
    }
    if (typeof walletAddress !== 'string') {
      throw new AdapterError('ADAPTER_018: walletAddress must be a string')
    }
    if (!state) {
      throw new AdapterError('ADAPTER_019: state is required')
    }
    if (!['connecting', 'connected', 'disconnected'].includes(state)) {
      throw new AdapterError(`ADAPTER_020: Invalid state: ${state}. Must be 'connecting', 'connected', or 'disconnected'`)
    }

    this.connectionStates.set(walletAddress, state)
  }

  cleanup(): void {
    try {
      // Clear current adapter reference
      this.currentAdapter = null
      this.currentWallets = []

      // Clear connection states
      this.connectionStates.clear()

      // Perform cleanup on all cached adapters
      const cacheEntries = Array.from(this.adapterCache.entries())
      const cleanupErrors: Array<{ key: string; error: unknown }> = []

      for (const [key, adapter] of cacheEntries) {
        try {
          this.performAdapterCleanup(adapter, key)
        } catch (error) {
          cleanupErrors.push({ key, error })
        }
      }

      // Clear the cache
      this.adapterCache.clear()

      // If any cleanup operations failed, throw an error with details
      if (cleanupErrors.length > 0) {
        const errorMessages = cleanupErrors.map(({ key, error }) => 
          `Key: ${key}, Error: ${error instanceof Error ? error.message : String(error)}`
        )
        throw new AdapterCleanupError(
          `CLEANUP_005: Failed to cleanup ${cleanupErrors.length} adapter(s): ${errorMessages.join('; ')}`
        )
      }

    } catch (error) {
      if (error instanceof AdapterCleanupError) {
        throw error
      }
      throw new AdapterCleanupError('CLEANUP_006: Unexpected error during cleanup', error)
    }
  }
}