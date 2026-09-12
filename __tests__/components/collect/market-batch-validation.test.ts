import {
  validateMarketBatchOperation,
  validateMarketBatchRequest,
  marketBatchReviewTerms,
} from "@/components/collect/market-batch-validation";
import { batchFixture, PAYER, FREN, NOW, MAKER } from "./market-batch.fixture";
import { MARKET_ZERO } from "@/components/collect/market-validation";

function validate(f: ReturnType<typeof batchFixture>) {
  validateMarketBatchOperation(f.operation, f.request, [PAYER], NOW);
}
it("accepts exact mixed ERC721 and partial ERC1155 allocations in one native transaction", () =>
  expect(() => validate(batchFixture())).not.toThrow());
it.each([
  [
    "omitted seller",
    (f) => {
      f.orders.splice(0, 1);
    },
  ],
  [
    "partial mirror",
    (f) => {
      f.orders[2]!.numerator = 0n;
    },
  ],
  [
    "signed buyer mirror",
    (f) => {
      f.orders[2]!.signature = "0x1234";
    },
  ],
  [
    "wrong recipient",
    (f) => {
      f.orders[2]!.parameters.consideration[0]!.recipient = MAKER;
    },
  ],
  [
    "unpaid fee",
    (f) => {
      f.fulfillments.pop();
    },
  ],
  [
    "duplicate payment",
    (f) => {
      f.fulfillments.push(f.fulfillments[3]!);
    },
  ],
  [
    "partial NFT",
    (f) => {
      f.orders[1]!.numerator = 1n;
    },
  ],
  [
    "replaced seller",
    (f) => {
      f.orders[0]!.parameters.offerer = FREN;
    },
  ],
  [
    "shifted price",
    (f) => {
      f.orders[0]!.parameters.consideration[0]!.startAmount = 91n;
    },
  ],
  [
    "wrong asset",
    (f) => {
      f.orders[1]!.parameters.offer[0]!.identifierOrCriteria = 74n;
    },
  ],
  [
    "mapping to wrong seller",
    (f) => {
      f.fulfillments[0]!.offerComponents[0]!.orderIndex = 1n;
    },
  ],
] satisfies Array<[string, (f: ReturnType<typeof batchFixture>) => void]>)(
  "rejects %s",
  (_name, mutate) => {
    const f = batchFixture();
    mutate(f);
    f.reencode();
    expect(() => validate(f)).toThrow();
  }
);
it.each(["quantity", "amount_wei", "asset_key"] as const)(
  "rejects a changed displayed %s",
  (field) => {
    const f = batchFixture();
    f.operation.items[0]![field] += "1";
    expect(() => validate(f)).toThrow();
  }
);
it("rejects approvals, gas under-reservation, extra calldata and foreign chains", () => {
  for (const mutate of [
    (f: ReturnType<typeof batchFixture>) =>
      f.operation.approval_transactions.push(f.operation.transaction!),
    (f: ReturnType<typeof batchFixture>) => {
      f.operation.transaction!.gas_reserve_wei = "1";
    },
    (f: ReturnType<typeof batchFixture>) => {
      f.operation.transaction!.data += "00";
    },
    (f: ReturnType<typeof batchFixture>) => {
      f.operation.transaction!.chain_id = 10;
    },
  ]) {
    const f = batchFixture();
    mutate(f);
    expect(() => validate(f)).toThrow();
  }
});
it("rejects missing external consent and profile membership changes", () => {
  const f = batchFixture();
  f.request.items[0]!.allocations[0]!.acknowledge_external_recipient = false;
  expect(() => validate(f)).toThrow();
  expect(() => validateMarketBatchRequest(f.request, [FREN])).toThrow();
});
it("rejects stale review, invalid amount units, duplicate exact orders and allocation oversubscription", () => {
  for (const mutate of [
    (f: ReturnType<typeof batchFixture>) => {
      f.operation.expires_at = NOW;
    },
    (f: ReturnType<typeof batchFixture>) => {
      f.request.items[0]!.quantity = "1.0";
    },
    (f: ReturnType<typeof batchFixture>) => {
      f.request.items.push(f.request.items[0]!);
    },
    (f: ReturnType<typeof batchFixture>) => {
      f.request.items[0]!.allocations[0]!.quantity = "2";
    },
    (f: ReturnType<typeof batchFixture>) => {
      f.request.items[0]!.allocations[0]!.recipient = MARKET_ZERO;
    },
  ]) {
    const f = batchFixture();
    mutate(f);
    expect(() => validate(f)).toThrow();
  }
});
it("binds review comparison to per-NFT destination, price and gas while allowing new authorization bytes", () => {
  const f = batchFixture(),
    before = marketBatchReviewTerms(f.operation);
  f.operation.transaction!.data += "00";
  expect(marketBatchReviewTerms(f.operation)).toBe(before);
  f.operation.items[0]!.allocations[0]!.recipient = PAYER;
  expect(marketBatchReviewTerms(f.operation)).not.toBe(before);
});
