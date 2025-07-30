import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet } from 'viem/chains'
import { CW_PROJECT_ID } from '@/constants'
import { AppWallet } from '../app-wallets/AppWalletsContext'
import { 
  createAppWalletConnector,
  APP_WALLET_CONNECTOR_TYPE 
} from '@/wagmiConfig/wagmiAppWalletConnector'
import type { Config } from 'wagmi'

export class AppKitAdapterManager {
  private currentAdapter: WagmiAdapter | null = null
  private currentWallets: AppWallet[] = []
  private requestPassword: (address: string, addressHashed: string) => Promise<string>
  private adapterCache = new Map<string, WagmiAdapter>()
  private maxCacheSize = 5
  private connectionStates = new Map<string, 'connecting' | 'connected' | 'disconnected'>()

  constructor(requestPassword: (address: string, addressHashed: string) => Promise<string>) {
    this.requestPassword = requestPassword
  }

  createAdapter(appWallets: AppWallet[]): WagmiAdapter {
    const networks = [mainnet]

    // Create AppWallet connectors if any exist
    const appWalletConnectors = appWallets.map(wallet => 
      createAppWalletConnector(
        networks,
        { appWallet: wallet },
        () => this.requestPassword(wallet.address, wallet.address_hashed)
      )
    )

    // Create adapter with all connectors
    const wagmiAdapter = new WagmiAdapter({
      networks,
      projectId: CW_PROJECT_ID,
      ssr: true,
      connectors: appWalletConnectors
    })

    this.currentAdapter = wagmiAdapter
    this.currentWallets = [...appWallets]
    
    return wagmiAdapter
  }

  shouldRecreateAdapter(newWallets: AppWallet[]): boolean {
    if (!this.currentAdapter) return true
    if (newWallets.length !== this.currentWallets.length) return true
    
    const currentAddresses = new Set(this.currentWallets.map(w => w.address))
    const newAddresses = new Set(newWallets.map(w => w.address))
    
    for (const addr of Array.from(newAddresses)) {
      if (!currentAddresses.has(addr)) return true
    }
    
    for (const addr of Array.from(currentAddresses)) {
      if (!newAddresses.has(addr)) return true
    }
    
    return false
  }

  createAdapterWithCache(appWallets: AppWallet[]): WagmiAdapter {
    const cacheKey = this.getCacheKey(appWallets)
    
    if (this.adapterCache.has(cacheKey)) {
      const cachedAdapter = this.adapterCache.get(cacheKey)!
      this.currentAdapter = cachedAdapter
      this.currentWallets = [...appWallets]
      return cachedAdapter
    }
    
    const adapter = this.createAdapter(appWallets)
    
    // Maintain cache size limit
    if (this.adapterCache.size >= this.maxCacheSize) {
      const firstKey = Array.from(this.adapterCache.keys())[0]
      if (firstKey) {
        this.adapterCache.delete(firstKey)
      }
    }
    
    this.adapterCache.set(cacheKey, adapter)
    return adapter
  }

  private getCacheKey(wallets: AppWallet[]): string {
    return wallets.map(w => w.address).sort().join(',')
  }

  getCurrentAdapter(): WagmiAdapter | null {
    return this.currentAdapter
  }

  getConnectionState(walletAddress: string): string {
    return this.connectionStates.get(walletAddress) || 'disconnected'
  }

  setConnectionState(walletAddress: string, state: 'connecting' | 'connected' | 'disconnected'): void {
    this.connectionStates.set(walletAddress, state)
  }

  cleanup(): void {
    this.currentAdapter = null
    this.currentWallets = []
    this.adapterCache.clear()
    this.connectionStates.clear()
  }
}