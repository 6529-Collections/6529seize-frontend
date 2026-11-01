import type { RegistryRecord } from "@/lib/explained/registry/referenceFacts";

/**
 * The rule's own text for the specification page: P26's formulas and
 * pseudocode at the record's P26 commit (TDH v1.4), with every number the
 * registry holds read from the registry record (P26 §10: "where a rule
 * above states a number, it is the value of the parameter named here").
 * Never translated; `#` starts a comment.
 */

type Value = RegistryRecord[string];

function num(value: Value | undefined): number {
  return typeof value === "number" ? value : Number(value);
}

/** 1792022400 → "1,792,022,400", the way P26 writes registry integers. */
function grouped(value: Value | undefined): string {
  const n = num(value);
  const plainDigits = String(Math.abs(n));
  const groups: string[] = [];
  for (let end = plainDigits.length; end > 0; end -= 3) {
    groups.unshift(plainDigits.slice(Math.max(0, end - 3), end));
  }
  const digits = groups.join(",");
  return n < 0 ? `-${digits}` : digits;
}

/** Micro-units as P26 writes them: 50000 → "50,000". */
const micro = grouped;

/** The registry's integers, read once. */
export function registryValues(record: RegistryRecord) {
  return {
    version: String(record["rule_version"] ?? ""),
    dayS: num(record["day_s"]),
    firstgmId: num(record["firstgm_id"]),
    adj: num(record["firstgm_edition_adjustment"]),
    cap: num(record["edition_floor_cap"]),
    threshold: num(record["edition_floor_threshold"]),
    gradientMin: num(record["gradient_rate_minimum"]),
    divisor: num(record["nextgen_collection_divisor"]),
    maxWallets: num(record["consolidation_max_wallets"]),
    ungated: num(record["consolidation_ungated_max_wallets"]),
    seasonBonus: micro(record["season_bonus"]),
    setFirst: micro(record["additional_set_first"]),
    setRatio: num(record["additional_set_ratio"]),
    genesisIds: (record["genesis_ids"] as readonly number[] | undefined) ?? [],
    genesisBonus: micro(record["genesis_bonus"]),
    nakamotoIds:
      (record["nakamoto_ids"] as readonly number[] | undefined) ?? [],
    nakamotoBonus: micro(record["nakamoto_bonus"]),
    gradientBonus: micro(record["gradient_bonus"]),
    gradientMax: num(record["gradient_max_count"]),
  };
}

type Values = ReturnType<typeof registryValues>;

export function conventions(v: Values): string {
  return [
    "a div b    floor division",
    "HALFUP(x)  floor(x + 1/2), for rational x >= 0",
    "B64(x)     the IEEE-754 binary64 value nearest to x, ties to even; B64(0) = 0",
    "DAY        86400, the cycle length (§4.1); whole days use day_s (§4.3)",
    "ZERO       0x0000000000000000000000000000000000000000",
    "DEAD       0x000000000000000000000000000000000000dead",
    `SINKS      the registry's sinks (§10), {ZERO, DEAD} in ${v.version}`,
  ].join("\n");
}

/** P26 §2's event signatures and their topic hashes (keccak-256). */
export const TOPICS = [
  "TransferSingle(address,address,address,uint256,uint256)",
  "  0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62",
  "TransferBatch(address,address,address,uint256[],uint256[])",
  "  0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb",
  "Transfer(address,address,uint256)",
  "  0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
  "RegisterDelegation(address,address,address,uint256,bool,uint256)",
  "  0xcf23f2b40be0e08bb0a6b6d6bef575e6441f3137f93730338475a86920fd2217",
  "RevokeDelegation(address,address,address,uint256)",
  "  0xeb2716ae908a1e27125f13f2a948ee7b067d22f92b1fc0152355e0085d80177e",
  "RegisterDelegationUsingSubDelegation(address,address,address,address,uint256,bool,uint256)",
  "  0xbd5af040fa27449f00e35a368bb558ba6b619f0da43b8f35722fe7f8de754b5f",
  "RevokeDelegationUsingSubDelegation(address,address,address,address,uint256)",
  "  0x3fc9853b549d505712a2e247960ed1ec823b23c592b38d4b438cc603c2c55d70",
].join("\n");

export const ORDER = [
  "canonical key  (block, txIndex, logIndex, batchPos), ascending",
  "mint           from = ZERO and to != ZERO     # ZERO -> ZERO is not a mint",
  "burn           to in SINKS                    # a sink is never debited",
].join("\n");

