/**
 * @jest-environment-options {"url": "http://localhost:6529/"}
 */
import { createWalletClient, custom, toHex, type Address } from "viem";
import { mainnet } from "viem/chains";
import {
  buildAppGrantTypedData,
  appGrantTimes,
} from "@/lib/device-signing/app-grant";
import { buildGrant, buildGrantTypedData } from "@/lib/e2ee/grant";
import { buildProfileCmsPublishTypedData } from "@/lib/profile-cms/builder/publish";
import { buildMemesSubmissionTypedData } from "@/services/wallet-signatures/memes-submission-signature";
import { ApiDropType } from "@/generated/models/ApiDropType";
import {
  parseWalletRequest,
  type WalletRequest,
} from "@/lib/desktop/walletForwarding";
import { describeWalletRequest } from "@/lib/desktop/walletRequestDescribe";
import { buildCompetitionSignatureMessage } from "@/services/wallet-signatures/competition-signature";
import {
  buildDropSignatureMessage,
  buildRememeSignatureMessage,
} from "@/services/wallet-signatures/structured-wallet-signatures";

const ADDRESS = "0x1111111111111111111111111111111111111111" as Address;
const OTHER = "0x2222222222222222222222222222222222222222" as Address;
const ORIGIN = "http://localhost:6529";
const DEVICE_KEY = `0x${"ab".repeat(32)}`;
const MLS_KEY = `0x${"cd".repeat(32)}`;
const NOW_MS = Date.UTC(2026, 10, 14, 12, 0, 0);

/** The exact `{ method, params }` viem sends for a JSON-RPC account. */
async function captureTypedData(typedData: unknown): Promise<unknown[]> {
  let params: unknown[] = [];
  const client = createWalletClient({
    account: ADDRESS,
    chain: mainnet,
    transport: custom({
      request: async (call: { method: string; params: unknown[] }) => {
        params = call.params;
        return `0x${"00".repeat(65)}`;
      },
    }),
  });
  await client.signTypedData(typedData as never);
  return params;
}

async function typedRequest(
  typedData: unknown,
  chainId = 1
): Promise<WalletRequest> {
  const parsed = parseWalletRequest(
    {
      method: "eth_signTypedData_v4",
      params: await captureTypedData(typedData),
      address: ADDRESS,
      chainId,
    },
    [1, 11155111]
  );
  if (!parsed.ok) throw new Error(parsed.problem);
  return parsed.value;
}

/** Re-serialize with a change, as a forged request would arrive. */
async function tamper(
  typedData: unknown,
  change: (json: any) => void
): Promise<WalletRequest> {
  const params = await captureTypedData(typedData);
  const json = JSON.parse(params[1] as string);
  change(json);
  const parsed = parseWalletRequest(
    {
      method: "eth_signTypedData_v4",
      params: [params[0], JSON.stringify(json)],
      address: ADDRESS,
      chainId: 1,
    },
    [1]
  );
  if (!parsed.ok) throw new Error(parsed.problem);
  return parsed.value;
}

const messageRequest = (text: string | `0x${string}`): WalletRequest => {
  const parsed = parseWalletRequest(
    {
      method: "personal_sign",
      params: [text.startsWith("0x") ? text : toHex(text), ADDRESS],
      address: ADDRESS,
      chainId: 1,
    },
    [1]
  );
  if (!parsed.ok) throw new Error(parsed.problem);
  return parsed.value;
};

const e2eeGrant = (wallet: string = ADDRESS, origin = "6529 Desktop") =>
  buildGrantTypedData(
    buildGrant({
      wallet,
      deviceKey: DEVICE_KEY,
      issuedAtSeconds: Math.floor(NOW_MS / 1000),
      origin,
    })
  );

const appGrant = (wallet: string = ADDRESS, origin = "6529 Desktop") => {
  const times = appGrantTimes(NOW_MS);
  return buildAppGrantTypedData({
    wallet: wallet.toLowerCase(),
    deviceKeyHex: DEVICE_KEY,
    scopes: ["post", "edit", "delete", "react"],
    mls: { deviceKeyHex: MLS_KEY, ciphersuites: [3] },
    issuedAtSeconds: times.issuedAtSeconds,
    expiresAtSeconds: times.expiresAtSeconds,
    origin,
  });
};

const memes = (signer: string = ADDRESS, origin = ORIGIN) => {
  const typedData = buildMemesSubmissionTypedData({
    drop: {
      wave_id: "wave-1",
      drop_type: ApiDropType.Participatory,
      title: "My Meme",
      parts: [{ content: "art", media: [] }],
      referenced_nfts: [],
      mentioned_users: [],
      metadata: [],
      signature: null,
      signer_address: signer,
    },
    termsOfService: "Terms v1",
    wave: { id: "wave-1", name: "Main Stage" },
    issuedAt: new Date(NOW_MS),
    nonce: "00000000-0000-4000-8000-000000000001",
    audience: "api.6529.io",
    origin,
  });
  // As useDropSignature sends it: viem derives the domain type.
  return {
    ...typedData,
    types: {
      MemeCardSubmission: typedData.types.MemeCardSubmission,
      SubmissionVerification: typedData.types.SubmissionVerification,
    },
  };
};

