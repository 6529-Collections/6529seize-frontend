/**
 * @jest-environment node
 */
import { keccak256, toBytes, type Hex } from "viem";
import {
  fixtureRecord,
  fixtureStore,
  payloadBytes,
  policiesTextCid,
  profileFixture,
  storeFetcher,
} from "@/__tests__/fixtures/museum-onchain-profile";
import { fixtureRegistrySnapshot } from "@/lib/museum/onchain/fixture";
import { buildOnchainMuseum } from "@/lib/museum/onchain/museum";
import { profileSubjectId } from "@/lib/museum/onchain/profile";
import type {
  RegistrySnapshot,
  RegistrySubject,
} from "@/lib/museum/onchain/registry";

const encoder = new TextEncoder();

function registry(): RegistrySnapshot {
  return fixtureRegistrySnapshot(profileFixture);
}

function build(
  snapshot: RegistrySnapshot = registry(),
  store: Map<string, Uint8Array> = fixtureStore()
) {
  return buildOnchainMuseum(snapshot, storeFetcher(store), 0, "fixture");
}

function subjectOf(
  snapshot: RegistrySnapshot,
  localId: string
): RegistrySubject {
  const { subjectId } = fixtureRecord(localId);
  const subject = snapshot.subjects.find(
    (item) => item.subjectId.toLowerCase() === subjectId.toLowerCase()
  );
  if (subject === undefined) throw new Error(localId);
  return subject;
}

function replaceSubject(
  snapshot: RegistrySnapshot,
  localId: string,
  change: (subject: RegistrySubject) => RegistrySubject
): RegistrySnapshot {
  const target = subjectOf(snapshot, localId);
  return {
    ...snapshot,
    subjects: snapshot.subjects.map((item) =>
      item === target ? change(item) : item
    ),
  };
}

async function recordOf(
  snapshot: RegistrySnapshot,
  localId: string,
  store?: Map<string, Uint8Array>
) {
  const museum = await build(snapshot, store);
  const { subjectId } = fixtureRecord(localId);
  const record = museum.records.find(
    (item) => item.subjectId.toLowerCase() === subjectId.toLowerCase()
  );
  if (record === undefined) throw new Error(localId);
  return { museum, record };
}

