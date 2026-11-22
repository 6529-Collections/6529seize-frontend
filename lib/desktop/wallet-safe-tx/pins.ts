/**
 * Safe transactions for 6529 Desktop: the pinned Safes and the SafeTx
 * schema (data only; 6529 Desktop keeps the same table).
 *
 * A Safe transaction is signed only for a pinned (chain, Safe) whose
 * pinned registries it owns: the domain must be exactly that Safe's, and
 * every call must go to one of its registries. Safe v1.4.1 typed data:
 * domain `{chainId, verifyingContract}`, primary type `SafeTx`.
 */

const SEPOLIA = 11_155_111;

export interface SafeTxRegistryPin {
  /** Lower-case registry address. */
  readonly address: string;
  /** Which registry it is (an i18n key suffix). */
  readonly name: "provenanceTest" | "museumCatalog";
}

export interface SafeTxPin {
  readonly chainId: number;
  /** The Safe's EIP-55 address, exactly as the domain must carry it. */
  readonly safe: string;
  /** Lower-case MultiSendCallOnly v1.4.1 on this chain (batches). */
  readonly multiSendCallOnly: string;
  readonly registries: readonly SafeTxRegistryPin[];
}

/**
 * Sepolia: the 2-of-3 test Safe (v1.4.1) and the two registries it owns
 * (6529-provenance tag v1.0.0-rc.1, `docs/deployments.md`). No registry
 * is deployed on mainnet.
 */
export const SAFE_TX_PINS: readonly SafeTxPin[] = [
  {
    chainId: SEPOLIA,
    safe: "0x87BD1Be4FbDEf9251C318b4870542217AA2AdB68",
    multiSendCallOnly: "0x9641d764fc13c8b624c04430c7356c1c7c8102e2",
    registries: [
      {
        address: "0x0e289576c7565d29018134517309668946ffc912",
        name: "provenanceTest",
      },
      {
        address: "0xee91c45a1893fbb45ce8eea170ef05d8d85bb850",
        name: "museumCatalog",
      },
    ],
  },
];

/** The SafeTx struct (Safe >= 1.3.0), in order. */
export const SAFE_TX_FIELDS = [
  { name: "to", type: "address" },
  { name: "value", type: "uint256" },
  { name: "data", type: "bytes" },
  { name: "operation", type: "uint8" },
  { name: "safeTxGas", type: "uint256" },
  { name: "baseGas", type: "uint256" },
  { name: "gasPrice", type: "uint256" },
  { name: "gasToken", type: "address" },
  { name: "refundReceiver", type: "address" },
  { name: "nonce", type: "uint256" },
] as const;

/** Inner calls one MultiSend batch carries. */
export const SAFE_TX_BATCH = { min: 2, max: 16 } as const;
