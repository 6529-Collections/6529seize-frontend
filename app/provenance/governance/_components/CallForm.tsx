"use client";

import { useId, useState } from "react";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import type { Action } from "@/lib/provenance-core/actions";
import {
  draftToAction,
  emptyDraft,
  GOVERNANCE_KINDS,
  subjectIdOf,
  type GovernanceDraft,
  type GovernanceKind,
} from "@/lib/provenance-governance/forms";
import { BUTTON, CARD, HINT, INPUT, LABEL, tr } from "./ui";

const KIND_LABEL: Record<GovernanceKind, MessageKey> = {
  registerCanonicalization:
    "provenance.governance.kind.registerCanonicalization",
  registerRecordType: "provenance.governance.kind.registerRecordType",
  registerSchema: "provenance.governance.kind.registerSchema",
  setPublisher: "provenance.governance.kind.setPublisher",
  deleteVersion: "provenance.governance.kind.deleteVersion",
  deleteVersions: "provenance.governance.kind.deleteVersions",
  deleteSubject: "provenance.governance.kind.deleteSubject",
  transferOwnership: "provenance.governance.kind.transferOwnership",
  acceptOwnership: "provenance.governance.kind.acceptOwnership",
  declareSuccessor: "provenance.governance.kind.declareSuccessor",
  freeze: "provenance.governance.kind.freeze",
};

const ADDRESS_LABEL: Partial<Record<GovernanceKind, MessageKey>> = {
  setPublisher: "provenance.governance.form.publisher",
  declareSuccessor: "provenance.governance.form.successor",
  transferOwnership: "provenance.governance.form.newOwner",
};

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
  hint?: string | undefined;
  mono?: boolean;
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  mono = true,
}: FieldProps) {
  const ids = [
    error === undefined ? "" : `${id}-error`,
    hint === undefined ? "" : `${id}-hint`,
  ];
  const describedBy = ids.filter((x) => x !== "").join(" ");
  return (
    <div className="tw-flex tw-flex-col tw-gap-1">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        className={mono ? `${INPUT} tw-font-mono` : INPUT}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={describedBy === "" ? undefined : describedBy}
      />
      {hint === undefined ? null : (
        <p id={`${id}-hint`} className={`${HINT} tw-m-0`}>
          {hint}
        </p>
      )}
      {error === undefined ? null : (
        <p id={`${id}-error`} className="tw-m-0 tw-text-xs tw-text-error">
          {error}
        </p>
      )}
    </div>
  );
}

type FieldsProps = {
  id: string;
  d: GovernanceDraft;
  set: (patch: Partial<GovernanceDraft>) => void;
  err: (field: keyof GovernanceDraft) => string | undefined;
};

function RegistrationFields({ id, d, set, err }: FieldsProps) {
  return (
    <>
      <Field
        id={`${id}-literal`}
        label={tr("provenance.governance.form.literal")}
        hint={tr("provenance.governance.form.literalHint")}
        value={d.literal}
        onChange={(literal) => set({ literal })}
        error={err("literal")}
      />
      {d.kind === "registerCanonicalization" ? (
        <Field
          id={`${id}-cid`}
          label={tr("provenance.governance.form.specCid")}
          value={d.cid}
          onChange={(cid) => set({ cid })}
          error={err("cid")}
        />
      ) : null}
      {d.kind === "registerSchema" ? (
        <>
          <Field
            id={`${id}-digest`}
            label={tr("provenance.governance.form.digest")}
            value={d.digest}
            onChange={(digest) => set({ digest })}
            error={err("digest")}
          />
          <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2">
            <div className="tw-flex tw-flex-col tw-gap-1">
              <label htmlFor={`${id}-alg`} className={LABEL}>
                {tr("provenance.governance.form.algorithm")}
              </label>
              <select
                id={`${id}-alg`}
                className={INPUT}
                value={d.algorithm}
                onChange={(e) =>
                  set({ algorithm: e.target.value === "2" ? "2" : "1" })
                }
              >
                <option value="1">
                  {tr("provenance.governance.form.algorithm.1")}
                </option>
                <option value="2">
                  {tr("provenance.governance.form.algorithm.2")}
                </option>
              </select>
            </div>
            <Field
              id={`${id}-canon`}
              label={tr("provenance.governance.form.canonicalization")}
              value={d.canonicalization}
              onChange={(canonicalization) => set({ canonicalization })}
              error={err("canonicalization")}
            />
          </div>
          <Field
            id={`${id}-cid`}
            label={tr("provenance.governance.form.cid")}
            hint={tr("provenance.governance.form.schemaHint")}
            value={d.cid}
            onChange={(cid) => set({ cid })}
            error={err("cid")}
          />
        </>
      ) : null}
    </>
  );
}

