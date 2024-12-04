import Link from "next/link";
import { AboutSection } from "../../pages/about/[section]";
import { useEULAConsent } from "./EULAConsentContext";

export default function EULAModal() {
  const { consent } = useEULAConsent();

  return (
    <div
      className="tw-fixed tw-inset-0 tw-z-1000 tw-flex tw-items-center tw-justify-center tw-bg-black/60 tw-backdrop-blur tw-p-2"
      role="dialog"
      aria-modal="true">
      <div className="tw-bg-iron-800 tw-rounded-lg tw-shadow-lg tw-w-full tw-max-w-lg sm:tw-w-3/4 sm:tw-max-w-4xl tw-px-6 sm:tw-px-12 tw-py-8 sm:tw-py-10">
        <div className="tw-text-center tw-mb-10">
          <h3>End User License Agreement</h3>
        </div>
        <div className="tw-mb-10">
          <p>
            To use 6529 Mobile, you must agree to our{" "}
            <Link
              href={`https://6529.io/about/${AboutSection.TERMS_OF_SERVICE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-text-blue-500 hover:tw-underline">
              Terms of Service and EULA
            </Link>
            . These terms include our policies on objectionable content and
            abusive behavior.
          </p>
        </div>
        <div className="tw-flex tw-justify-center">
          <button
            onClick={consent}
            className="tw-bg-white tw-text-gray-900 tw-font-medium tw-px-8 tw-py-3 tw-rounded tw-shadow hover:tw-bg-iron-300 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-gray-300 tw-transition tw-duration-150 tw-border-none">
            Agree
          </button>
        </div>
      </div>
    </div>
  );
}