const profilePublish = (chainId = 1, verifyingContract?: string) => {
  const typedData = buildProfileCmsPublishTypedData({
    context: {
      draftId: "draft-1",
      profileId: "profile-1",
      handle: "punk6529",
      packageId: "pkg-1",
      version: 4,
      payloadHash: "0xpayload",
      packageHash: "0xpackage",
      primaryPath: "/",
      receipt: {
        provider: "arweave",
        uri: "ar://abc",
        content_hash: "0xcontent",
        canonical: true,
        recorded_at: "2026-11-14T12:00:00Z",
      },
    },
    chainId,
    deadline: 1_900_000_000,
    verifyingContract,
  });
  return {
    ...typedData,
    message: {
      ...typedData.message,
      version: BigInt(typedData.message.version),
      deadline: BigInt(typedData.message.deadline),
    },
  };
};

const NONCE = "00000000-0000-4000-8000-000000000001";

const dropMessage = (address: string = ADDRESS) =>
  buildDropSignatureMessage({
    address,
    drop: {
      wave_id: "wave-1",
      drop_type: ApiDropType.Chat,
      title: null,
      parts: [{ content: "gm", media: [] }],
      referenced_nfts: [],
      mentioned_users: [],
      metadata: [],
      signature: null,
      signer_address: address,
    },
    termsOfService: "Terms v1",
  }).message;

const decisionMessage = (
  action: "VOTE_SET" | "ENTRY_CREATE",
  wallet: string = ADDRESS
) =>
  buildCompetitionSignatureMessage({
    action,
    audience: "api.6529.io",
    actorProfileId: "profile-1",
    actorWallet: wallet,
    waveId: "wave-1",
    competitionId: "competition-1",
    entryId: action === "VOTE_SET" ? "entry-1" : null,
    dropId: null,
    configVersion: 3,
    payload: { votes: 5 },
    nonce: NONCE,
    issuedAt: NOW_MS,
  });

const refusalOf = (text: string) => {
  const result = describeWalletRequest(messageRequest(text), ORIGIN);
  return result.ok ? null : result.refusal;
};

describe("describeWalletRequest: messages (allow-list)", () => {
  it("allows the structured drop signature this app builds", () => {
    const text = dropMessage();
    expect(describeWalletRequest(messageRequest(text), ORIGIN)).toEqual({
      ok: true,
      value: { kind: "message", text, format: "drop" },
    });
  });

  it.each([
    ["VOTE_SET", "decisionVote"],
    ["ENTRY_CREATE", "decisionEntry"],
  ] as const)("allows a decision %s signature", (action, format) => {
    const text = decisionMessage(action);
    expect(describeWalletRequest(messageRequest(text), ORIGIN)).toEqual({
      ok: true,
      value: { kind: "message", text, format },
    });
  });

  it.each([
    ["the structured sign-in challenge", "6529 Authentication\nVersion: 2"],
    ["a login action", "6529 Action\nAction: login"],
    [
      "a SIWE message",
      "6529.io wants you to sign in with your Ethereum account:\n0x1",
    ],
  ])("refuses %s as a sign-in message", (_label, text) => {
    expect(refusalOf(text)).toBe("sign-in-message");
  });

  it.each([
    [
      "the legacy ownership nonce text",
      "Signing this message confirms that you own the address 0x1111111111111111111111111111111111111111. Nonce: abc",
    ],
    ["a bare UUID nonce", NONCE],
    ["free text", "Vote for entry 7"],
    [
      "a rememe signature",
      buildRememeSignatureMessage({ address: ADDRESS, rememe: { id: 1 } })
        .message,
    ],
    ["a drop signature for another wallet", dropMessage(OTHER)],
    [
      "a drop signature for another app",
      dropMessage().replace(
        "Client Origin: http://localhost:6529",
        "Client Origin: https://6529.io"
      ),
    ],
    [
      "a drop signature for another domain",
      dropMessage().replace("Domain: localhost:6529", "Domain: 6529.io"),
    ],
    [
      "a drop signature with a longer lifetime",
      dropMessage().replace(
        /Expiration Time: (.*)/,
        (_m, time: string) =>
          `Expiration Time: ${new Date(Date.parse(time) + 1000).toISOString()}`
      ),
    ],
    ["a drop signature with an extra line", `${dropMessage()}\nNote: extra`],
    [
      "a drop signature with a session type",
      dropMessage().replace("Wallet: ", "Session Type: desktop\nWallet: "),
    ],
    [
      "a decision signature for another wallet",
      decisionMessage("VOTE_SET", OTHER),
    ],
    [
      "a decision signature that is not canonical",
      JSON.stringify(
        JSON.parse(decisionMessage("VOTE_SET")),
        null,
        1
      ).replaceAll("\n", ""),
    ],
    [
      "a decision signature with another domain",
      decisionMessage("VOTE_SET").replace("6529-competition-v1", "6529-login"),
    ],
    [
      "a decision signature with an extra key",
      decisionMessage("VOTE_SET").replace('{"action"', '{"a":1,"action"'),
    ],
  ])("refuses %s", (_label, text) => {
    expect(refusalOf(text)).toBe("unknown-message");
  });

  it("refuses bytes that are not readable text", () => {
    expect(describeWalletRequest(messageRequest("0xff00"), ORIGIN)).toEqual({
      ok: false,
      refusal: "unreadable-message",
    });
  });
});

