import { knownMarketTransactionHash } from "@/components/collect/market-known-transaction";
import type { MarketSendAttempt } from "@/components/collect/market-send-attempt";

const hash = `0x${"a".repeat(64)}` as const;
const otherHash = `0x${"b".repeat(64)}` as const;
const actor = { profile_id: "profile", wallet: `0x${"1".repeat(40)}` };
const attempt: MarketSendAttempt = {
  id: "attempt-one",
  purpose: "APPROVAL",
  digest: hash,
  snapshotBlock: 100,
  walletRequested: true,
  expectedRevision: "revision",
};
const saved = { request: actor, sendAttempt: attempt, approvalHash: hash };

it("recovers an approval hash from its exact active saved attempt", () => {
  expect(knownMarketTransactionHash(actor, attempt, saved)).toBe(hash);
});

it("does not reuse an approval hash for the later fulfillment", () => {
  expect(
    knownMarketTransactionHash(
      actor,
      { ...attempt, purpose: "TRANSACTION" },
      saved
    )
  ).toBeUndefined();
});

it.each(["id", "digest", "profile", "wallet"])(
  "rejects a saved hash when the %s binding differs",
  (field) => {
    const changed = {
      ...saved,
      request: { ...actor },
      sendAttempt: { ...attempt },
    };
    if (field === "id") changed.sendAttempt.id = "old-attempt";
    if (field === "digest") changed.sendAttempt.digest = otherHash;
    if (field === "profile") changed.request.profile_id = "another-profile";
    if (field === "wallet") changed.request.wallet = `0x${"2".repeat(40)}`;
    expect(knownMarketTransactionHash(actor, attempt, changed)).toBeUndefined();
  }
);

it("prefers the active server attempt hash without a local journal", () => {
  expect(
    knownMarketTransactionHash(
      {
        ...actor,
        send_attempt: {
          attempt_id: attempt.id,
          purpose: attempt.purpose,
          transaction_digest: attempt.digest,
          status: "ACTIVE",
          transaction_hash: otherHash,
        },
      },
      attempt,
      saved
    )
  ).toBe(otherHash);
});

it("does not reuse a previous root hash while a different attempt is active", () => {
  expect(
    knownMarketTransactionHash(
      { ...actor, transaction_hash: hash },
      attempt,
      null
    )
  ).toBeUndefined();
});

it("keeps a submitted transaction hash once no unresolved attempt remains", () => {
  expect(
    knownMarketTransactionHash(
      { ...actor, transaction_hash: hash },
      undefined,
      null
    )
  ).toBe(hash);
});

it.each(["0x1234", "not-a-hash"])(
  "does not hide recovery for malformed hash %s",
  (value) => {
    expect(
      knownMarketTransactionHash(actor, attempt, {
        ...saved,
        approvalHash: value,
      })
    ).toBeUndefined();
  }
);
