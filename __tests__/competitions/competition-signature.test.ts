import { createHash } from "node:crypto";
import { publicEnv } from "@/config/env";
import {
  buildCompetitionSignatureMessage,
  canonicalCompetitionJson,
} from "@/services/wallet-signatures/competition-signature";

const signing = {
  action: "VOTE_SET" as const,
  audience: "api.example.test:8443",
  actorProfileId: "profile",
  actorWallet: "0xABC",
  waveId: "wave",
  competitionId: "competition",
  entryId: "entry",
  dropId: "drop",
  configVersion: 7,
  payload: { value: -12 },
  nonce: "nonce",
  issuedAt: 1_000,
};

describe("native competition signatures", () => {
  it("defaults to the trusted configured API audience and mainnet chain", () => {
    const { audience: _fixtureAudience, ...runtimeSigning } = signing;
    expect(
      JSON.parse(buildCompetitionSignatureMessage(runtimeSigning))
    ).toMatchObject({
      audience: new URL(publicEnv.API_ENDPOINT).host.toLowerCase(),
      chain_id: 1,
    });
  });

  it("canonicalizes nested keys while preserving arrays and omitting absent fields", () => {
    expect(
      canonicalCompetitionJson({
        z: [{ b: 2, a: 1 }, "second"],
        omitted: undefined,
        a: null,
      })
    ).toBe('{"a":null,"z":[{"a":1,"b":2},"second"]}');
  });
  it("binds the domain, represented profile, wallet, parent, entry, version, value and expiry", () => {
    const message = buildCompetitionSignatureMessage(signing);
    expect(JSON.parse(message)).toEqual({
      action: "VOTE_SET",
      audience: "api.example.test:8443",
      chain_id: 1,
      actor_profile_id: "profile",
      actor_wallet: "0xabc",
      competition_entry_id: "entry",
      competition_id: "competition",
      config_version: 7,
      domain: "6529-competition-v1",
      drop_id: "drop",
      expires_at: 301_000,
      issued_at: 1_000,
      nonce: "nonce",
      payload_hash: createHash("sha256").update('{"value":-12}').digest("hex"),
      wave_id: "wave",
    });
    expect(message).toBe(canonicalCompetitionJson(JSON.parse(message)));
    for (const change of [
      { audience: "api.staging.example.test:8443" },
      { competitionId: "other" },
      { entryId: "other" },
      { configVersion: 8 },
      { payload: { value: 12 } },
      { actorProfileId: "other" },
    ])
      expect(
        buildCompetitionSignatureMessage({ ...signing, ...change })
      ).not.toBe(message);
  });
  it("signs the complete original entry body and an explicit null association", () => {
    const payload = {
      drop: { parts: [{ content: "hello", media: [] }], signature: null },
      drop_id: null,
    };
    const message = JSON.parse(
      buildCompetitionSignatureMessage({
        ...signing,
        action: "ENTRY_CREATE",
        entryId: null,
        dropId: null,
        payload,
      })
    );
    expect(message.payload_hash).toBe(
      createHash("sha256")
        .update(canonicalCompetitionJson(payload))
        .digest("hex")
    );
    expect(message.competition_entry_id).toBeNull();
  });
});
