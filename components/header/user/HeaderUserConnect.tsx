import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";

export default function HeaderUserConnect(props: Readonly<{}>) {
  const { seizeConnect } = useSeizeConnectContext();

  return (
    <button
      onClick={() => seizeConnect()}
      type="button"
      className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-flex tw-items-center tw-rounded-lg tw-bg-iron-200 tw-px-4 tw-py-2.5 tw-text-iron-800 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-border-0 tw-ring-1 tw-ring-inset tw-ring-white hover:tw-bg-iron-300 hover:tw-ring-iron-300 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out tw-justify-center tw-gap-x-1.5"
    >
      Connect
    </button>
  );
}
