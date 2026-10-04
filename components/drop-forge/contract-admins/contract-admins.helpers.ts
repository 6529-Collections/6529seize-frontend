import { getAddress, isAddress, zeroAddress, type Address } from "viem";

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
  admins: readonly Address[]
): string | null {
  if (!isAddress(address))
    return "Enter a valid wallet address or a resolvable ENS name.";
  if (address.toLowerCase() === zeroAddress)
    return "The zero address cannot be an admin.";
  if (owner?.toLowerCase() === address.toLowerCase())
    return "This wallet is already the owner.";
  if (admins.some((admin) => admin.toLowerCase() === address.toLowerCase()))
    return "This wallet is already an admin.";
  return null;
}

export function getAdminValidationMessage(
  resolving: boolean,
  input: string,
  error: string | null,
  resolvedAddress: string
): string {
  if (resolving) return "Resolving ENS...";
  if (input && error) return error;
  if (resolvedAddress && !error) return getAddress(resolvedAddress);
  return "";
}
