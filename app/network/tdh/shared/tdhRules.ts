/**
 * Rule blocks quoted verbatim from specification P26, text of 15 October 2026
 * (rule version `tdh-v1.0`). Formulas, hashes and addresses are not
 * translated. Updating them is a deliberate content change reviewed against
 * the new P26 text.
 */

export const RULE_CONVENTIONS = `a div b    floor division
HALFUP(x)  floor(x + 1/2), for rational x >= 0
B64(x)     the IEEE-754 binary64 value nearest to x, ties to even; B64(0) = 0
DAY        86,400 seconds
SINKS      {0x0000000000000000000000000000000000000000,
            0x000000000000000000000000000000000000dEaD}`;

export const RULE_CUTOFF = `B = the block b on the finalized chain with ts(b) < M <= ts(b + 1)
T = ts(B)        M = N × 86,400`;

export const RULE_CUTOFF_SPEC = `B = the block b on the finalized chain with ts(b) < M <= ts(b + 1)
T = ts(B)
days(a) = (T - a) div DAY`;

export const RULE_DAYS = "days(a) = (T − a) div 86,400";

export const RULE_ORDER =
  "order = ascending (block, txIndex, logIndex, batchPos)";

export const RULE_EDITIONS = `minted[i]  = sum of mint amounts of Meme i in blocks <= B
adj[i]     = -2588 if i = 8 (FirstGM), else 0
floor[i]   = min(totalMax_i, 310) if minted[i] + adj[i] < 300 and totalMax_i > 0, else 0
E[i]       = max(minted[i] + adj[i], floor[i])
H          = max(E[i] over eligible Memes), or 0 if none`;

export const RULE_STACKS = `if from = to or amount = 0: skip
moved = none
if from not in SINKS:
    if len(stack[from]) < amount: input invalid
    moved = last \`amount\` entries of stack[from]; remove them
if to in SINKS:
    unless to = ZERO and txHash = firstgm_burn_tx:
        append amount copies of timestamp to stack[to]
elif moved is not none and cluster(from) = cluster(to):
    append moved to stack[to]                 # age carries inside an identity
else:
    append amount copies of timestamp to stack[to]

balance = len(stack)
raw     = sum(days(a) for a in stack if days(a) > 0)
base    = BASE(rate, raw)`;

export const RULE_RATE = "RATE(n, d) = HALFUP( B64( B64(n / d) × 100 ) )";

export const RULE_BASE = "BASE(r, raw) = (r × raw + 50) div 100";

export const RULE_BOOST = `sets = min(bal[i] over eligible Memes) if n_memes > 0 and every eligible
       Meme is held, else 0
ADD(sets) = 0 if sets <= 1, else HALFUP(10^6 * 0.05 * (1 - q^(sets-1)) / (1 - q)),
            q = 6529/10000, evaluated as an exact rational
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

export const RULE_FINAL = `FINAL(base, beta) = HALFUP( B64( base × B64(beta / 100) ) )
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

export const RULE_DAILY_RATE =
  "rate_e4 = beta * sum(r over the record's copies with days(a) > 0)";

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

registryHash = H("6529.TdhRegistry.v1", the fields above in order)`;

export const RULE_SEASONS =
  "season_starts = 1, 48, 87, 119, 152, 181, 213, 246, 279, 311, 343, 375, 407, 439, 477, 516, 556";

export const RULE_RANGE =
  "H, G, every N_c, every base × beta and total_final < 2^53";

export const RULE_OUTPUT = `header   = (N, B, hash(B), T, rule_version, registry_hash)
identity = (key, wallets, beta, final)
token    = (contract, tokenId, balance, raw, base, final)`;

export const REGISTRY_HASH =
  "0x74b4a8f96e3f1fbc3f44167bb42f0a18effb7a0f49d12bc8b88cdb3784c663d3";
