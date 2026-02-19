"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  DropForgeMintingMode,
  useDropForgeMintingConfig,
} from "@/components/drop-forge/drop-forge-config";
import EtherscanIcon from "@/components/user/utils/icons/EtherscanIcon";
import { MANIFOLD_LAZY_CLAIM_CONTRACT } from "@/constants/constants";

export default function DropForgeExplorerLink({
  className = "",
}: {
  className?: string;
}) {
  const { mode } = useDropForgeMintingConfig();
  const { address } = useSeizeConnectContext();

  const baseUrl =
    mode === DropForgeMintingMode.TESTNET
      ? "https://sepolia.etherscan.io"
      : "https://etherscan.io";
  const fadd = address ? `?fadd=${encodeURIComponent(address)}` : "";
  const href = `${baseUrl}/address/${MANIFOLD_LAZY_CLAIM_CONTRACT}${fadd}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`tw-inline-flex tw-items-center tw-gap-2 tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-900/80 tw-px-2.5 tw-py-1 tw-text-sm tw-font-semibold tw-text-iron-50 tw-no-underline tw-transition-colors hover:tw-bg-iron-800 sm:tw-text-base ${className}`}
      aria-label="Open explorer"
      title="Explorer"
    >
      <span className="tw-h-4 tw-w-4 tw-flex-shrink-0">
        <EtherscanIcon />
      </span>
      <span>EXPLORER</span>
    </a>
  );
}
