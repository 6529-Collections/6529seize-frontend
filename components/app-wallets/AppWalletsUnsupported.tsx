import Link from "next/link";
import useCapacitor from "@/hooks/useCapacitor";
import { DELEGATION_CARD_CLASS_NAME } from "@/components/delegation/delegation-ui";

export default function AppWalletsUnsupported() {
  const capacitor = useCapacitor();

  return (
    <section className={`${DELEGATION_CARD_CLASS_NAME} tw-p-5 sm:tw-p-6`}>
      <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-300">
        {capacitor.isCapacitor
          ? "Update to the latest version of the app to use App Wallets"
          : "App Wallets are not supported on this platform"}
      </p>
      <Link
        href="/"
        className="desktop-hover:hover:tw-text-primary-200 tw-mt-4 tw-inline-flex tw-text-sm tw-font-semibold tw-text-primary-300 tw-no-underline tw-transition-colors"
      >
        TAKE ME HOME
      </Link>
    </section>
  );
}
