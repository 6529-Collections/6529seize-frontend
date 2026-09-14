import {
  collectAllocationIssue,
  collectAllocationQuantity,
  collectBatchEthAmount,
} from "@/components/collect/collect-batch-review.helpers";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

const payer = "0x1111111111111111111111111111111111111111";
const fren = "0x2222222222222222222222222222222222222222";
const profile = {
  id: "profile",
  primary_wallet: payer,
  wallets: [{ wallet: payer, display: payer, tdh: 0 }],
} as ApiIdentity;

it.each([
  "",
  "0",
  "-1",
  "01",
  "1.5",
  "1e2",
  " 1",
  "1 ",
  (2n ** 256n).toString(),
])("rejects an invalid copy count %s", (value) => {
  expect(collectAllocationQuantity(value)).toBeNull();
});
it("compares large allocation totals exactly without number rounding", () => {
  const count = "9007199254740993";
  const allocations = [
    { recipient: payer, quantity: count, acknowledgeExternalRecipient: false },
    { recipient: fren, quantity: "2", acknowledgeExternalRecipient: true },
  ];
  expect(
    collectAllocationIssue(allocations, "9007199254740995", profile)
  ).toBeNull();
  expect(collectAllocationIssue(allocations, "9007199254740994", profile)).toBe(
    "quantity"
  );
});
it("does not allow legacy primary fallback to override an authoritative nonempty wallet list", () => {
  const changed = {
    ...profile,
    wallets: [{ wallet: fren, display: fren, tdh: 0 }],
  };
  expect(
    collectAllocationIssue(
      [
        {
          recipient: payer,
          quantity: "1",
          acknowledgeExternalRecipient: false,
        },
      ],
      "1",
      changed
    )
  ).toBe("consent");
});
it("formats exact ETH decimals for the browser locale", () => {
  expect(collectBatchEthAmount("de-DE", "100000000000000001")).toBe(
    "0,100000000000000001 ETH"
  );
});
