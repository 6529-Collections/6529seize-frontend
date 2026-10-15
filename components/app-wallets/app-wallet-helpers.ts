import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const APP_WALLET_MIN_PASSPHRASE_LENGTH = 12;

export function getAppWalletNameError(
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  return t(locale, "appWallet.validation.name.alphanumericSpaces");
}

export function getAppWalletPassphraseWhitespaceError(
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  return t(locale, "appWallet.validation.password.noWhitespace");
}

export function getAppWalletPassphraseError(
  password: string,
  locale: SupportedLocale = DEFAULT_LOCALE
): string | null {
  if (password.length < APP_WALLET_MIN_PASSPHRASE_LENGTH) {
    return t(locale, "appWallet.validation.password.minLength", {
      count: formatInteger(locale, APP_WALLET_MIN_PASSPHRASE_LENGTH),
    });
  }

  if (/\s/.test(password)) {
    return getAppWalletPassphraseWhitespaceError(locale);
  }

  if (!/[a-z]/.test(password)) {
    return t(locale, "appWallet.validation.password.lowercase");
  }

  if (!/[A-Z]/.test(password)) {
    return t(locale, "appWallet.validation.password.uppercase");
  }

  if (!/\d/.test(password)) {
    return t(locale, "appWallet.validation.password.number");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return t(locale, "appWallet.validation.password.symbol");
  }

  return null;
}

// The cipher implementation pulls in the Node `crypto` polyfill, so it is
// loaded on first use instead of shipping with every route.
const loadAppWalletCrypto = () => import("./app-wallet-crypto");

export async function encryptData(
  _legacySalt: string,
  data: string,
  password: string
): Promise<string> {
  const { encryptAppWalletData } = await loadAppWalletCrypto();
  return encryptAppWalletData(data, password);
}

export async function decryptData(
  salt: string,
  encryptedData: string,
  password: string
): Promise<string> {
  const { decryptAppWalletData } = await loadAppWalletCrypto();
  return decryptAppWalletData(salt, encryptedData, password);
}
