import {
  VALIDATOR_GRANT_PURPOSE,
  VALIDATOR_GRANT_TYPES,
  VALIDATOR_MAINNET_SALT,
} from "@/lib/validator-page/grant";

// Synthetic public data; no user's grant or wallet material.
export function grantFixture() {
  return {
    domain: {
      name: "6529 Validator",
      version: "1",
      salt: VALIDATOR_MAINNET_SALT,
    },
    types: Object.fromEntries(
      Object.entries(VALIDATOR_GRANT_TYPES).map(([name, fields]) => [
        name,
        fields.map((field) => ({ ...field })),
      ])
    ),
    primaryType: "ValidatorGrant",
    message: {
      purpose: VALIDATOR_GRANT_PURPOSE,
      account: "0x0000000000000000000000000000000000000001",
      authVersion: "2",
      refBlockNumber: "26354747",
      refBlockHash: `0x${"12".repeat(32)}`,
      keys: [{ pubkey: `0x${"ab".repeat(48)}`, share: "10000" }],
    },
  };
}