describe("describeWalletRequest: known typed data", () => {
  it("describes the encrypted-messages grant with its own statement", async () => {
    const typedData = e2eeGrant();
    const result = describeWalletRequest(await typedRequest(typedData), ORIGIN);
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.kind !== "typedData") return;
    expect(result.value.schema).toBe("encryptedMessagesGrant");
    expect(result.value.statement).toBe(typedData.message.statement);
    expect(result.value.details).toContainEqual({
      label: "origin",
      value: "6529 Desktop",
    });
  });

  it("describes the signed-messages grant", async () => {
    const typedData = appGrant();
    const result = describeWalletRequest(await typedRequest(typedData), ORIGIN);
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.kind !== "typedData") return;
    expect(result.value.schema).toBe("signedMessagesGrant");
    expect(result.value.statement).toBe(typedData.message.statement);
  });

  it("describes a Memes submission with its artwork and wave", async () => {
    const result = describeWalletRequest(await typedRequest(memes()), ORIGIN);
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.kind !== "typedData") return;
    expect(result.value.schema).toBe("memesSubmission");
    expect(result.value.summary).toEqual({
      artwork: "My Meme",
      destination: "Main Stage",
    });
    expect(result.value.statement).toMatch(/No gas fee/);
    expect(result.value.details).toContainEqual({
      label: "Verification.Origin",
      value: ORIGIN,
    });
  });

  it("describes a profile site publish on the request's chain", async () => {
    const result = describeWalletRequest(
      await typedRequest(profilePublish()),
      ORIGIN
    );
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.kind !== "typedData") return;
    expect(result.value.schema).toBe("profileSitePublish");
    expect(result.value.summary).toEqual({ handle: "punk6529", version: "4" });
  });
});

