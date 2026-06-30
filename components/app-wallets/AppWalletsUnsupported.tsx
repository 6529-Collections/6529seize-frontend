import Link from "next/link";
import useCapacitor from "@/hooks/useCapacitor";

export default function AppWalletsUnsupported() {
  const capacitor = useCapacitor();

  return (
    <>
      <div className="-tw-mx-3 tw-mt-4 tw-flex tw-flex-wrap">
        {capacitor.isCapacitor ? (
          <div className="tw-relative tw-w-full tw-max-w-full tw-flex-1 tw-px-3">
            Update to the latest version of the app to use App Wallets
          </div>
        ) : (
          <div className="tw-relative tw-w-full tw-max-w-full tw-flex-1 tw-px-3">
            App Wallets are not supported on this platform
          </div>
        )}
      </div>
      <div className="-tw-mx-3 tw-mt-4 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-max-w-full tw-flex-1 tw-px-3">
          <Link href="/">TAKE ME HOME</Link>
        </div>
      </div>
    </>
  );
}
