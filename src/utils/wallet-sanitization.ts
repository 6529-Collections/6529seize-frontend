import { AppWallet } from '@/components/app-wallets/AppWalletsContext'
import { WalletValidationError } from '@/src/errors/wallet-validation'

/**
 * List of sensitive field names that should never be logged
 * These fields may contain private keys, mnemonics, or other sensitive data
 */
const SENSITIVE_FIELDS = [
  'privateKey',
  'private_key',
  'mnemonic',
  'seed',
  'seedPhrase',
  'secret',
  'key',
  'password',
  'passphrase',
  'keystore',
  'encrypted',
  'signature',
  'signedMessage',
] as const

/**
 * Recursively removes sensitive fields from an object for safe logging
 * This prevents accidental exposure of private keys or other sensitive data in logs
 * 
 * @param obj - The object to sanitize
 * @param maxDepth - Maximum recursion depth to prevent infinite loops
 * @returns A sanitized copy of the object with sensitive fields replaced with '[REDACTED]'
 */
function sanitizeObject(obj: any, maxDepth: number = 3): any {
  if (maxDepth <= 0) {
    return '[MAX_DEPTH_REACHED]'
  }
  
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (typeof obj !== 'object') {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, maxDepth - 1))
  }
  
  const sanitized: any = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()
    
    // Check if this key contains sensitive information
    const isSensitive = SENSITIVE_FIELDS.some(sensitiveField => 
      lowerKey.includes(sensitiveField.toLowerCase())
    )
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, maxDepth - 1)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

/**
 * Sanitizes a wallet object for safe logging by removing all sensitive fields
 * This function ensures that private keys and other sensitive data are never exposed in logs
 * 
 * @param wallet - The wallet object to sanitize
 * @returns A safe representation of the wallet for logging
 */
export function sanitizeWalletForLogging(wallet: any): object {
  if (wallet === null || wallet === undefined) {
    return { status: 'null_or_undefined' }
  }
  
  try {
    const sanitized = sanitizeObject(wallet, 3)
    
    // Always include a marker that this has been sanitized
    return {
      ...sanitized,
      __sanitized: true,
      __sanitizedAt: new Date().toISOString()
    }
  } catch (error) {
    // If sanitization fails, return minimal safe info
    return {
      status: 'sanitization_failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      __sanitized: true,
      __sanitizedAt: new Date().toISOString()
    }
  }
}

/**
 * Validates an AppWallet object and throws secure errors without exposing sensitive data
 * This replaces unsafe JSON.stringify calls that could leak private keys
 * 
 * @param wallet - The wallet to validate
 * @param context - Additional context for error messages (e.g., 'during adapter creation')
 * @throws {WalletValidationError} If validation fails
 */
export function validateAppWallet(wallet: AppWallet, context: string = 'validation'): void {
  // Check if wallet exists
  if (!wallet) {
    throw new WalletValidationError(
      `Wallet is null or undefined during ${context}`
    )
  }
  
  // Check wallet address
  if (!wallet.address) {
    const safeWallet = sanitizeWalletForLogging(wallet)
    throw new WalletValidationError(
      `Wallet missing required 'address' field during ${context}. Wallet structure: ${JSON.stringify(safeWallet)}`
    )
  }
  
  if (typeof wallet.address !== 'string') {
    throw new WalletValidationError(
      `Wallet address must be a string during ${context}. Found type: ${typeof wallet.address}`
    )
  }
  
  if (wallet.address.trim() === '') {
    throw new WalletValidationError(
      `Wallet address cannot be empty during ${context}`
    )
  }
  
  // Validate address format (basic Ethereum address validation)
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet.address)) {
    throw new WalletValidationError(
      `Invalid Ethereum address format during ${context}. Address should be 42 characters starting with 0x`
    )
  }
  
  // Check for address_hashed if it exists
  if (wallet.address_hashed && typeof wallet.address_hashed !== 'string') {
    throw new WalletValidationError(
      `Wallet address_hashed must be a string when provided during ${context}. Found type: ${typeof wallet.address_hashed}`
    )
  }
  
  if (wallet.address_hashed && wallet.address_hashed.trim() === '') {
    throw new WalletValidationError(
      `Wallet address_hashed cannot be empty when provided during ${context}`
    )
  }
}

/**
 * Validates an array of AppWallet objects safely
 * 
 * @param wallets - Array of wallets to validate
 * @param context - Additional context for error messages
 * @throws {WalletValidationError} If any wallet is invalid
 */
export function validateAppWallets(wallets: AppWallet[], context: string = 'validation'): void {
  if (!Array.isArray(wallets)) {
    throw new WalletValidationError(
      `Expected array of wallets during ${context}, got ${typeof wallets}`
    )
  }
  
  if (wallets.length === 0) {
    throw new WalletValidationError(
      `No wallets provided during ${context}. At least one wallet is required`
    )
  }
  
  const addresses = new Set<string>()
  
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i]
    
    try {
      validateAppWallet(wallet, `${context} at index ${i}`)
    } catch (error) {
      if (error instanceof WalletValidationError) {
        throw error
      }
      throw new WalletValidationError(
        `Unexpected error validating wallet at index ${i} during ${context}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
    
    // Check for duplicate addresses
    if (addresses.has(wallet.address)) {
      throw new WalletValidationError(
        `Duplicate wallet address found during ${context} at index ${i}`
      )
    }
    addresses.add(wallet.address)
  }
}