import { chainRelay } from "@/lib/chain-identity/relay";
import {
  commonApiDeleteWithResponse,
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";
import {
  IDENTITY_WALLET,
  JOIN_EXPIRES_AT,
  JOIN_PRINCIPAL,
  joinDraft,
  JOINING_WALLET,
} from "./joinFixture";

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(async () => ({})),
  commonApiFetch: jest.fn(async () => ({ data: [] })),
  commonApiDeleteWithResponse: jest.fn(async () => ({})),
}));

const SIG = `0x${"12".repeat(65)}` as const;

beforeEach(() => jest.clearAllMocks());

it("holds a join with the draft's own signers and expiry, in the relay's fields", async () => {
  const draft = joinDraft();
  await chainRelay.hold(draft, [{ role: 0, key_type: 1, sig: SIG }]);
  expect(commonApiPost).toHaveBeenCalledWith({
    endpoint: "chain/pending",
    errorMode: "structured",
    body: {
      tx_id: draft.txId,
      op_type: "IDENTITY_JOIN",
      principal: JOIN_PRINCIPAL,
      unsigned: draft.unsigned,
      typed_data: draft.typedData,
      expires_at: JOIN_EXPIRES_AT,
      required: [
        { role: 0, key_type: 1, signer: IDENTITY_WALLET },
        { role: 4, key_type: 1, signer: JOINING_WALLET },
      ],
      signatures: [{ role: 0, key_type: 1, sig: SIG }],
    },
  });
});

it("lists, reads, signs, retries and cancels held operations", async () => {
  const txId = joinDraft().txId;
  await expect(chainRelay.waiting()).resolves.toEqual([]);
  expect(commonApiFetch).toHaveBeenLastCalledWith({
    endpoint: "chain/pending",
    errorMode: "structured",
    signal: undefined,
  });
  await chainRelay.get(txId);
  expect(commonApiFetch).toHaveBeenLastCalledWith({
    endpoint: `chain/pending/${txId}`,
    errorMode: "structured",
    signal: undefined,
  });
  await chainRelay.sign(txId, { role: 4, key_type: 1, sig: SIG });
  expect(commonApiPost).toHaveBeenLastCalledWith({
    endpoint: `chain/pending/${txId}/signatures`,
    errorMode: "structured",
    body: { role: 4, key_type: 1, sig: SIG },
  });
  await chainRelay.retry(txId);
  expect(commonApiPost).toHaveBeenLastCalledWith(
    expect.objectContaining({ endpoint: `chain/pending/${txId}/retry` })
  );
  await chainRelay.cancel(txId);
  expect(commonApiDeleteWithResponse).toHaveBeenCalledWith({
    endpoint: `chain/pending/${txId}`,
    errorMode: "structured",
  });
});

it("turns any failed relay call into a ChainRelayError with its status", async () => {
  jest
    .mocked(commonApiPost)
    .mockRejectedValueOnce(
      Object.assign(new Error("Forbidden"), { status: 403 })
    );
  await expect(
    chainRelay.sign(joinDraft().txId, { role: 4, key_type: 1, sig: SIG })
  ).rejects.toMatchObject({ name: "ChainRelayError", status: 403 });
  jest.mocked(commonApiFetch).mockRejectedValueOnce(new Error("offline"));
  await expect(chainRelay.waiting()).rejects.toMatchObject({
    name: "ChainRelayError",
    status: 0,
  });
});
