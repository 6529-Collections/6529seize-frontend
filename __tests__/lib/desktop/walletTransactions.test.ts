import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { type Abi, type AbiFunction, toFunctionSelector } from "viem";
import {
  DELEGATION_ABI,
  MEMES_MANIFOLD_PROXY_ABI,
  NEXTGEN_MINTER_ABI,
} from "@/abis/abis";
import {
  DELEGATION_CONTRACT,
  MANIFOLD_LAZY_CLAIM_CONTRACT,
  MEMES_CONTRACT,
  NEVER_DATE,
  SUBSCRIPTIONS_ADDRESS,
} from "@/constants/constants";
import {
  CONSOLIDATION_USE_CASE,
  DELEGATION_USE_CASES,
  PRIMARY_ADDRESS_USE_CASE,
  SUB_DELEGATION_USE_CASE,
  SUPPORTED_COLLECTIONS,
} from "@/components/delegation/delegation-constants";
import { NEXTGEN_MINTER_ADDRESSES } from "@/components/nextGen/nextgen_addresses";
import {
  canonicalTransactionRulesJson,
  checkWalletTransaction,
  decodeTransactionData,
  transactionRulesHash,
  WALLET_TRANSACTION_RULES,
  walletTransactionRulesHash,
  type TransactionRule,
} from "@/lib/desktop/wallet-transactions";
import {
  ARG_RULE_KEYS,
  type ArgRule,
  RULE_ARG_TYPES,
} from "@/lib/desktop/wallet-transactions/types";
import {
  buildWalletTransactionVectors,
  type WalletTransactionVector,
} from "@/__tests__/fixtures/desktop-wallet-transactions/vectors";

jest.mock("@/config/env", () => ({
  publicEnv: { NEXTGEN_CHAIN_ID: 1 },
}));

const FIXTURES = path.join(
  __dirname,
  "../../fixtures/desktop-wallet-transactions"
);
const RULES_FIXTURE = path.join(FIXTURES, "website-tx-rules.json");
const VECTORS_FIXTURE = path.join(FIXTURES, "website-transactions.json");
/** Set to rewrite the JSON fixtures from the sources (then review the diff). */
const UPDATE = process.env["UPDATE_DESKTOP_TX_FIXTURES"] === "1";

const rulesFixture = () => ({
  sha256: walletTransactionRulesHash(),
  canonical: JSON.parse(canonicalTransactionRulesJson()) as unknown,
});

function readFixture(file: string, expected: unknown): unknown {
  if (UPDATE) writeFileSync(file, `${JSON.stringify(expected, null, 2)}\n`);
  return JSON.parse(readFileSync(file, "utf8")) as unknown;
}

const check = (vector: WalletTransactionVector) =>
  checkWalletTransaction(
    { ...vector.transaction, value: BigInt(vector.transaction.value) },
    vector.chainId
  );

const vectors = buildWalletTransactionVectors();

