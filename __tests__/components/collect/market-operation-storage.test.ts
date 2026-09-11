import {
  readMarketIntent,
  saveMarketIntent,
} from "@/components/collect/market-operation-storage";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";

const request = {
  profile_id: "profile",
  wallet: "0x1111111111111111111111111111111111111111",
  recipient: "0x1111111111111111111111111111111111111111",
  currency: "0x0000000000000000000000000000000000000000",
  kind: "BUY",
  quantity: "1",
  asset_key: "1:nft:1",
  amount_wei: "1",
  acknowledge_external_recipient: false,
} as ApiMarketPrepareRequest;
const hash = `0x${"b".repeat(64)}` as const;
afterEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
});
it.each(["transactionHash", "approvalHash"] as const)(
  "keeps %s in memory when browser storage fails after sending",
  (field) => {
    const id = `failed-${field}`;
    expect(saveMarketIntent("profile", id, { request })).toBe(true);
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(saveMarketIntent("profile", id, { request, [field]: hash })).toBe(
      false
    );
    expect(readMarketIntent("profile", id)?.[field]).toBe(hash);
  }
);
it("keeps a different profile from recovering the original intent", () => {
  saveMarketIntent("profile", "owned", { request, transactionHash: hash });
  expect(readMarketIntent("other-profile", "owned")).toBeNull();
});
