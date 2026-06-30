import Link from "next/link";
import useCapacitor from "@/hooks/useCapacitor";
import {
  appWalletColClassName,
  appWalletRowClassName,
} from "./app-wallet-tailwind-classes";

export default function AppWalletsUnsupported() {
  const capacitor = useCapacitor();

  return (
    <>
      <div className={`${appWalletRowClassName} tw-mt-4`}>
        {capacitor.isCapacitor ? (
          <div className={appWalletColClassName}>
            Update to the latest version of the app to use App Wallets
          </div>
        ) : (
          <div className={appWalletColClassName}>
            App Wallets are not supported on this platform
          </div>
        )}
      </div>
      <div className={`${appWalletRowClassName} tw-mt-4`}>
        <div className={appWalletColClassName}>
          <Link href="/">TAKE ME HOME</Link>
        </div>
      </div>
    </>
  );
}