describe("describeWalletRequest: refusals", () => {
  it("refuses grants for another wallet or app", async () => {
    expect(
      describeWalletRequest(await typedRequest(e2eeGrant(OTHER)), ORIGIN)
    ).toEqual({ ok: false, refusal: "wrong-wallet" });
    expect(
      describeWalletRequest(
        await typedRequest(e2eeGrant(ADDRESS, "6529.io")),
        ORIGIN
      )
    ).toEqual({ ok: false, refusal: "wrong-origin" });
    expect(
      describeWalletRequest(await typedRequest(appGrant(OTHER)), ORIGIN)
    ).toEqual({ ok: false, refusal: "wrong-wallet" });
    expect(
      describeWalletRequest(
        await typedRequest(appGrant(ADDRESS, "6529.io")),
        ORIGIN
      )
    ).toEqual({ ok: false, refusal: "wrong-origin" });
  });

  it("refuses a grant whose statement does not match its fields", async () => {
    const forgedE2ee = await tamper(e2eeGrant(), (json) => {
      json.message.statement = "Harmless, sign me.";
    });
    expect(describeWalletRequest(forgedE2ee, ORIGIN)).toEqual({
      ok: false,
      refusal: "statement-mismatch",
    });
    const longerE2ee = await tamper(e2eeGrant(), (json) => {
      json.message.expiresAt = String(Number(json.message.expiresAt) + 86_400);
    });
    expect(describeWalletRequest(longerE2ee, ORIGIN)).toEqual({
      ok: false,
      refusal: "statement-mismatch",
    });
    const forgedApp = await tamper(appGrant(), (json) => {
      json.message.scopes = "post,edit,delete,react,vote";
    });
    expect(describeWalletRequest(forgedApp, ORIGIN)).toEqual({
      ok: false,
      refusal: "statement-mismatch",
    });
  });

  describe("signed-messages grant: every signed field is checked", () => {
    const keyWithNewPrefix = (key: string) =>
      `0x${"ef".repeat(4)}${key.slice(10)}`;
    it.each([
      [
        "scopes",
        (m: any) => (m.scopes = "post,edit,delete,react,vote"),
        "statement-mismatch",
      ],
      [
        "expiry",
        (m: any) =>
          (m.expiresAt = String(Number(m.expiresAt) + 86_400)),
        "statement-mismatch",
      ],
      [
        "device key",
        (m: any) =>
          (m.deviceKey = keyWithNewPrefix(m.deviceKey)),
        "statement-mismatch",
      ],
      [
        "encrypted-messages key",
        (m: any) =>
          (m.mlsDeviceKey = keyWithNewPrefix(m.mlsDeviceKey)),
        "statement-mismatch",
      ],
      [
        "encrypted-messages key removed",
        (m: any) => (m.mlsDeviceKey = `0x${"00".repeat(32)}`),
        "statement-mismatch",
      ],
      [
        "suites",
        (m: any) => (m.ciphersuites = [3, 3]),
        "statement-mismatch",
      ],
      [
        "issued time beyond the grant lifetime",
        (m: any) => (m.issuedAt = "1"),
        "statement-mismatch",
      ],
      [
        "issued time after expiry",
        (m: any) =>
          (m.issuedAt = String(Number(m.expiresAt) + 60)),
        "statement-mismatch",
      ],
      [
        "wallet",
        (m: any) => (m.wallet = OTHER),
        "wrong-wallet",
      ],
      [
        "origin",
        (m: any) => (m.origin = "6529.io"),
        "wrong-origin",
      ],
    ])("refuses a changed %s", async (_label, change, refusal) => {
      const request = await tamper(appGrant(), (json) => change(json.message));
      expect(describeWalletRequest(request, ORIGIN)).toEqual({
        ok: false,
        refusal,
      });
    });

    it("shows an issued time within the lifetime as signed, in the details", async () => {
      const request = await tamper(appGrant(), (json) => {
        json.message.issuedAt = String(Number(json.message.issuedAt) - 60);
      });
      const result = describeWalletRequest(request, ORIGIN);
      expect(result.ok).toBe(true);
      if (!result.ok || result.value.kind !== "typedData") return;
      const issued = result.value.details.find((d) => d.label === "issuedAt");
      expect(issued?.value).toBe(
        String(
          Number((appGrant().message as { issuedAt: bigint }).issuedAt) - 60
        )
      );
    });
  });

  it("refuses Memes submissions for another wallet or origin", async () => {
    expect(
      describeWalletRequest(await typedRequest(memes(OTHER)), ORIGIN)
    ).toEqual({ ok: false, refusal: "wrong-wallet" });
    expect(
      describeWalletRequest(
        await typedRequest(memes(ADDRESS, "https://evil.example")),
        ORIGIN
      )
    ).toEqual({ ok: false, refusal: "wrong-origin" });
  });

  it.each([
    [
      "an extra signed field",
      (json: any) => {
        json.types.MlsDeviceGrant.push({ name: "admin", type: "bool" });
        json.message.admin = true;
      },
    ],
    [
      "another domain",
      (json: any) => {
        json.domain.name = "6529 Encrypted Messagez";
      },
    ],
    [
      "a domain type that hides a field",
      (json: any) => {
        json.types.EIP712Domain = json.types.EIP712Domain.slice(0, 2);
      },
    ],
  ])("refuses a grant with %s", async (_label, change) => {
    expect(
      describeWalletRequest(await tamper(e2eeGrant(), change), ORIGIN)
    ).toEqual({
      ok: false,
      refusal: "unknown-typed-data",
    });
  });

  it("refuses unknown typed data, such as a market order", async () => {
    const order = {
      domain: { name: "Seaport", version: "1.6", chainId: 1 },
      types: {
        OrderComponents: [
          { name: "offerer", type: "address" },
          { name: "zone", type: "address" },
        ],
      },
      primaryType: "OrderComponents",
      message: { offerer: ADDRESS, zone: OTHER },
    };
    expect(describeWalletRequest(await typedRequest(order), ORIGIN)).toEqual({
      ok: false,
      refusal: "unknown-typed-data",
    });
  });

  it("refuses a profile publish for a Safe or another chain", async () => {
    expect(
      describeWalletRequest(
        await typedRequest(profilePublish(1, OTHER)),
        ORIGIN
      )
    ).toEqual({ ok: false, refusal: "unknown-typed-data" });
    const sepolia = await typedRequest(profilePublish(11155111), 11155111);
    expect(
      describeWalletRequest({ ...sepolia, chainId: 1 } as WalletRequest, ORIGIN)
    ).toEqual({ ok: false, refusal: "unknown-typed-data" });
  });
});
