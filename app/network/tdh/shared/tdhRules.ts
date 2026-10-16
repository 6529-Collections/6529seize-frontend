/**
 * Rule blocks from specification P26 after its fifth round of 16 October
 * 2026 (6529chain commit f840096, rule version `tdh-v1.0`). Pseudocode is quoted verbatim;
 * blocks named `..._CONDENSED` restate P26's prose rules line for line, with
 * the section or vector each line comes from. A `#` line names the step it
 * starts. Formulas, hashes and addresses are not translated. Updating them is
 * a deliberate content change reviewed against the new P26 text.
 */

export const RULE_CONVENTIONS = `a div b    floor division
HALFUP(x)  floor(x + 1/2), for rational x >= 0
B64(x)     the IEEE-754 binary64 value nearest to x, ties to even; B64(0) = 0
DAY        86400, the cycle length (§4.1); whole days use day_s (§4.3)
ZERO       0x0000000000000000000000000000000000000000
DEAD       0x000000000000000000000000000000000000dead
SINKS      the registry's sinks (§10), {ZERO, DEAD} in tdh-v1.0`;

/** P26 §3.1, its input rules line for line. */
export const RULE_LOG_SELECTION_CONDENSED = `input log: address in {memes, gradients, nextgen, delegation}
           and block <= B and block hash on the canonical chain ending at hash(B)
every input log exactly once, the logs §3.2 and §6.1 ignore included
logs in later blocks: neither decoded nor checked, beyond their field types
a log marked removed: true left the chain: not an input       # vector 67
removed must be a JSON boolean; anything else: invalid        # vector 69
no completeness proof for [deployment, B]: publish no result

invalid if two logs share one (block, logIndex)                   # vector 52
invalid if, in one block, a larger logIndex has a smaller txIndex  # vector 53
decoded inputs: items of different logs never share (block, logIndex);
                the positions of all delegation events count, kept or not
                                                                  # vectors 30, 51
transfers at one (block, logIndex) are one log's elements: they share its
    contract, from, to and txIndex; differing in any: invalid    # vectors 85-87
    their number and batchPos (distinct) are not otherwise checked
each log is given raw or decoded, never both: a decoded item at a raw
    log's (block, logIndex) is invalid, an ignored raw log included
                                                          # vectors 63, 72
the txIndex order counts raw and decoded logs together    # vector 64
checked before §6.1 filters events and before §7.1 nets transfers`;

/** P26 §3.2, the decoding rules line for line. */
export const RULE_DECODING_CONDENSED = `TransferSingle(operator, from, to, id, value), The Memes:
    topics [topic0, operator, from, to]; data = id || value, 64 bytes
    one transfer, batchPos = 0
TransferBatch(operator, from, to, ids, values), The Memes:
    data = 0x40 || 0x60 + 32n || n || ids || n || values, 128 + 64n bytes
    equal lengths; element k is one transfer with batchPos = k
Transfer(from, to, tokenId), Gradients or NextGen, exactly four topics:
    empty data; amount = 1; batchPos = 0

every address topic, operator included, has 12 zero high bytes
an amount of 2^64 or more is malformed, in a log and in a decoded transfer
    in a block <= B; after B a decoded transfer is no input, no effect
                                                                  # vector 76
a malformed log makes the input invalid; a node MUST NOT skip it
any other topic0 or topic count, anonymous logs included: ignored
timestamp = the header timestamp of the log's block
one transaction (block, txIndex): one timestamp and one txHash   # vectors 48, 49

types: block numbers, txIndex, logIndex, batchPos and timestamps are uint64,
       token ids, amounts and a delegation event's useCase uint256; a value
       outside its type is malformed wherever it is, a header timestamp no
       log reads included, and the input has no result
                                                    # vectors 71, 77, 78, 79

values written in JSON, one way each:
    an integer is a JSON number in canonical form: no fraction, no
        exponent, no -0, a minus sign only on a negative signed field
                                                                  # vector 80
    a string is never an integer, a token id included             # vector 81
    a key naming an integer is its canonical decimal: no sign, no leading
        zero, so two keys never name one value          # vectors 82, 84, 88
    any other form is outside its type: the input has no result
not JSON, a member named twice, a required field missing: no input
    document at all, refused whole before any value is read`;

