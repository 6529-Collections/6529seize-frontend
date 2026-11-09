import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import {
  canManageGivenRatings,
  isRatingValue,
  getRatingRecipient,
  withRatingRecipientIdentity,
} from "@/components/user/rep/ratingsManagement";

const owner = { id: "owner", handle: "owner" } as ApiIdentity;
const visitor = { id: "visitor", handle: "visitor" } as ApiIdentity;

it("only grants management to the connected owner outside proxy mode", () => {
  expect(canManageGivenRatings(owner, owner, null)).toBe(true);
  expect(canManageGivenRatings(owner, visitor, null)).toBe(false);
  expect(canManageGivenRatings(owner, null, null)).toBe(false);
  expect(
    canManageGivenRatings({ ...owner, id: null }, { ...owner, id: null }, null)
  ).toBe(false);
  expect(canManageGivenRatings(owner, owner, {} as ApiProfileProxy)).toBe(
    false
  );
  expect(canManageGivenRatings(owner, { ...owner, handle: null }, null)).toBe(
    false
  );
});

it.each(["", "-", "1.5", "1e3", "NaN", "9007199254740992"])(
  "rejects incomplete or unsafe rating %s",
  (value) => {
    expect(isRatingValue(value)).toBe(false);
  }
);

it.each(["0", "-50", "6529", "9007199254740991"])(
  "accepts complete signed integer %s",
  (value) => {
    expect(isRatingValue(value)).toBe(true);
  }
);

it("resolves a wallet-only recipient with a null handle", () => {
  const wallet = "0x0000000000000000000000000000000000000001";
  const recipient = getRatingRecipient({
    handle: null,
    wallets: [wallet],
    profile_id: "recipient",
  });
  expect(recipient.identity).toBe(wallet);
  expect(recipient.display).not.toBe(wallet);
  const profile = withRatingRecipientIdentity(
    { ...owner, query: null, handle: null, display: "Recipient display" },
    recipient.identity
  );
  expect(profile.query).toBe(wallet);
});
