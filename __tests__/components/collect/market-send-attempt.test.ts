import {
  createMarketSendAttempt,
  isMarketSendAttempt,
  isMarketSendRejected,
  marketTransactionDigest,
} from "@/components/collect/market-send-attempt";
import type { ApiMarketTransaction } from "@/generated/models/ApiMarketTransaction";
import { ApiMarketTransactionPurposeEnum } from "@/generated/models/ApiMarketTransaction";

const sender = "0x1111111111111111111111111111111111111111";
const recipient = "0x2222222222222222222222222222222222222222";
const transaction: ApiMarketTransaction = {
  chain_id: 1,
  sender,
  to: recipient,
  data: "0x1234",
  value: "1000",
  purpose: ApiMarketTransactionPurposeEnum.Fulfill,
};

it("persists only a public transaction fingerprint and snapshot, not calldata", () => {
  const attempt = createMarketSendAttempt(transaction, 100);
  expect(isMarketSendAttempt(attempt)).toBe(true);
  expect(attempt.purpose).toBe("TRANSACTION");
  expect(attempt.snapshotBlock).toBe(100);
  expect(attempt.digest).toBe(
    marketTransactionDigest({
      chainId: 1,
      from: sender,
      to: recipient,
      input: "0x1234",
      value: 1000n,
    })
  );
  expect(attempt).not.toHaveProperty("data");
  expect(attempt).not.toHaveProperty("signature");
});

it.each([
  { sender: recipient },
  { to: sender },
  { value: "1001" },
  { data: "0x123400" },
])("binds the attempted transaction fields %s", (change) => {
  expect(
    createMarketSendAttempt({ ...transaction, ...change }, 100).digest
  ).not.toBe(createMarketSendAttempt(transaction, 100).digest);
});

it.each([undefined, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
  "rejects an unsafe recovery block %s before a wallet prompt",
  (block) => {
    expect(() => createMarketSendAttempt(transaction, block)).toThrow();
  }
);
it("rejects another chain before producing a recovery fingerprint", () => {
  expect(() =>
    createMarketSendAttempt({ ...transaction, chain_id: 8453 }, 100)
  ).toThrow();
});
it("distinguishes approvals from economic fulfillment", () => {
  expect(
    createMarketSendAttempt(
      {
        ...transaction,
        purpose: ApiMarketTransactionPurposeEnum.ApproveNft,
      },
      100
    ).purpose
  ).toBe("APPROVAL");
});

it("recognizes explicit EIP-1193 rejection through a wrapped viem cause", () => {
  expect(isMarketSendRejected({ cause: { code: 4001 } })).toBe(true);
});
it.each([
  new Error("User rejected request"),
  new Error("Connection lost after broadcast"),
  { code: -32000 },
  { code: "4001" },
  { cause: { code: 4900 } },
])("keeps an unproven wallet failure unresolved: %s", (error) => {
  expect(isMarketSendRejected(error)).toBe(false);
});
