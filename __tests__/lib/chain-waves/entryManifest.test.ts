import { sha256 } from "js-sha256";
import { bytesToString, type Hex } from "viem";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { ApiDropType } from "@/generated/models/ApiDropType";
import {
  DocClass,
  docBytes,
  docCid,
  docCommitment,
} from "@/lib/chain-waves/docs";
import {
  buildEntryManifest,
  competitionConsent,
  competitionEntryPayload,
  consentPayload,
  dropConsent,
  entryFieldsOf,
  entryManifestDocument,
  type EntryManifest,
} from "@/lib/chain-waves/entryManifest";
import { buildCompetitionSignatureMessage } from "@/services/wallet-signatures/competition-signature";
import { DropHasher } from "@/utils/drop-hasher";
import { DECISION, VOTER, WALLET, WAVE } from "./wavesDraftFixture";

const NONCE_WORD = `0x${"5a".repeat(16)}${"00".repeat(16)}` as Hex;
const WAVE_UUID = "7d0a2c4e-9a1b-4c3d-8e5f-0a1b2c3d4e5f";
const TERMS = "I made this work and may submit it.";

const memesRequest = (): ApiCreateDropRequest => ({
  collaborator_ids: ["3b1f6a2c-0000-4000-8000-000000000001"],
  wave_id: WAVE_UUID,
  drop_type: ApiDropType.Participatory,
  is_additional_action_promised: false,
  title: "Card title",
  parts: [
    {
      content: "About the card",
      media: [
        { url: "https://media.example/card.png", mime_type: "image/png" },
      ],
    },
  ],
  referenced_nfts: [],
  mentioned_users: [],
  metadata: [
    { data_key: "title", data_value: "Card title" },
    { data_key: "payment_info", data_value: '{"payment_address":"0x01"}' },
    { data_key: "airdrop_config", data_value: "[]" },
  ],
  signature: null,
  is_safe_signature: false,
  signer_address: WALLET,
});

const parse = (bytes: Uint8Array): EntryManifest =>
  JSON.parse(bytesToString(bytes)) as EntryManifest;

const manifestOf = (
  request: ApiCreateDropRequest,
  consent: EntryManifest["consent"]
) =>
  buildEntryManifest({
    nonceWord: NONCE_WORD,
    decisionId: DECISION,
    waveId: WAVE,
    author: VOTER,
    createdAt: 1_764_000_000_000,
    fields: entryFieldsOf(request),
    consent,
  });

describe("the entry manifest", () => {
  it("keeps 6529.io's entry fields and leaves the request's proofs out", () => {
    const manifest = manifestOf(
      {
        ...memesRequest(),
        client_drop_id: "c0ffee00-0000-4000-8000-000000000000",
      },
      null
    );
    expect(manifest).toEqual({
      v: 1,
      kind: "entry",
      nonce: `0x${"5a".repeat(16)}`,
      decision: DECISION,
      wave: WAVE,
      author: VOTER,
      created_at: 1_764_000_000_000,
      consent: null,
      collaborator_ids: ["3b1f6a2c-0000-4000-8000-000000000001"],
      wave_id: WAVE_UUID,
      drop_type: "PARTICIPATORY",
      is_additional_action_promised: false,
      title: "Card title",
      parts: memesRequest().parts,
      referenced_nfts: [],
      mentioned_users: [],
      metadata: memesRequest().metadata,
    });
  });

  it("commits to its bytes with class 8 and its nonce, and is named by their CID", () => {
    const manifest = manifestOf(memesRequest(), null);
    const document = entryManifestDocument(manifest);
    expect(document.bytes).toEqual(docBytes(manifest));
    expect(document.manifestHash).toBe(
      docCommitment(DocClass.ENTRY_MANIFEST, NONCE_WORD, document.bytes)
    );
    expect(document.contentCid).toBe(docCid(document.bytes));
    expect(parse(document.bytes)).toEqual(manifest);
  });

  it("takes only a 128-bit nonce", () => {
    expect(() =>
      buildEntryManifest({
        nonceWord: `0x${"5a".repeat(32)}`,
        decisionId: DECISION,
        waveId: WAVE,
        author: VOTER,
        createdAt: 1,
        fields: {},
        consent: null,
      })
    ).toThrow("nonce");
  });

  it("carries a competition consent whose payload hash the manifest rebuilds", () => {
    const request = memesRequest();
    const fields = entryFieldsOf(request);
    const message = buildCompetitionSignatureMessage({
      action: "ENTRY_CREATE",
      audience: "api.example",
      actorProfileId: "profile-1",
      actorWallet: WALLET,
      waveId: WAVE_UUID,
      competitionId: "9e0a2c4e-9a1b-4c3d-8e5f-0a1b2c3d4e5f",
      entryId: null,
      dropId: null,
      configVersion: 4,
      payload: competitionEntryPayload(fields),
      nonce: "8f0a2c4e-9a1b-4c3d-8e5f-0a1b2c3d4e5f",
      issuedAt: 1_764_000_000_000,
    });
    const consent = competitionConsent({
      signature: { message, signature: "0xsig" },
      terms: TERMS,
      configVersion: 4,
      isSafeSignature: false,
    });
    expect(consent).toEqual({
      scheme: "6529-competition-v1",
      terms: TERMS,
      terms_sha256: `0x${sha256(TERMS)}`,
      config_version: 4,
      signer_address: WALLET,
      is_safe_signature: false,
      client_drop_id: null,
      signature_message: message,
      signature: "0xsig",
    });
    const stored = parse(
      entryManifestDocument(manifestOf(request, consent)).bytes
    );
    const payload = consentPayload(stored);
    expect(payload).not.toBeNull();
    expect(sha256(payload ?? "")).toBe(
      (JSON.parse(message) as { payload_hash: string }).payload_hash
    );
  });

  it("carries a drop signature whose hash the manifest rebuilds", () => {
    const unsigned: ApiCreateDropRequest = {
      ...memesRequest(),
      client_drop_id: "c0ffee00-0000-4000-8000-000000000000",
    };
    const hash = new DropHasher().hash({
      drop: unsigned,
      termsOfService: TERMS,
    });
    const signed = {
      ...unsigned,
      signature: "0xsig",
      signature_message: `signed ${hash}`,
    };
    const consent = dropConsent(signed, TERMS);
    expect(consent).toMatchObject({
      scheme: "6529-drop",
      signer_address: WALLET,
      client_drop_id: "c0ffee00-0000-4000-8000-000000000000",
      signature_message: `signed ${hash}`,
    });
    const stored = parse(
      entryManifestDocument(manifestOf(signed, consent)).bytes
    );
    expect(consentPayload(stored)).toBe(hash);
  });

  it("has no consent for an unsigned request", () => {
    expect(dropConsent(memesRequest(), TERMS)).toBeNull();
    expect(consentPayload(manifestOf(memesRequest(), null))).toBeNull();
  });
});