export const RULE_ORDER =
  "order = ascending (block, txIndex, logIndex, batchPos)";

/** P26 §3.4, line for line. */
export const RULE_MINTS_CONDENSED = `mint: from = ZERO and to != ZERO      # ZERO -> ZERO is not a mint (vector 56)
burn: to in SINKS
sinks are credit-only: credited, never debited, never consolidated (§6.1)
a transfer from DEAD credits fresh timestamps and is not a mint
the FirstGM burn transaction is not credited to ZERO
burns do not reduce edition sizes`;

export const RULE_CUTOFF = `B = the block b on the finalized chain with ts(b) < M <= ts(b + 1)
T = ts(B)        M = N * 86400`;

/** P26 §4.1-§4.3: the cutoff verbatim, then its header-order rule. */
export const RULE_CUTOFF_SPEC = `B = the block b on the finalized canonical chain with ts(b) < M <= ts(b + 1)
T = ts(B)
days(a) = (T - a) div day_s                            # §4.3, for a <= T

# The cycle date (§4.1)
a date is exactly eight digits naming a calendar date on or after 1970-01-01;
    anything else names no cycle                       # vector 74

# Header order (§4.2)
no result until b + 1 is finalized
block 2^64 - 1 has no block b + 1, so it is never B    # vector 74
headers read for the cycle (b, b + 1, the search's, the decoded logs' blocks):
    by block number, timestamps MUST strictly increase between every two;
    the set need not be contiguous, else the cycle has no result
                                                       # vectors 34, 55
the set always holds B stamped T: a log below B stamped at T or later, or
    block B stamped other than T, is invalid           # vectors 61, 62
a decoded transfer in a block <= B stamped after T: input invalid  # vector 54`;

export const RULE_DAYS = "days(a) = (T - a) div day_s";

export const RULE_EDITIONS = `minted[i]  = sum of mint amounts of Meme i in blocks <= B
adj[i]     = -2588 if i = 8 (FirstGM), else 0
floor[i]   = min(totalMax_i, 310) if minted[i] + adj[i] < 300 and totalMax_i > 0, else 0
E[i]       = max(minted[i] + adj[i], floor[i])        (>= 0)
H          = max(E[i] over eligible Memes), or 0 if no Meme is eligible`;

/** P26 §7.1: the underflow test, before netting, in canonical order. */
export const RULE_UNDERFLOW = `if from = to or amount = 0: skip
if from not in SINKS:
    if count[from] < amount: input invalid
    count[from] -= amount
count[to] += amount`;

/** P26 §7.1: transaction netting (D131), every transaction, sinks included. */
export const RULE_NETTING = `A transaction is the set of transfers with one (block, txIndex).
For each transaction and (contract, tokenId), S = its transfers with
amount > 0 and from != to. Every non-empty S is netted.
(P26 names this set M; here it is S, because M is the cycle boundary.)

- For every address w in S, a sink included,
  net(w) = the amount w receives in S - the amount it sends in S.
- Sources: the w with net(w) < 0, each with amount -net(w).
  Destinations: the w with net(w) > 0, each with amount net(w).
  Both lists are in ascending address order.
- Pairing: repeatedly emit (head source, head destination, k), where k
  is the smaller of their remaining amounts, subtract k from both,
  and drop any head that reaches 0.
- S is replaced by the emitted pairs, in order: each a transfer of k
  copies with the transaction's block, timestamp and txHash, at the
  position of S's first transfer.
- Every |net(w)| MUST be below 2^64.`;

/** P26 §7.1: the replay, after netting, in canonical order. */
export const RULE_REPLAY = `# SINKS: the zero address and 0x…dead (§3.4); cluster(w): the identity
# of wallet w (§6.3); firstgm_burn_tx: FirstGM's recorded burn (§10)
if from = to or amount = 0: skip
moved = none
if from not in SINKS:
    moved = last \`amount\` entries of stack[from], in order; remove them
if to in SINKS:
    unless to = ZERO and txHash = firstgm_burn_tx:
        append amount copies of timestamp to stack[to]
elif moved is not none and cluster(from) = cluster(to):
    append moved to stack[to]                 # age carries inside an identity
else:
    append amount copies of timestamp to stack[to]`;

