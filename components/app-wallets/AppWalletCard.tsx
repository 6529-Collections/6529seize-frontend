import styles from "./AppWallet.module.scss";
import Link from "next/link";
import type { AppWallet } from "./AppWalletsContext";
import AppWalletAvatar from "./AppWalletAvatar";
import {
  appWalletColClassName,
  appWalletRowClassName,
} from "./app-wallet-tailwind-classes";

export default function AppWalletCard(
  props: Readonly<{
    wallet: AppWallet;
  }>
) {
  return (
    <Link
      href={`/tools/app-wallets/${props.wallet.address}`}
      className="tw-no-underline">
      <div className={styles["appWalletCard"]}>
        <div className={appWalletRowClassName}>
          <div
            className={`${appWalletColClassName} tw-flex tw-items-center tw-gap-2 tw-break-words`}>
            <AppWalletAvatar address={props.wallet.address} />
            <span className="tw-text-[larger] tw-font-bold">
              {props.wallet.name}
            </span>
            {props.wallet.imported ? (
              <span className="tw-text-iron-400"> (imported)</span>
            ) : (
              <></>
            )}
          </div>
        </div>
        <div className={`${appWalletRowClassName} tw-pt-3`}>
          <div
            className={`${appWalletColClassName} tw-break-words tw-text-sm tw-font-extralight`}>
            {props.wallet.address.toLowerCase()}
          </div>
        </div>
      </div>
    </Link>
  );
}
