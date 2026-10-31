import type { ApiDeviceGrantProof } from "@/generated/models/ApiDeviceGrantProof";
import type { ApiDeviceSignedEvent } from "@/generated/models/ApiDeviceSignedEvent";
import type { ApiDropSignedEvents } from "@/generated/models/ApiDropSignedEvents";
import { canonicalizeBody } from "@/lib/device-signing/canonical-json";
import { signEventId } from "@/lib/device-signing/ed25519";
import { parseDeviceGrantMessage } from "@/lib/device-signing/grant-message";
import { computeInterimEventId } from "@/lib/device-signing/interim-event";
import {
  verifyDropSignedEvents,
  toDisplayedDropContent,
  type ContractWalletReader,
} from "@/lib/device-signing/verify-signed-events";
import { hashMessage, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  buildVectorGrantMessage,
  importVectorPrivateKey,
  installNodeWebCrypto,
  VECTORS,
} from "./device-signing-test-utils";

let mockDevLike = true;
jest.mock("@/config/devAuth", () => ({
  isDevLikeEnv: () => mockDevLike,
}));

const wallet = privateKeyToAccount(`0x${"42".repeat(32)}`);
const otherWallet = privateKeyToAccount(`0x${"43".repeat(32)}`);
const DROP_ID = "b0c5d6e7-1111-4222-8333-944455556666";
const WAVE_ID = VECTORS.body.wave_id;

