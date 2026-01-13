"use client";

import { useEnsName } from "wagmi";

interface EnsAddressDisplayProps {
  readonly address: string;
  readonly chainId?: number;
  readonly className?: string;
}

export default function EnsAddressDisplay({
  address,
  chainId = 1,
  className,
}: EnsAddressDisplayProps) {
  const isValidAddress = address?.startsWith("0x") && address.length === 42;

  const { data: ensName, isLoading } = useEnsName({
    address: isValidAddress ? (address as `0x${string}`) : undefined,
    chainId,
  });

  if (isLoading) {
    return (
      <span className={className}>
        <span className="tw-animate-pulse">{address}</span>
      </span>
    );
  }

  if (ensName) {
    return (
      <span className={className}>
        <span className="tw-text-primary-400">{ensName}</span>
        <span className="tw-mx-1 tw-text-iron-500">-</span>
        <span>{address}</span>
      </span>
    );
  }

  return <span className={className}>{address}</span>;
}
