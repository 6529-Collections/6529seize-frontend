import { ratingDraft } from "./chainDraftFixture";
import { chainGateway, ChainGatewayError } from "@/lib/chain-identity/gateway";
import { awaitFinal, submitAndAwait } from "@/lib/chain-identity/operation";

jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGateway: { submit: jest.fn(), getTx: jest.fn() },
}));

const gateway = chainGateway as unknown as Record<string, jest.Mock>;
const blip = () => new ChainGatewayError(0, "network", "no answer");
const SIG = { role: 0, keyType: 1, sig: `0x${"12".repeat(65)}` } as const;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

/** Runs a promise while the fake clock moves the polls along. */
async function settle<T>(promise: Promise<T>): Promise<T> {
  let outcome: { ok: true; value: T } | { ok: false; error: unknown } | null =
    null;
  void promise.then(
    (value) => {
      outcome = { ok: true, value };
    },
    (error: unknown) => {
      outcome = { ok: false, error };
    }
  );
  while (outcome === null) {
    await jest.advanceTimersByTimeAsync(3_000);
  }
  const settled = outcome as
    | { ok: true; value: T }
    | { ok: false; error: unknown };
  if (!settled.ok) {
    throw settled.error;
  }
  return settled.value;
}

it("reads past a network blip while it waits: the change may still land", async () => {
  const draft = ratingDraft();
  gateway["getTx"]!.mockRejectedValueOnce(blip())
    .mockResolvedValueOnce({ status: "pending" })
    .mockResolvedValue({ status: "final", height: 12 });
  await expect(settle(awaitFinal(draft.txId))).resolves.toMatchObject({
    status: "final",
  });
  expect(gateway["getTx"]).toHaveBeenCalledTimes(3);
});

it("looks for a change whose submit got no answer before it says anything", async () => {
  const draft = ratingDraft();
  gateway["submit"]!.mockRejectedValue(blip());
  gateway["getTx"]!.mockResolvedValueOnce(null).mockResolvedValue({
    status: "final",
    height: 12,
  });
  await expect(settle(submitAndAwait(draft, [SIG]))).resolves.toMatchObject({
    status: "final",
  });
});

it("never calls an unanswered change unsent: it says to check first", async () => {
  const draft = ratingDraft();
  gateway["submit"]!.mockRejectedValue(blip());
  gateway["getTx"]!.mockResolvedValue(null);
  const outcome = settle(submitAndAwait(draft, [SIG])).catch(
    (error: unknown) => error
  );
  await expect(outcome).resolves.toMatchObject({
    reason: "timeout",
    resultName: "UNCONFIRMED",
  });
  // About half a minute of looking, not the full wait.
  expect(gateway["getTx"]).toHaveBeenCalledTimes(10);
});

it("passes a refusal at submit straight through", async () => {
  const draft = ratingDraft();
  gateway["submit"]!.mockRejectedValue(
    new ChainGatewayError(422, "inadmissible", "0x2103 HANDLE_TAKEN, detail 1")
  );
  await expect(submitAndAwait(draft, [SIG])).rejects.toMatchObject({
    status: 422,
  });
  expect(gateway["getTx"]).not.toHaveBeenCalled();
});
