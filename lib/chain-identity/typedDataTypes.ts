/**
 * The EIP-712 types of the operations this site signs, pinned here from the
 * chain's schema registry (chain-tx `schema.rs`, P40, P61 1.14 to 1.16) so the
 * digest a wallet or session key signs never depends on types the gateway
 * sends. A draft whose txId is not the digest under these types is refused.
 */

type Field = readonly [name: string, type: string];

// Rule version 7's bodies; an optional field is pinned as its inner type, as
// the registry names it (`Ty::eip712_name`).
const GROUP_REF = "GroupRef";
const HUB_GROUPS: readonly Field[] = [
  ["readGroup", GROUP_REF],
  ["postGroup", GROUP_REF],
  ["adminGroup", GROUP_REF],
];
const DECISION_GROUPS: readonly Field[] = [
  ["submitGroup", GROUP_REF],
  ["voteGroup", GROUP_REF],
];
const GROUP_DEFINITION: readonly Field[] = [
  ["defHash", "bytes32"],
  ["predicateMode", "uint8"],
  ["clauses", "Clause[]"],
  ["includes", "Member[]"],
  ["excludes", "Member[]"],
];

const WAVES_BODIES: Readonly<Record<string, readonly Field[]>> = {
  GroupCreate: [
    ["controller", "bytes32"],
    ["visibility", "uint8"],
    ...GROUP_DEFINITION,
  ],
  GroupReplace: [
    ["groupId", "bytes32"],
    ["expectedVersion", "uint32"],
    ["newController", "bytes32"],
    ...GROUP_DEFINITION,
  ],
  RoleGrant: [
    ["scopeId", "bytes32"],
    ["role", "uint8"],
    ["member", "bytes32"],
    ["expiresAt", "uint64"],
    ["expectedVersion", "uint32"],
  ],
  RoleRevoke: [
    ["scopeId", "bytes32"],
    ["role", "uint8"],
    ["member", "bytes32"],
    ["expectedVersion", "uint32"],
  ],
  WaveCreate: [
    ["waveType", "uint8"],
    ["controller", "bytes32"],
    ...HUB_GROUPS,
    ["metadataCid", "bytes"],
  ],
  WavePolicyReplace: [
    ["waveId", "bytes32"],
    ["expectedVersion", "uint32"],
    ["decisionId", "bytes32"],
    ["expectedConfigVersion", "uint32"],
    ["newController", "bytes32"],
    ...HUB_GROUPS,
    ...DECISION_GROUPS,
    ["metadataCid", "bytes"],
    ["decision", "DecisionConfig"],
  ],
  WaveClose: [
    ["waveId", "bytes32"],
    ["expectedVersion", "uint32"],
    ["disposition", "uint8"],
  ],
  ModerationDecide: [
    ["waveId", "bytes32"],
    ["policyVersion", "uint32"],
    ["action", "uint8"],
    ["subjects", "SubjectRef[]"],
    ["reasonHash", "bytes32"],
    ["until", "uint64"],
  ],
  WavePauseSet: [
    ["decisionId", "bytes32"],
    ["expectedConfigVersion", "uint32"],
    ["pauseId", "uint32"],
    ["expectedPauseVersion", "uint32"],
    ["start", "uint64"],
    ["end", "uint64"],
    ["reason", "uint16"],
  ],
  WavePauseRemove: [
    ["decisionId", "bytes32"],
    ["pauseId", "uint32"],
    ["expectedPauseVersion", "uint32"],
  ],
  DecisionOpen: [
    ["decisionId", "bytes32"],
    ["expectedConfigVersion", "uint32"],
    ["workCreditAU", "uint128"],
    ["workFundTokens", "uint128"],
  ],
  SubmissionCreate: [
    ["decisionId", "bytes32"],
    ["expectedConfigVersion", "uint32"],
    ["manifestHash", "bytes32"],
    ["contentCid", "bytes"],
  ],
  SubmissionWithdraw: [
    ["entryId", "bytes32"],
    ["expectedVersion", "uint32"],
  ],
  VoteSet: [
    ["decisionId", "bytes32"],
    ["expectedConfigVersion", "uint32"],
    ["entryId", "bytes32"],
    ["amount", "int64"],
    ["priorVoteVersion", "uint64"],
    ["budgetScope", "uint8"],
  ],
  PollCreate: [
    ["waveId", "bytes32"],
    ["optionsHash", "bytes32"],
    ["optionCount", "uint8"],
    ["maxChoices", "uint8"],
    ["closeTime", "uint64"],
    ["minTdh", "uint64"],
    ["onlyPosters", "bool"],
    ["snapshotDay", "uint32"],
  ],
  PollBallotSet: [
    ["pollId", "bytes32"],
    ["selection", "uint32"],
    ["priorVersion", "uint32"],
    ["wallet", "address"],
  ],
  DecisionCreate: [
    ["waveId", "bytes32"],
    ["expectedVersion", "uint32"],
    ...DECISION_GROUPS,
    ["metadataCid", "bytes"],
    ["decision", "DecisionConfig"],
  ],
  DecisionArchive: [
    ["decisionId", "bytes32"],
    ["expectedConfigVersion", "uint32"],
    ["disposition", "uint8"],
  ],
};

const WAVES_NESTED: Readonly<Record<string, readonly Field[]>> = {
  GroupRef: [
    ["groupId", "bytes32"],
    ["version", "uint32"],
  ],
  Member: [
    ["kind", "uint8"],
    ["value", "bytes32"],
  ],
  Clause: [
    ["metric", "uint8"],
    ["category", "bytes32"],
    ["rater", "bytes32"],
    ["min", "int64"],
    ["max", "int64"],
  ],
  SubjectRef: [
    ["subjectId", "bytes32"],
    ["version", "uint32"],
  ],
  DecisionConfig: [
    ["kind", "uint8"],
    ["creditSource", "uint8"],
    ["creditParam", "bytes32"],
    ["creditor", "bytes32"],
    ["creditScope", "uint8"],
    ["creditMode", "uint8"],
    ["minVote", "int64"],
    ["maxVote", "int64"],
    ["perEntryCap", "uint64"],
    ["participationStart", "uint64"],
    ["participationEnd", "uint64"],
    ["votingStart", "uint64"],
    ["votingEnd", "uint64"],
    ["firstResult", "uint64"],
    ["gaps", "uint64[]"],
    ["rolling", "bool"],
    ["scheduleEnd", "uint64"],
    ["timeLock", "uint64"],
    ["winnersPerResult", "uint8"],
    ["maxEntriesPerAuthor", "uint8"],
    ["outcomeTemplateHash", "bytes32"],
    ["ballots", "uint8"],
    ["threshold", "int64"],
    ["holdMs", "uint64"],
    ["maxWinners", "uint32"],
  ],
};

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
  // Rule version 7 (P61 1.15 and 1.16): groups, waves, decisions, entries,
  // votes and polls (lib/chain-waves).
  ...WAVES_BODIES,
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
  ...WAVES_NESTED,
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
