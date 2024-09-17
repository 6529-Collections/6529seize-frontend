import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useConnectors } from "wagmi";

export default function HeaderUserConnect(
  props: Readonly<{
    onConnectClick?: () => void;
  }>
) {
  const { open: onConnect } = useWeb3Modal();
  const connectors = useConnectors();

  console.log("i am connectors", connectors);

  return (
    <button
      onClick={() => {
        if (props.onConnectClick) {
          props.onConnectClick();
        }
        onConnect();
      }}
      type="button"
      className="tw-whitespace-nowrap tw-inline-flex tw-items-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-sm tw-leading-6 tw-rounded-lg tw-font-semibold tw-text-white tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 hover:tw-ring-primary-600 placeholder:tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-shadow-sm hover:tw-bg-primary-600 tw-transition tw-duration-300 tw-ease-out">
      Connect
    </button>
  );
}
