/**
 * @jest-environment-options {"url": "http://localhost:6529/"}
 */
import { sha256 } from "js-sha256";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import {
  buildDecisionSignatureContext,
  buildDropSignatureContext,
  readWalletPayloadHash,
  shortWalletPayloadHash,
  verifyWalletRequestContext,
} from "@/lib/desktop/walletRequestContext";
import { buildCompetitionSignatureMessage } from "@/services/wallet-signatures/competition-signature";
import { buildDropSignatureMessage } from "@/services/wallet-signatures/structured-wallet-signatures";

const ADDRESS = "0x1111111111111111111111111111111111111111";

const drop = (
  overrides: Partial<ApiCreateDropRequest> = {}
): ApiCreateDropRequest => ({
  wave_id: "wave-1",
  drop_type: ApiDropType.Chat,
  title: "Hello",
  reply_to: { drop_id: "drop-0", drop_part_id: 1 },
  parts: [
    {
      content: "gm everyone",
      quoted_drop: { drop_id: "drop-q", drop_part_id: 1 },
      media: [{ url: "https://d.6529.io/a.png", mime_type: "image/png" }],
      attachments: [{ attachment_id: "att-1" }],
    },
    { content: null, media: [] },
  ],
  referenced_nfts: [],
  mentioned_users: [],
  metadata: [{ data_key: "mood", data_value: "sunny" }],
  signature: "0xold",
  signature_message: "old",
  signer_address: ADDRESS,
  ...overrides,
});

const dropText = (value: ApiCreateDropRequest, terms: string | null) =>
  buildDropSignatureMessage({
    address: ADDRESS,
    drop: value,
    termsOfService: terms,
  }).message;

const decisionText = (action: "VOTE_SET" | "ENTRY_CREATE", payload: unknown) =>
  buildCompetitionSignatureMessage({
    action,
    audience: "api.6529.io",
    actorProfileId: "profile-1",
    actorWallet: ADDRESS,
    waveId: "wave-1",
    competitionId: "competition-1",
    entryId: action === "VOTE_SET" ? "entry-1" : null,
    dropId: null,
    configVersion: 3,
    payload,
    nonce: "00000000-0000-4000-8000-000000000001",
    issuedAt: 1_800_000_000_000,
  });

describe("drop context", () => {
  it("recomputes the payload hash and summarises the drop", () => {
    const text = dropText(drop(), "Terms v1");
    const context = buildDropSignatureContext({
      drop: drop(),
      termsOfService: "Terms v1",
    });
    const content = verifyWalletRequestContext(text, "drop", context);
    expect(content).toEqual({
      kind: "drop",
      terms: "Terms v1",
      drop: {
        waveId: "wave-1",
        title: "Hello",
        replyToDropId: "drop-0",
        parts: [
          {
            position: 1,
            text: "gm everyone",
            quotedDropId: "drop-q",
            media: [{ url: "https://d.6529.io/a.png", mimeType: "image/png" }],
            attachments: 1,
          },
          {
            position: 2,
            text: null,
            quotedDropId: null,
            media: [],
            attachments: 0,
          },
        ],
        metadata: [{ key: "mood", value: "sunny" }],
      },
      committed: expect.any(String),
    });
    // What is shown as committed is exactly what the hash covers.
    expect(sha256(content!.committed)).toBe(
      readWalletPayloadHash(text, "drop")
    );
    expect(content!.committed).toContain('"terms_of_service":"Terms v1"');
    expect(content!.committed).not.toContain("0xold");
  });

  it("never sends the signature fields and sends empty terms as null", () => {
    const parsed = JSON.parse(
      buildDropSignatureContext({ drop: drop(), termsOfService: "" })
    );
    expect(Object.keys(parsed)).toEqual(["v", "kind", "drop", "terms"]);
    expect(parsed.terms).toBeNull();
    expect(parsed.drop).not.toHaveProperty("signature");
    expect(parsed.drop).not.toHaveProperty("signature_message");
  });

  it("refuses content that does not hash to the message's payload hash", () => {
    const text = dropText(drop(), null);
    const good = buildDropSignatureContext({
      drop: drop(),
      termsOfService: null,
    });
    expect(verifyWalletRequestContext(text, "drop", good)).not.toBeNull();
    for (const forged of [
      good.replace("gm everyone", "send me your NFTs"),
      buildDropSignatureContext({ drop: drop(), termsOfService: "Other" }),
      buildDropSignatureContext({
        drop: drop({ wave_id: "wave-2" }),
        termsOfService: null,
      }),
    ]) {
      expect(verifyWalletRequestContext(text, "drop", forged)).toBeNull();
    }
  });

  it("refuses an unexpected envelope or keys the hasher would change", () => {
    const text = dropText(drop(), null);
    const base = JSON.parse(
      buildDropSignatureContext({ drop: drop(), termsOfService: null })
    );
    for (const changed of [
      { ...base, v: 2 },
      { ...base, kind: "decision" },
      { ...base, extra: 1 },
      { ...base, terms: "" },
      { ...base, drop: { ...base.drop, signature: null } },
      { ...base, drop: { ...base.drop, terms_of_service: "x" } },
    ]) {
      expect(
        verifyWalletRequestContext(text, "drop", JSON.stringify(changed))
      ).toBeNull();
    }
    expect(verifyWalletRequestContext(text, "drop", "{")).toBeNull();
    expect(verifyWalletRequestContext(text, "drop", "[]")).toBeNull();
  });

  it("refuses a drop whose summarised fields have an unexpected shape, even when the hash matches", () => {
    for (const odd of [
      drop({ parts: [{ content: 7 as never, media: [] }] }),
      drop({ parts: [{ content: "x", media: [{ url: 1 } as never] }] }),
      drop({ title: 3 as never }),
      drop({ metadata: [{ data_key: "k" } as never] }),
      drop({ reply_to: { drop_id: "" } as never }),
    ]) {
      const context = buildDropSignatureContext({
        drop: odd,
        termsOfService: null,
      });
      expect(
        verifyWalletRequestContext(dropText(odd, null), "drop", context)
      ).toBeNull();
    }
  });
});

