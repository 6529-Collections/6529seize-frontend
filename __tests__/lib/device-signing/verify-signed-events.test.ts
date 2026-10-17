import type { ApiDeviceGrantProof } from "@/generated/models/ApiDeviceGrantProof";
import type { ApiDeviceSignedEvent } from "@/generated/models/ApiDeviceSignedEvent";
import type { ApiDropSignedEvents } from "@/generated/models/ApiDropSignedEvents";
import { canonicalizeBody } from "@/lib/device-signing/canonical-json";
import { signEventId } from "@/lib/device-signing/ed25519";
import { computeInterimEventId } from "@/lib/device-signing/interim-event";
import {
  verifyDropSignedEvents,
  toDisplayedDropContent,
} from "@/lib/device-signing/verify-signed-events";
import { hashMessage } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  buildVectorGrantMessage,
  importVectorPrivateKey,
  installNodeWebCrypto,
  VECTORS,
} from "./device-signing-test-utils";

const wallet = privateKeyToAccount(`0x${"42".repeat(32)}`);
const otherWallet = privateKeyToAccount(`0x${"43".repeat(32)}`);
const DROP_ID = "b0c5d6e7-1111-4222-8333-944455556666";
const WAVE_ID = VECTORS.body.wave_id;

async function createGrant(signer = wallet): Promise<ApiDeviceGrantProof> {
  const message = buildVectorGrantMessage({ address: wallet.address });
  return {
    id: hashMessage(message),
    wallet: wallet.address.toLowerCase(),
    key_type: "ed25519",
    device_key: VECTORS.deviceKey,
    scopes: ["post", "edit", "delete", "react"],
    device_label: "Chrome on macOS",
    domain: "staging.6529.io",
    issued_at: 1_760_270_400_000,
    expires_at: VECTORS.grantExpiresAtSeconds * 1000,
    created_at: 1_760_270_400_000,
    revoked_at: null,
    last_used_at: null,
    message,
    wallet_signature: await signer.signMessage({ message }),
    chain_id: 1,
  } as ApiDeviceGrantProof;
}

async function createEvent(
  grant: ApiDeviceGrantProof,
  { kind, seq, body }: { kind: number; seq: number; body: object | null }
): Promise<ApiDeviceSignedEvent> {
  const { canonical, bodyHash, bodySize } = canonicalizeBody(body);
  const fields = {
    kind,
    kindVersion: 1,
    wave: WAVE_ID,
    author: grant.wallet,
    keyType: 2,
    deviceKey: grant.device_key,
    authRef: grant.id,
    seq,
    anchor: 0,
    claimedTime: seq,
    refs: [DROP_ID],
    bodyHash,
    bodySize,
  };
  const id = computeInterimEventId(fields);
  return {
    id,
    kind,
    kind_version: 1,
    wave: WAVE_ID,
    author: grant.wallet,
    key_type: 2,
    device_key: grant.device_key,
    auth_ref: grant.id,
    seq,
    anchor: 0,
    claimed_time: seq,
    refs: [DROP_ID],
    body: canonical,
    body_hash: bodyHash,
    body_size: bodySize,
    signature: await signEventId(await importVectorPrivateKey(), id),
    created_at: seq + 10,
  } as ApiDeviceSignedEvent;
}

const signedEvents = (
  events: ApiDeviceSignedEvent[],
  grants: ApiDeviceGrantProof[],
  currentEventId: string | null
): ApiDropSignedEvents =>
  ({
    drop_id: DROP_ID,
    current_event_id: currentEventId,
    events,
    grants,
  }) as ApiDropSignedEvents;

