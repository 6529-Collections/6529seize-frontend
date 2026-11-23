/**
 * @jest-environment node
 */
import {
  fixtureRecord,
  fixtureStore,
  profileFixture,
  storeFetcher,
} from "@/__tests__/fixtures/museum-onchain-profile";
import { parseSubjectIdParam } from "@/lib/museum/onchain/fields";
import { fixtureRegistrySnapshot } from "@/lib/museum/onchain/fixture";
import type { OnchainWorkImage } from "@/lib/museum/onchain/media";
import {
  buildOnchainMuseum,
  type OnchainMuseumSnapshot,
} from "@/lib/museum/onchain/museum";
import {
  buildOnchainMuseumView,
  type OnchainLabeler,
  type OnchainMuseumView,
} from "@/lib/museum/onchain/presentation";
import { textGroupKey, textsNaming } from "@/lib/museum/onchain/texts";
import {
  collectionOf,
  creatorsOf,
  objectRecordsOf,
  rightsOf,
  workImage,
  worksAbout,
} from "@/lib/museum/onchain/works";

const labeler: OnchainLabeler = {
  entityGroup: (key) => `group:${key}`,
  entitySingular: (key) => `entity:${key}`,
  family: (recordType) => `family:${recordType}`,
  recordKind: (family, kind) => `${family}/${kind}`,
  recordKindPlural: (family, kind) => `${family}/${kind}s`,
  documentKind: (kind) => `document:${kind}`,
  relation: (kind, source, target) => `${source} [${kind}] ${target}`,
  dated: (kind, isoDate) => `${kind} ${isoDate.slice(0, 10)}`,
  textGroup: (kind) => `texts:${kind}`,
  unverifiedGroup: () => "unverified",
};

function image(key: string, sha256: string): OnchainWorkImage {
  return {
    key,
    mediaEntityId: null,
    altText: `Image of ${key}`,
    derivatives: [
      { width: 640, height: 480, cid: "bafkreitest", sha256, byteSize: 10 },
    ],
    rightsStatus: null,
    rightsTerms: [],
    displayStatus: "approved_by_reviewed_display_authority",
    manifestPath:
      "records/programs/6529NM-AP-01/public/presentation-manifest.json",
  };
}

/** Take the Key!'s digital object names this file in `body.media`. */
const TAKE_THE_KEY_SHA256 =
  "d28e89b7ca58647ce0b7a0979ca8138d4213c3c0b4080d76b7f154b522612b04";

let snapshot: OnchainMuseumSnapshot;
let view: OnchainMuseumView;

beforeAll(async () => {
  const built = await buildOnchainMuseum(
    fixtureRegistrySnapshot(profileFixture),
    storeFetcher(fixtureStore()),
    0,
    "fixture"
  );
  snapshot = {
    ...built,
    media: {
      ...built.media,
      images: {
        "6529NM-W-0001": image("6529NM-W-0001", "a".repeat(64)),
        "6529NM-AP-01-OUT-001": image(
          "6529NM-AP-01-OUT-001",
          TAKE_THE_KEY_SHA256
        ),
      },
    },
  };
  view = buildOnchainMuseumView(snapshot, {
    labeler,
    compare: (left, right) => left.localeCompare(right, "en-US"),
  });
});

function record(localId: string) {
  const found = view.find(fixtureRecord(localId).subjectId);
  if (found === null) throw new Error(localId);
  return found;
}

describe("buildOnchainMuseumView", () => {
  it("groups entities by profile kind and the relations around them", () => {
    const groups = Object.fromEntries(
      view.entityGroups.map((group) => [
        group.key,
        group.records.map((item) => item.profile?.localId),
      ])
    );
    expect(groups).toEqual({
      work: ["6529NM-W-0001", "6529NM-W-0008"],
      artist: ["6529NM-ART-0001"],
      object: ["6529NM.2026.001.01"],
      collection: ["6529NM-C-0001"],
      group: ["6529NM-I-0001"],
      digital_object: ["6529NM-MED-0020"],
    });
    expect(
      view.recordGroups.map((group) => [group.key, group.records.length])
    ).toEqual([
      ["PRV_OBSERVATION.condition", 1],
      ["PRV_RIGHTS.licence", 1],
    ]);
    expect(view.relationCount).toBe(4);
    expect(view.unverified).toEqual([]);
  });

  it("labels records from their bodies and the records they name", () => {
    expect(view.labelOf(record("6529NM-REL-0002"))).toBe(
      "CENTURY #31 [created_by] Casey Reas"
    );
    expect(view.labelOf(record("6529NM.2026.001.RIGHTS.01"))).toBe(
      "PRV_RIGHTS/licence: CENTURY #31"
    );
    expect(view.kindOf(record("6529NM-DOC-0001"))).toBe("document:finding_aid");
    expect(view.labelOf(record("declaration"))).toBe(
      "6529 Network Museum catalog registry, profile v1 (Sepolia test)"
    );
    expect(view.declarationRecord?.profile?.kind).toBe("declaration");
  });

  it("reads a work's artists, collection and object records", () => {
    const work = record("6529NM-W-0001");
    expect(creatorsOf(view, work).map((item) => item.profile?.localId)).toEqual(
      ["6529NM-ART-0001"]
    );
    expect(collectionOf(view, work)?.profile?.localId).toBe("6529NM-C-0001");
    expect(collectionOf(view, record("6529NM-W-0008"))).toBeNull();
    expect(
      objectRecordsOf(view, work).map((item) => item.profile?.localId)
    ).toEqual([
      "6529NM.2026.001.01",
      "6529NM.2026.001.RIGHTS.01",
      "6529NM.2026.001.COND.01",
    ]);
    expect(rightsOf(view, work)).toEqual([
      expect.objectContaining({
        status: "licensed",
        licence: "CC BY-NC 4.0",
        licenceUri: "https://creativecommons.org/licenses/by-nc/4.0/",
      }),
    ]);
  });

  it("finds a work's image by its local ID or by its digital object's file", () => {
    expect(workImage(view, record("6529NM-W-0001"))).toMatchObject({
      title: "CENTURY #31",
      artists: ["Casey Reas"],
      rights: [expect.objectContaining({ licence: "CC BY-NC 4.0" })],
    });
    expect(workImage(view, record("6529NM-W-0008"))?.image.key).toBe(
      "6529NM-AP-01-OUT-001"
    );
    expect(workImage(view, record("6529NM-ART-0001"))).toBeNull();
  });

  it("groups texts by folder and names what they are about", () => {
    const document = record("6529NM-DOC-0001");
    expect(view.textGroupOf(document)).toMatchObject({
      kind: "policies",
      heading: "texts:policies",
    });
    expect(worksAbout(view, document)).toEqual([]);
    expect(
      textsNaming(view, "Policies and governing sources", "equals")
    ).toEqual([document]);
    expect(
      textGroupKey("records/accessions/6529NM.2026.001/public/a.md")
    ).toEqual({ kind: "accession", contextId: "6529NM.2026.001" });
  });

  it("accepts only full lower-case subject IDs in the route", () => {
    const id = fixtureRecord("6529NM-W-0001").subjectId;
    expect(parseSubjectIdParam(id.toUpperCase().replace("0X", "0x"))).toBe(
      id.toLowerCase()
    );
    expect(parseSubjectIdParam("0x1234")).toBeNull();
  });
});
