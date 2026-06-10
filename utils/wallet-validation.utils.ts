import type { AppWallet } from "@/components/app-wallets/AppWalletsContext";
import { isAppWalletEncryptedEnvelope } from "@/components/app-wallets/app-wallet-helpers";
import {
  WalletValidationError,
  WalletSecurityError,
} from "@/src/errors/wallet-validation";

const ETHEREUM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;
const APP_WALLET_MNEMONIC_UNAVAILABLE = "N/A";
const HEX_PATTERN = /^[0-9a-f]+$/i;
const MIN_LEGACY_IV_BYTES = 12;
const MAX_LEGACY_IV_BYTES = 16;
const LEGACY_AUTH_TAG_BYTES = 16;

const isHexByteString = (value: string): boolean =>
  value.length > 0 && value.length % 2 === 0 && HEX_PATTERN.test(value);

const isLegacyEncryptedSecret = (value: string): boolean => {
  const [ivHex, authTagHex, encryptedHex, ...extraParts] = value.split(":");

  if (
    extraParts.length > 0 ||
    !ivHex ||
    !authTagHex ||
    !encryptedHex ||
    !isHexByteString(ivHex) ||
    !isHexByteString(authTagHex) ||
    !isHexByteString(encryptedHex)
  ) {
    return false;
  }

  const ivBytes = ivHex.length / 2;
  const authTagBytes = authTagHex.length / 2;
  const encryptedBytes = encryptedHex.length / 2;

  return (
    ivBytes >= MIN_LEGACY_IV_BYTES &&
    ivBytes <= MAX_LEGACY_IV_BYTES &&
    authTagBytes === LEGACY_AUTH_TAG_BYTES &&
    encryptedBytes > 0
  );
};

const validateWalletExists = (wallet: AppWallet): void => {
  if (!wallet) {
    throw new WalletValidationError(
      "Wallet object is null or undefined - cannot process"
    );
  }
};

const validateWalletAddress = (wallet: AppWallet): void => {
  if (!wallet.address) {
    throw new WalletValidationError("Wallet missing required address field");
  }

  if (typeof wallet.address !== "string") {
    throw new WalletValidationError("Wallet address must be a string");
  }

  if (!wallet.address.match(ETHEREUM_ADDRESS_PATTERN)) {
    throw new WalletValidationError(
      "Wallet address has invalid Ethereum format"
    );
  }
};

const validateWalletAddressHash = (wallet: AppWallet): void => {
  if (!wallet.address_hashed) {
    throw new WalletValidationError(
      "Wallet missing required address_hashed field"
    );
  }

  if (typeof wallet.address_hashed !== "string") {
    throw new WalletValidationError("Wallet address_hashed must be a string");
  }

  if (wallet.encryption_version === 2) {
    if (!isAppWalletEncryptedEnvelope(wallet.address_hashed)) {
      throw new WalletValidationError(
        "Wallet address_hashed envelope is invalid"
      );
    }
    return;
  }

  if (!isLegacyEncryptedSecret(wallet.address_hashed)) {
    throw new WalletValidationError(
      "Wallet address_hashed legacy encrypted payload is invalid"
    );
  }
};

const validateWalletName = (wallet: AppWallet): void => {
  if (!wallet.name) {
    throw new WalletValidationError("Wallet missing required name field");
  }

  if (typeof wallet.name !== "string") {
    throw new WalletValidationError("Wallet name must be a string");
  }

  if (
    wallet.name.length < MIN_NAME_LENGTH ||
    wallet.name.length > MAX_NAME_LENGTH
  ) {
    throw new WalletValidationError(
      "Wallet name length must be between 1 and 100 characters"
    );
  }
};

const validatePrivateKey = (wallet: AppWallet): void => {
  if (!wallet.private_key) {
    throw new WalletSecurityError("Private key is required");
  }

  if (typeof wallet.private_key !== "string") {
    throw new WalletSecurityError("Private key must be a string");
  }

  if (wallet.encryption_version === 2) {
    if (!isAppWalletEncryptedEnvelope(wallet.private_key)) {
      throw new WalletSecurityError("Private key envelope is invalid");
    }
    return;
  }

  if (!isLegacyEncryptedSecret(wallet.private_key)) {
    throw new WalletSecurityError(
      "Private key legacy encrypted payload is invalid"
    );
  }
};

const validateMnemonic = (wallet: AppWallet): void => {
  if (!wallet.mnemonic) {
    if (wallet.has_mnemonic === true) {
      throw new WalletSecurityError("Mnemonic encrypted payload is required");
    }
    return;
  }

  if (typeof wallet.mnemonic !== "string") {
    throw new WalletSecurityError("Mnemonic must be a string");
  }

  if (wallet.encryption_version === 2) {
    if (!isAppWalletEncryptedEnvelope(wallet.mnemonic)) {
      throw new WalletSecurityError("Mnemonic envelope is invalid");
    }
    return;
  }

  if (
    wallet.has_mnemonic === false ||
    wallet.mnemonic === APP_WALLET_MNEMONIC_UNAVAILABLE
  ) {
    return;
  }

  if (isLegacyEncryptedSecret(wallet.mnemonic)) {
    return;
  }

  throw new WalletSecurityError("Mnemonic must be stored encrypted");
};

export function validateWalletSafely(wallet: AppWallet): void {
  validateWalletExists(wallet);
  validateWalletAddress(wallet);
  validateWalletAddressHash(wallet);
  validateWalletName(wallet);
  validatePrivateKey(wallet);
  validateMnemonic(wallet);
}