async function createGrant(
  signer = wallet,
  statement: string = VECTORS.grantStatement
): Promise<ApiDeviceGrantProof> {
  const message = buildVectorGrantMessage({
    address: wallet.address,
    statement,
  });
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
  beforeEach(() => {
    mockDevLike = true;
  });

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

  it("still verifies grants signed over the legacy statement", async () => {
    const grant = await createGrant(wallet, VECTORS.legacyGrantStatement);
    const post = await createEvent(grant, {
      kind: 1,
      seq: 1_760_000_000_000,
      body: { wave_id: WAVE_ID, parts: [{ content: "gm" }] },
    });

    await expect(
      verifyDropSignedEvents(signedEvents([post], [grant], post.id))
    ).resolves.toMatchObject({
      status: "signed",
      currentContentSigned: true,
      signature: { walletSignature: "verified" },
    });
  });

  it.each([
    ["current", VECTORS.grantStatement, "posts, edits", "posts"],
    ["legacy", VECTORS.legacyGrantStatement, "post, edit", "post"],
  ])(
    "rejects a %s grant whose statement does not match its terms",
    async (_name, statement, from, to) => {
      const grant = await createGrant(wallet, statement.replace(from, to));
      const post = await createEvent(grant, {
        kind: 1,
        seq: 1_760_000_000_000,
        body: { parts: [{ content: "gm" }] },
      });

      await expect(
        verifyDropSignedEvents(signedEvents([post], [grant], post.id))
      ).resolves.toEqual({ status: "invalid" });
    }
  );

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

  it("only counts events of the opened drop, its wave and its author", async () => {
    const grant = await createGrant();
    const post = await createEvent(grant, {
      kind: 1,
      seq: 1_760_000_000_000,
      body: { parts: [{ content: "gm" }] },
    });
    const data = signedEvents([post], [grant], post.id);
    const expected = (overrides: Record<string, unknown> = {}) => ({
      dropId: DROP_ID,
      waveId: WAVE_ID,
      authorWallets: [wallet.address],
      ...overrides,
    });

    await expect(
      verifyDropSignedEvents(data, { expected: expected() })
    ).resolves.toMatchObject({ status: "signed" });
    // A consolidation wallet of the author also counts.
    await expect(
      verifyDropSignedEvents(data, {
        expected: expected({
          authorWallets: [otherWallet.address, wallet.address.toLowerCase()],
        }),
      })
    ).resolves.toMatchObject({ status: "signed" });
    for (const mismatch of [
      { dropId: "another-drop" },
      { waveId: "another-wave" },
      { authorWallets: [otherWallet.address] },
    ]) {
      await expect(
        verifyDropSignedEvents(data, { expected: expected(mismatch) })
      ).resolves.toEqual({ status: "invalid" });
    }
  });

  it("binds the grant to a 6529 domain and to its stored domain and chain", async () => {
    const verdictFor = async (grant: ApiDeviceGrantProof) => {
      const post = await createEvent(grant, {
        kind: 1,
        seq: 1_760_000_000_000,
        body: { parts: [{ content: "gm" }] },
      });
      return verifyDropSignedEvents(signedEvents([post], [grant], post.id));
    };
    const grant = await createGrant();
    await expect(verdictFor(grant)).resolves.toMatchObject({
      status: "signed",
    });
    await expect(verdictFor({ ...grant, domain: "6529.io" })).resolves.toEqual({
      status: "invalid",
    });
    await expect(verdictFor({ ...grant, chain_id: 10 })).resolves.toEqual({
      status: "invalid",
    });

    // A grant the wallet signed on another site never counts.
    const foreign = buildVectorGrantMessage({
      address: wallet.address,
    }).replace(
      "https://staging.6529.io wants you",
      "https://evil.example wants you"
    );
    await expect(
      verdictFor({
        ...grant,
        domain: "evil.example",
        message: foreign,
        id: hashMessage(foreign),
        wallet_signature: await wallet.signMessage({ message: foreign }),
      })
    ).resolves.toEqual({ status: "invalid" });
  });

  describe("grant domains", () => {
    /** A grant whose sign-in message names exactly this domain. */
    const grantSignedFor = async (
      domain: string
    ): Promise<ApiDeviceGrantProof> => {
      const grant = await createGrant();
      const message = buildVectorGrantMessage({
        address: wallet.address,
      }).replace("https://staging.6529.io wants you", `${domain} wants you`);
      // The message itself parses: only the domain check can reject it.
      expect(parseDeviceGrantMessage(message)?.domain).toBe(
        domain.toLowerCase()
      );
      return {
        ...grant,
        domain: domain.toLowerCase(),
        message,
        id: hashMessage(message),
        wallet_signature: await wallet.signMessage({ message }),
      };
    };
    const verdictFor = async (domain: string) => {
      const grant = await grantSignedFor(domain);
      const post = await createEvent(grant, {
        kind: 1,
        seq: 1_760_000_000_000,
        body: { parts: [{ content: "gm" }] },
      });
      return verifyDropSignedEvents(signedEvents([post], [grant], post.id));
    };

    it.each([
      "6529.io",
      "staging.6529.io",
      "Staging.6529.io",
      // Development and test runtimes also accept local hosts.
      "localhost",
      "localhost:3001",
      "127.0.0.1:3001",
    ])("counts grants signed on %s", async (domain) => {
      await expect(verdictFor(domain)).resolves.toMatchObject({
        status: "signed",
      });
    });

    it.each(["6529.io", "staging.6529.io"])(
      "counts grants signed on %s in a production build",
      async (domain) => {
        mockDevLike = false;
        await expect(verdictFor(domain)).resolves.toMatchObject({
          status: "signed",
        });
      }
    );

    it.each(["localhost", "localhost:3001", "127.0.0.1:3001", "app.localhost"])(
      "never counts a grant signed on %s in a production build",
      async (domain) => {
        mockDevLike = false;
        await expect(verdictFor(domain)).resolves.toEqual({
          status: "invalid",
        });
      }
    );

    it.each([
      // 6529.io hosts other than the app serve user-published pages.
      "ipfs.6529.io",
      "media.6529.io",
      "www.6529.io",
      "evil.staging.6529.io",
      "6529.io:443",
      "evil.example/x.6529.io",
      "evil.example/.6529.io",
      "evil.example?x=.6529.io",
      "evil.example#.6529.io",
      String.raw`evil.example\.6529.io`,
      "user@staging.6529.io",
      "evil.example%2f.6529.io",
      "evil.example .6529.io",
      "6529.io.evil.example",
      "evil6529.io",
      "a..6529.io",
      "6529.io.",
      "staging.6529.io:8443",
      "localhost.evil.example",
    ])("never counts a grant signed for %s", async (domain) => {
      await expect(verdictFor(domain)).resolves.toEqual({ status: "invalid" });
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

  describe("wallet signatures that do not recover to the wallet", () => {
    const MAGIC_VALUE: Hex = "0x1626ba7e";

    const reader = ({
      hasCode = jest.fn().mockResolvedValue(true),
      isValidSignature = jest.fn().mockResolvedValue(MAGIC_VALUE),
    }: Partial<Record<keyof ContractWalletReader, jest.Mock>> = {}) => ({
      hasCode,
      isValidSignature,
    });

    /** A post under a grant whose wallet signature is not the wallet's ECDSA one. */
    const notRecovering = async (chainId = 1) => {
      const grant = await createGrant(otherWallet);
      const message = grant.message.replace(
        "\nChain ID: 1\n",
        `\nChain ID: ${chainId}\n`
      );
      const chainGrant: ApiDeviceGrantProof = {
        ...grant,
        message,
        id: hashMessage(message),
        chain_id: chainId,
        wallet_signature: await otherWallet.signMessage({ message }),
      };
      const post = await createEvent(chainGrant, {
        kind: 1,
        seq: 1_760_000_000_000,
        body: { parts: [{ content: "gm" }] },
      });
      return {
        grant: chainGrant,
        data: signedEvents([post], [chainGrant], post.id),
      };
    };

    it("never counts an ordinary wallet's (EOA) bad signature", async () => {
      const { grant, data } = await notRecovering();
      const contractWallets = reader({
        hasCode: jest.fn().mockResolvedValue(false),
      });

      await expect(
        verifyDropSignedEvents(data, { contractWallets })
      ).resolves.toEqual({ status: "invalid" });
      expect(contractWallets.hasCode).toHaveBeenCalledWith(grant.wallet);
      expect(contractWallets.isValidSignature).not.toHaveBeenCalled();
    });

    it("counts a contract wallet whose EIP-1271 check returns the magic value", async () => {
      const { grant, data } = await notRecovering();
      const contractWallets = reader();

      await expect(
        verifyDropSignedEvents(data, { contractWallets })
      ).resolves.toMatchObject({
        status: "signed",
        signature: { walletSignature: "contract-verified" },
      });
      expect(contractWallets.isValidSignature).toHaveBeenCalledWith({
        address: grant.wallet,
        hash: hashMessage(grant.message),
        signature: grant.wallet_signature,
      });
    });

    it.each([
      ["another value", "0xffffffff"],
      ["a revert", null],
    ])(
      "never counts a contract wallet whose EIP-1271 check returns %s",
      async (_name, result) => {
        const { data } = await notRecovering();
        await expect(
          verifyDropSignedEvents(data, {
            contractWallets: reader({
              isValidSignature: jest.fn().mockResolvedValue(result),
            }),
          })
        ).resolves.toEqual({ status: "invalid" });
      }
    );

    it.each([
      [
        "the code read fails",
        () => reader({ hasCode: jest.fn().mockRejectedValue(new Error("rpc")) }),
      ],
      [
        "the EIP-1271 read fails",
        () =>
          reader({
            isValidSignature: jest.fn().mockRejectedValue(new Error("rpc")),
          }),
      ],
      ["there is no Ethereum client", () => undefined],
    ])(
      "reports couldn't verify, never signed, when %s",
      async (_name, contractWallets) => {
        const { data } = await notRecovering();
        await expect(
          verifyDropSignedEvents(data, { contractWallets: contractWallets() })
        ).resolves.toEqual({ status: "unverifiable" });
      }
    );

    it("reports couldn't verify for a grant on another chain, without reading Ethereum", async () => {
      const { data } = await notRecovering(137);
      const contractWallets = reader();

      await expect(
        verifyDropSignedEvents(data, { contractWallets })
      ).resolves.toEqual({ status: "unverifiable" });
      expect(contractWallets.hasCode).not.toHaveBeenCalled();
      expect(contractWallets.isValidSignature).not.toHaveBeenCalled();
    });

    it("still reports changed content as invalid when the wallet check cannot run", async () => {
      const { data } = await notRecovering();
      await expect(
        verifyDropSignedEvents(data, {
          displayed: {
            title: null,
            parts: [{ content: "swapped", mediaCount: 0, attachmentCount: 0 }],
          },
        })
      ).resolves.toEqual({ status: "invalid" });
    });

    it("needs no Ethereum read for a signature that recovers to the wallet", async () => {
      const grant = await createGrant();
      const post = await createEvent(grant, {
        kind: 1,
        seq: 1_760_000_000_000,
        body: { parts: [{ content: "gm" }] },
      });
      const contractWallets = reader();

      await expect(
        verifyDropSignedEvents(signedEvents([post], [grant], post.id), {
          contractWallets,
        })
      ).resolves.toMatchObject({
        status: "signed",
        signature: { walletSignature: "verified" },
      });
      expect(contractWallets.hasCode).not.toHaveBeenCalled();
    });
  });
});
