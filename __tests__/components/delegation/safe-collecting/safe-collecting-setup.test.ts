import {
  getSetupChecklist,
  getSetupWalletFacts,
  type SetupWallet,
} from "@/components/delegation/safe-collecting/safe-collecting-setup";
import type { Delegation } from "@/entities/IDelegation";

const VAULT = `0x${"a".repeat(40)}`;
const TRANSACTION = `0x${"b".repeat(40)}`;
const SOCIAL = `0x${"c".repeat(40)}`;
const OUTSIDER = `0x${"d".repeat(40)}`;
const NOW = 1_800_000_000;

const wallets: SetupWallet[] = [
  { wallet: VAULT, display: "vault.eth", tdh: 900 },
  { wallet: TRANSACTION, display: TRANSACTION, tdh: 50 },
  { wallet: SOCIAL, display: "social.eth", tdh: 0 },
];

function row(
  from: string,
  to: string,
  useCase: number,
  expiry = 64_060_588_800
): Delegation {
  return {
    block: 1,
    from_address: from.toUpperCase().replace("0X", "0x"),
    from_display: from,
    to_address: to,
    to_display: to === OUTSIDER ? "outsider.eth" : to,
    collection: "0x8888888888888888888888888888888888888888",
    use_case: useCase,
    expiry,
    token_id: 0,
    all_tokens: true,
  };
}

describe("getSetupWalletFacts", () => {
  it("reads managers, minting and airdrop delegations from both sides", () => {
    const managerRow = row(VAULT, TRANSACTION, 998);
    const mintRow = row(VAULT, SOCIAL, 2);
    const airdropRow = row(VAULT, OUTSIDER, 3);
    const facts = getSetupWalletFacts(
      wallets,
      new Map([
        [VAULT, [managerRow, mintRow, airdropRow]],
        [TRANSACTION, [managerRow]],
        [SOCIAL, [mintRow]],
      ]),
      NOW
    );

    const [vault, transaction, social] = facts;
    expect(vault?.managedBy).toEqual([
      { wallet: TRANSACTION, display: TRANSACTION },
    ]);
    expect(vault?.airdropsTo).toEqual([
      { wallet: OUTSIDER, display: "outsider.eth" },
    ]);
    expect(transaction?.manages).toEqual([
      { wallet: VAULT, display: "vault.eth" },
    ]);
    expect(social?.mintsFor).toEqual([{ wallet: VAULT, display: "vault.eth" }]);
    expect(vault?.airdropsFrom).toEqual([]);
  });

  it("ignores expired delegations but keeps expired managers", () => {
    const facts = getSetupWalletFacts(
      wallets,
      new Map([
        [
          VAULT,
          [
            row(VAULT, TRANSACTION, 998, NOW - 1),
            row(VAULT, OUTSIDER, 3, NOW - 1),
          ],
        ],
        [SOCIAL, [row(VAULT, SOCIAL, 1, NOW - 1)]],
      ]),
      NOW
    );

    expect(facts[0]?.managedBy).toHaveLength(1);
    expect(facts[0]?.airdropsTo).toEqual([]);
    expect(facts[2]?.mintsFor).toEqual([]);
  });

  it("deduplicates counterparts and skips self-delegations", () => {
    const facts = getSetupWalletFacts(
      wallets,
      new Map([
        [
          VAULT,
          [
            row(VAULT, TRANSACTION, 998),
            row(VAULT, TRANSACTION, 998),
            row(VAULT, VAULT, 997),
          ],
        ],
      ]),
      NOW
    );

    expect(facts[0]?.managedBy).toHaveLength(1);
  });
});

it("lists who sends airdrops to a wallet", () => {
  const airdropRow = row(TRANSACTION, VAULT, 3);
  const facts = getSetupWalletFacts(
    wallets,
    new Map([
      [VAULT, [airdropRow]],
      [TRANSACTION, [airdropRow]],
    ]),
    NOW
  );

  expect(facts[0]?.airdropsFrom).toEqual([
    { wallet: TRANSACTION, display: TRANSACTION },
  ]);
  expect(facts[1]?.airdropsTo).toEqual([
    { wallet: VAULT, display: "vault.eth" },
  ]);
});

describe("getSetupChecklist", () => {
  it("reports combined wallets, managed wallets and minting delegators", () => {
    const facts = getSetupWalletFacts(
      wallets,
      new Map([
        [VAULT, [row(VAULT, TRANSACTION, 998)]],
        [SOCIAL, [row(VAULT, SOCIAL, 2)]],
      ]),
      NOW
    );

    expect(getSetupChecklist(facts)).toEqual({
      combined: true,
      managedWallets: [{ wallet: VAULT, display: "vault.eth" }],
      mintDelegators: [{ wallet: VAULT, display: "vault.eth" }],
    });
  });

  it("is empty for a single wallet with no delegations", () => {
    const facts = getSetupWalletFacts(wallets.slice(0, 1), new Map(), NOW);
    expect(getSetupChecklist(facts)).toEqual({
      combined: false,
      managedWallets: [],
      mintDelegators: [],
    });
  });
});
