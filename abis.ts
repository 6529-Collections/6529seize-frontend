export const DELEGATION_ABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      {
        indexed: true,
        internalType: "address",
        name: "collectionAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "delegationAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "useCase",
        type: "uint256",
      },
      { indexed: false, internalType: "bool", name: "allTokens", type: "bool" },
      {
        indexed: false,
        internalType: "uint256",
        name: "_tokenId",
        type: "uint256",
      },
    ],
    name: "RegisterDelegation",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "delegator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "collectionAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "delegationAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "useCase",
        type: "uint256",
      },
      { indexed: false, internalType: "bool", name: "allTokens", type: "bool" },
      {
        indexed: false,
        internalType: "uint256",
        name: "_tokenId",
        type: "uint256",
      },
    ],
    name: "RegisterDelegationUsingSubDelegation",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      {
        indexed: true,
        internalType: "address",
        name: "collectionAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "delegationAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "useCase",
        type: "uint256",
      },
    ],
    name: "RevokeDelegation",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "delegator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "collectionAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "delegationAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "useCase",
        type: "uint256",
      },
    ],
    name: "RevokeDelegationUsingSubDelegation",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      {
        indexed: true,
        internalType: "address",
        name: "collectionAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "olddelegationAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newdelegationAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "useCase",
        type: "uint256",
      },
      { indexed: false, internalType: "bool", name: "allTokens", type: "bool" },
      {
        indexed: false,
        internalType: "uint256",
        name: "_tokenId",
        type: "uint256",
      },
    ],
    name: "UpdateDelegation",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "_collectionAddresses",
        type: "address[]",
      },
      {
        internalType: "address[]",
        name: "_delegationAddresses",
        type: "address[]",
      },
      { internalType: "uint256[]", name: "_expiryDates", type: "uint256[]" },
      { internalType: "uint256[]", name: "_useCases", type: "uint256[]" },
      { internalType: "bool[]", name: "_allTokens", type: "bool[]" },
      { internalType: "uint256[]", name: "_tokenIds", type: "uint256[]" },
    ],
    name: "batchDelegations",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "_collectionAddresses",
        type: "address[]",
      },
      {
        internalType: "address[]",
        name: "_delegationAddresses",
        type: "address[]",
      },
      { internalType: "uint256[]", name: "_useCases", type: "uint256[]" },
    ],
    name: "batchRevocations",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_wallet1", type: "address" },
      { internalType: "address", name: "_wallet2", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
    ],
    name: "checkConsolidationStatus",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "collectionLock",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "collectionUsecaseLock",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "collectionsRegisteredPerDelAdd",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "collectionsRegisteredPerDelegator",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "", type: "bytes32" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "delegationAddressHashes",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "", type: "bytes32" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "delegatorHashes",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "", type: "bytes32" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "globalDelegationHashes",
    outputs: [
      { internalType: "address", name: "delegatorAddress", type: "address" },
      { internalType: "address", name: "delegationAddress", type: "address" },
      { internalType: "uint256", name: "registeredDate", type: "uint256" },
      { internalType: "uint256", name: "expiryDate", type: "uint256" },
      { internalType: "bool", name: "allTokens", type: "bool" },
      { internalType: "uint256", name: "tokens", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "globalLock",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "address", name: "_delegationAddress", type: "address" },
      { internalType: "uint256", name: "_expiryDate", type: "uint256" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
      { internalType: "bool", name: "_allTokens", type: "bool" },
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
    ],
    name: "registerDelegationAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegatorAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "address", name: "_delegationAddress", type: "address" },
      { internalType: "uint256", name: "_expiryDate", type: "uint256" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
      { internalType: "bool", name: "_allTokens", type: "bool" },
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
    ],
    name: "registerDelegationAddressUsingSubDelegation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegatorAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "uint256", name: "_date", type: "uint256" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveActiveDelegations",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegationAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "uint256", name: "_date", type: "uint256" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveActiveDelegators",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegationAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveActiveHistoryPerDelegationAddress",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegatorAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveActiveHistoryPerDelegator",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "address", name: "_delegationAddress", type: "address" },
    ],
    name: "retrieveCollectionLockStatus",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "address", name: "_delegationAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveCollectionUseCaseLockStatus",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "address", name: "_delegationAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveCollectionUseCaseLockStatusOneCall",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegationAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveDelegationAddressStatusOfDelegation",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegatorAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveDelegationAddresses",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegatorAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveDelegationAddressesTokensIDsandExpiredDates",
    outputs: [
      { internalType: "address[]", name: "", type: "address[]" },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
      { internalType: "bool[]", name: "", type: "bool[]" },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegatorAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveDelegatorStatusOfDelegation",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegationAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveDelegators",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegationAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveDelegatorsTokensIDsandExpiredDates",
    outputs: [
      { internalType: "address[]", name: "", type: "address[]" },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
      { internalType: "bool[]", name: "", type: "bool[]" },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegationAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveFullHistoryOfDelAddress",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegatorAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveFullHistoryOfDelegator",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegatorAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "address", name: "_delegationAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveGlobalHash",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegationAddress", type: "address" },
    ],
    name: "retrieveGlobalLockStatus",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegatorAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "address", name: "_delegationAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveGlobalStatusOfDelegation",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_walletAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveLocalHash",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegatorAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveMostRecentDelegation",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegationAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveMostRecentDelegator",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegatorAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "address", name: "_delegationAddress", type: "address" },
      { internalType: "uint256", name: "_date", type: "uint256" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveStatusOfActiveDelegator",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegatorAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "address", name: "_delegationAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "retrieveStatusOfMostRecentDelegation",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegatorAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "address", name: "_delegationAddress", type: "address" },
    ],
    name: "retrieveSubDelegationStatus",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegatorAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "address", name: "_delegationAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
    ],
    name: "retrieveTokenStatus",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "address", name: "_delegationAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "revokeDelegationAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_delegatorAddress", type: "address" },
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "address", name: "_delegationAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
    ],
    name: "revokeDelegationAddressUsingSubdelegation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "bool", name: "_status", type: "bool" },
    ],
    name: "setCollectionLock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_collectionAddress", type: "address" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
      { internalType: "bool", name: "_status", type: "bool" },
    ],
    name: "setCollectionUsecaseLock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bool", name: "_status", type: "bool" }],
    name: "setGlobalLock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_collectionAddress", type: "address" },
      {
        internalType: "address",
        name: "_olddelegationAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "_newdelegationAddress",
        type: "address",
      },
      { internalType: "uint256", name: "_expiryDate", type: "uint256" },
      { internalType: "uint256", name: "_useCase", type: "uint256" },
      { internalType: "bool", name: "_allTokens", type: "bool" },
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
    ],
    name: "updateDelegationAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "updateUseCaseCounter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "useCaseCounter",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

