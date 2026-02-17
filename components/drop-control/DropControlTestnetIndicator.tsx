"use client";

import {
  DropControlMintingMode,
  useDropControlMintingConfig,
} from "@/components/drop-control/drop-control-config";

export default function DropControlTestnetIndicator() {
  const { mode } = useDropControlMintingConfig();

  if (mode !== DropControlMintingMode.TESTNET) {
    return null;
  }

  return (
    <div className="tw-mb-6 tw-inline-flex tw-items-center tw-rounded-lg tw-border tw-border-amber-400/60 tw-bg-amber-500/15 tw-px-4 tw-py-2 tw-text-2xl tw-font-semibold tw-text-amber-100 sm:tw-text-3xl">
      🚧 TESTNET 🚧
    </div>
  );
}
