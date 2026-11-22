/**
 * @jest-environment node
 */
import { keccak256, toHex } from "viem";
import { literalId } from "@/lib/provenance-core/actions";
import { registryPins } from "@/lib/provenance-core/config/registries";
import { buildGovernanceSafeTxs } from "@/lib/provenance-core/governance";
import {
  draftToAction,
  emptyDraft,
  formatArg,
  GOVERNANCE_KINDS,
  subjectIdOf,
  type GovernanceDraft,
} from "@/lib/provenance-governance/forms";

const KEY = "0x56ec02E81f5Cd36E49cA5382A5f55a00A4906F94";
const DIGEST = `0x${"ab".repeat(32)}`;
const CID = "bafkreickzojlirllnpd6q53jgaksb7fb54pwogqx7dbolt47lcbyewdqbi";
const draft = (
  patch: Partial<GovernanceDraft> & Pick<GovernanceDraft, "kind">
): GovernanceDraft => ({
  ...emptyDraft(patch.kind),
  ...patch,
});

describe("draftToAction", () => {
  it("builds every governance call the page offers into a call the core accepts", () => {
    const drafts: GovernanceDraft[] = [
      draft({ kind: "registerCanonicalization", literal: "RAW_BYTES_LF" }),
      draft({ kind: "registerRecordType", literal: "PUBLIC_DOCUMENT" }),
      draft({
        kind: "registerSchema",
        literal: "PUBLIC_DOCUMENT_V1",
        digest: DIGEST,
        cid: CID,
      }),
      draft({ kind: "setPublisher", address: KEY, authorized: true }),
      draft({ kind: "deleteVersion", subject: "subject text", reason: DIGEST }),
      draft({
        kind: "deleteVersions",
        subject: DIGEST,
        fromVersion: "1",
        toVersion: "3",
        reason: DIGEST,
      }),
      draft({ kind: "deleteSubject", subject: DIGEST, reason: DIGEST }),
      draft({ kind: "transferOwnership", address: KEY }),
      draft({ kind: "acceptOwnership" }),
      draft({ kind: "declareSuccessor", address: KEY }),
      draft({ kind: "freeze" }),
    ];
    expect(drafts.map((d) => d.kind).sort()).toEqual(
      [...GOVERNANCE_KINDS].sort()
    );
    const actions = drafts.map((d) => {
      const r = draftToAction(d);
      if (!r.ok) throw new Error(`${d.kind}: ${r.key}`);
      return r.action;
    });
    const txs = buildGovernanceSafeTxs(registryPins[1]!, actions, 0n);
    expect(txs.flatMap((g) => g.actions)).toEqual(actions);
  });

  it("registers a schema by hash and CID with no on-chain document", () => {
    const r = draftToAction(
      draft({
        kind: "registerSchema",
        literal: "S_V1",
        digest: DIGEST,
        cid: CID,
        algorithm: "2",
      })
    );
    expect(r).toMatchObject({
      ok: true,
      action: {
        document: "0x",
        documentHash: {
          algorithm: 2,
          digest: DIGEST,
          canonicalizationId: literalId("RFC8785_JCS"),
        },
      },
    });
  });

  it.each([
    [
      draft({ kind: "registerRecordType", literal: "HAS SPACE" }),
      "literal",
      "provenance.governance.form.error.literal",
    ],
    [
      draft({ kind: "registerSchema", literal: "S", digest: "0x12", cid: CID }),
      "digest",
      "provenance.governance.form.error.digest",
    ],
    [
      draft({ kind: "registerSchema", literal: "S", digest: DIGEST, cid: "" }),
      "cid",
      "provenance.governance.form.error.cid",
    ],
    [
      draft({
        kind: "registerSchema",
        literal: "S",
        digest: DIGEST,
        cid: "not a cid",
      }),
      "cid",
      "provenance.governance.form.error.cid",
    ],
    [
      draft({ kind: "setPublisher", address: "0x12" }),
      "address",
      "provenance.governance.form.error.address",
    ],
    [
      draft({ kind: "deleteVersion", subject: "", reason: DIGEST }),
      "subject",
      "provenance.governance.form.error.subject",
    ],
    [
      draft({ kind: "deleteVersion", subject: "s", reason: "0x" }),
      "reason",
      "provenance.governance.form.error.reason",
    ],
    [
      draft({
        kind: "deleteVersion",
        subject: "s",
        reason: DIGEST,
        fromVersion: "0",
      }),
      "fromVersion",
      "provenance.governance.form.error.version",
    ],
    [
      draft({
        kind: "deleteVersions",
        subject: "s",
        reason: DIGEST,
        fromVersion: "3",
        toVersion: "2",
      }),
      "toVersion",
      "provenance.governance.form.error.range",
    ],
  ])("names the field and message for a bad draft (%#)", (d, field, key) => {
    expect(draftToAction(d)).toMatchObject({ ok: false, field, key });
  });

  it("derives a subject ID from text, and takes 32-byte hex as is", () => {
    expect(
      subjectIdOf(
        "6529networkmuseum.subject.public_document.v1:CONTRIBUTING.md"
      )
    ).toBe(
      keccak256(
        toHex("6529networkmuseum.subject.public_document.v1:CONTRIBUTING.md")
      )
    );
    expect(subjectIdOf(DIGEST)).toBe(DIGEST);
    expect(subjectIdOf("   ")).toBeUndefined();
  });
});

describe("formatArg", () => {
  it("writes decoded arguments as text", () => {
    expect(formatArg(12n)).toBe("12");
    expect(formatArg(true)).toBe("true");
    expect(formatArg("")).toBe('""');
    expect(formatArg({ algorithm: 1, digest: "0x01" })).toBe(
      "{ algorithm: 1, digest: 0x01 }"
    );
  });
});
