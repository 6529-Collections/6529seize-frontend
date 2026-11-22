"use client";

import { useId, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import type { Address, Hex, PublicClient } from "viem";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { formatInteger } from "@/i18n/format";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import { provenanceRegistryAbi } from "@/lib/provenance-core/abi/provenanceRegistry";
import type { Action } from "@/lib/provenance-core/actions";
import { defaultTxServices } from "@/lib/provenance-core/config/chains";
import type { RegistryPin } from "@/lib/provenance-core/config/registries";
import {
  checkBeforeSigning,
  decodeGovernanceSafeTx,
  proposeToTxService,
  type DecodedCall,
  type Eip1193Provider,
  type GovernanceCheck,
  type GovernanceSafeTx,
} from "@/lib/provenance-core/governance";
import { errorText, signingProblems } from "@/lib/provenance-governance/checks";
import { formatArg } from "@/lib/provenance-governance/forms";
import {
  isUserRejection,
  signWithWallet,
} from "@/lib/provenance-governance/wallet";
import {
  CARD,
  ERROR_TEXT,
  HINT,
  INPUT,
  LABEL,
  locale,
  MONO,
  PRIMARY,
  tr,
} from "./ui";

export type SimResult = {
  ok: boolean;
  gas: bigint;
  reason?: string | undefined;
};

const WARNING_KEYS: Partial<Record<Action["kind"], MessageKey>> = {
  freeze: "provenance.governance.warning.freeze",
  declareSuccessor: "provenance.governance.warning.declareSuccessor",
  transferOwnership: "provenance.governance.warning.transferOwnership",
  acceptOwnership: "provenance.governance.warning.acceptOwnership",
  deleteVersion: "provenance.governance.warning.delete",
  deleteVersions: "provenance.governance.warning.delete",
  deleteSubject: "provenance.governance.warning.delete",
  setPublisher: "provenance.governance.warning.setPublisher",
};

function simMessage(sim: SimResult): string {
  if (sim.ok)
    return tr("provenance.governance.simulate.ok", {
      gas: formatInteger(locale, Number(sim.gas)),
    });
  return tr("provenance.governance.simulate.fail", {
    reason: sim.reason ?? "",
  });
}

function argNames(functionName: string): string[] {
  const item = provenanceRegistryAbi.find(
    (x) => x.type === "function" && x.name === functionName
  );
  return item?.type === "function" ? item.inputs.map((p) => p.name) : [];
}

function DecodedCalls({ calls }: { calls: DecodedCall[] }) {
  return (
    <ol className="tw-m-0 tw-flex tw-flex-col tw-gap-2 tw-pl-5">
      {calls.map((c, k) => {
        const names = argNames(c.functionName);
        return (
          <li
            key={`${c.functionName}-${k}`}
            className="tw-text-sm tw-text-iron-100"
          >
            <span className="tw-font-mono tw-text-iron-50">
              {c.functionName}
            </span>
            <ul className="tw-m-0 tw-mt-1 tw-flex tw-list-none tw-flex-col tw-gap-1 tw-p-0">
              {c.args.map((v, n) => (
                <li key={names[n] ?? n} className={MONO}>
                  <span className="tw-text-iron-400">{`${names[n] ?? "arg"}: `}</span>
                  {formatArg(v)}
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

function ProposePanel({
  pin,
  g,
  signer,
  signature,
}: {
  pin: RegistryPin;
  g: GovernanceSafeTx;
  signer: Address;
  signature: Hex;
}) {
  const id = useId();
  const [serviceUrl, setServiceUrl] = useState(
    defaultTxServices[11155111] ?? ""
  );
  const [apiKey, setApiKey] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [post, setPost] = useState<{
    busy?: boolean;
    done?: boolean;
    error?: string;
  }>({});

  const propose = async () => {
    setPost({ busy: true });
    try {
      await proposeToTxService({
        serviceUrl,
        pin,
        g,
        sender: signer,
        signature,
        ...(apiKey === "" ? {} : { apiKey }),
        origin: "6529.io provenance governance",
      });
      setPost({ done: true });
    } catch (e) {
      setPost({ error: errorText(e) });
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <h4 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
        {tr("provenance.governance.post.heading")}
      </h4>
      <div className="tw-flex tw-flex-col tw-gap-1">
        <label htmlFor={`${id}-svc`} className={LABEL}>
          {tr("provenance.governance.post.serviceUrl")}
        </label>
        <input
          id={`${id}-svc`}
          className={`${INPUT} tw-font-mono`}
          value={serviceUrl}
          onChange={(e) => setServiceUrl(e.target.value)}
          spellCheck={false}
        />
      </div>
      <div className="tw-flex tw-flex-col tw-gap-1">
        <label htmlFor={`${id}-key`} className={LABEL}>
          {tr("provenance.governance.post.apiKey")}
        </label>
        <input
          id={`${id}-key`}
          type="password"
          autoComplete="off"
          className={`${INPUT} tw-font-mono`}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          aria-describedby={`${id}-key-hint`}
        />
        <p id={`${id}-key-hint`} className={`${HINT} tw-m-0`}>
          {tr("provenance.governance.post.apiKeyHint")}
        </p>
      </div>
      <label className="tw-flex tw-items-start tw-gap-2 tw-text-sm tw-text-iron-100">
        <input
          type="checkbox"
          className="tw-mt-1"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        {tr("provenance.governance.post.confirm", { url: serviceUrl })}
      </label>
      <div>
        <button
          type="button"
          className={PRIMARY}
          onClick={propose}
          disabled={!confirmed || post.busy === true || post.done === true}
        >
          {tr(
            post.busy === true
              ? "provenance.governance.post.running"
              : "provenance.governance.post.button"
          )}
        </button>
      </div>
      {post.done === true ? (
        <p className="tw-m-0 tw-text-sm tw-text-success">
          {tr("provenance.governance.post.done", {
            nonce: g.tx.nonce.toString(),
          })}
        </p>
      ) : null}
      {post.error === undefined ? null : (
        <p role="alert" className={ERROR_TEXT}>
          {tr("provenance.governance.post.error", { reason: post.error })}
        </p>
      )}
    </div>
  );
}

function SignPanel({
  pin,
  g,
  client,
}: {
  pin: RegistryPin;
  g: GovernanceSafeTx;
  client: PublicClient;
}) {
  const { connector } = useAccount();
  const { address, seizeConnect } = useSeizeConnectContext();
  const [check, setCheck] = useState<GovernanceCheck>();
  const [signature, setSignature] = useState<Hex>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const signer = address as Address | undefined;

  const sign = async () => {
    if (signer === undefined) return;
    setBusy(true);
    setError(undefined);
    setSignature(undefined);
    try {
      const c = await checkBeforeSigning(client, pin, signer, g);
      setCheck(c);
      if (c.problems.length === 0) {
        const provider = (await connector?.getProvider()) as
          | Eip1193Provider
          | undefined;
        if (provider === undefined)
          throw new Error(tr("provenance.governance.wallet.unavailable"));
        setSignature(await signWithWallet(provider, signer, pin, g));
      }
    } catch (e) {
      setError(
        isUserRejection(e)
          ? tr("provenance.governance.sign.rejected")
          : tr("provenance.governance.sign.error", { reason: errorText(e) })
      );
    } finally {
      setBusy(false);
    }
  };

  const problems = check === undefined ? [] : signingProblems(check, g);
  return (
    <div
      className="tw-flex tw-flex-col tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-3"
      aria-live="polite"
    >
      {signer === undefined ? (
        <div>
          <button type="button" className={PRIMARY} onClick={seizeConnect}>
            {tr("provenance.governance.wallet.connect")}
          </button>
        </div>
      ) : (
        <>
          <p className="tw-m-0 tw-text-xs tw-text-iron-300">
            {tr("provenance.governance.wallet.signer", { address: signer })}
          </p>
          <div>
            <button
              type="button"
              className={PRIMARY}
              onClick={sign}
              disabled={busy}
            >
              {tr(
                busy
                  ? "provenance.governance.sign.running"
                  : "provenance.governance.sign.button"
              )}
            </button>
          </div>
        </>
      )}
      {problems.length > 0 ? (
        <div role="alert" className="tw-text-sm tw-text-error">
          <p className="tw-m-0">{tr("provenance.governance.sign.blocked")}</p>
          <ul className="tw-m-0 tw-pl-5">
            {problems.map((p) => {
              const text =
                p.key === "provenance.governance.sign.problem.nonce"
                  ? tr(p.key, { nonce: p.nonce, current: p.current })
                  : tr(p.key);
              return <li key={p.key}>{text}</li>;
            })}
          </ul>
        </div>
      ) : null}
      {check?.nonce === "queued" ? (
        <p className="tw-m-0 tw-text-xs tw-text-iron-300">
          {tr("provenance.governance.sign.queued", {
            nonce: g.tx.nonce.toString(),
            current: check.safeNonce.toString(),
          })}
        </p>
      ) : null}
      {error === undefined ? null : (
        <p role="alert" className={ERROR_TEXT}>
          {error}
        </p>
      )}
      {signature !== undefined && signer !== undefined ? (
        <>
          <p className="tw-m-0 tw-text-sm tw-text-success">
            {tr("provenance.governance.sign.done")}
          </p>
          <span className={MONO}>{signature}</span>
          <ProposePanel pin={pin} g={g} signer={signer} signature={signature} />
        </>
      ) : null}
    </div>
  );
}

export default function SafeTxCard({
  pin,
  g,
  index,
  count,
  client,
  sim,
}: {
  pin: RegistryPin;
  g: GovernanceSafeTx;
  index: number;
  count: number;
  client: PublicClient;
  sim?: SimResult | undefined;
}) {
  const id = useId();
  const decoded = useMemo(() => decodeGovernanceSafeTx(pin, g.tx), [pin, g]);
  const high = g.risk === "high";
  const first = g.actions[0];
  const warning =
    high && first !== undefined ? WARNING_KEYS[first.kind] : undefined;
  const simText = sim === undefined ? undefined : simMessage(sim);

  return (
    <article
      className={`${CARD} tw-flex tw-flex-col tw-gap-3 ${high ? "tw-border-error/60" : ""}`}
      aria-labelledby={`${id}-heading`}
      data-testid="governance-safetx"
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <h3
          id={`${id}-heading`}
          className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50"
        >
          {tr("provenance.governance.safeTx.heading", {
            index: index + 1,
            count,
          })}
        </h3>
        <span
          className={`tw-rounded-full tw-border tw-border-solid tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold ${high ? "tw-border-error tw-text-error" : "tw-border-iron-600 tw-text-iron-300"}`}
        >
          {tr(
            high
              ? "provenance.governance.safeTx.high"
              : "provenance.governance.safeTx.normal"
          )}
        </span>
        <span className="tw-text-xs tw-text-iron-400">
          {tr("provenance.governance.safeTx.nonce", {
            nonce: g.tx.nonce.toString(),
          })}
        </span>
      </div>
      {warning === undefined ? null : (
        <p
          role="note"
          className="tw-m-0 tw-rounded-lg tw-border tw-border-solid tw-border-error/50 tw-bg-error/10 tw-p-3 tw-text-sm tw-text-iron-50"
        >
          {tr(warning)}
        </p>
      )}
      <p className="tw-m-0 tw-text-sm tw-text-iron-300">
        {g.tx.operation === 1
          ? tr("provenance.governance.safeTx.batch", { count: decoded.length })
          : tr("provenance.governance.safeTx.direct")}
      </p>
      <DecodedCalls calls={decoded} />
      <div className="tw-flex tw-flex-col tw-gap-1">
        <span className="tw-text-xs tw-font-semibold tw-text-iron-400">
          {tr("provenance.governance.safeTx.hash")}
        </span>
        <span className={MONO}>{g.hash}</span>
        <span className={HINT}>
          {tr("provenance.governance.safeTx.hashHint")}
        </span>
      </div>
      {simText === undefined ? null : (
        <p
          className={`tw-m-0 tw-text-sm ${sim?.ok === true ? "tw-text-success" : "tw-text-error"}`}
          data-testid="governance-sim"
        >
          {simText}
        </p>
      )}
      <SignPanel pin={pin} g={g} client={client} />
    </article>
  );
}