export const NEXTGEN_CORE_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_randomizerContract",
        type: "address",
      },
    ],
    name: "addRandomizer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "mintIndex",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_recipient",
        type: "address",
      },
      {
        internalType: "string",
        name: "_tokenData",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_saltfun_o",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
    ],
    name: "airDropTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_signature",
        type: "string",
      },
    ],
    name: "artistSignature",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_tokenId",
        type: "uint256",
      },
    ],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "mintIndex",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_burnCollectionID",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_mintCollectionID",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_saltfun_o",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "burner",
        type: "address",
      },
    ],
    name: "burnToMint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "_status",
        type: "bool",
      },
    ],
    name: "changeMetadataView",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_tokenId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "newData",
        type: "string",
      },
    ],
    name: "changeTokenData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_collectionName",
        type: "string",
      },
      {
        internalType: "string",
        name: "_collectionArtist",
        type: "string",
      },
      {
        internalType: "string",
        name: "_collectionDescription",
        type: "string",
      },
      {
        internalType: "string",
        name: "_collectionWebsite",
        type: "string",
      },
      {
        internalType: "string",
        name: "_collectionLicense",
        type: "string",
      },
      {
        internalType: "string",
        name: "_collectionBaseURI",
        type: "string",
      },
      {
        internalType: "string",
        name: "_collectionLibrary",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "_collectionDependencyScript",
        type: "bytes32",
      },
      {
        internalType: "string[]",
        name: "_collectionScript",
        type: "string[]",
      },
    ],
    name: "createCollection",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol",
        type: "string",
      },
      {
        internalType: "address",
        name: "_adminsContract",
        type: "address",
      },
      {
        internalType: "address",
        name: "_dependencyRegistry",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "numerator",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "denominator",
        type: "uint256",
      },
    ],
    name: "ERC2981InvalidDefaultRoyalty",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "ERC2981InvalidDefaultRoyaltyReceiver",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "numerator",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "denominator",
        type: "uint256",
      },
    ],
    name: "ERC2981InvalidTokenRoyalty",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "ERC2981InvalidTokenRoyaltyReceiver",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "approved",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
    ],
    name: "CollectionCreated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
    ],
    name: "freezeCollection",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "mintIndex",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_mintingAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "_mintTo",
        type: "address",
      },
      {
        internalType: "string",
        name: "_tokenData",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_saltfun_o",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "phase",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_collectionArtistAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_maxCollectionPurchases",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_collectionTotalSupply",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_setFinalSupplyTimeAfterMint",
        type: "uint256",
      },
    ],
    name: "setCollectionData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
    ],
    name: "setFinalSupply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_mintIndex",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "_hash",
        type: "bytes32",
      },
    ],
    name: "setTokenHash",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_newCollectionName",
        type: "string",
      },
      {
        internalType: "string",
        name: "_newCollectionArtist",
        type: "string",
      },
      {
        internalType: "string",
        name: "_newCollectionDescription",
        type: "string",
      },
      {
        internalType: "string",
        name: "_newCollectionWebsite",
        type: "string",
      },
      {
        internalType: "string",
        name: "_newCollectionLicense",
        type: "string",
      },
      {
        internalType: "string",
        name: "_newCollectionBaseURI",
        type: "string",
      },
      {
        internalType: "string",
        name: "_newCollectionLibrary",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "_newCollectionDependencyScript",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "_index",
        type: "uint256",
      },
      {
        internalType: "string[]",
        name: "_newCollectionScript",
        type: "string[]",
      },
    ],
    name: "updateCollectionInfo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "_opt",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "_newContract",
        type: "address",
      },
    ],
    name: "updateContracts",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[]",
        name: "_tokenId",
        type: "uint256[]",
      },
      {
        internalType: "string[]",
        name: "_images",
        type: "string[]",
      },
      {
        internalType: "string[]",
        name: "_attributes",
        type: "string[]",
      },
    ],
    name: "updateImagesAndAttributes",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "artistSigned",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "artistsSignatures",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "burnAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
    ],
    name: "collectionFreezeStatus",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getApproved",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "isApprovedForAll",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minterContract",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "newCollectionIndex",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "onchainMetadata",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ownerOf",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
    ],
    name: "retrieveArtistAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
    ],
    name: "retrieveCollectionAdditionalData",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
    ],
    name: "retrieveCollectionInfo",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
    ],
    name: "retrieveCollectionLibraryAndScript",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "retrieveGenerativeScript",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_tokenid",
        type: "uint256",
      },
    ],
    name: "retrieveTokenHash",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_tokenId",
        type: "uint256",
      },
    ],
    name: "retrievetokenImageAndAttributes",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_address",
        type: "address",
      },
    ],
    name: "retrieveTokensAirdroppedPerAddress",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_address",
        type: "address",
      },
    ],
    name: "retrieveTokensMintedALPerAddress",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_address",
        type: "address",
      },
    ],
    name: "retrieveTokensMintedPublicPerAddress",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
    ],
    name: "retrievewereDataAdded",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "salePrice",
        type: "uint256",
      },
    ],
    name: "royaltyInfo",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "tokenByIndex",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "tokenData",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
    ],
    name: "totalSupplyOfCollection",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
    ],
    name: "viewCirSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_tokenid",
        type: "uint256",
      },
    ],
    name: "viewColIDforTokenID",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
    ],
    name: "viewMaxAllowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
    ],
    name: "viewTokensIndexMax",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionID",
        type: "uint256",
      },
    ],
    name: "viewTokensIndexMin",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const NEXTGEN_MINTER_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_gencore", type: "address" },
      { internalType: "address", name: "_del", type: "address" },
      { internalType: "address", name: "_adminsContract", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "_add", type: "address" },
      { indexed: false, internalType: "bool", name: "status", type: "bool" },
      {
        indexed: true,
        internalType: "uint256",
        name: "funds",
        type: "uint256",
      },
    ],
    name: "Withdraw",
    type: "event",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
      { internalType: "bool", name: "_statusPrimary", type: "bool" },
      { internalType: "bool", name: "_statusSecondary", type: "bool" },
    ],
    name: "acceptAddressesAndPercentages",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address[]", name: "_recipients", type: "address[]" },
      { internalType: "string[]", name: "_tokenData", type: "string[]" },
      { internalType: "uint256[]", name: "_saltfun_o", type: "uint256[]" },
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
      { internalType: "uint256[]", name: "_numberOfTokens", type: "uint256[]" },
    ],
    name: "airDropTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "", type: "bytes32" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "burnExternalToMintCollections",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "burnOrSwapAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_erc721Collection", type: "address" },
      { internalType: "uint256", name: "_burnCollectionID", type: "uint256" },
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
      { internalType: "uint256", name: "_mintCollectionID", type: "uint256" },
      { internalType: "string", name: "_tokenData", type: "string" },
      { internalType: "bytes32[]", name: "merkleProof", type: "bytes32[]" },
      { internalType: "uint256", name: "_saltfun_o", type: "uint256" },
    ],
    name: "burnOrSwapExternalToMint",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_burnCollectionID", type: "uint256" },
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
      { internalType: "uint256", name: "_mintCollectionID", type: "uint256" },
      { internalType: "uint256", name: "_saltfun_o", type: "uint256" },
    ],
    name: "burnToMint",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "burnToMintCollections",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "collectionTotalAmount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "dmc",
    outputs: [
      {
        internalType: "contract IDelegationManagementContract",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "emergencyWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "excludeTokensCounter",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_option", type: "uint256" },
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
      { internalType: "uint256", name: "_excludeCounter", type: "uint256" },
    ],
    name: "excludeTokensOrResetLD",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "gencore",
    outputs: [
      { internalType: "contract INextGenCore", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_tokenId", type: "uint256" }],
    name: "getAuctionEndTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_tokenId", type: "uint256" }],
    name: "getAuctionStatus",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
    ],
    name: "getEndTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_collectionId", type: "uint256" },
    ],
    name: "getPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_burnCollectionID", type: "uint256" },
      { internalType: "uint256", name: "_mintCollectionID", type: "uint256" },
      { internalType: "bool", name: "_status", type: "bool" },
    ],
    name: "initializeBurn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_erc721Collection", type: "address" },
      { internalType: "uint256", name: "_burnCollectionID", type: "uint256" },
      { internalType: "uint256", name: "_mintCollectionID", type: "uint256" },
      { internalType: "uint256", name: "_tokmin", type: "uint256" },
      { internalType: "uint256", name: "_tokmax", type: "uint256" },
      { internalType: "address", name: "_burnOrSwapAddress", type: "address" },
      { internalType: "bool", name: "_status", type: "bool" },
    ],
    name: "initializeExternalBurnOrSwap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "isMinterContract",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "lastMintDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
      { internalType: "uint256", name: "_numberOfTokens", type: "uint256" },
      { internalType: "uint256", name: "_maxAllowance", type: "uint256" },
      { internalType: "string", name: "_tokenData", type: "string" },
      { internalType: "address", name: "_mintTo", type: "address" },
      { internalType: "bytes32[]", name: "merkleProof", type: "bytes32[]" },
      { internalType: "address", name: "_delegator", type: "address" },
      { internalType: "uint256", name: "_saltfun_o", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_recipient", type: "address" },
      { internalType: "string", name: "_tokenData", type: "string" },
      { internalType: "uint256", name: "_saltfun_o", type: "uint256" },
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
      { internalType: "uint256", name: "_auctionEndTime", type: "uint256" },
    ],
    name: "mintAndAuction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
      { internalType: "address", name: "_team1", type: "address" },
      { internalType: "address", name: "_team2", type: "address" },
      { internalType: "uint256", name: "_teamperc1", type: "uint256" },
      { internalType: "uint256", name: "_teamperc2", type: "uint256" },
    ],
    name: "payArtist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
      { internalType: "address", name: "_primaryAdd1", type: "address" },
      { internalType: "address", name: "_primaryAdd2", type: "address" },
      { internalType: "address", name: "_primaryAdd3", type: "address" },
      { internalType: "uint256", name: "_add1Percentage", type: "uint256" },
      { internalType: "uint256", name: "_add2Percentage", type: "uint256" },
      { internalType: "uint256", name: "_add3Percentage", type: "uint256" },
    ],
    name: "proposePrimaryAddressesAndPercentages",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
      { internalType: "address", name: "_secondaryAdd1", type: "address" },
      { internalType: "address", name: "_secondaryAdd2", type: "address" },
      { internalType: "address", name: "_secondaryAdd3", type: "address" },
      { internalType: "uint256", name: "_add1Percentage", type: "uint256" },
      { internalType: "uint256", name: "_add2Percentage", type: "uint256" },
      { internalType: "uint256", name: "_add3Percentage", type: "uint256" },
    ],
    name: "proposeSecondaryAddressesAndPercentages",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
    ],
    name: "retrieveCollectionMintingDetails",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint8", name: "", type: "uint8" },
      { internalType: "address", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
    ],
    name: "retrieveCollectionPhases",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "bytes32", name: "", type: "bytes32" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
    ],
    name: "retrievePrimaryAddressesAndPercentages",
    outputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "bool", name: "", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
    ],
    name: "retrievePrimarySplits",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
    ],
    name: "retrieveSecondaryAddressesAndPercentages",
    outputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "bool", name: "", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
    ],
    name: "retrieveSecondarySplits",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
      { internalType: "uint256", name: "_collectionMintCost", type: "uint256" },
      {
        internalType: "uint256",
        name: "_collectionEndMintCost",
        type: "uint256",
      },
      { internalType: "uint256", name: "_rate", type: "uint256" },
      { internalType: "uint256", name: "_timePeriod", type: "uint256" },
      { internalType: "uint8", name: "_salesOption", type: "uint8" },
      { internalType: "address", name: "_delAddress", type: "address" },
    ],
    name: "setCollectionCosts",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
      { internalType: "uint256", name: "_allowlistStartTime", type: "uint256" },
      { internalType: "uint256", name: "_allowlistEndTime", type: "uint256" },
      { internalType: "uint256", name: "_publicStartTime", type: "uint256" },
      { internalType: "uint256", name: "_publicEndTime", type: "uint256" },
      { internalType: "bytes32", name: "_merkleRoot", type: "bytes32" },
    ],
    name: "setCollectionPhases",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
      { internalType: "uint256", name: "_artistPrSplit", type: "uint256" },
      { internalType: "uint256", name: "_teamPrSplit", type: "uint256" },
      { internalType: "uint256", name: "_artistSecSplit", type: "uint256" },
      { internalType: "uint256", name: "_teamSecSplit", type: "uint256" },
    ],
    name: "setPrimaryAndSecondarySplits",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_newadminsContract", type: "address" },
    ],
    name: "updateAdminContract",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_gencore", type: "address" }],
    name: "updateCoreContract",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export const NEXTGEN_ADMIN_ABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "adminPermissions",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isAdminContract",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_admin", type: "address" },
      { internalType: "bool", name: "_status", type: "bool" },
    ],
    name: "registerAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_address", type: "address" },
      { internalType: "bytes4[]", name: "_selector", type: "bytes4[]" },
      { internalType: "bool", name: "_status", type: "bool" },
    ],
    name: "registerBatchFunctionAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
      { internalType: "address", name: "_address", type: "address" },
      { internalType: "bool", name: "_status", type: "bool" },
    ],
    name: "registerCollectionAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_address", type: "address" },
      { internalType: "bytes4", name: "_selector", type: "bytes4" },
      { internalType: "bool", name: "_status", type: "bool" },
    ],
    name: "registerFunctionAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_address", type: "address" },
      { internalType: "uint256", name: "_collectionID", type: "uint256" },
    ],
    name: "retrieveCollectionAdmin",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_address", type: "address" },
      { internalType: "bytes4", name: "_selector", type: "bytes4" },
    ],
    name: "retrieveFunctionAdmin",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_address", type: "address" }],
    name: "retrieveGlobalAdmin",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
