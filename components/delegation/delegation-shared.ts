import { DELEGATION_CONTRACT } from "@/constants/constants";
import type { Abi } from "viem";
import { useEnsName } from "wagmi";

/**
 * Contract-write config assembled by the delegation form components and
 * executed by `DelegationSubmitGroups`. `functionName` is `undefined` while
 * the form fails validation; submission is gated on the same `validate()`
 * predicate, so it is always defined by the time the write is sent.
 */
export interface DelegationWriteParams {
  readonly address: `0x${string}`;
  readonly abi: Abi;
  readonly chainId: number;
  readonly functionName: string | undefined;
  readonly args: readonly unknown[];
}

export type DelegationWriteSettledHandler = (
  data: unknown,
  error: Error | null
) => void;

export function useOrignalDelegatorEnsResolution(
  props: Readonly<{
    subdelegation?: { originalDelegator: string } | undefined;
  }>
) {
  return useEnsName({
    address: props.subdelegation
      ? (props.subdelegation.originalDelegator as `0x${string}`)
      : undefined,
    chainId: 1,
  });
}

const DELEGATION_NETWORK_ERROR = `Switch to ${
  DELEGATION_CONTRACT.chain_id === 1 ? "Ethereum Mainnet" : "Sepolia Network"
}`;

const DELEGATION_LOCKED_ERROR =
  "CANNOT ESTIMATE GAS - This can be caused by locked collections/use-cases";

export function getGasError(
  error: Readonly<Pick<Error, "message">>
): string | undefined {
  if (
    /chain mismatch|does not match the target chain|current chain.*target chain|unsupported chain|switch (?:the )?(?:wallet )?network/i.test(
      error.message
    )
  ) {
    return DELEGATION_NETWORK_ERROR;
  }

  if (
    /cannot estimate gas|estimate gas|gas estimation|execution reverted|\breverted\b|call exception/i.test(
      error.message
    )
  ) {
    return DELEGATION_LOCKED_ERROR;
  }

  return undefined;
}