/** P26 §7.2: the values of one token in one wallet. */
export const RULE_TOKEN_VALUES = `balance = len(stack)
raw     = sum(days(a) for a in stack if days(a) > 0)
rate    = §5.3
base    = BASE(rate, raw)                        # §8.2`;

/** P26 §7.3, line for line. */
export const RULE_RECORDS_CONDENSED = `wallet record:   total eligible balance > 0, or a cluster of more than one wallet
identity record: at least one wallet record
identity, per token: the sums over its wallets of balance, raw and base
identity base:   the sum of wallet bases, never recomputed from the merged raw
beta and final:  computed for each record; an identity's are not the sums
                 of its wallets' (e.g. two wallets at 102 each, identity 208)
totals (§8.5):   sums over identity records, never over wallet records`;

export const RULE_RATE = "RATE(n, d) = HALFUP( B64( B64(n / d) * 100 ) )";

/** P26 §8.1 with its Gradient minimum, read from the registry. */
export const RULE_RATE_SPEC = `RATE(n, d) = HALFUP( B64( B64(n / d) * 100 ) )

# Gradient minimum: replace B64(n / d) by B64(gradient_rate_minimum / 100)
# when it is below it; with tdh-v1.0's 100 cents that is 1`;

export const RULE_BASE = "BASE(r, raw) = (r * raw + 50) div 100";

export const RULE_BOOST = `sets = min(bal[i] over eligible Memes) if n_memes > 0 and every eligible
       Meme is held, else 0
ADD(sets) = 0 if sets <= 1, else HALFUP(first * (1 - q^(sets-1)) / (1 - q)),
            first = additional_set_first (50,000 micro-units, 0.05),
            q = additional_set_ratio (6529/10000), evaluated as an exact rational
if sets >= 1:
    meme_u = 50,000 * |boostable seasons| + ADD(sets)
else:
    meme_u = 0
    for each boostable season s in ascending id:
        complete = every id in [start_s, start_(s+1) - 1] is held
        if s = 1 and not complete:
            meme_u += 10,000 if Memes 1, 2 and 3 are all held       # Genesis
            meme_u += 10,000 if Meme 4 is held                        # Nakamoto
        elif complete:
            meme_u += 50,000
grad_u = 20,000 * min(g, 5)
beta   = HALFUP((10^6 + meme_u + grad_u) / 10^4)                     # cents`;

export const RULE_FINAL = `FINAL(base, beta) = HALFUP( B64( base * B64(beta / 100) ) )
final(record)     = sum of FINAL over the record's Meme, Gradient and NextGen tokens`;

export const RULE_PAIR_STATE = `REGISTER(a, b):
  no row                -> row (a, b, pos, false)
  row (a, b, ...)       -> unchanged
  row (b, a, ...)       -> row (b, a, pos, true)     # confirms or refreshes
REVOKE(a, b):
  no row                -> unchanged
  row (a, b, _, true)   -> row (b, a, pos, false)
  row (a, b, _, false)  -> delete
  row (b, a, ...)       -> row (b, a, pos, false)`;

/** P26 §6.1: the four delegation events and the filter, line for line. */
export const RULE_DELEGATION_CONDENSED = `topics = [topic0, wallet w1, collection, delegationAddress w2]
RegisterDelegation                    data: useCase, allTokens, _tokenId        REGISTER
RegisterDelegationUsingSubDelegation  data: from, useCase, allTokens, _tokenId  REGISTER
RevokeDelegation                      data: useCase                             REVOKE
RevokeDelegationUsingSubDelegation    data: from, useCase                       REVOKE
(in the sub-delegation variants the data word from is the caller, ignored)

malformed, so the input is invalid, unless the data has exactly these words,
    every address word has 12 zero high bytes and allTokens is 0 or 1
two events at one position (block, txIndex, logIndex): input invalid,
    kept or not                                                 # vector 51
keep:       useCase = consolidation_use_case (999)
            and collection in consolidation_collections (memes, 0x8888...8888)
            and w1 != w2 and neither w1 nor w2 is a sink        # vector 57
kept event: (position, REGISTER | REVOKE, w1, w2)`;

