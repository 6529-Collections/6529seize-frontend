import { useEnsName } from "wagmi";
import { DELEGATION_CONTRACT } from "../../constants";

export function useOrignalDelegatorEnsResolution(
  props: Readonly<{
    subdelegation?: { originalDelegator: string };
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

export function getGasError(error: any) {
  if (error.message.includes("Chain mismatch")) {
    return DELEGATION_NETWORK_ERROR;
  } else {
    return DELEGATION_LOCKED_ERROR;
  }
}
