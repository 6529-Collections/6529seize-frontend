import { AppWallet } from '@/components/app-wallets/AppWalletsContext'
import { WalletValidationError, WalletSecurityError } from '@/src/errors/wallet-validation'

// Constants for validation patterns
const ETHEREUM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/
const MIN_HASH_LENGTH = 64
const MIN_NAME_LENGTH = 1
const MAX_NAME_LENGTH = 100
const MIN_PRIVATE_KEY_LENGTH = 32
const MIN_MNEMONIC_WORDS = 12
const MAX_MNEMONIC_WORDS = 24

/**
 * Validates wallet object exists and is not null/undefined
 */
function validateWalletExists(wallet: AppWallet): void {
  if (!wallet) {
    throw new WalletValidationError('Wallet object is null or undefined - cannot process')
  }
}

/**
 * Validates wallet address field and format
 */
function validateWalletAddress(wallet: AppWallet): void {
  if (!wallet.address) {
    throw new WalletValidationError('Wallet missing required address field')
  }
  
  if (typeof wallet.address !== 'string') {
    throw new WalletValidationError('Wallet address must be a string')
  }
  
  if (!wallet.address.match(ETHEREUM_ADDRESS_PATTERN)) {
    throw new WalletValidationError('Wallet address has invalid Ethereum format')
  }
}

/**
 * Validates wallet address_hashed field
 */
function validateWalletAddressHash(wallet: AppWallet): void {
  if (!wallet.address_hashed) {
    throw new WalletValidationError('Wallet missing required address_hashed field')
  }
  
  if (typeof wallet.address_hashed !== 'string') {
    throw new WalletValidationError('Wallet address_hashed must be a string')
  }
  
  if (wallet.address_hashed.length < MIN_HASH_LENGTH) {
    throw new WalletValidationError('Wallet address_hashed too short - potential security issue')
  }
}

/**
 * Validates wallet name field
 */
function validateWalletName(wallet: AppWallet): void {
  if (!wallet.name) {
    throw new WalletValidationError('Wallet missing required name field')
  }
  
  if (typeof wallet.name !== 'string') {
    throw new WalletValidationError('Wallet name must be a string')
  }
  
  if (wallet.name.length < MIN_NAME_LENGTH || wallet.name.length > MAX_NAME_LENGTH) {
    throw new WalletValidationError('Wallet name length must be between 1 and 100 characters')
  }
}

/**
 * Validates private key if present
 */
function validatePrivateKey(wallet: AppWallet): void {
  if (!wallet.private_key) {
    return
  }
  
  if (typeof wallet.private_key !== 'string') {
    throw new WalletSecurityError('Private key must be a string')
  }
  
  if (wallet.private_key.length < MIN_PRIVATE_KEY_LENGTH) {
    throw new WalletSecurityError('Private key too short - security violation detected')
  }
}

/**
 * Validates mnemonic if present
 */
function validateMnemonic(wallet: AppWallet): void {
  if (!wallet.mnemonic) {
    return
  }
  
  if (typeof wallet.mnemonic !== 'string') {
    throw new WalletSecurityError('Mnemonic must be a string')
  }
  
  const words = wallet.mnemonic.trim().split(/\s+/)
 
  if (words.some(word => !word || word.length === 0)) {
    throw new WalletSecurityError('Mnemonic contains empty words - security violation detected')
  }
}

/**
 * Security validation: Fail-fast wallet validation without exposing sensitive data
 */
export function validateWalletSafely(wallet: AppWallet): void {
  validateWalletExists(wallet)
  validateWalletAddress(wallet)
  validateWalletAddressHash(wallet)
  validateWalletName(wallet)
  validatePrivateKey(wallet)
  validateMnemonic(wallet)
}

// Export individual validators for reuse in other parts of the application
export {
  validateWalletExists,
  validateWalletAddress,
  validateWalletAddressHash,
  validateWalletName,
  validatePrivateKey,
  validateMnemonic
}