export const RULE_CLUSTERS = `Q = confirmed rows sorted by position, newest first
P = set of confirmed unordered pairs
used = {}
while Q not empty:
    (w1, w2) = pop first of Q
    if w1 in used or w2 in used: continue
    C = [w1, w2]
    repeat while |C| < consolidation_max_wallets (3)
          and the previous pass added a wallet:
        for each (c1, c2) in Q, in order:
            n = c2 if c1 in C, c2 not in C, c2 not in used
                c1 if c2 in C, c1 not in C, c1 not in used
            if n exists and {x, n} in P for every x in C:
                append n to C; remove (c1, c2) from Q; restart the pass
    used = used + C; emit cluster C
every wallet of P not in used is a singleton cluster`;

/** P26 §6.4-§6.5, line for line. */
export const RULE_IDENTITY_CONDENSED = `cluster map: the state after all consolidation events in blocks <= B,
              applied to the whole transfer history of the cycle (DEV-10)
identity:    a cluster; a wallet outside every confirmed pair is its own
key:         its lowercase addresses, sorted, joined with "-"`;

export const RULE_DAILY_RATE =
  "rate_e4 = beta * sum(r over the record's copies with days(a) > 0)";

/** P26 §8.5, line for line. */
export const RULE_TOTALS_CONDENSED = `total_final                 = sum of identity finals, not of wallet finals
total_final_excluding_sinks = total_final without the sink identities, one per
                              registry sink (ZERO and DEAD in tdh-v1.0)
total_base, total_raw       = sums of identity base and raw; diagnostic
sink identities: never consensus participants, never in a consensus denominator`;

export const RULE_REGISTRY = `address memes, gradients, nextgen; uint64 nextgen_collection_divisor;
address[] sinks; uint32 eligibility_min_age_s, day_s; uint256 firstgm_id;
int64 firstgm_edition_adjustment; bytes32 firstgm_burn_tx;
uint64 edition_floor_cap, edition_floor_threshold; address manifold_lazy_claim;
uint32 gradient_rate_minimum; address delegation;
uint256 consolidation_use_case; address[] consolidation_collections;
uint32 consolidation_max_wallets, season_bonus, last_boosted_season,
       additional_set_first, additional_set_ratio;
uint256[] genesis_ids; uint32 genesis_bonus; uint256[] nakamoto_ids;
uint32 nakamoto_bonus, gradient_bonus, gradient_max_count;
uint256[] season_starts

registryHash = H("6529.TdhRegistry.v1", the fields above in order)

# H is P28's hash (below), not the edition H. Stored, the record is a CE
# struct of these fields in this order; a T[] field is a CE list<T>,
# ascending. Boosts are in micro-units, additional_set_ratio in 10^-4 and
# gradient_rate_minimum in cents.`;

/**
 * P28 §1 (H), §2.6 (the stored record), §2.7 (abi.encode) and §3.1 (TAG):
 * how H and the registry record are encoded.
 */
export const RULE_REGISTRY_HASH = `TAG(name)    = keccak256(the ASCII bytes of name)
H(name, f1, ..., fk) = keccak256(abi.encode(bytes32 TAG(name), f1, ..., fk))

abi.encode, with the types declared above, in order:
  address, uintN, intN, bytes32   one 32-byte word each, big-endian;
                                  zero-extended, an int64 sign-extended
  address[], uint256[]            a 32-byte offset in the field's place;
                                  at the end, the list's length and then
                                  its elements, one word each, in order

stored record (CE struct)         the same fields in order, fixed-width
                                  big-endian, no padding; a list is a
                                  uint32 count then its elements
the hash is taken over the typed values, never over the stored bytes`;

