import {
  readMarketIntent,
  saveMarketIntent,
} from "@/components/collect/market-operation-storage";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import { createMarketSendAttempt } from "@/components/collect/market-send-attempt";
import { ApiMarketTransactionPurposeEnum } from "@/generated/models/ApiMarketTransaction";

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

it("recovers an unresolved send marker after a reload with no in-memory state", () => {
  const sendAttempt = createMarketSendAttempt(
    {
      chain_id: 1,
      sender: request.wallet,
      to: request.wallet,
      data: "0x1234",
      value: "1",
      purpose: ApiMarketTransactionPurposeEnum.Fulfill,
    },
    100
  );
  localStorage.setItem(
    "6529-market:profile:reloaded",
    JSON.stringify({
      request,
      sendAttempt: { ...sendAttempt, walletRequested: true },
    })
  );
  expect(readMarketIntent("profile", "reloaded")?.sendAttempt).toEqual({
    ...sendAttempt,
    walletRequested: true,
  });
});

it("keeps an acknowledged send marker in memory if storage fails later", () => {
  const sendAttempt = createMarketSendAttempt(
    {
      chain_id: 1,
      sender: request.wallet,
      to: request.wallet,
      data: "0x",
      value: "1",
      purpose: ApiMarketTransactionPurposeEnum.Fulfill,
    },
    100
  );
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  expect(
    saveMarketIntent("profile", "attempt-failed", { request, sendAttempt })
  ).toBe(false);
  expect(readMarketIntent("profile", "attempt-failed")?.sendAttempt).toEqual(
    sendAttempt
  );
});