describe("wallet transaction vectors", () => {
  it.each(vectors.map((vector) => [vector.name, vector] as const))(
    "%s",
    (_name, vector) => {
      const result = check(vector);
      if (vector.expect.ok) {
        expect(result).toMatchObject({
          ok: true,
          rule: { id: vector.expect.ruleId, chainId: vector.chainId },
          risk: vector.expect.risk,
        });
      } else {
        expect(result).toEqual({ ok: false, problem: vector.expect.problem });
      }
    }
  );

  it("has unique names", () => {
    const names = vectors.map((vector) => vector.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("accepts and refuses at least once for every rule", () => {
    for (const rule of WALLET_TRANSACTION_RULES) {
      const forRule = vectors.filter(
        (vector) =>
          vector.chainId === rule.chainId &&
          vector.transaction.to === rule.to &&
          (rule.selector === null
            ? vector.transaction.data === "0x"
            : vector.transaction.data.startsWith(rule.selector))
      );
      expect(forRule.some((vector) => vector.expect.ok)).toBe(true);
      expect(
        forRule.some(
          (vector) =>
            !vector.expect.ok && vector.expect.problem === "transaction-rule"
        )
      ).toBe(true);
    }
  });

  it("matches the shared JSON vectors", () => {
    expect(readFixture(VECTORS_FIXTURE, vectors)).toEqual(
      JSON.parse(JSON.stringify(vectors))
    );
  });
});

describe("checkWalletTransaction", () => {
  const [accepted] = vectors;

  it("requires a canonical lower-case sender and contract", () => {
    const transaction = {
      ...accepted!.transaction,
      value: 0n,
    };
    expect(
      checkWalletTransaction(
        { ...transaction, from: transaction.from.toUpperCase() },
        1
      )
    ).toEqual({ ok: false, problem: "transaction-rule" });
    expect(checkWalletTransaction({ ...transaction, to: "0x12" }, 1)).toEqual({
      ok: false,
      problem: "transaction-rule",
    });
  });

  it("keeps decoded strings exactly as sent", () => {
    const vector = vectors.find((item) =>
      item.name.startsWith("nextgen.mint keeps hex-like token data")
    )!;
    const rule = WALLET_TRANSACTION_RULES.find(
      (item) => item.id === "nextgen.mint" && item.chainId === 1
    )!;
    expect(
      decodeTransactionData(rule, vector.transaction.data)?.["_tokenData"]
    ).toBe("0xAB");
  });

  it("decodes arguments by name with uints as bigint", () => {
    const rule = WALLET_TRANSACTION_RULES.find(
      (item) => item.id === "delegation.register"
    )!;
    expect(decodeTransactionData(rule, accepted!.transaction.data)).toEqual({
      _collectionAddress: MEMES_CONTRACT.toLowerCase(),
      _delegationAddress: "0x2222222222222222222222222222222222222222",
      _expiryDate: BigInt(NEVER_DATE),
      _useCase: 4n,
      _allTokens: true,
      _tokenId: 0n,
    });
  });
});

const isLowerAddress = (value: string) => /^0x[0-9a-f]{40}$/.test(value);

function argRuleProblems(rule: ArgRule, argNames: readonly string[]): string[] {
  const problems: string[] = [];
  for (const key of Object.keys(rule)) {
    if (!(ARG_RULE_KEYS as readonly string[]).includes(key)) {
      problems.push(`unknown key ${key}`);
    }
  }
  for (const name of rule.sameLength ?? []) {
    if (!argNames.includes(name)) problems.push(`sameLength ${name}`);
  }
  if (rule.zeroIf && !argNames.includes(rule.zeroIf.arg)) {
    problems.push(`zeroIf ${rule.zeroIf.arg}`);
  }
  if (rule.each) problems.push(...argRuleProblems(rule.each, argNames));
  return problems;
}

describe("WALLET_TRANSACTION_RULES", () => {
  it.each(
    WALLET_TRANSACTION_RULES.map(
      (rule) => [rule.id, rule.chainId, rule] as const
    )
  )("%s on chain %d is well formed", (_id, _chainId, rule: TransactionRule) => {
    expect(isLowerAddress(rule.to)).toBe(true);
    expect([1, 11_155_111]).toContain(rule.chainId);
    const names = rule.args.map((arg) => arg.name);
    expect(new Set(names).size).toBe(names.length);
    for (const arg of rule.args) {
      expect(RULE_ARG_TYPES).toContain(arg.type);
      expect(argRuleProblems(arg.rule, names)).toEqual([]);
    }
    if (rule.signature === null) {
      expect(rule.selector).toBeNull();
      expect(rule.args).toEqual([]);
    } else {
      const name = rule.signature.slice(0, rule.signature.indexOf("("));
      expect(rule.signature).toBe(
        `${name}(${rule.args.map((arg) => arg.type).join(",")})`
      );
      expect(rule.selector).toBe(toFunctionSelector(rule.signature));
    }
    if ("unitsArg" in rule.value) {
      expect(names).toContain(rule.value.unitsArg);
    }
    if (typeof rule.risk === "object") {
      for (const condition of rule.risk.highIf) {
        if ("arg" in condition) expect(names).toContain(condition.arg);
      }
    }
  });

  it("has one rule per chain, contract and selector", () => {
    const keys = WALLET_TRANSACTION_RULES.map(
      (rule) => `${rule.chainId}:${rule.to}:${rule.selector}`
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  const SITE_ABIS: Record<string, Abi> = {
    delegation: DELEGATION_ABI,
    memes: MEMES_MANIFOLD_PROXY_ABI,
    nextgen: NEXTGEN_MINTER_ABI,
  };

  it("uses the same functions and parameter names as the site's ABIs", () => {
    for (const rule of WALLET_TRANSACTION_RULES) {
      if (rule.selector === null) continue;
      const abi = SITE_ABIS[rule.id.split(".")[0]!]!;
      const item = abi.find(
        (entry): entry is AbiFunction =>
          entry.type === "function" &&
          toFunctionSelector(entry) === rule.selector
      );
      expect(item).toBeDefined();
      expect(item!.inputs.map(({ name, type }) => ({ name, type }))).toEqual(
        rule.args.map(({ name, type }) => ({ name, type }))
      );
    }
  });

  it("names the contracts the site writes to", () => {
    const byId = (id: string, chainId = 1) =>
      WALLET_TRANSACTION_RULES.find(
        (rule) => rule.id === id && rule.chainId === chainId
      )!;
    expect(byId("delegation.register").to).toBe(
      DELEGATION_CONTRACT.contract.toLowerCase()
    );
    expect(byId("delegation.register").chainId).toBe(
      DELEGATION_CONTRACT.chain_id
    );
    expect(byId("memes.mint").to).toBe(MANIFOLD_LAZY_CLAIM_CONTRACT);
    expect(byId("memes.mint", 11_155_111).to).toBe(
      MANIFOLD_LAZY_CLAIM_CONTRACT
    );
    expect(byId("memes.mint").args[0]!.rule.equals).toBe(
      MEMES_CONTRACT.toLowerCase()
    );
    expect(byId("nextgen.mint").to).toBe(
      NEXTGEN_MINTER_ADDRESSES[1].toLowerCase()
    );
    expect(byId("nextgen.mint", 11_155_111).to).toBe(
      NEXTGEN_MINTER_ADDRESSES[11_155_111].toLowerCase()
    );
    expect(byId("subscriptions.topUp").to).toBe(
      SUBSCRIPTIONS_ADDRESS.toLowerCase()
    );
    const collections = byId("delegation.register").args[0]!.rule.oneOf;
    expect(collections).toEqual(
      SUPPORTED_COLLECTIONS.map((item) => item.contract.toLowerCase())
    );
    const useCases = byId("delegation.register").args[3]!.rule.oneOf;
    const siteUseCases = new Set(
      [
        ...DELEGATION_USE_CASES,
        PRIMARY_ADDRESS_USE_CASE,
        SUB_DELEGATION_USE_CASE,
        CONSOLIDATION_USE_CASE,
      ].map((item) => item.use_case)
    );
    expect(useCases).toEqual(
      [...siteUseCases].sort((a, b) => a - b).map(String)
    );
    expect(byId("delegation.register").args[2]!.rule.uintMax).toBe(
      String(NEVER_DATE)
    );
  });
});

describe("canonical rules JSON and hash", () => {
  it("sorts keys, has no whitespace, and wraps the rules with a version", () => {
    const json = canonicalTransactionRulesJson();
    expect(json.startsWith('{"rules":[{"args":[')).toBe(true);
    expect(json.endsWith('],"v":1}')).toBe(true);
    expect(json).not.toMatch(/\s/);
  });

  it("does not depend on the table order", () => {
    expect(
      canonicalTransactionRulesJson([...WALLET_TRANSACTION_RULES].reverse())
    ).toBe(canonicalTransactionRulesJson());
  });

  it("changes with any rule", () => {
    const [first, ...rest] = WALLET_TRANSACTION_RULES;
    const changed = [{ ...first!, value: { min: "0", max: "1" } }, ...rest];
    expect(transactionRulesHash(changed)).not.toBe(
      walletTransactionRulesHash()
    );
    expect(walletTransactionRulesHash()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("matches the shared JSON table and hash", () => {
    expect(readFixture(RULES_FIXTURE, rulesFixture())).toEqual(rulesFixture());
  });
});
