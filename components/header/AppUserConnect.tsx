import {
  ArrowsRightLeftIcon,
  ArrowRightEndOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";

export default function AppUserConnect({
  onNavigate,
}: {
  readonly onNavigate: () => void;
}) {
  const { isConnected, seizeConnect, seizeDisconnectAndLogout } =
    useSeizeConnectContext();

  if (!isConnected) {
    return (
      <button
        onClick={() => {
          seizeConnect();
          onNavigate();
        }}
        type="button"
        className="tw-whitespace-nowrap tw-flex tw-w-full tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-sm tw-leading-6 tw-rounded-lg tw-font-semibold tw-text-white tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 hover:tw-ring-primary-600 placeholder:tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-shadow-sm hover:tw-bg-primary-600 tw-transition tw-duration-300 tw-ease-out"
      >
        <span>Connect Wallet</span>
      </button>
    );
  }

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-space-y-2">
      <button
        onClick={() => {
          seizeDisconnectAndLogout(true);
          onNavigate();
        }}
        className="tw-bg-transparent tw-border-none tw-w-full tw-flex tw-items-center tw-space-x-4 tw-px-4 tw-py-3.5 tw-text-base tw-font-medium tw-text-zinc-300 active:tw-bg-zinc-700 active:tw-text-zinc-200 tw-rounded-lg tw-transition-colors tw-duration-200"
        aria-label="Switch Account"
      >
        <ArrowsRightLeftIcon className="tw-w-6 tw-h-6 tw-flex-shrink-0" />
        <span>Switch Account</span>
      </button>
      <button
        onClick={() => {
          seizeDisconnectAndLogout();
          onNavigate();
        }}
        className="tw-bg-transparent tw-border-none tw-w-full tw-flex tw-items-center tw-space-x-4 tw-px-4 tw-py-3.5 tw-text-base tw-font-medium tw-text-zinc-300 active:tw-bg-zinc-700 active:tw-text-zinc-200 tw-rounded-lg tw-transition-colors tw-duration-200"
        aria-label="Disconnect & Logout"
      >
        <ArrowRightEndOnRectangleIcon className="tw-w-6 tw-h-6 tw-flex-shrink-0" />
        <span>Disconnect & Logout</span>
      </button>
    </div>
  );
}
