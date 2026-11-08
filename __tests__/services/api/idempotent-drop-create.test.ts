import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { ApiDropType } from "@/generated/models/ApiDropType";
import {
  postIdempotentDrop,
  withClientDropId,
  withoutClientDropId,
} from "@/services/api/idempotent-drop-create";
import { postDrop } from "@/services/api/signed-drop-writes";

jest.mock("@/services/api/signed-drop-writes", () => ({
  postDrop: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  getStructuredApiErrorStatus: (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : undefined,
}));

const postDropMock = jest.mocked(postDrop);
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const RETRY_DELAY_MS = 1_000;

let messageCount = 0;
/** A chat request with content no other test sends. */
function request(content = `message ${++messageCount}`): ApiCreateDropRequest {
  return {
    wave_id: "wave-1",
    drop_type: ApiDropType.Chat,
    title: null,
    parts: [{ content, media: [], quoted_drop: null }],
    referenced_nfts: [],
    mentioned_users: [],
    mentioned_waves: [],
    metadata: [],
    signature: null,
    is_safe_signature: false,
    signer_address: "",
  };
}
const serverDrop = { id: "server-drop", wave: { id: "wave-1" } } as never;
const timeout = { status: 504 };

const busy = (retryAfter: string) => ({
  status: 503,
  headers: new Headers({ "Retry-After": retryAfter }),
  response: { body: { code: "WRITE_BUSY" } },
});

/** Runs a send through its retry delay. */
async function settle<T>(
  promise: Promise<T>,
  delayMs = RETRY_DELAY_MS
): Promise<T> {
  const settled = promise.then(
    (value) => ({ value }),
    (error: unknown) => ({ error })
  );
  await jest.advanceTimersByTimeAsync(delayMs);
  const result = await settled;
  if ("error" in result) throw result.error;
  return result.value;
}

function sentIds(): Array<string | undefined> {
  return postDropMock.mock.calls.map(([body]) => body.client_drop_id);
}

beforeEach(() => {
  jest.useFakeTimers();
  postDropMock.mockReset();
});
afterEach(() => {
  jest.useRealTimers();
});

it("gives every new message its own client_drop_id", () => {
  const content = request("same text");
  const first = withClientDropId(content);
  const second = withClientDropId(content);

  expect(first.client_drop_id).toMatch(UUID);
  expect(second.client_drop_id).toMatch(UUID);
  expect(second.client_drop_id).not.toBe(first.client_drop_id);
  expect(withClientDropId(first)).toBe(first);
});

it("retries a send whose response was lost with the same id and returns the drop", async () => {
  postDropMock.mockRejectedValueOnce(timeout).mockResolvedValueOnce(serverDrop);

  await expect(settle(postIdempotentDrop(request()))).resolves.toBe(serverDrop);

  expect(postDropMock).toHaveBeenCalledTimes(2);
  const [first, second] = sentIds();
  expect(first).toMatch(UUID);
  expect(second).toBe(first);
  expect(postDropMock.mock.calls[1]?.[0]).toEqual(
    postDropMock.mock.calls[0]?.[0]
  );
});

it("waits for Retry-After before retrying a busy write", async () => {
  postDropMock
    .mockRejectedValueOnce(busy("2"))
    .mockResolvedValueOnce(serverDrop);
  const sent = postIdempotentDrop(request());

  await jest.advanceTimersByTimeAsync(RETRY_DELAY_MS);
  expect(postDropMock).toHaveBeenCalledTimes(1);
  await expect(settle(sent)).resolves.toBe(serverDrop);

  expect(postDropMock).toHaveBeenCalledTimes(2);
  const [first, second] = sentIds();
  expect(second).toBe(first);
});

it("retries an unconfirmed commit once after 1 s with the same id", async () => {
  const unconfirmed = {
    status: 503,
    headers: new Headers(),
    response: { body: { code: "WRITE_OUTCOME_UNKNOWN" } },
  };
  postDropMock
    .mockRejectedValueOnce(unconfirmed)
    .mockResolvedValueOnce(serverDrop);

  await expect(settle(postIdempotentDrop(request()))).resolves.toBe(serverDrop);

  const [first, second] = sentIds();
  expect(second).toBe(first);
});

it("leaves a long Retry-After to the user and keeps the id", async () => {
  const content = request();
  const longBusy = busy("60");
  postDropMock.mockRejectedValue(longBusy);

  await expect(settle(postIdempotentDrop(content), 60_000)).rejects.toBe(
    longBusy
  );

  expect(postDropMock).toHaveBeenCalledTimes(1);
  const [keptId] = sentIds();
  expect(withClientDropId(content).client_drop_id).toBe(keptId);
});

it("keeps the id for a resend of the same content until a send settles", async () => {
  const content = request();
  postDropMock.mockRejectedValue(new TypeError("Failed to fetch"));
  await expect(settle(postIdempotentDrop(content))).rejects.toThrow(
    "Failed to fetch"
  );
  const [failedId] = sentIds();

  // A resend of the same content, signed again or not, reuses the id.
  expect(withClientDropId(content).client_drop_id).toBe(failedId);
  expect(
    withClientDropId({
      ...content,
      device_signature: { kid: "device" } as never,
      signer_address: "0xsigner",
    }).client_drop_id
  ).toBe(failedId);
  // Other content is another message.
  expect(withClientDropId(request()).client_drop_id).not.toBe(failedId);

  postDropMock.mockReset();
  postDropMock.mockResolvedValue(serverDrop);
  await postIdempotentDrop(content);
  expect(sentIds()).toEqual([failedId]);

  // Once it settles, the same text again is a new message.
  expect(withClientDropId(content).client_drop_id).not.toBe(failedId);
});

it.each([
  ["a validation error", { status: 400 }],
  ["a moderation rejection", { status: 422 }],
  [
    "a reused id",
    { status: 409, response: { body: { code: "CLIENT_DROP_ID_REUSED" } } },
  ],
  [
    "a saved drop that could not be read back",
    { status: 409, response: { body: { code: "DROP_SAVED_REFRESH" } } },
  ],
])("neither retries nor keeps the id after %s", async (_label, rejection) => {
  const content = request();
  postDropMock.mockRejectedValue(rejection);

  await expect(settle(postIdempotentDrop(content))).rejects.toBe(rejection);

  expect(postDropMock).toHaveBeenCalledTimes(1);
  const [rejectedId] = sentIds();
  expect(withClientDropId(content).client_drop_id).not.toBe(rejectedId);
});

it("forgets a kept id when a resend is rejected", async () => {
  const content = request();
  postDropMock.mockRejectedValue(timeout);
  await expect(settle(postIdempotentDrop(content))).rejects.toBe(timeout);
  const [keptId] = sentIds();

  postDropMock.mockReset();
  postDropMock.mockRejectedValue({ status: 422 });
  await expect(settle(postIdempotentDrop(content))).rejects.toEqual({
    status: 422,
  });

  expect(sentIds()).toEqual([keptId]);
  expect(withClientDropId(content).client_drop_id).not.toBe(keptId);
});

it("leaves a wallet-signed request unchanged and does not retry it", async () => {
  const signed = { ...request(), signature: "0xsigned" };
  expect(withClientDropId(signed)).toBe(signed);

  postDropMock.mockRejectedValue(timeout);
  await expect(settle(postIdempotentDrop(signed))).rejects.toBe(timeout);
  expect(postDropMock).toHaveBeenCalledTimes(1);
  expect(postDropMock).toHaveBeenCalledWith(signed, {
    errorMode: "structured",
  });
});

it("retries a wallet-signed request that was signed with its id", async () => {
  const signed = { ...withClientDropId(request()), signature: "0xsigned" };
  postDropMock.mockRejectedValueOnce(timeout).mockResolvedValueOnce(serverDrop);

  await expect(settle(postIdempotentDrop(signed))).resolves.toBe(serverDrop);

  expect(postDropMock).toHaveBeenCalledTimes(2);
  expect(postDropMock.mock.calls[1]?.[0]).toBe(signed);
});

it("strips the id for endpoints with their own idempotency key", () => {
  const withId = withClientDropId(request());
  const stripped = withoutClientDropId(withId);
  expect(stripped).not.toHaveProperty("client_drop_id");
  expect(stripped.parts).toBe(withId.parts);
});
