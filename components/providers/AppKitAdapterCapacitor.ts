import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet } from 'viem/chains'
import { CW_PROJECT_ID } from '@/constants'
import { AppWallet } from '../app-wallets/AppWalletsContext'
import { 
  createAppWalletConnector,
  APP_WALLET_CONNECTOR_TYPE 
} from '@/wagmiConfig/wagmiAppWalletConnector'
import { walletConnect, coinbaseWallet, injected } from 'wagmi/connectors'

export class AppKitAdapterCapacitor {
  private currentAdapter: WagmiAdapter | null = null
  private currentWallets: AppWallet[] = []
  private requestPassword: (address: string, addressHashed: string) => Promise<string>

  constructor(requestPassword: (address: string, addressHashed: string) => Promise<string>) {
    this.requestPassword = requestPassword
  }

  createAdapter(appWallets: AppWallet[]): WagmiAdapter {
    const networks = [mainnet]

    // Create mobile-specific connectors
    const mobileConnectors = [
      // WalletConnect for mobile - no QR modal since we're in a mobile app
      walletConnect({
        projectId: CW_PROJECT_ID,
        metadata: {
          name: "6529.io",
          description: "6529.io",
          url: process.env.BASE_ENDPOINT!,
          icons: [
            "https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses_3.png",
          ],
        },
        showQrModal: false, // Critical for mobile - don't show QR modal
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
      ssr: false, // Mobile apps are not SSR
      connectors: allConnectors
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

  getCurrentAdapter(): WagmiAdapter | null {
    return this.currentAdapter
  }

  cleanup(): void {
    this.currentAdapter = null
    this.currentWallets = []
  }
}