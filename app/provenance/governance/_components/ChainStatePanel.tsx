import "@/i18n/namespaces/provenance-governance";
import type { RegistryPin } from "@/lib/provenance-core/config/registries";
import type { ChainLoad, ChainState } from "./useChainState";
import { BUTTON, CARD, ERROR_TEXT, MONO, sameAddress, tr } from "./ui";

const ZERO = /^0x0{40}$/i;

function StateList({ pin, state }: { pin: RegistryPin; state: ChainState }) {
  const ownerMatches = sameAddress(state.owner, pin.safe);
  return (
    <dl className="tw-m-0 tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-2 sm:tw-grid-cols-[10rem_1fr]">
      <dt className="tw-text-sm tw-text-iron-400">
        {tr("provenance.governance.state.owner")}
      </dt>
      <dd className="tw-m-0 tw-flex tw-flex-col tw-gap-1">
        <span className={MONO}>{state.owner}</span>
        <span
          className={
            ownerMatches
              ? "tw-text-xs tw-text-success"
              : "tw-text-xs tw-text-error"
          }
        >
          {tr(
            ownerMatches
              ? "provenance.governance.state.ownerMatches"
              : "provenance.governance.state.ownerDiffers"
          )}
        </span>
      </dd>
      <dt className="tw-text-sm tw-text-iron-400">
        {tr("provenance.governance.state.pendingOwner")}
      </dt>
      <dd className={`tw-m-0 ${MONO}`}>
        {ZERO.test(state.pendingOwner)
          ? tr("provenance.governance.state.none")
          : state.pendingOwner}
      </dd>
      <dt className="tw-text-sm tw-text-iron-400">
        {tr("provenance.governance.state.safe")}
      </dt>
      <dd className="tw-m-0 tw-flex tw-flex-col tw-gap-1">
        <span className={MONO}>{pin.safe}</span>
        <span className="tw-text-xs tw-text-iron-300">
          {tr("provenance.governance.state.safeDetail", {
            threshold: state.safe.threshold,
            owners: state.safe.owners.length,
            nonce: state.safe.nonce.toString(),
          })}
        </span>
      </dd>
    </dl>
  );
}

export default function ChainStatePanel({
  pin,
  load,
  onRetry,
}: {
  pin: RegistryPin;
  load: ChainLoad;
  onRetry: () => void;
}) {
  return (
    <section
      className={`${CARD} tw-flex tw-flex-col tw-gap-3`}
      aria-labelledby="state-heading"
      aria-live="polite"
    >
      <h2
        id="state-heading"
        className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50"
      >
        {tr("provenance.governance.state.heading")}
      </h2>
      {load.status === "loading" ? (
        <p className="tw-m-0 tw-text-sm tw-text-iron-400">
          {tr("provenance.governance.state.loading")}
        </p>
      ) : null}
      {load.status === "error" ? (
        <div
          role="alert"
          className="tw-flex tw-flex-col tw-items-start tw-gap-2"
        >
          <p className={ERROR_TEXT}>
            {tr("provenance.governance.state.error", { reason: load.reason })}
          </p>
          <button type="button" className={BUTTON} onClick={onRetry}>
            {tr("provenance.governance.state.retry")}
          </button>
        </div>
      ) : null}
      {load.status === "ready" ? (
        <StateList pin={pin} state={load.state} />
      ) : null}
    </section>
  );
}