describe("buildOnchainMuseum with profile records", () => {
  it("verifies every fixture record, the declaration and the text", async () => {
    const museum = await build();
    expect(museum.counts.verified).toBe(profileFixture.records.length);
    expect(museum.source).toBe("fixture");
    expect(museum.declaration).toMatchObject({
      state: "verified",
      ns: "6529networkmuseum",
      profileVersion: "PRV_PROFILE_V1.0",
      subjectDerivation: "v1",
      registry: "eip155:11155111:0x0000000000000000000000000000000000000000",
      predecessor: "eip155:11155111:0xee91c45a1893fbb45ce8eea170ef05d8d85bb850",
    });
    const document = museum.records.find(
      (record) => record.profile?.localId === "6529NM-DOC-0001"
    );
    expect(document?.text).toMatchObject({
      state: "verified",
      byteSize: 681,
      mediaType: "text/markdown",
    });
    expect(document?.text?.text).toMatch(/^# /u);
    expect(document?.label).toBe("Policies and governing sources");
    // Fifteen of the release's 589 records.
    expect(museum.expected).toEqual({
      releases: 1,
      records: 589,
      matches: false,
    });
  });

  it("derives each subject ID from the payload's namespace, family and local ID", async () => {
    const museum = await build();
    for (const record of museum.records) {
      const { profile } = record;
      expect(profile).not.toBeNull();
      expect(
        profileSubjectId(profile!.ns, profile!.recordType, profile!.localId)
      ).toBe(record.subjectId.toLowerCase());
    }
    expect(
      keccak256(
        toBytes("6529networkmuseum.subject.prv_entity.v1:6529NM-W-0001")
      )
    ).toBe(fixtureRecord("6529NM-W-0001").subjectId);
  });

  it("withholds a forged payload served for a record's content ID", async () => {
    const store = fixtureStore();
    const { rawCid } = fixtureRecord("6529NM-W-0001");
    const forged = new TextDecoder()
      .decode(payloadBytes("6529NM-W-0001"))
      .replace('"en":"CENTURY #31"', '"en":"CENTURY #32"');
    store.set(rawCid.toLowerCase(), encoder.encode(forged));
    const { museum, record } = await recordOf(
      registry(),
      "6529NM-W-0001",
      store
    );
    expect(record).toMatchObject({
      state: "mismatch",
      check: "digest_mismatch",
      content: null,
      profile: null,
    });
    expect(museum.counts.mismatch).toBe(1);
  });

  it("withholds a verified payload that the registry filed under another subject", async () => {
    const artist = fixtureRecord("6529NM-ART-0001");
    const snapshot = replaceSubject(registry(), "6529NM-W-0001", (subject) => ({
      ...subject,
      version: {
        ...subject.version,
        contentHash: {
          ...subject.version.contentHash,
          digest: artist.contentHash,
        },
        cid: artist.rawCid,
        effectiveAt: artist.effectiveAt,
      },
    }));
    const { record } = await recordOf(snapshot, "6529NM-W-0001");
    expect(record).toMatchObject({
      state: "nonconforming",
      check: "subject_id",
      content: null,
    });
  });

  it("checks the schema and effective time against the registry version", async () => {
    const wrongTime = replaceSubject(
      registry(),
      "6529NM-W-0001",
      (subject) => ({
        ...subject,
        version: {
          ...subject.version,
          effectiveAt: subject.version.effectiveAt + 1,
        },
      })
    );
    expect((await recordOf(wrongTime, "6529NM-W-0001")).record.check).toBe(
      "effective_at"
    );
    const schemaId: Hex = keccak256(toBytes("PRV_ENTITY_V2.0"));
    const base = registry();
    const wrongSchema = replaceSubject(
      {
        ...base,
        schemas: {
          ...base.schemas,
          [schemaId]: {
            ...Object.values(base.schemas)[0]!,
            schemaId,
            literal: "PRV_ENTITY_V2.0",
          },
        },
      },
      "6529NM-W-0001",
      (subject) => ({ ...subject, version: { ...subject.version, schemaId } })
    );
    expect((await recordOf(wrongSchema, "6529NM-W-0001")).record.check).toBe(
      "schema"
    );
  });

  it("rejects a declaration that names another registry", async () => {
    const snapshot = {
      ...registry(),
      registry: "0xee91c45A1893fbb45ce8EeA170eF05d8d85bb850" as const,
    };
    const { museum, record } = await recordOf(snapshot, "declaration");
    expect(museum.declaration.state).toBe("mismatch");
    expect(record).toMatchObject({
      state: "nonconforming",
      check: "declaration",
    });
  });

  it("shows a document's facts but not a text whose bytes do not match", async () => {
    const store = fixtureStore();
    store.set(policiesTextCid.toLowerCase(), encoder.encode("# Forged\n"));
    const { record } = await recordOf(registry(), "6529NM-DOC-0001", store);
    expect(record.state).toBe("mismatch");
    expect(record.check).toBe("text_mismatch");
    expect(record.text?.text).toBeNull();
    expect(record.profile?.kind).toBe("finding_aid");
  });

  it("reports a text no gateway serves as unavailable", async () => {
    const store = fixtureStore();
    store.delete(policiesTextCid.toLowerCase());
    const { record } = await recordOf(registry(), "6529NM-DOC-0001", store);
    expect(record).toMatchObject({
      state: "unavailable",
      check: "text_unavailable",
    });
  });

  it("does not fetch a deleted version", async () => {
    const snapshot = replaceSubject(registry(), "6529NM-W-0001", (subject) => ({
      ...subject,
      deleted: true,
      version: { ...subject.version, deleted: true, deletionId: 1 },
    }));
    const { record } = await recordOf(snapshot, "6529NM-W-0001");
    expect(record.state).toBe("deleted");
    expect(record.content).toBeNull();
  });
});
