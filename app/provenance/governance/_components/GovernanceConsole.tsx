"use client";

import { useMemo, useState } from "react";
import type { Action } from "@/lib/provenance-core/actions";
import { describeAction } from "@/lib/provenance-core/actions";
import { makeClient } from "@/lib/provenance-core/client";
import { publicRpc } from "@/lib/provenance-core/config/chains";
import {
  registryPins,
  type RegistryPin,
} from "@/lib/provenance-core/config/registries";
import {
  buildGovernanceSafeTxs,
  type GovernanceSafeTx,
} from "@/lib/provenance-core/governance";
import { errorText } from "@/lib/provenance-governance/checks";
import CallForm from "./CallForm";
import ChainStatePanel from "./ChainStatePanel";
import SafeTxList from "./SafeTxList";
import {
  BUTTON,
  CARD,
  ERROR_TEXT,
  HINT,
  INPUT,
  LABEL,
  MONO,
  PRIMARY,
  tr,
} from "./ui";
import { useChainState } from "./useChainState";

const DEFAULT_PIN = registryPins[1] ?? registryPins[0];

function RegistryPicker({
  pin,
  onPick,
}: {
  pin: RegistryPin;
  onPick: (p: RegistryPin) => void;
}) {
  return (
    <fieldset className={`${CARD} tw-m-0 tw-flex tw-flex-col tw-gap-3`}>
      <legend className="tw-px-1 tw-text-sm tw-font-semibold tw-text-iron-100">
        {tr("provenance.governance.registry.legend")}
      </legend>
      {registryPins.map((p) => (
        <label
          key={p.registry}
          className="tw-flex tw-cursor-pointer tw-items-start tw-gap-3"
        >
          <input
            type="radio"
            name="registry"
            className="tw-mt-1"
            checked={p.registry === pin.registry}
            onChange={() => onPick(p)}
          />
          <span className="tw-flex tw-min-w-0 tw-flex-col">
            <span className="tw-text-sm tw-font-medium tw-text-iron-50">
              {p.name}
            </span>
            <span className={MONO}>{p.registry}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function CallList({
  calls,
  onRemove,
}: {
  calls: Action[];
  onRemove: (index: number) => void;
}) {
  if (calls.length === 0)
    return (
      <p className="tw-m-0 tw-text-sm tw-text-iron-400">
        {tr("provenance.governance.calls.empty")}
      </p>
    );
  return (
    <ol className="tw-m-0 tw-flex tw-list-decimal tw-flex-col tw-gap-2 tw-pl-5">
      {calls.map((a, i) => (
        <li key={`${a.kind}-${i}`} className="tw-text-sm tw-text-iron-100">
          <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <span className="tw-break-all">{describeAction(a)}</span>
            <button
              type="button"
              className={BUTTON}
              aria-label={tr("provenance.governance.calls.remove", {
                index: i + 1,
              })}
              onClick={() => onRemove(i)}
            >
              ×
            </button>
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function GovernanceConsole() {
  const client = useMemo(() => makeClient(11155111, publicRpc[11155111]), []);
  const [pin, setPin] = useState<RegistryPin>(DEFAULT_PIN!);
  const [attempt, setAttempt] = useState(0);
  const load = useChainState(client, pin, attempt);
  const [calls, setCalls] = useState<Action[]>([]);
  const [nonceText, setNonceText] = useState<string>();
  const [built, setBuilt] = useState<GovernanceSafeTx[]>();
  const [buildError, setBuildError] = useState<string>();
  // The Safe's next nonce until the signer types another.
  const nonceValue =
    nonceText ??
    (load.status === "ready" ? load.state.safe.nonce.toString() : "");

  const build = () => {
    setBuildError(undefined);
    try {
      setBuilt(
        buildGovernanceSafeTxs(
          pin,
          calls,
          BigInt(nonceValue === "" ? "0" : nonceValue)
        )
      );
    } catch (e) {
      setBuilt(undefined);
      setBuildError(errorText(e));
    }
  };

  return (
    <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-4xl tw-flex-col tw-gap-6 tw-px-4 tw-py-8 sm:tw-px-6">
      <header className="tw-flex tw-flex-col tw-gap-2">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
          {tr("provenance.governance.eyebrow")}
        </p>
        <h1 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50 sm:tw-text-3xl">
          {tr("provenance.governance.heading")}
        </h1>
        <p className="tw-m-0 tw-max-w-3xl tw-text-sm tw-text-iron-300">
          {tr("provenance.governance.intro")}
        </p>
        <p
          role="note"
          className="tw-m-0 tw-rounded-lg tw-border tw-border-solid tw-border-yellow-500/40 tw-bg-yellow-500/10 tw-p-3 tw-text-sm tw-text-yellow-100"
        >
          {tr("provenance.governance.notice")}
        </p>
      </header>

      <RegistryPicker
        pin={pin}
        onPick={(p) => {
          setPin(p);
          setBuilt(undefined);
          setNonceText(undefined);
        }}
      />
      <ChainStatePanel
        pin={pin}
        load={load}
        onRetry={() => setAttempt((n) => n + 1)}
      />
      <CallForm
        onAdd={(a) => {
          setCalls((c) => [...c, a]);
          setBuilt(undefined);
        }}
      />

      <section
        className={`${CARD} tw-flex tw-flex-col tw-gap-3`}
        aria-labelledby="calls-heading"
      >
        <h2
          id="calls-heading"
          className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50"
        >
          {tr("provenance.governance.calls.heading")}
        </h2>
        <CallList
          calls={calls}
          onRemove={(i) => {
            setCalls((c) => c.filter((_, k) => k !== i));
            setBuilt(undefined);
          }}
        />
        <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-3">
          <div className="tw-flex tw-w-40 tw-flex-col tw-gap-1">
            <label htmlFor="safe-nonce" className={LABEL}>
              {tr("provenance.governance.build.nonce")}
            </label>
            <input
              id="safe-nonce"
              className={INPUT}
              inputMode="numeric"
              value={nonceValue}
              onChange={(e) => {
                setNonceText(e.target.value.replaceAll(/\D/g, ""));
                setBuilt(undefined);
              }}
              aria-describedby="safe-nonce-hint"
            />
          </div>
          <button
            type="button"
            className={PRIMARY}
            disabled={calls.length === 0}
            onClick={build}
          >
            {tr("provenance.governance.build.button")}
          </button>
        </div>
        <p id="safe-nonce-hint" className={`${HINT} tw-m-0`}>
          {tr("provenance.governance.build.nonceHint")}
        </p>
        {buildError === undefined ? null : (
          <p role="alert" className={ERROR_TEXT}>
            {tr("provenance.governance.build.error", { reason: buildError })}
          </p>
        )}
      </section>

      {built === undefined ? null : (
        <SafeTxList pin={pin} txs={built} client={client} load={load} />
      )}
    </div>
  );
}
