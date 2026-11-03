/**
 * Test vectors copied from 6529chain `design/` at commit af10fac.
 *
 * - P28 `canonical-encodings.md` appendix A (network, tags) and §7.10 (an
 *   illustrative VoteSet whose body is P28's, not P40's final schema).
 * - P40 `phase1-operation-schemas.md` §2.2 (domain), §3.2 (type hashes),
 *   §13 worked examples E1-E4, and the extra lines its generator
 *   `design/evidence/operation-vectors.py` prints (holder and decision IDs,
 *   body encodeType strings).
 *
 * Every value is the design's test data, not a deployed network, key or
 * decision. P40 publishes no worked example for SUBMISSION_CREATE,
 * WAVE_CREATE or COMPETITION_CREATE; for those only the type hash and the
 * encodeType string are published, and the tests add round trips and a
 * cross-check against viem rather than inventing digests.
 */
import type { Hex } from "viem";

export const NETWORK = {
  chainId: "6529-devnet-1",
  genesis: "0x142b99b0a73b278bc1fefb70e9eb7da7a2d8c0b695e70fca04799a067ca1212c",
  networkId: "0x53929f81f84ac199d1155e0cff0ae25cc43ca45d7434abdabf675c583f1c02b5",
  domainSeparator: "0x4427b1088ce2c047409473fac8231104b423a6d0cc591039710270c869d1d0b2",
} as const satisfies Record<string, string>;

export const TAGS: readonly (readonly [string, Hex])[] = [
  ["6529.MerkleNode.v1", "0x43332606081b0acd6a569fa4ba32297773ae067c609ddc4d24cad45c4d97fe94"],
  ["6529.TdhWalletLeaf.v1", "0x3ef30cf9989b2acc9dd89d0061d0f8395d5ee0dc2d6b7e3bf34e72cd691a9d7e"],
  ["6529.DecisionMessage.v1", "0x711e179936ff876fd0e97cdf7eaa37db530d64429790398044d5ecf13b333c35"],
  ["6529.RepCategory.v1", "0x36fe1b27e546bbbc041d621878e3ea6d881d2cd9634b09c6303e14820c97a16a"],
];

/** P28 §7.10. */
export const P28_VOTE_SET = {
  header: {
    ruleVersion: 1,
    principalPreimage: "example principal",
    keyId: `0x000000000000000000000000${"88".repeat(20)}` as Hex,
    nonce: 7n,
    notBefore: 1_800_000_000_000n,
    expiresAt: 1_800_003_600_000n,
    feeMode: 3,
    maxFee: 10n ** 18n,
    maxWork: 100_000n,
    tipPerRU: 10n ** 12n,
  },
  body: {
    decisionIdPreimage: "example decision",
    subjectIdPreimage: "example submission",
    amount: -1234n,
    priorBallotVersion: 3n,
  },
  encodeType:
    "VoteSet(TxHeader header,VoteSetBody body)TxHeader(uint32 ruleVersion,bytes32 principal,uint8 keyType,bytes32 keyId,bytes32 authRef,uint32 nonceLane,uint64 nonce,uint64 notBefore,uint64 expiresAt,uint64 ethRefNumber,bytes32 ethRefHash,uint8 feeMode,bytes32 sponsorRef,uint128 maxFee,uint64 maxWork,uint128 tipPerRU)VoteSetBody(bytes32 decisionId,bytes32 subjectId,int64 amount,uint64 priorBallotVersion)",
  domain: "0x4427b1088ce2c047409473fac8231104b423a6d0cc591039710270c869d1d0b2",
  headerHash: "0xf063504d469b74d9f62c4a6ec84f20315dfa482ec04ac000ac8f0a71aaa90079",
  payloadHash: "0xb8ab265766fc131c007f70b271cd01f8a75b5fbdfa7840e4d5afb84180867e2d",
  txId: "0x94d3601b9f090a13a462ad209b13829541421abf1523f6899aa52cff708d3721",
  headerCe: [
    "00000001",
    "e096c6f91d1590af9db3fb2aa23ecb1123e9433d7becf9f7bdb400c434bbbba5",
    "01",
    "0000000000000000000000008888888888888888888888888888888888888888",
    "00",
    "00000000",
    "0000000000000007",
    "000001a3185c5000",
    "000001a318933e80",
    "00",
    "03",
    "00",
    "00000000000000000de0b6b3a7640000",
    "00000000000186a0",
    "0000000000000000000000e8d4a51000",
  ].join(""),
} as const;