describe("drop signature verification in the browser", () => {
  beforeAll(installNodeWebCrypto);

  it("reports legacy drops as not signed", async () => {
    await expect(
      verifyDropSignedEvents(signedEvents([], [], null))
    ).resolves.toEqual({ status: "unsigned" });
  });

  it("verifies the post, its grant and the wallet's sign-in signature", async () => {
    const grant = await createGrant();
    const post = await createEvent(grant, {
      kind: 1,
      seq: 1_760_000_000_000,
      body: { wave_id: WAVE_ID, parts: [{ content: "gm" }] },
    });

    await expect(
      verifyDropSignedEvents(signedEvents([post], [grant], post.id))
    ).resolves.toEqual({
      status: "signed",
      currentContentSigned: true,
      signature: {
        eventId: post.id,
        wallet: grant.wallet,
        deviceKey: VECTORS.deviceKey,
        grantExpiresAt: VECTORS.grantExpiresAtSeconds * 1000,
        walletSignature: "verified",
      },
    });
  });

  it("reports content changed after signing and ignores other people's reactions", async () => {
    const grant = await createGrant();
    const post = await createEvent(grant, {
      kind: 1,
      seq: 1_760_000_000_000,
      body: { parts: [{ content: "gm" }] },
    });
    const reaction = await createEvent(grant, {
      kind: 4,
      seq: 1_760_000_000_001,
      body: { on: true, reaction: ":+1:" },
    });

    const verdict = await verifyDropSignedEvents(
      signedEvents([post, reaction], [grant], null)
    );
    expect(verdict).toMatchObject({
      status: "signed",
      currentContentSigned: false,
      signature: { eventId: post.id },
    });
  });

  it("checks the current signed body against the content shown", async () => {
    const grant = await createGrant();
    const post = await createEvent(grant, {
      kind: 1,
      seq: 1_760_000_000_000,
      body: { title: null, parts: [{ content: "gm", media: [] }] },
    });
    const data = signedEvents([post], [grant], post.id);
    const shown = (content: string, mediaCount = 0) => ({
      title: null,
      parts: [{ content, mediaCount, attachmentCount: 0 }],
    });

    await expect(
      verifyDropSignedEvents(data, { displayed: shown("gm") })
    ).resolves.toMatchObject({ status: "signed", currentContentSigned: true });
    await expect(
      verifyDropSignedEvents(data, {
        displayed: shown("gm, swapped by a host"),
      })
    ).resolves.toEqual({ status: "invalid" });
    await expect(
      verifyDropSignedEvents(data, { displayed: shown("gm", 1) })
    ).resolves.toEqual({ status: "invalid" });
    // Without the shown content the verdict rests on the signed events alone.
    await expect(verifyDropSignedEvents(data)).resolves.toMatchObject({
      status: "signed",
      currentContentSigned: true,
    });
  });

  it("builds the shown content from a drop", () => {
    expect(
      toDisplayedDropContent({
        title: "t",
        parts: [
          { content: "a", media: [{}, {}], attachments: [{}] },
          { content: null, media: [] },
        ],
      } as unknown as Parameters<typeof toDisplayedDropContent>[0])
    ).toEqual({
      title: "t",
      parts: [
        { content: "a", mediaCount: 2, attachmentCount: 1 },
        { content: null, mediaCount: 0, attachmentCount: 0 },
      ],
    });
  });

  it("reports invalid when the claimed current event does not verify", async () => {
    const grant = await createGrant();
    const post = await createEvent(grant, {
      kind: 1,
      seq: 1_760_000_000_000,
      body: { parts: [{ content: "gm" }] },
    });
    const edit = await createEvent(grant, {
      kind: 2,
      seq: 1_760_000_000_001,
      body: { parts: [{ content: "gm, edited" }] },
    });
    const tamperedEdit = {
      ...edit,
      body: '{"parts":[{"content":"tampered"}]}',
    };
    await expect(
      verifyDropSignedEvents(
        signedEvents([post, tamperedEdit], [grant], tamperedEdit.id)
      )
    ).resolves.toEqual({ status: "invalid" });
    // An unknown current event id is treated the same way.
    await expect(
      verifyDropSignedEvents(
        signedEvents([post], [grant], `0x${"9".repeat(64)}`)
      )
    ).resolves.toEqual({ status: "invalid" });
  });

  it("rejects tampered bodies, ids and signatures", async () => {
    const grant = await createGrant();
    const post = await createEvent(grant, {
      kind: 1,
      seq: 1_760_000_000_000,
      body: { parts: [{ content: "gm" }] },
    });
    const tampered: ApiDeviceSignedEvent[] = [
      { ...post, body: '{"parts":[{"content":"gn"}]}' },
      { ...post, seq: post.seq + 1 },
      { ...post, signature: `0x${"00".repeat(64)}` },
      { ...post, author: otherWallet.address.toLowerCase() },
    ] as ApiDeviceSignedEvent[];

    for (const event of tampered) {
      await expect(
        verifyDropSignedEvents(signedEvents([event], [grant], event.id))
      ).resolves.toEqual({ status: "invalid" });
    }
    await expect(
      verifyDropSignedEvents(signedEvents([post], [], post.id))
    ).resolves.toEqual({ status: "invalid" });
  });

  it("rejects a grant whose message does not match its stored terms", async () => {
    const grant = await createGrant();
    const post = await createEvent(grant, {
      kind: 1,
      seq: 1_760_000_000_000,
      body: null,
    });
    const forged = {
      ...grant,
      scopes: ["post", "edit", "delete", "react", "vote"],
    };
    await expect(
      verifyDropSignedEvents(
        signedEvents([post], [forged as ApiDeviceGrantProof], post.id)
      )
    ).resolves.toEqual({ status: "invalid" });
  });

  it("never attributes a malformed wallet signature to the wallet", async () => {
    const grant = {
      ...(await createGrant()),
      wallet_signature: "not-a-signature",
    };
    const post = await createEvent(grant, {
      kind: 1,
      seq: 1_760_000_000_000,
      body: { parts: [{ content: "gm" }] },
    });
    await expect(
      verifyDropSignedEvents(signedEvents([post], [grant], post.id))
    ).resolves.toEqual({ status: "invalid" });
  });

  it("checks a contract-wallet signature on Ethereum when a client is available", async () => {
    const grant = await createGrant(otherWallet);
    const post = await createEvent(grant, {
      kind: 1,
      seq: 1_760_000_000_000,
      body: { parts: [{ content: "gm" }] },
    });
    const data = signedEvents([post], [grant], post.id);
    const valid = jest.fn().mockResolvedValue(true);
    await expect(
      verifyDropSignedEvents(data, { verifyContractSignature: valid })
    ).resolves.toMatchObject({
      status: "signed",
      signature: { walletSignature: "verified" },
    });
    expect(valid).toHaveBeenCalledWith(
      expect.objectContaining({ address: grant.wallet, chainId: 1 })
    );
    await expect(
      verifyDropSignedEvents(data, {
        verifyContractSignature: jest.fn().mockResolvedValue(false),
      })
    ).resolves.toEqual({ status: "invalid" });
    await expect(
      verifyDropSignedEvents(data, {
        verifyContractSignature: jest.fn().mockRejectedValue(new Error("rpc")),
      })
    ).resolves.toMatchObject({
      status: "signed",
      signature: { walletSignature: "contract-wallet" },
    });
  });

  it("defers to 6529.io for a wallet signature that does not recover (contract wallet)", async () => {
    const grant = await createGrant(otherWallet);
    const post = await createEvent(grant, {
      kind: 1,
      seq: 1_760_000_000_000,
      body: { parts: [{ content: "gm" }] },
    });
    await expect(
      verifyDropSignedEvents(signedEvents([post], [grant], post.id))
    ).resolves.toMatchObject({
      status: "signed",
      signature: { walletSignature: "contract-wallet" },
    });
  });
});
