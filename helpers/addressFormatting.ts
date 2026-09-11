export const isValidEthAddress = (address: string) =>
  /^0x[0-9a-fA-F]{40}$/.test(address);

export function formatAddress(address: string) {
  if (
    !address ||
    !isValidEthAddress(address) ||
    address.endsWith(".eth") ||
    address.includes(" ")
  ) {
    return address;
  }
  if (address.length > 11) {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  }
  return address;
}
