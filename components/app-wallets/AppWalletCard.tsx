import Link from "next/link";
import type { AppWallet } from "./AppWalletsContext";
import AppWalletAvatar from "./AppWalletAvatar";
import { DELEGATION_CARD_CLASS_NAME } from "@/components/delegation/delegation-ui";

export default function AppWalletCard(
  props: Readonly<{
    wallet: AppWallet;
  }>
) {
  return (
    <Link
      href={`/tools/app-wallets/${props.wallet.address}`}
      className={`${DELEGATION_CARD_CLASS_NAME} tw-group tw-flex tw-min-h-32 tw-flex-col tw-justify-between tw-gap-5 tw-p-5 tw-no-underline tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-iron-900`}
    >
      <div className="tw-flex tw-items-center tw-gap-3 tw-break-words">
        <AppWalletAvatar address={props.wallet.address} />
        <div className="tw-min-w-0">
          <span className="tw-block tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100 group-hover:tw-text-iron-50">
            {props.wallet.name}
          </span>
          {props.wallet.imported && (
            <span className="tw-block tw-text-xs tw-leading-5 tw-text-iron-500">
              (imported)
            </span>
          )}
        </div>
      </div>
      <span className="tw-break-all tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-500">
        {props.wallet.address.toLowerCase()}
      </span>
    </Link>
  );
}