/** P53 §4.2: the cycle root validators sign. */
export const RULE_CYCLE_ROOT = `cycleRoot_N = H("6529.TdhCycleRoot.v1",
  bytes32 NETWORK_ID,
  uint32  cycleDay,         # N
  uint64  boundary,         # t_N, Unix seconds
  bytes32 tdhRuleId,        # H("6529.TdhRule.v1", keccak256("tdh-v1.0"),
                            #   registryHash), P28 §4.5
  uint64  cutoffNumber,     # B_N
  bytes32 cutoffHash,       # hash(B_N)
  uint64  cutoffTimestamp,  # ts(B_N), the age reference T of P26 §4.3
  bytes32 walletRoot,       # P28 §4.4
  uint32  walletCount,      # leaves in walletRoot
  uint32  identityCount,    # non-sink identities with a wallet record
  uint64  totalTDH,         # sum of identityTDH over non-sink identities
  bytes32 tokenRoot,        # P28 §4.12
  uint32  tokenCount)       # leaves in tokenRoot`;

/**
 * P28 §3.3, §4.3, §4.4 and §4.12 (as P53 §4.1 uses them): the leaves of the
 * wallet and per-token trees the cycle root binds, and the list tree.
 */
export const RULE_EXPORT_TREES = `cid = H("6529.TdhIdentity.v1", address[] wallets)    # wallets ascending

walletLeaf = H("6529.TdhWalletLeaf.v1",
    address wallet,
    bytes32 cid,              # the wallet's identity
    uint64  identityTDH,      # the identity's final TDH
    uint64  walletTDH,        # this wallet's own final TDH
    uint8   walletCount)      # wallets in the identity, 1 to 3
    one leaf per wallet record whose identity is not a sink,
    ascending by address as an unsigned 160-bit integer
walletRoot = ROOT("6529.TdhWalletRoot.v1", wallet leaves)

tokenLeaf = H("6529.TdhTokenLeaf.v1",
    bytes32 cid, address contract, uint256 tokenId,
    uint64  tokenTDH)         # the identity's per-token final
    one leaf per non-sink identity and eligible token with tokenTDH > 0,
    ascending by (cid, contract, tokenId)
tokenRoot = ROOT("6529.TdhTokenRoot.v1", token leaves)

NODE(l, r)     = keccak256(TAG("6529.MerkleNode.v1") || l || r)
TOP([])        = 32 zero bytes
TOP([x])       = x
TOP(L)         = pair adjacent entries left to right with NODE; an odd
                 last entry is promoted unchanged; repeat until one remains
ROOT(class, L) = H(class, uint64 len(L), bytes32 TOP(L))`;

/** P26 §10, "Field types" and "Registry constraints", line for line. */
export const RULE_REGISTRY_CONSTRAINTS_CONDENSED = `every field at its type (uint32, uint64, uint256, int64, address, bytes32);
    a value outside it: no registry, no hash, no result   # vectors 68, 70, 75
read at its type, cut to fit never: a uint32 in 32 bits, every uint256 in
    full                                                  # vectors 73, 75
season_starts starts at 1 and strictly increases       # §5.4
every list field is strictly ascending, so it has no repeats  # vector 66
sinks contains ZERO                                     # §3.4
day_s > 0 and nextgen_collection_divisor > 0
additional_set_ratio < 10^4, a ratio below 1            # §8.3
consolidation_max_wallets >= 2
a registry that breaks one of these: the cycle has no result  # vector 60`;

export const RULE_SEASONS =
  "season_starts = 1, 48, 87, 119, 152, 181, 213, 246, 279, 311, 343, 375, 407, 439, 477, 516, 556";

/** P26 §8.7, line for line. */
export const RULE_RANGE = `H, G and every Nc                                    < 2^53
every base * beta of a record's token                < 2^53
total_final                                          < 2^53
every net movement |net(w)| of §7.1's netting        < 2^64
every balance and raw of a wallet or identity
    record, per token and in total                   < 2^64   # vector 58
outside the range: no tdh-v1.0 result, and nothing is published`;

export const RULE_OUTPUT = `header   = (N, B, hash(B), T, rule_version, registry_hash)
identity = (key, wallets, beta, final)
token    = (contract, tokenId, balance, raw, base, final)`;

export const REGISTRY_HASH =
  "0x74b4a8f96e3f1fbc3f44167bb42f0a18effb7a0f49d12bc8b88cdb3784c663d3";
