import { useDropSealStates } from "@/components/waves/drops/signature/dropSignatureVerdicts";
import type { ApiDeviceGrantProof } from "@/generated/models/ApiDeviceGrantProof";
import type { ApiDeviceSignedEvent } from "@/generated/models/ApiDeviceSignedEvent";
import { canonicalizeBody } from "@/lib/device-signing/canonical-json";
import { signEventId } from "@/lib/device-signing/ed25519";
import { computeInterimEventId } from "@/lib/device-signing/interim-event";
import { renderHook, waitFor } from "@testing-library/react";
import { hashMessage } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  buildVectorGrantMessage,
  importVectorPrivateKey,
  installNodeWebCrypto,
  VECTORS,
} from "../../../../lib/device-signing/device-signing-test-utils";

jest.mock("@/lib/device-signing/feature", () => ({
  isSignedMessagesEnabled: () => true,
}));

jest.mock("@/config/devAuth", () => ({
  isDevLikeEnv: () => true,
}));

const mockFetchSignedEvents = jest.fn();
const mockFetchBatch = jest.fn();
const mockFetchAuthorWallets = jest.fn();
jest.mock("@/services/api/device-grants-api", () => ({
  fetchDropSignedEvents: (...args: unknown[]) => mockFetchSignedEvents(...args),
  fetchDropsSignedEvents: (...args: unknown[]) => mockFetchBatch(...args),
  fetchAuthorWallets: (...args: unknown[]) => mockFetchAuthorWallets(...args),
}));

const wallet = privateKeyToAccount(`0x${"42".repeat(32)}`);
const WAVE_ID = VECTORS.body.wave_id;

async function createGrant(): Promise<ApiDeviceGrantProof> {
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
    wallet_signature: await wallet.signMessage({ message }),
    chain_id: 1,
  } as ApiDeviceGrantProof;
}

/** A post signed by the vector device key under the grant. */
async function createPost(
  grant: ApiDeviceGrantProof,
  content: string,
  seq: number
): Promise<ApiDeviceSignedEvent> {
  const body = { wave_id: WAVE_ID, parts: [{ content }] };
  const { canonical, bodyHash, bodySize } = canonicalizeBody(body);
  const fields = {
    kind: 1,
    kindVersion: 1,
    wave: WAVE_ID,
    author: grant.wallet,
    keyType: 2,
    deviceKey: grant.device_key,
    authRef: grant.id,
    seq,
    anchor: 0,
    claimedTime: seq,
    refs: [],
    bodyHash,
    bodySize,
  };
  const id = computeInterimEventId(fields);
  return {
    id,
    kind: 1,
    kind_version: 1,
    wave: WAVE_ID,
    author: grant.wallet,
    key_type: 2,
    device_key: grant.device_key,
    auth_ref: grant.id,
    seq,
    anchor: 0,
    claimed_time: seq,
    refs: [],
    body: canonical,
    body_hash: bodyHash,
    body_size: bodySize,
    signature: await signEventId(await importVectorPrivateKey(), id),
    created_at: seq + 10,
  } as ApiDeviceSignedEvent;
}

const shownDrop = (id: string, content: string) =>
  ({
    id,
    is_author_signed: true,
    title: null,
    parts: [{ content, media: [], attachments: [], quoted_drop: null }],
    wave: { id: WAVE_ID },
    author: { primary_address: wallet.address },
  }) as any;

/** Flips the last hex digit of a signature. */
const tampered = (signature: string): string =>
  `${signature.slice(0, -1)}${signature.endsWith("0") ? "1" : "0"}`;

describe("a seal checked with batch-read signed events", () => {
  beforeAll(installNodeWebCrypto);

  beforeEach(() => {
    mockFetchSignedEvents.mockReset();
    mockFetchBatch.mockReset();
    mockFetchAuthorWallets.mockReset().mockResolvedValue([wallet.address]);
  });

  it("is verified only for the post whose signature verifies, never for the one carrying a wrong signature", async () => {
    const grant = await createGrant();
    const genuine = await createPost(grant, "gm", 1_760_000_000_000);
    const forged = {
      ...(await createPost(grant, "gn", 1_760_000_000_001)),
    };
    forged.signature = tampered(forged.signature);
    const [genuineDrop, forgedDrop] = [
      shownDrop("e2e-drop-genuine", "gm"),
      shownDrop("e2e-drop-forged", "gn"),
    ];
    mockFetchBatch.mockResolvedValue({
      drops: [
        {
          drop_id: genuineDrop.id,
          current_event_id: genuine.id,
          events: [genuine],
          grants: [],
        },
        {
          drop_id: forgedDrop.id,
          current_event_id: forged.id,
          events: [forged],
          grants: [],
        },
      ],
      grants: [grant],
      unavailable: [],
      truncated_drop_ids: [],
    });

    const { result } = renderHook(() =>
      useDropSealStates([genuineDrop, forgedDrop], true)
    );
    await waitFor(() => expect(result.current).not.toContain("pending"), {
      timeout: 10_000,
    });
    expect(result.current).toEqual(["verified", "failed"]);
    expect(mockFetchBatch).toHaveBeenCalledTimes(1);
    expect(mockFetchSignedEvents).not.toHaveBeenCalled();
  });

  it("is never verified when the batch's events do not match the content shown", async () => {
    const grant = await createGrant();
    const post = await createPost(grant, "gm", 1_760_000_000_002);
    const drop = shownDrop("e2e-drop-other-content", "something else");
    mockFetchBatch.mockResolvedValue({
      drops: [
        {
          drop_id: drop.id,
          current_event_id: post.id,
          events: [post],
          grants: [],
        },
      ],
      grants: [grant],
      unavailable: [],
      truncated_drop_ids: [],
    });

    const { result } = renderHook(() => useDropSealStates([drop], true));
    await waitFor(() => expect(result.current).toEqual(["failed"]), {
      timeout: 10_000,
    });
  });
});
