import { useChainId, useChains, useSwitchChain } from "wagmi";

type UseChainSwitcherResult = {
  chains: ReturnType<typeof useChains>;
  currentChainName: string;
  switchToNextChain: () => boolean;
};

export function useChainSwitcher(): UseChainSwitcherResult {
  const chains = useChains();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const currentChainName =
    chains.find((chain) => chain.id === chainId)?.name ?? chainId.toString();

  const switchToNextChain = (): boolean => {
    if (chains.length < 2) return false;

    const currentIndex = chains.findIndex((chain) => chain.id === chainId);

    for (let offset = 1; offset <= chains.length; offset++) {
      const nextIndex =
        currentIndex === -1
          ? offset - 1
          : (currentIndex + offset) % chains.length;
      const nextChain = chains[nextIndex];
      if (nextChain && nextChain.id !== chainId) {
        switchChain({ chainId: nextChain.id });
        return true;
      }
    }

    return false;
  };

  return {
    chains,
    currentChainName,
    switchToNextChain,
  };
}
