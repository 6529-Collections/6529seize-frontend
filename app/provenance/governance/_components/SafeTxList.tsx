"use client";

import "@/i18n/namespaces/provenance-governance";
import { useState } from "react";
import type { PublicClient } from "viem";
import type { RegistryPin } from "@/lib/provenance-core/config/registries";
import type { GovernanceSafeTx } from "@/lib/provenance-core/governance";
import { simulatePlan } from "@/lib/provenance-core/simulate";
import { errorText } from "@/lib/provenance-governance/checks";
import SafeTxCard, { type SimResult } from "./SafeTxCard";
import { BUTTON, ERROR_TEXT, HINT, tr } from "./ui";
import type { ChainLoad } from "./useChainState";

/** Gas limit each SafeTx is simulated with; governance calls use far less. */
const SIMULATION_GAS_LIMIT = 30_000_000n;

export default function SafeTxList({
  pin,
  txs,
  client,
  load,
}: {
  pin: RegistryPin;
  txs: GovernanceSafeTx[];
  client: PublicClient;
  load: ChainLoad;
}) {
  const [sims, setSims] = useState<SimResult[]>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const first = txs[0];

  const simulate = async () => {
    if (load.status !== "ready" || first === undefined) return;
    setBusy(true);
    setError(undefined);
    try {
      const run = await simulatePlan(
        client,
        pin.registry,
        {
          kind: "safe",
          safe: pin.safe,
          owners: load.state.safe.owners,
          nonce: first.tx.nonce,
          chainId: pin.chainId,
        },
        txs.map((g) => ({ actions: g.actions })),
        SIMULATION_GAS_LIMIT
      );
      setSims(
        run.txs.map((r) => ({
          ok: r.ok,
          gas: r.gasUsed,
          reason:
            r.failedAction === undefined
              ? r.error
              : `${r.failedAction.description}: ${r.failedAction.error}`,
        }))
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="tw-flex tw-flex-col tw-gap-4"
      aria-labelledby="safetx-heading"
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <h2
          id="safetx-heading"
          className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50"
        >
          {tr("provenance.governance.build.button")}
        </h2>
        <button
          type="button"
          className={BUTTON}
          onClick={simulate}
          disabled={busy || load.status !== "ready"}
        >
          {tr(
            busy
              ? "provenance.governance.simulate.running"
              : "provenance.governance.simulate.button"
          )}
        </button>
      </div>
      <p className={`${HINT} tw-m-0`}>
        {tr("provenance.governance.simulate.note")}
      </p>
      {error === undefined ? null : (
        <p role="alert" className={ERROR_TEXT}>
          {tr("provenance.governance.simulate.error", { reason: error })}
        </p>
      )}
      <ol className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-4 tw-p-0">
        {txs.map((g, i) => (
          <li key={g.hash}>
            <SafeTxCard
              pin={pin}
              g={g}
              index={i}
              count={txs.length}
              client={client}
              sim={sims?.[i]}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}