function AddressFields({ id, d, set, err }: FieldsProps) {
  const label = ADDRESS_LABEL[d.kind];
  if (label === undefined) return null;
  return (
    <>
      <Field
        id={`${id}-address`}
        label={tr(label)}
        value={d.address}
        onChange={(address) => set({ address })}
        error={err("address")}
      />
      {d.kind === "setPublisher" ? (
        <fieldset className="tw-m-0 tw-flex tw-flex-wrap tw-gap-4 tw-border-0 tw-p-0">
          <legend className="tw-sr-only">
            {tr("provenance.governance.kind.setPublisher")}
          </legend>
          <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-iron-100">
            <input
              type="radio"
              name={`${id}-auth`}
              checked={d.authorized}
              onChange={() => set({ authorized: true })}
            />
            {tr("provenance.governance.form.authorize")}
          </label>
          <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-iron-100">
            <input
              type="radio"
              name={`${id}-auth`}
              checked={!d.authorized}
              onChange={() => set({ authorized: false })}
            />
            {tr("provenance.governance.form.revoke")}
          </label>
        </fieldset>
      ) : null}
    </>
  );
}

function DeletionFields({ id, d, set, err }: FieldsProps) {
  const subjectId = subjectIdOf(d.subject);
  const versionLabel =
    d.kind === "deleteVersion"
      ? "provenance.governance.form.version"
      : "provenance.governance.form.fromVersion";
  return (
    <>
      <Field
        id={`${id}-subject`}
        label={tr("provenance.governance.form.subject")}
        hint={
          subjectId === undefined
            ? undefined
            : tr("provenance.governance.form.subjectId", { id: subjectId })
        }
        value={d.subject}
        onChange={(subject) => set({ subject })}
        error={err("subject")}
      />
      {d.kind === "deleteSubject" ? null : (
        <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2">
          <Field
            id={`${id}-from`}
            label={tr(versionLabel)}
            value={d.fromVersion}
            onChange={(fromVersion) => set({ fromVersion })}
            error={err("fromVersion")}
            mono={false}
          />
          {d.kind === "deleteVersions" ? (
            <Field
              id={`${id}-to`}
              label={tr("provenance.governance.form.toVersion")}
              value={d.toVersion}
              onChange={(toVersion) => set({ toVersion })}
              error={err("toVersion")}
              mono={false}
            />
          ) : null}
        </div>
      )}
      <Field
        id={`${id}-reason`}
        label={tr("provenance.governance.form.reason")}
        value={d.reason}
        onChange={(reason) => set({ reason })}
        error={err("reason")}
      />
    </>
  );
}

const REGISTRATIONS = new Set<GovernanceKind>([
  "registerCanonicalization",
  "registerRecordType",
  "registerSchema",
]);
const DELETIONS = new Set<GovernanceKind>([
  "deleteVersion",
  "deleteVersions",
  "deleteSubject",
]);

export default function CallForm({ onAdd }: { onAdd: (a: Action) => void }) {
  const id = useId();
  const [d, setD] = useState<GovernanceDraft>(emptyDraft("registerRecordType"));
  const [problem, setProblem] = useState<{
    field: keyof GovernanceDraft;
    text: string;
  }>();
  const set = (patch: Partial<GovernanceDraft>) => {
    setD((x) => ({ ...x, ...patch }));
    setProblem(undefined);
  };
  const err = (field: keyof GovernanceDraft) =>
    problem?.field === field ? problem.text : undefined;
  const fields: FieldsProps = { id, d, set, err };

  return (
    <form
      className={`${CARD} tw-flex tw-flex-col tw-gap-4`}
      aria-labelledby={`${id}-heading`}
      onSubmit={(e) => {
        e.preventDefault();
        const r = draftToAction(d);
        if (r.ok) {
          onAdd(r.action);
          setD(emptyDraft(d.kind));
        } else {
          setProblem({
            field: r.field,
            text: tr(r.key, { detail: r.detail ?? "" }),
          });
        }
      }}
    >
      <h2
        id={`${id}-heading`}
        className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50"
      >
        {tr("provenance.governance.form.heading")}
      </h2>
      <div className="tw-flex tw-flex-col tw-gap-1">
        <label htmlFor={`${id}-kind`} className={LABEL}>
          {tr("provenance.governance.form.kind")}
        </label>
        <select
          id={`${id}-kind`}
          className={INPUT}
          value={d.kind}
          onChange={(e) => {
            const kind =
              GOVERNANCE_KINDS.find((k) => k === e.target.value) ??
              "registerRecordType";
            setD(emptyDraft(kind));
            setProblem(undefined);
          }}
        >
          {GOVERNANCE_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {tr(KIND_LABEL[kind])}
            </option>
          ))}
        </select>
      </div>
      {REGISTRATIONS.has(d.kind) ? <RegistrationFields {...fields} /> : null}
      <AddressFields {...fields} />
      {DELETIONS.has(d.kind) ? <DeletionFields {...fields} /> : null}
      <div>
        <button type="submit" className={BUTTON}>
          {tr("provenance.governance.form.add")}
        </button>
      </div>
    </form>
  );
}
