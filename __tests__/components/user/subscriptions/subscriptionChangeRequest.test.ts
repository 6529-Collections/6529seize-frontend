import {
  postSubscriptionChange,
  subscriptionSigningToast,
} from "@/components/user/subscriptions/subscriptionChangeRequest";
import { publicEnv } from "@/config/env";
import { readUsableDeviceGrant } from "@/lib/device-signing/device-key-store";
import { fetchRecordAnchor } from "@/lib/signed-records/record-anchor";
import {
  encodeSignedRecordsHeader,
  type SignedRecordEvent,
} from "@/lib/signed-records/record-event";
import { signRecords } from "@/lib/signed-records/sign-records";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { getWalletAddress } from "@/services/auth/auth.utils";

// The flag is read when a change is sent; other modules read the rest of
// the public env when they load.
jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return { ...actual, publicEnv: { ...actual.publicEnv } };
});
jest.mock("@/services/auth/auth.utils", () => ({
  getWalletAddress: jest.fn(),
}));
jest.mock("@/lib/device-signing/device-key-store", () => ({
  readUsableDeviceGrant: jest.fn(),
}));
jest.mock("@/lib/signed-records/record-anchor", () => ({
  fetchRecordAnchor: jest.fn(),
}));
jest.mock("@/lib/signed-records/sign-records", () => ({
  ...jest.requireActual("@/lib/signed-records/sign-records"),
  signRecords: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  ...jest.requireActual("@/services/api/common-api"),
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

const env = publicEnv as { NEXT_PUBLIC_FEATURE_SIGNED_SUBSCRIPTIONS?: string };
const post = jest.mocked(commonApiPost);
const fetchApi = jest.mocked(commonApiFetch);
const sign = jest.mocked(signRecords);
const wallet = jest.mocked(getWalletAddress);
const usableGrant = jest.mocked(readUsableDeviceGrant);
const freshAnchor = jest.mocked(fetchRecordAnchor);

const WALLET = "0x00000000000000000000000000000000000000c1";
const OTHER_WALLET = "0x00000000000000000000000000000000000000c2";
const PRINCIPAL = `0x${"c1".padStart(64, "0")}`;
const CONTRACT = "0x33FD426905F149f8376e227d0C9D3340AaD17aF1";
const ENDPOINT = `subscriptions/${WALLET}/subscription`;
const BODY = { contract: CONTRACT, token_id: 581, subscribed: true };
const CARD = {
  type: "subs.card" as const,
  contract: CONTRACT,
  tokenId: 581,
  subscribed: true,
};
const EVENT = { id: `0x${"e".repeat(64)}` } as SignedRecordEvent;
const FRESH_EVENT = { id: `0x${"f".repeat(64)}` } as SignedRecordEvent;
const headersOf = (event: SignedRecordEvent) => ({
  "x-6529-signed-records": encodeSignedRecordsHeader([event]),
});

function structuredError(status: number, code?: string) {
  return Object.assign(new Error("refused"), {
    name: "ApiError",
    status,
    response: { status, body: JSON.stringify({ error: "refused", code }) },
  });
}

const send = () =>
  postSubscriptionChange({ endpoint: ENDPOINT, body: BODY, change: CARD });

beforeEach(() => {
  jest.resetAllMocks();
  env.NEXT_PUBLIC_FEATURE_SIGNED_SUBSCRIPTIONS = "true";
  wallet.mockReturnValue(WALLET);
  usableGrant.mockResolvedValue({} as never);
  // GET /signed-records/owners: the owner and the height it was read at.
  fetchApi.mockResolvedValue({
    anchor: 1000,
    owners: [{ wallet: WALLET, owner: PRINCIPAL }],
  });
  freshAnchor.mockResolvedValue({
    anchor: 1010,
    finalizedTime: 0,
    maxAnchorLag: 120,
  });
  sign.mockResolvedValue({ status: "signed", events: [EVENT], grantId: "g" });
  post.mockResolvedValue({ subscribed: true });
});

afterAll(() => {
  delete env.NEXT_PUBLIC_FEATURE_SIGNED_SUBSCRIPTIONS;
});

describe("postSubscriptionChange", () => {
  it("sends today's request when signed subscriptions are off", async () => {
    delete env.NEXT_PUBLIC_FEATURE_SIGNED_SUBSCRIPTIONS;
    await expect(send()).resolves.toEqual({ subscribed: true });
    expect(post.mock.calls[0]![0]).toStrictEqual({
      endpoint: ENDPOINT,
      body: BODY,
    });
    expect(sign).not.toHaveBeenCalled();
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it.each([
    [
      "a card",
      CARD,
      ["subs.card", `${CONTRACT.toLowerCase()}:581`],
      { subscribed: true },
    ],
    [
      "a count",
      { type: "subs.count" as const, contract: CONTRACT, tokenId: 9, count: 3 },
      ["subs.count", `${CONTRACT.toLowerCase()}:9`],
      { count: 3 },
    ],
    [
      "the mode",
      { type: "subs.mode" as const, automatic: false },
      ["subs.mode"],
      { automatic: false },
    ],
    [
      "the edition preference",
      { type: "subs.all-editions" as const, all: true },
      ["subs.all-editions"],
      { all: true },
    ],
  ])(
    "signs %s in the owner's ps stream at the height the owner was read, and sends it in the header",
    async (_name, change, refs, body) => {
      await postSubscriptionChange({ endpoint: ENDPOINT, body: BODY, change });
      expect(fetchApi).toHaveBeenCalledWith({
        endpoint: "signed-records/owners",
        params: { wallets: WALLET },
        includeWalletAuth: false,
        cache: "no-store",
        errorMode: "structured",
      });
      expect(sign).toHaveBeenCalledWith(
        [{ kind: 9, wave: `ps/${PRINCIPAL}`, refs, body }],
        { anchor: 1000 }
      );
      expect(freshAnchor).not.toHaveBeenCalled();
      expect(post).toHaveBeenCalledWith({
        endpoint: ENDPOINT,
        body: BODY,
        headers: headersOf(EVENT),
        errorMode: "structured",
      });
    }
  );

  it("writes a wallet bound to no principal into its own stream", async () => {
    fetchApi.mockResolvedValue({
      anchor: 1000,
      owners: [{ wallet: WALLET, owner: WALLET }],
    });
    await send();
    expect(sign.mock.calls[0]![0][0]!.wave).toBe(`ps/${WALLET}`);
  });

  it("sends the change unsigned when this browser has no usable grant, asking the API for nothing", async () => {
    usableGrant.mockResolvedValue(null);
    await send();
    expect(fetchApi).not.toHaveBeenCalled();
    expect(sign).not.toHaveBeenCalled();
    expect(post.mock.calls[0]![0]).toStrictEqual({
      endpoint: ENDPOINT,
      body: BODY,
      errorMode: "structured",
    });
  });

  it.each([
    [
      "the owner request fails",
      () => fetchApi.mockRejectedValue(new Error("503")),
    ],
    [
      "the API names no owner for the wallet",
      () => fetchApi.mockResolvedValue({ anchor: 1000, owners: [] }),
    ],
    [
      "the API names another wallet as the owner",
      () =>
        fetchApi.mockResolvedValue({
          anchor: 1000,
          owners: [{ wallet: WALLET, owner: OTHER_WALLET }],
        }),
    ],
    [
      "the API names no height",
      () =>
        fetchApi.mockResolvedValue({
          owners: [{ wallet: WALLET, owner: PRINCIPAL }],
        }),
    ],
    [
      "the signer times out",
      () => sign.mockResolvedValue({ status: "failed", reason: "timeout" }),
    ],
    [
      "the signer finds no grant",
      () => sign.mockResolvedValue({ status: "no-grant" }),
    ],
  ])(
    "sends the change unsigned when %s, so a gateway blip never stops it before the switch",
    async (_name, arrange) => {
      arrange();
      await expect(send()).resolves.toEqual({ subscribed: true });
      expect(post).toHaveBeenCalledTimes(1);
      expect(post.mock.calls[0]![0]).not.toHaveProperty("headers");
    }
  );

  it("after the switch, asks to try again when the change went unsigned for want of an owner or height", async () => {
    fetchApi.mockRejectedValue(new Error("503"));
    post.mockRejectedValue(structuredError(409, "SIGNED_RECORD_REQUIRED"));
    await expect(send()).rejects.toMatchObject({
      name: "SubscriptionSigningFailedError",
    });
  });

  it("after the switch, asks to turn on signing when the change went unsigned for want of a grant", async () => {
    usableGrant.mockResolvedValue(null);
    post.mockRejectedValue(structuredError(409, "SIGNED_RECORD_REQUIRED"));
    await expect(send()).rejects.toMatchObject({
      name: "SubscriptionSigningRequiredError",
    });
  });

  it("signs again once at a fresh height when the API holds a newer change", async () => {
    post
      .mockRejectedValueOnce(structuredError(409, "STALE_SIGNED_RECORD"))
      .mockResolvedValueOnce({ subscribed: true });
    sign
      .mockResolvedValueOnce({
        status: "signed",
        events: [EVENT],
        grantId: "g",
      })
      .mockResolvedValueOnce({
        status: "signed",
        events: [FRESH_EVENT],
        grantId: "g",
      });
    await expect(send()).resolves.toEqual({ subscribed: true });
    expect(freshAnchor).toHaveBeenCalledWith(expect.any(Number), {
      fresh: true,
    });
    expect(
      sign.mock.calls.map(([drafts, options]) => [drafts[0]!.wave, options])
    ).toEqual([
      [`ps/${PRINCIPAL}`, { anchor: 1000 }],
      [`ps/${PRINCIPAL}`, { anchor: 1010 }],
    ]);
    expect(post.mock.calls.map(([request]) => request.headers)).toEqual([
      headersOf(EVENT),
      headersOf(FRESH_EVENT),
    ]);
  });

  it("gives up after the one fresh try, and when no fresh height can be had", async () => {
    const stale = structuredError(409, "STALE_SIGNED_RECORD");
    const staleAgain = structuredError(409, "STALE_SIGNED_RECORD");
    post.mockRejectedValueOnce(stale).mockRejectedValueOnce(staleAgain);
    await expect(send()).rejects.toBe(staleAgain);
    expect(post).toHaveBeenCalledTimes(2);

    post.mockReset().mockRejectedValueOnce(stale);
    freshAnchor.mockRejectedValueOnce(new Error("503"));
    await expect(send()).rejects.toBe(stale);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("passes any other refusal on as it came, a signed change's 409 included", async () => {
    for (const refusal of [
      structuredError(400, "INVALID_SIGNED_RECORD"),
      structuredError(409, "SIGNED_RECORD_REQUIRED"),
    ]) {
      post.mockReset().mockRejectedValueOnce(refusal);
      await expect(send()).rejects.toBe(refusal);
    }
  });
});

/** The error postSubscriptionChange rejects with, once arranged. */
async function rejection(): Promise<unknown> {
  try {
    await send();
  } catch (error) {
    return error;
  }
  throw new Error("expected a rejection");
}

describe("subscriptionSigningToast", () => {
  it("asks to try again when an unsigned change needed a signature", async () => {
    sign.mockResolvedValue({ status: "failed", reason: "crypto-error" });
    post.mockRejectedValue(structuredError(409, "SIGNED_RECORD_REQUIRED"));
    expect(subscriptionSigningToast(await rejection(), "en-US")).toEqual({
      type: "error",
      title: "Couldn't sign this change.",
      description: "Nothing was changed. Try again in a moment.",
    });
  });

  it("offers to turn on signed posts when the browser has no grant", async () => {
    usableGrant.mockResolvedValue(null);
    post.mockRejectedValue(structuredError(409, "SIGNED_RECORD_REQUIRED"));
    expect(subscriptionSigningToast(await rejection(), "en-US")).toEqual({
      type: "error",
      title: "Subscription changes are signed now.",
      description:
        "Turn on signed posts in this browser, then make the change again.",
      action: {
        label: "Turn on signed posts",
        href: "/preferences?tab=devices",
      },
    });
  });

  it("leaves other errors to the caller", async () => {
    post.mockRejectedValue(structuredError(400, "BALANCE"));
    expect(subscriptionSigningToast(await rejection(), "en-US")).toBeNull();
    expect(subscriptionSigningToast("Not enough balance", "en-US")).toBeNull();
  });
});