describe("decision context", () => {
  it("shows a vote whose payload hashes to the message's payload hash", () => {
    const text = decisionText("VOTE_SET", { value: 5 });
    expect(
      verifyWalletRequestContext(
        text,
        "decisionVote",
        buildDecisionSignatureContext({ value: 5 })
      )
    ).toEqual({
      kind: "decisionVote",
      waveId: "wave-1",
      competitionId: "competition-1",
      entryId: "entry-1",
      value: 5,
      committed: '{"value":5}',
    });
    for (const forged of [
      buildDecisionSignatureContext({ value: 6 }),
      buildDecisionSignatureContext({ value: 5, extra: true }),
      buildDropSignatureContext({ drop: drop(), termsOfService: null }),
    ]) {
      expect(
        verifyWalletRequestContext(text, "decisionVote", forged)
      ).toBeNull();
    }
  });

  it("refuses a vote payload of another shape even when its hash matches", () => {
    const text = decisionText("VOTE_SET", { value: "5" });
    expect(
      verifyWalletRequestContext(
        text,
        "decisionVote",
        buildDecisionSignatureContext({ value: "5" })
      )
    ).toBeNull();
  });

  it("shows an entry's drop", () => {
    const { signature: _s, signature_message: _m, ...unsigned } = drop();
    const payload = { drop: { ...unsigned, signature: null }, drop_id: null };
    const text = decisionText("ENTRY_CREATE", payload);
    expect(
      verifyWalletRequestContext(
        text,
        "decisionEntry",
        buildDecisionSignatureContext(payload)
      )
    ).toMatchObject({
      kind: "decisionEntry",
      competitionId: "competition-1",
      drop: { waveId: "wave-1", parts: [{ text: "gm everyone" }, {}] },
    });
  });
});

describe("payload hash", () => {
  it("reads it from both message formats and shortens it for comparing", () => {
    const text = dropText(drop(), null);
    const hash = readWalletPayloadHash(text, "drop");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(shortWalletPayloadHash(hash!)).toBe(
      `${hash!.slice(0, 8)}…${hash!.slice(-8)}`
    );
    const vote = decisionText("VOTE_SET", { value: 1 });
    expect(readWalletPayloadHash(vote, "decisionVote")).toBe(
      JSON.parse(vote).payload_hash
    );
    expect(readWalletPayloadHash("nope", "decisionVote")).toBeNull();
    expect(readWalletPayloadHash("nope", "drop")).toBeNull();
  });
});