export function cutoff(v: Values): string {
  return [
    "M = t_N = N * 86400",
    "B = the block b on the finalized canonical chain with ts(b) < M <= ts(b + 1)",
    "T = ts(B)",
    `days(a) = (T - a) div day_s          # day_s = ${grouped(v.dayS)} in ${v.version}`,
  ].join("\n");
}

export function editions(v: Values): string {
  return [
    "minted[i]  = sum of mint amounts of Meme i in blocks <= B",
    `adj[i]     = ${grouped(v.adj)} if i = ${v.firstgmId} (FirstGM), else 0`,
    `floor[i]   = min(totalMax_i, ${v.cap}) if minted[i] + adj[i] < ${v.threshold} and totalMax_i > 0, else 0`,
    "E[i]       = max(minted[i] + adj[i], floor[i])",
    "H          = max(E[i] over eligible Memes), or 0 if none is eligible",
  ].join("\n");
}

export function rates(v: Values): string {
  return [
    "Meme i           RATE(H, E[i]) when E[i] > 0; no rate when E[i] = 0",
    `Gradient         RATE(H, G), at least ${v.gradientMin} cents`,
    "                 G = Gradient ids minted at or before B",
    `NextGen token t  RATE(H, Nc), c = t div ${grouped(v.divisor)}`,
    "                 Nc = collection-c tokens minted at or before B",
  ].join("\n");
}

/** P26 §6.2, the pair state machine, as written. */
export const PAIR_STATE = [
  "REGISTER(a, b) at t:",
  "  no row                       -> row (a, b, pos, false, t, -)",
  "  row (a, b, p, c, _, t2)      -> row (a, b, p, c, t, t2)       # a again: its time only",
  "  row (b, a, _, _, t1, _)      -> row (b, a, pos, true, t1, t)  # a confirms, or a (second) again",
  "REVOKE(a, b):",
  "  no row                       -> unchanged",
  "  row (a, b, _, true, _, t2)   -> row (b, a, pos, false, t2, -)",
  "  row (a, b, _, false, _, _)   -> delete",
  "  row (b, a, _, _, t1, _)      -> row (b, a, pos, false, t1, -)",
].join("\n");

export function clusters(v: Values): string {
  return [
    "Q = confirmed rows, newest block first; within one block, by ascending",
    "    pair key",
    "P = the set of confirmed unordered pairs",
    "fresh(x, y): {x, y} in P, and both of its times are at or after",
    "    consolidation_gate_activation_s",
    "canJoin(C, n): {x, n} in P for every x in C, and either",
    `    |C| < consolidation_ungated_max_wallets (${v.ungated}), or`,
    "    some m in C + [n] has fresh(m, x) for every other x in C + [n]",
    "used = {}",
    "while Q not empty:",
    "    (w1, w2) = pop first of Q",
    "    if w1 in used or w2 in used: continue",
    "    C = [w1, w2]",
    `    repeat while |C| < consolidation_max_wallets (${v.maxWallets})`,
    "          and the previous pass added a wallet:",
    "        for each (c1, c2) in Q, in order:",
    "            n = c2 if c1 in C, c2 not in C, c2 not in used",
    "                c1 if c2 in C, c1 not in C, c1 not in used",
    "            if n exists and canJoin(C, n):",
    "                append n to C; remove (c1, c2) from Q; restart the pass",
    "    used = used + C; emit cluster C",
    "every wallet of P not in used is a singleton cluster",
  ].join("\n");
}

/** P26 §7.1, the underflow test over the transfers before netting. */
export const UNDERFLOW = [
  "if from = to or amount = 0: skip",
  "if from not in SINKS:",
  "    if count[from] < amount: input invalid",
  "    count[from] -= amount",
  "count[to] += amount",
].join("\n");

/** P26 §7.1, transaction netting: each transaction's net movements, paired in address order. */
export const NETTING = [
  "for each transaction (block, txIndex) and token (contract, tokenId):",
  "    M = its transfers with amount > 0 and from != to",
  "    net(w) = received(w) - sent(w), for every address w in M, a sink included",
  "    sources      = [(w, -net(w)) for net(w) < 0], ascending address",
  "    destinations = [(w,  net(w)) for net(w) > 0], ascending address",
  "    while sources:",
  "        k = min(amount(head(sources)), amount(head(destinations)))",
  "        emit (head(sources) -> head(destinations), k)",
  "        subtract k from both heads; drop a head that reaches 0",
  "    M := the emitted pairs, in order, at the position of M's first transfer",
  "    # each pair has M's block, timestamp and txHash",
  "|net(w)| < 2^64 for every w, else the cycle is outside the range (§8.7)",
].join("\n");

