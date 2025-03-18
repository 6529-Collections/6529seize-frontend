import { useConnections, useSwitchChain } from "wagmi";
import { getChains } from "../../../../pages/_app";

export default function HeaderUserProxyDropdownChains({
  onSwitchChain,
}: {
  readonly onSwitchChain: () => void;
}) {
  const { switchChain } = useSwitchChain();
  const myChains = getChains();
  const connections = useConnections();

  const chainId = connections?.[0]?.chainId;

  const handleSwitchChain = async (chainId: number) => {
    try {
      onSwitchChain();
      switchChain({ chainId: chainId });
    } catch (error) {
      console.error(error);
    }
  };

  if (!chainId || (myChains.length === 1 && myChains[0].id === chainId)) {
    return <></>;
  }

  return (
    <div className="tw-h-full tw-px-2 tw-pt-2">
      <span className="tw-bg-transparent tw-py-2.5 tw-w-full tw-h-full tw-border-none tw-text-md tw-font-medium tw-text-left tw-flex tw-items-center tw-gap-x-3 tw-text-iron-500 tw-rounded-lg tw-relative tw-select-none tw-px-3 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out">
        Current Chain: {myChains.find((c) => c.id === chainId)?.name ?? chainId}
      </span>
      {myChains
        .filter((c) => c.id !== chainId)
        .map((c) => (
          <button
            key={`switch-chain-${c.id}`}
            onClick={() => handleSwitchChain(c.id)}
            type="button"
            aria-label={`Switch to ${c.name}`}
            title={`Switch to ${c.name}`}
            className="tw-bg-transparent hover:tw-bg-iron-700 tw-py-2.5 tw-w-full tw-h-full tw-border-none tw-text-md tw-font-medium tw-text-left tw-flex tw-items-center tw-gap-x-3 tw-text-iron-300 hover:tw-text-iron-50 tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-3 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
            <span>Switch to {c.name}</span>
          </button>
        ))}
    </div>
  );
}
