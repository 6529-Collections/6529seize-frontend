import { useEnsName } from "wagmi";

export function useOrignalDelegatorEnsResolution(
  props: Readonly<{
    subdelegation: { originalDelegator: string } | null;
  }>
) {
  return useEnsName({
    address: props.subdelegation
      ? (props.subdelegation.originalDelegator as `0x${string}`)
      : undefined,
    chainId: 1,
  });
}
