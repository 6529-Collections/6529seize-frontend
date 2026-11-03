import {
  getAddress,
  isAddress,
  isAddressEqual,
  zeroAddress,
  type Address,
} from "viem";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export function getCreatorAdminRows(
  owner: Address,
  admins: readonly Address[]
) {
  const seen = new Set([owner.toLowerCase()]);
  const rows = [{ address: getAddress(owner), isOwner: true }];
  for (const address of admins) {
    if (!seen.has(address.toLowerCase())) {
      seen.add(address.toLowerCase());
      rows.push({ address: getAddress(address), isOwner: false });
    }
  }
  return rows;
}

export function getAdminAddressError(
  address: string,
  owner: Address | undefined,
  admins: readonly Address[],
  locale: SupportedLocale = DEFAULT_LOCALE
): string | null {
  if (!isAddress(address)) return t(locale, "dropForge.admins.invalidAddress");
  if (isAddressEqual(address, zeroAddress))
    return t(locale, "dropForge.admins.zeroAddress");
  if (owner?.toLowerCase() === address.toLowerCase())
    return t(locale, "dropForge.admins.existingOwner");
  if (admins.some((admin) => admin.toLowerCase() === address.toLowerCase()))
    return t(locale, "dropForge.admins.existingAdmin");
  return null;
}

export function getAdminValidationMessage(
  resolving: boolean,
  input: string,
  error: string | null,
  resolvedAddress: string,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  if (resolving) return t(locale, "dropForge.admins.resolving");
  if (input && error) return error;
  if (resolvedAddress && !error) return getAddress(resolvedAddress);
  return "";
}