/** P40 §3.2 type hashes and the generator's encodeType of each body. */
export const P40_TYPES: Readonly<Record<string, { typeHash: Hex; bodyType: string }>> = {
  IdentityCreate: {
    typeHash: "0xffb2bd77f385fb8298b4b2d9f672ea87a616931438fbb1e2827ea302f29aa396",
    bodyType: "IdentityCreateBody(bytes16 legacyId,string handle,bytes profileDocCid)",
  },
  CapabilityGrant: {
    typeHash: "0x38f9258be576af63265dc6ca0c8b74859fb5bcbadb86b8421b45a4aefc089286",
    bodyType:
      "CapabilityGrantBody(uint8 granteeKind,bytes32 grantee,uint8 granteeKeyType,bytes granteePublicKey,uint16[] ops,uint16 flags,Scope[] scopes,BudgetLimit[] budgets,uint64 notBefore,uint64 expiresAt,uint8 acceptMode)BudgetLimit(uint8 kind,bytes32 assetId,uint128 limit)Scope(uint16 objectKind,bytes32 objectId)",
  },
  WaveCreate: {
    typeHash: "0x024c734377322d921afa83b6817cfe76f53e17ec83382bf2a212ab03b157327f",
    bodyType:
      "WaveCreateBody(uint8 waveType,bytes32 controller,GroupRef readGroup,GroupRef postGroup,GroupRef adminGroup,bytes metadataCid)GroupRef(bytes32 groupId,uint32 version)",
  },
  SubmissionCreate: {
    typeHash: "0xabb7b578203c0c451393944dd49c4fea9fb3a0643b722583364a8a82491ef727",
    bodyType:
      "SubmissionCreateBody(bytes32 competitionId,uint32 expectedConfigVersion,bytes32 manifestHash,bytes contentCid)",
  },
  VoteSet: {
    typeHash: "0x06c989bf0741d64a711743966e6219f885dee38f8b6dcba216d32d2ac9ecb688",
    bodyType:
      "VoteSetBody(bytes32 competitionId,uint32 expectedConfigVersion,bytes32 entryId,int64 amount,uint64 priorVoteVersion,uint8 budgetScope)",
  },
  CompetitionCreate: {
    typeHash: "0xdd9432ddab8af959e2f4d3998d51e18c124e4050304b280fe3f55a74327410a7",
    bodyType:
      "CompetitionCreateBody(bytes32 waveId,uint32 expectedVersion,GroupRef submitGroup,GroupRef voteGroup,bytes metadataCid,CompetitionConfig competition)CompetitionConfig(uint8 kind,uint8 creditSource,bytes32 creditParam,bytes32 creditor,uint8 creditScope,uint8 creditMode,int64 minVote,int64 maxVote,uint64 perEntryCap,uint64 participationStart,uint64 participationEnd,uint64 votingStart,uint64 votingEnd,uint64 firstDecision,uint64[] gaps,bool rolling,uint64 scheduleEnd,uint64 timeLock,uint8 winnersPerDecision,uint8 maxEntriesPerAuthor,bytes32 outcomeTemplateHash)GroupRef(bytes32 groupId,uint32 version)",
  },
  RatingSet: {
    typeHash: "0x9abea4e9a9542a5944190645461e574cb09a3265d9bbd1cab0c4e818d0fd5dbe",
    bodyType:
      "RatingSetBody(uint8 matter,uint8 targetKind,bytes32 target,bytes32 category,string categoryName,int64 value,uint64 priorVersion)",
  },
};

/** P40 §13 inputs shared by the examples. */
export const WALLET_WORD: Hex = `0x000000000000000000000000${"11".repeat(20)}`;
/** RFC 8032 §7.1 TEST 1 public key, used by P40 as an Ed25519 session key. */
export const SESSION_PUB: Hex =
  "0xd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a";
export const NOT_BEFORE_MS = 1_800_000_000_000n;
export const EXPIRES_AT_MS = 1_800_003_600_000n;
export const DAY_MS = 86_400_000n;

