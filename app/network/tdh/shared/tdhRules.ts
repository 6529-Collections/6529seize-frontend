

export const RULE_CUTOFF = `B = the block b on the finalized chain with ts(b) < M <= ts(b + 1)
T = ts(B)        M = N * 86400`;

export const RULE_DAYS = "days(a) = (T - a) div day_s";

export const RULE_EDITIONS = `minted[i]  = sum of mint amounts of Meme i in blocks <= B
adj[i]     = -2588 if i = 8 (FirstGM), else 0
floor[i]   = min(totalMax_i, 310) if minted[i] + adj[i] < 300 and totalMax_i > 0, else 0
E[i]       = max(minted[i] + adj[i], floor[i])        (>= 0)
H          = max(E[i] over eligible Memes), or 0 if no Meme is eligible`;

/** P26 §7.1: transaction netting (D131), every transaction, sinks included. */
export const RULE_NETTING = `A transaction is the set of transfers with one (block, txIndex).
For each transaction and (contract, tokenId), M = its transfers with
amount > 0 and from != to. Every non-empty M is netted.
(Here M is a set of transfers, P26's own name; it is not the cycle
boundary M of section 4.)

- For every address w in M, a sink included,
  net(w) = the amount w receives in M - the amount it sends in M.
- Sources: the w with net(w) < 0, each with amount -net(w).
  Destinations: the w with net(w) > 0, each with amount net(w).
  Both lists are in ascending address order.
- Pairing: repeatedly emit (head source, head destination, k), where k
  is the smaller of their remaining amounts, subtract k from both,
  and drop any head that reaches 0.
- M is replaced by the emitted pairs, in order: each a transfer of k
  copies with the transaction's block, timestamp and txHash, at the
  position of M's first transfer.
- Every |net(w)| MUST be below 2^64.`;

/** P26 §7.1: the replay, after netting, in canonical order. */
export const RULE_REPLAY = `# SINKS: the zero address and 0x…dead (§3.4); cluster(w): the identity
# of wallet w (§6.3); firstgm_burn_tx: FirstGM's recorded burn (§10)
if from = to or amount = 0: skip
moved = none
if from not in SINKS:
    moved = last amount entries of stack[from], in order; remove them
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

export const RULE_RATE = "RATE(n, d) = HALFUP( B64( B64(n / d) * 100 ) )";

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

export const REGISTRY_HASH =
  "0x74b4a8f96e3f1fbc3f44167bb42f0a18effb7a0f49d12bc8b88cdb3784c663d3";
