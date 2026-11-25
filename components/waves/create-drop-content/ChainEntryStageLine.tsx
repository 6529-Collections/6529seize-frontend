import type { ChainEntryStage } from "@/lib/chain-waves/entryWriters";
import { CHAIN_ENTRY_STAGE_LABEL } from "./useChainEntrySender";

/** Where an entry on its way to the 6529 Network is, under the composer. */
export function ChainEntryStageLine({
  stage,
}: {
  readonly stage: ChainEntryStage | null;
}) {
  if (stage === null) {
    return null;
  }
  return (
    <p
      role="status"
      className="tw-mb-0 tw-mt-1 tw-px-1 tw-text-xs tw-leading-5 tw-text-iron-400"
    >
      {CHAIN_ENTRY_STAGE_LABEL[stage]}
    </p>
  );
}
