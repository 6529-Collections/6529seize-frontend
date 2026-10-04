import {
  getAdminAddressError,
  getCreatorAdminRows,
} from "@/components/drop-forge/contract-admins/contract-admins.helpers";
import { zeroAddress } from "viem";
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
