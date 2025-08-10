import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet } from 'viem/chains'
import { CW_PROJECT_ID, VALIDATED_BASE_ENDPOINT } from '@/constants'
import { AppWallet } from '../app-wallets/AppWalletsContext'
import { 
  createAppWalletConnector 
} from '@/wagmiConfig/wagmiAppWalletConnector'
import { walletConnect, coinbaseWallet, injected, metaMask } from 'wagmi/connectors'
import { WalletConnectionError, ConnectionStateError } from '@/src/errors/wallet-connection'


export class AppKitAdapterCapacitor {
  private currentAdapter: WagmiAdapter | null = null
  private currentWallets: AppWallet[] = []
  private requestPassword: (address: string, addressHashed: string) => Promise<string>
  private connectionStates = new Map<string, 'connecting' | 'connected' | 'disconnected'>()

  constructor(requestPassword: (address: string, addressHashed: string) => Promise<string>) {
    if (!requestPassword) {
      throw new WalletConnectionError('requestPassword function is required but not provided')
    }
    if (typeof requestPassword !== 'function') {
      throw new WalletConnectionError('requestPassword must be a function')
    }
    this.requestPassword = requestPassword
  }

  private initializeWalletConnectionState(walletAddress: string): void {
    if (walletAddress === null || walletAddress === undefined) {
      throw new ConnectionStateError('Cannot initialize connection state: wallet address is required')
    }
    if (typeof walletAddress !== 'string') {
      throw new ConnectionStateError('Cannot initialize connection state: wallet address must be a string', walletAddress)
    }
    if (walletAddress.trim() === '') {
      throw new ConnectionStateError('Cannot initialize connection state: wallet address cannot be empty', walletAddress)
    }
    
    // Only initialize if not already present
    if (!this.connectionStates.has(walletAddress)) {
      this.connectionStates.set(walletAddress, 'disconnected')
    }
  }

  createAdapter(appWallets: AppWallet[]): WagmiAdapter {
    // Validate wallets FIRST before creating anything
    for (const wallet of appWallets) {
      if (!wallet?.address) {
        throw new WalletConnectionError(`Invalid wallet in appWallets: missing address. Wallet: ${JSON.stringify(wallet)}`)
      }
    }
    
    const networks = [mainnet]

    // Create mobile-specific connectors
    const mobileConnectors = [
      // MetaMask connector for mobile - critical for mobile MetaMask connections
      metaMask({
        dappMetadata: {
          name: "6529.io",
          url: VALIDATED_BASE_ENDPOINT,
        },
      }),
      // WalletConnect for mobile with improved deep linking
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
        showQrModal: false, // Critical for mobile - don't show QR modal
        qrModalOptions: {
          enableExplorer: true, // Enable wallet discovery for mobile
        },
      }),
      // Coinbase Wallet with mobile wallet link enabled
      coinbaseWallet({
        appName: "6529 CORE",
        appLogoUrl: "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png",
        enableMobileWalletLink: true, // Enable mobile deep linking
        version: "3",
      }),
      // Injected connector for browsers that have injected wallets
      injected(),
    ]

    // Create AppWallet connectors if any exist
    const appWalletConnectors = appWallets.map(wallet => 
      createAppWalletConnector(
        networks,
        { appWallet: wallet },
        () => this.requestPassword(wallet.address, wallet.address_hashed)
      )
    )

    // Combine all connectors
    const allConnectors = [...mobileConnectors, ...appWalletConnectors]

    // Create adapter with mobile-specific settings
    const wagmiAdapter = new WagmiAdapter({
      networks,
      projectId: CW_PROJECT_ID,
      ssr: false, // Mobile apps are not SSR and App Router needs this false
      connectors: allConnectors
    })

    // Only set state after everything succeeds
    this.currentAdapter = wagmiAdapter
    this.currentWallets = [...appWallets]
    
    // Initialize connection states for all wallets
    for (const wallet of appWallets) {
      this.initializeWalletConnectionState(wallet.address)
    }
    
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

  getCurrentAdapter(): WagmiAdapter | null {
    return this.currentAdapter
  }

  getConnectionState(walletAddress: string): 'connecting' | 'connected' | 'disconnected' {
    if (walletAddress === null || walletAddress === undefined) {
      throw new ConnectionStateError('Wallet address is required but not provided')
    }
    if (typeof walletAddress !== 'string') {
      throw new ConnectionStateError('Wallet address must be a string', walletAddress)
    }
    if (walletAddress.trim() === '') {
      throw new ConnectionStateError('Wallet address cannot be empty', walletAddress)
    }
    
    const state = this.connectionStates.get(walletAddress)
    if (state === undefined) {
      throw new ConnectionStateError(`No connection state found for wallet address: ${walletAddress}`, walletAddress)
    }
    
    return state
  }

  setConnectionState(walletAddress: string, state: 'connecting' | 'connected' | 'disconnected'): void {
    if (walletAddress === null || walletAddress === undefined) {
      throw new ConnectionStateError('Wallet address is required but not provided')
    }
    if (typeof walletAddress !== 'string') {
      throw new ConnectionStateError('Wallet address must be a string', walletAddress)
    }
    if (walletAddress.trim() === '') {
      throw new ConnectionStateError('Wallet address cannot be empty', walletAddress)
    }
    
    if (!state) {
      throw new ConnectionStateError('Connection state is required but not provided', walletAddress)
    }
    if (!['connecting', 'connected', 'disconnected'].includes(state)) {
      throw new ConnectionStateError(`Invalid connection state: ${state} for wallet ${walletAddress}. Must be 'connecting', 'connected', or 'disconnected'`, walletAddress, state)
    }
    
    const currentState = this.connectionStates.get(walletAddress)
    
    // Validate state transitions
    if (currentState) {
      if (currentState === 'connected' && state === 'connecting') {
        throw new ConnectionStateError(`Invalid state transition from '${currentState}' to '${state}' for wallet ${walletAddress}`, walletAddress, state)
      }
      if (currentState === 'disconnected' && state === 'connected') {
        throw new ConnectionStateError(`Invalid state transition from '${currentState}' to '${state}' for wallet ${walletAddress}. Must go through 'connecting' state first`, walletAddress, state)
      }
    }
    
    this.connectionStates.set(walletAddress, state)
  }

  cleanup(): void {
    this.currentAdapter = null
    this.currentWallets = []
    this.connectionStates.clear()
  }
}