import styles from "./AppWallet.module.css";
import Link from "next/link";
import type { AppWallet } from "./AppWalletsContext";
import AppWalletAvatar from "./AppWalletAvatar";

export default function AppWalletCard(
  props: Readonly<{
    wallet: AppWallet;
  }>
) {
  return (
    <Link
      href={`/tools/app-wallets/${props.wallet.address}`}
      className="tw-no-underline"
    >
      <div className={styles["appWalletCard"]}>
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-flex tw-w-full tw-max-w-full tw-flex-1 tw-items-center tw-gap-2 tw-break-words tw-px-3">
            <AppWalletAvatar address={props.wallet.address} />
            <span className="tw-text-lg tw-font-bold">{props.wallet.name}</span>
            {props.wallet.imported ? (
              <span className="tw-text-iron-400"> (imported)</span>
            ) : (
              <></>
            )}
          </div>
        </div>
        <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-3">
          <div className="tw-relative tw-w-full tw-max-w-full tw-flex-1 tw-break-words tw-px-3 tw-text-sm tw-font-extralight">
            {props.wallet.address.toLowerCase()}
          </div>
        </div>
      </div>
    </Link>
  );
}
