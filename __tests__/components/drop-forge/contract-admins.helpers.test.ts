import {
  getAdminAddressError,
  getCreatorAdminRows,
  getAdminValidationMessage,
} from "@/components/drop-forge/contract-admins/contract-admins.helpers";
import { getAddress, zeroAddress } from "viem";
const owner = "0x0000000000000000000000000000000000000001";
const admin = "0x0000000000000000000000000000000000000002";
it("puts the owner first and deduplicates the onchain list", () => {
  expect(getCreatorAdminRows(owner, [admin, owner, admin])).toEqual([
    { address: owner, isOwner: true },
    { address: admin, isOwner: false },
  ]);
});
it.each(["", "prxt0.eth", "0x123", zeroAddress, owner, admin])(
  "rejects invalid, unresolved, or existing admin %s",
  (address) => {
    expect(getAdminAddressError(address, owner, [admin])).not.toBeNull();
  }
);
it("accepts a new address", () =>
  expect(
    getAdminAddressError("0x0000000000000000000000000000000000000003", owner, [
      admin,
    ])
  ).toBeNull());

it("deduplicates addresses with different casing", () => {
  const mixed = getAddress("0x1234567890abcdef1234567890abcdef12345678");
  expect(
    getCreatorAdminRows(mixed, [mixed.toLowerCase() as `0x${string}`, mixed])
  ).toEqual([{ address: mixed, isOwner: true }]);
});

it.each([
  [true, "prxt0.eth", null, "", "Resolving ENS..."],
  [true, "prxt0.eth", "Invalid", "", "Resolving ENS..."],
  [
    false,
    "invalid.eth",
    "Unable to resolve this ENS name.",
    "",
    "Unable to resolve this ENS name.",
  ],
  [false, "prxt0.eth", null, admin, admin],
  [false, "", "Invalid", "", ""],
] as const)(
  "describes validation state %#",
  (resolving, input, error, address, expected) => {
    expect(getAdminValidationMessage(resolving, input, error, address)).toBe(
      expected
    );
  }
);

it("rejects unresolved ENS at the address-validation boundary", () => {
  expect(getAdminAddressError("prxt0.eth", owner, [admin])).toBe(
    "Enter a valid wallet address or a resolvable ENS name."
  );
});