export interface WorkedExample {
  readonly label: string;
  readonly typeHash: Hex;
  readonly headerHash: Hex;
  readonly payloadHash: Hex;
  readonly txId: Hex;
  readonly ceHeaderLength: number;
  readonly ceBody: Hex;
  readonly unsigned: Hex;
}

export const E1: WorkedExample & { principalId: Hex } = {
  label: "E1 IDENTITY_CREATE",
  typeHash: "0xffb2bd77f385fb8298b4b2d9f672ea87a616931438fbb1e2827ea302f29aa396",
  headerHash: "0x8f2992d4d08b81c25573602e91153f9d0d849a3c2ab067f062213a8238a4db04",
  payloadHash: "0xddd464a775ac54778ccb00ca9fd84dd61d57af56f673f6ed03695ab1f87cd54d",
  txId: "0x55394da459437f7f6ebe199ece6e03d8bf0d7f62bf982af4f808d067addf7662",
  principalId: "0x21724a4e681f9f33c84ff9d9cd000c8da3e5cb8c788be52a1d8c39ecef5b626d",
  ceHeaderLength: 141,
  ceBody:
    "0x00000000086578616d706c65310000002401551220c950c17bfb81c7a29f573884f936bd5c329ba182865bfb738786f08c8ebaf0f0",
  unsigned:
    "0x4001000153929f81f84ac199d1155e0cff0ae25cc43ca45d7434abdabf675c583f1c02b500000001000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000111111111111111111111111111111111111111100000000000000000000000000000001a3185c5000000001a318933e8000000000000000000000000000000000000000000000000000ea60000000000000000000000000000000000101000100000000086578616d706c65310000002401551220c950c17bfb81c7a29f573884f936bd5c329ba182865bfb738786f08c8ebaf0f0",
};

export const E2: WorkedExample & { grantId: Hex; sessionKeyId: Hex } = {
  label: "E2 CAPABILITY_GRANT",
  typeHash: "0x38f9258be576af63265dc6ca0c8b74859fb5bcbadb86b8421b45a4aefc089286",
  headerHash: "0x1dd5d15d11ad6e340c99e4f425713a5e5daa6ab8a938189840e3a4689e6b678d",
  payloadHash: "0x852475ed2937be05cc4bfa868ca6ad99db827aa991d178f5bb0553b752c53b8a",
  txId: "0xe27dcd0d57a20ef9533b90264537351543b3d937b6b830aa03283da9fd768ffc",
  grantId: "0x96a33983c6ec145d1f014e5436159a8224c0c74d828c69a035837a68c6b5ab9b",
  sessionKeyId: "0x2a5dd5dcdeb155ddb00d6e9ec5392e2bf843cf1835930f78213e977c2ccfe03e",
  ceHeaderLength: 141,
  ceBody:
    "0x012a5dd5dcdeb155ddb00d6e9ec5392e2bf843cf1835930f78213e977c2ccfe03e0200000020d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a0000000306040606070100000000000000000001040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004c4b400000000000000000000001a3b2db180001",
  unsigned:
    "0x4001000153929f81f84ac199d1155e0cff0ae25cc43ca45d7434abdabf675c583f1c02b50000000121724a4e681f9f33c84ff9d9cd000c8da3e5cb8c788be52a1d8c39ecef5b626d01000000000000000000000000111111111111111111111111111111111111111100000000000000000000000000000001a3185c5000000001a318933e8000000000000000000000000000000000000000000000000000ea600000000000000000000000000000000003010001012a5dd5dcdeb155ddb00d6e9ec5392e2bf843cf1835930f78213e977c2ccfe03e0200000020d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a0000000306040606070100000000000000000001040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004c4b400000000000000000000001a3b2db180001",
};

