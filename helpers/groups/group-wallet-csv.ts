const ETHEREUM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const WALLET_DELIMITER_PATTERN = /[\s,;]+/;

export function parseGroupWalletCsv(content: string): string[] {
  const wallets = content
    .split(WALLET_DELIMITER_PATTERN)
    .map((value) =>
      value
        .trim()
        .replace(/^\uFEFF/, "")
        .replace(/^"(.*)"$/, "$1")
        .trim()
    )
    .filter((value) => ETHEREUM_ADDRESS_PATTERN.test(value))
    .map((value) => value.toLowerCase());

  return [...new Set(wallets)];
}