/** P26 §3.1 and §3.2: every value read at its type; a document that breaks the format is no input. */
export const VALUES = [
  "amount          a transfer of 2^64 or more in a block <= B: input invalid",
  "totalMax        uint32, the type of Manifold's Claim field; else no result",
  "cycleDay        uint32",
  "removed         a JSON boolean; true: no input, neither decoded nor checked",
  "JSON integer    canonical: no fraction, no exponent, no -0, '-' only if signed",
  "JSON string     never an integer, a decimal token id included",
  "integer key     its canonical decimal: no sign, no leading zero",
  "object          no member twice or missing, none the format does not name (E13)",
  "text            UTF-8, no byte order mark, Unicode scalar values only (E14)",
].join("\n");

/** P26 §8.6, the daily rate: derived data, not part of a day's output. */
export const DAILY_RATE = [
  "rate_e4 = beta × Σ r over the record's copies with days(a) > 0",
  "    # in units of 10^-4 TDH a day; r = the copy's token rate in cents",
  "    # beta = the record's own boost; zero-day copies add nothing",
].join("\n");

/** P26 §8.7, the numeric range of a TDH v1.4 result. */
export const RANGE = [
  "H, G and every Nc                              < 2^53",
  "base × beta, for every token of every record   < 2^53",
  "total_final                                    < 2^53",
  "|net(w)| in §7.1's netting                     < 2^64",
  "every balance and raw, per token and in total  < 2^64",
  "outside the range: no tdh-v1.4 result, and a node MUST NOT publish one",
].join("\n");

/** P26 §7.1, the replay of the netted transfers. */
export const REPLAY = [
  "if from = to or amount = 0: skip",
  "moved = none",
  "if from not in SINKS:",
  "    moved = last `amount` entries of stack[from], in order; remove them",
  "if to in SINKS:",
  "    unless to = ZERO and txHash = firstgm_burn_tx:",
  "        append amount copies of timestamp to stack[to]",
  "elif moved is not none and cluster(from) = cluster(to):",
  "    append moved to stack[to]                 # age carries inside an identity",
  "else:",
  "    append amount copies of timestamp to stack[to]",
].join("\n");

export const TOKEN_VALUES = [
  "balance = len(stack)",
  "raw     = sum(days(a) for a in stack if days(a) > 0)",
  "rate    = §5.3",
  "base    = BASE(rate, raw)                        # §8.2",
].join("\n");

export const ARITHMETIC = [
  "RATE(n, d) = HALFUP( B64( B64(n / d) × 100 ) )",
  "rate[i]    = RATE(H, E[i])                       # a Meme",
  "BASE(r, raw)    = (r × raw + 50) div 100          # §8.2, per token per wallet",
  "FINAL(base, β)  = HALFUP( B64( base × B64(β / 100) ) )   # §8.4",
].join("\n");

export function boost(v: Values): string {
  const ratio = `${v.setRatio}/10000`;
  return [
    "sets = min(bal[i] over eligible Memes) if n_memes > 0 and every eligible",
    "       Meme is held, else 0",
    "ADD(sets) = 0 if sets <= 1, else HALFUP(first * (1 - q^(sets-1)) / (1 - q)),",
    `            first = additional_set_first (${v.setFirst} micro-units),`,
    `            q = additional_set_ratio (${ratio}), an exact rational`,
    "if sets >= 1:",
    `    meme_u = ${v.seasonBonus} * |boostable seasons| + ADD(sets)`,
    "else:",
    "    meme_u = 0",
    "    for each boostable season s in ascending id:",
    "        complete = every id in [start_s, start_(s+1) - 1] is held",
    "        if s = 1 and not complete:",
    `            meme_u += ${v.genesisBonus} if Memes ${v.genesisIds.join(", ")} are all held   # Genesis`,
    `            meme_u += ${v.nakamotoBonus} if Meme ${v.nakamotoIds.join(", ")} is held   # Nakamoto`,
    "        elif complete:",
    `            meme_u += ${v.seasonBonus}`,
    `grad_u = ${v.gradientBonus} * min(g, ${v.gradientMax})`,
    "beta   = HALFUP((10^6 + meme_u + grad_u) / 10^4)               # cents",
  ].join("\n");
}
