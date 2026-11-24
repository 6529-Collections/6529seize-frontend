/**
 * The EIP-712 types of the operations this site signs, pinned here from the
 * chain's schema registry (chain-tx `schema.rs`, P40 and P61 1.14) so the
 * digest a wallet or session key signs never depends on types the gateway
 * sends. A draft whose txId is not the digest under these types is refused.
 */

type Field = readonly [name: string, type: string];

const TX_HEADER: readonly Field[] = [
  ["ruleVersion", "uint32"],
  ["principal", "bytes32"],
  ["keyType", "uint8"],
  ["keyId", "bytes32"],
  ["authRef", "bytes32"],
  ["nonceLane", "uint32"],
  ["nonce", "uint64"],
  ["notBefore", "uint64"],
  ["expiresAt", "uint64"],
  ["ethRefNumber", "uint64"],
  ["ethRefHash", "bytes32"],
  ["feeMode", "uint8"],
  ["sponsorRef", "bytes32"],
  ["maxFee", "uint128"],
  ["maxWork", "uint64"],
  ["tipPerRU", "uint128"],
];

const DELEGATION_KEY: readonly Field[] = [
  ["collection", "address"],
  ["delegate", "address"],
  ["useCase", "uint16"],
  ["allTokens", "uint8"],
  ["tokenId", "bytes32"],
];

/** Each operation's body; nested structs are listed in NESTED. */
const BODIES: Readonly<Record<string, readonly Field[]>> = {
  IdentityCreate: [
    ["legacyId", "bytes16"],
    ["handle", "string"],
    ["profileDocCid", "bytes"],
  ],
  ProfileReplace: [
    ["expectedVersion", "uint32"],
    ["docCid", "bytes"],
  ],
  HandleClaim: [
    ["handle", "string"],
    ["expectedCurrent", "string"],
  ],
  RatingSet: [
    ["matter", "uint8"],
    ["targetKind", "uint8"],
    ["target", "bytes32"],
    ["category", "bytes32"],
    ["categoryName", "string"],
    ["value", "int64"],
    ["priorVersion", "uint64"],
  ],
  CapabilityGrant: [
    ["granteeKind", "uint8"],
    ["grantee", "bytes32"],
    ["granteeKeyType", "uint8"],
    ["granteePublicKey", "bytes"],
    ["ops", "uint16[]"],
    ["flags", "uint16"],
    ["scopes", "Scope[]"],
    ["budgets", "BudgetLimit[]"],
    ["notBefore", "uint64"],
    ["expiresAt", "uint64"],
    ["acceptMode", "uint8"],
  ],
  CapabilityRevoke: [
    ["grantId", "bytes32"],
    ["expectedVersion", "uint32"],
    ["p2pSeqCutoff", "uint64"],
  ],
  IdentityJoin: [["wallet", "address"]],
  IdentityRemove: [["wallet", "address"]],
  DelegationSet: [...DELEGATION_KEY, ["expiry", "uint64"]],
  DelegationRevoke: [
    ["scope", "uint8"],
    ["holder", "bytes32"],
    ...DELEGATION_KEY,
  ],
  BalanceTransfer: [
    ["assetId", "bytes32"],
    ["amount", "uint128"],
    ["recipientKind", "uint8"],
    ["recipient", "bytes32"],
    ["memo", "bytes32"],
  ],
};

const NESTED: Readonly<Record<string, readonly Field[]>> = {
  Scope: [
    ["objectKind", "uint16"],
    ["objectId", "bytes32"],
  ],
  BudgetLimit: [
    ["kind", "uint8"],
    ["assetId", "bytes32"],
    ["limit", "uint128"],
  ],
};

export type PinnedTypes = Record<string, { name: string; type: string }[]>;

const members = (fields: readonly Field[]) =>
  fields.map(([name, type]) => ({ name, type }));

/** The pinned types for `primaryType`, or null for one this site doesn't sign. */
export function pinnedTypes(primaryType: string): PinnedTypes | null {
  const body = BODIES[primaryType];
  if (body === undefined) {
    return null;
  }
  const types: PinnedTypes = {
    [primaryType]: members([
      ["header", "TxHeader"],
      ["body", `${primaryType}Body`],
    ]),
    TxHeader: members(TX_HEADER),
    [`${primaryType}Body`]: members(body),
  };
  for (const [, type] of body) {
    const nested = NESTED[type.replace("[]", "")];
    if (nested !== undefined) {
      types[type.replace("[]", "")] = members(nested);
    }
  }
  return types;
}
