import { useChainId, useChains, useSwitchChain } from "wagmi";

type UseChainSwitcherResult = {
  chains: ReturnType<typeof useChains>;
  currentChainName: string;
  nextChainName: string;
  switchToNextChain: () => boolean;
};

function getNextChain(chains: ReturnType<typeof useChains>, chainId: number) {
  if (chains.length < 2) {
    return undefined;
  }

  const currentIndex = chains.findIndex((chain) => chain.id === chainId);

  for (let offset = 1; offset <= chains.length; offset++) {
    const nextIndex =
      currentIndex === -1
        ? offset - 1
        : (currentIndex + offset) % chains.length;
    const nextChain = chains[nextIndex];
    if (nextChain && nextChain.id !== chainId) {
      return nextChain;
    }
  }

  return undefined;
}

export function useChainSwitcher(): UseChainSwitcherResult {
  const chains = useChains();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const currentChainName =
    chains.find((chain) => chain.id === chainId)?.name ?? chainId.toString();

  const nextChain = getNextChain(chains, chainId);
  const nextChainName = nextChain?.name ?? "";

  const switchToNextChain = (): boolean => {
    if (!nextChain) return false;
    switchChain({ chainId: nextChain.id });
    return true;
  };

  return {
    chains,
    currentChainName,
    nextChainName,
    switchToNextChain,
  };
}
