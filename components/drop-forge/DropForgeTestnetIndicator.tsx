"use client";

import {
  DropForgeMintingMode,
  useDropForgeMintingConfig,
} from "@/components/drop-forge/drop-forge-config";

export default function DropForgeTestnetIndicator({
  className = "",
}: Readonly<{
  className?: string;
}>) {
  const { mode } = useDropForgeMintingConfig();

  if (mode !== DropForgeMintingMode.TESTNET) {
    return null;
  }

  return (
    <div
      className={`tw-inline-flex tw-items-center tw-rounded-md tw-border tw-border-amber-400/60 tw-bg-amber-500/15 tw-px-2.5 tw-py-1 tw-text-sm tw-font-semibold tw-text-amber-100 sm:tw-text-base ${className}`}
    >
      🚧 TESTNET 🚧
    </div>
  );
}
