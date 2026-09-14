import {
  collectProfileWallets,
  defaultCollectRecipient,
  isCollectProfileWallet,
} from "@/components/collect/collect-recipient.helpers";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getAddress } from "viem";

const primary = "0x52908400098527886e0f7030069857d2e4169ee7";
const custody = "0xde709f2102306220921060314715629080e2fb77";
const outsider = "0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed";
const profile = {
  primary_wallet: primary,
  wallets: [{ wallet: primary }, { wallet: custody }],
} as ApiIdentity;

it("defaults to the confirmed payer, then confirmed primary, then the first listed wallet", () => {
  expect(defaultCollectRecipient(profile, custody)).toBe(getAddress(custody));
  expect(defaultCollectRecipient(profile, outsider)).toBe(getAddress(primary));
  expect(
    defaultCollectRecipient({ ...profile, primary_wallet: outsider }, outsider)
  ).toBe(getAddress(primary));
});

it("rejects zero or malformed wallets and deduplicates case-insensitively", () => {
  expect(
    collectProfileWallets({
      ...profile,
      wallets: [
        { wallet: primary },
        { wallet: getAddress(primary) },
        { wallet: "0x0000000000000000000000000000000000000000" },
        { wallet: "invalid" },
      ],
    } as ApiIdentity).map(({ wallet }) => wallet)
  ).toEqual([getAddress(primary)]);
  expect(isCollectProfileWallet(null, outsider)).toBe(false);
  expect(
    defaultCollectRecipient({
      ...profile,
      primary_wallet: "invalid",
      wallets: [],
    })
  ).toBe("");
});