export const E3: WorkedExample & { waveId: Hex; competitionId: Hex } = {
  label: "E3 VOTE_SET",
  typeHash: "0x06c989bf0741d64a711743966e6219f885dee38f8b6dcba216d32d2ac9ecb688",
  headerHash: "0x4723b93b9d1f62608f0a59ba8779a9f991173e8fbbd25c42930fcbe8baf1aaa9",
  payloadHash: "0x99024c0515448dee923545d44afcac549711bb5306cb1ea9830d669992829d05",
  txId: "0x570fdda843d9470b96ca1c6816e5ef571705fc0722215dc35874439f4df1721f",
  waveId: "0x982d86c5fcdbe8374406d7a88e50b35b8d39f42167ac31eef8a783427a058d35",
  competitionId: "0x5b7094b86baba5bf5ee2423289410a82c322681e6de97660612061993436cb00",
  ceHeaderLength: 173,
  ceBody:
    "0x5b7094b86baba5bf5ee2423289410a82c322681e6de97660612061993436cb0000000001242dc8ed1a01605c10a0a663c2a96cd5aa6fb1bb2b96e287e796bcf87c0fae6e00000000000000fa000000000000000001",
  unsigned:
    "0x4001000153929f81f84ac199d1155e0cff0ae25cc43ca45d7434abdabf675c583f1c02b50000000121724a4e681f9f33c84ff9d9cd000c8da3e5cb8c788be52a1d8c39ecef5b626d022a5dd5dcdeb155ddb00d6e9ec5392e2bf843cf1835930f78213e977c2ccfe03e0196a33983c6ec145d1f014e5436159a8224c0c74d828c69a035837a68c6b5ab9b000000000000000000000000000001a3185c5000000001a318933e800000000000000000000000000000000000000000000000002dc6c000000000000000000000000000000000060600015b7094b86baba5bf5ee2423289410a82c322681e6de97660612061993436cb0000000001242dc8ed1a01605c10a0a663c2a96cd5aa6fb1bb2b96e287e796bcf87c0fae6e00000000000000fa000000000000000001",
};

export const E4: WorkedExample & { categoryId: Hex } = {
  label: "E4 RATING_SET",
  typeHash: "0x9abea4e9a9542a5944190645461e574cb09a3265d9bbd1cab0c4e818d0fd5dbe",
  headerHash: "0x842bbc30e46a8586d52b86f9290c999d49cff164614313c981bfe0067743c26f",
  payloadHash: "0x319fca1785cd3337015075b5bc40ad7376f25e0bd31e12ecc31c9c91a3c705f7",
  txId: "0x309d1cd8d74aca89fae8825dfd9769fdf7c61564ff5a508805ab41c0c7392729",
  categoryId: "0x09eb565c3dd1c29ff154ff51b495dfe2ce7b8b71ba54f1a41f085849b9981d10",
  ceHeaderLength: 173,
  ceBody:
    "0x01018ed4b798efd665fa0462869b30698ed2625a3a6ad531a23b8af540938feb18d009eb565c3dd1c29ff154ff51b495dfe2ce7b8b71ba54f1a41f085849b9981d10000000104578616d706c652043617465676f727900000000000001f40000000000000000",
  unsigned:
    "0x4001000153929f81f84ac199d1155e0cff0ae25cc43ca45d7434abdabf675c583f1c02b50000000121724a4e681f9f33c84ff9d9cd000c8da3e5cb8c788be52a1d8c39ecef5b626d022a5dd5dcdeb155ddb00d6e9ec5392e2bf843cf1835930f78213e977c2ccfe03e0196a33983c6ec145d1f014e5436159a8224c0c74d828c69a035837a68c6b5ab9b000000010000000000000000000001a3185c5000000001a318933e80000000000000000000000000000000000000000000000000030d40000000000000000000000000000000000701000101018ed4b798efd665fa0462869b30698ed2625a3a6ad531a23b8af540938feb18d009eb565c3dd1c29ff154ff51b495dfe2ce7b8b71ba54f1a41f085849b9981d10000000104578616d706c652043617465676f727900000000000001f40000000000000000",
};

/** Generator lines: P31 2.4 holder and P31 0x060A decision IDs. */
export const DERIVED = {
  decisionTimeMs: 1_743_436_800_000n,
  decisionId: "0x43e434b51db7b31c0018cd7c76d37dc2e3b8e384270bd583d6689b65a5694732",
  asset6529: "0x34c978fe5753ff0a2194f725a939ac51d19e0f2af73cdb90364101112175396d",
} as const satisfies Record<string, Hex | bigint>;
