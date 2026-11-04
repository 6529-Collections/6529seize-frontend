"use client";

import { faUserShield } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  DeviceSecurityDetails,
  useDeviceSecurityState,
} from "@/components/device-signing/DeviceSecurityStatus";
import {
  DEVICE_SETUP_TITLE,
  getDeviceSetupScope,
  openDeviceSetup,
} from "./deviceSetup";

export default function DeviceSetupMenuAction({
  onClose,
  showStatus = true,
  mobile = false,
}: {
  readonly onClose: () => void;
  readonly showStatus?: boolean;
  readonly mobile?: boolean;
}) {
  const locale = useBrowserLocale();
  const details = useDeviceSecurityState();
  const { proof, canEnableEncryption } = details;
  const scope = getDeviceSetupScope(proof, canEnableEncryption);
  return (
    <>
      {showStatus && (
        <div className="tw-px-3 tw-text-xs tw-text-iron-400 [@media(hover:hover)]:tw-hidden">
          <DeviceSecurityDetails {...details} />
        </div>
      )}
      {scope && (
        <button
          type="button"
          onClick={() => {
            onClose();
            openDeviceSetup(scope);
          }}
          className={`tw-flex tw-w-full tw-items-center tw-rounded-lg tw-border-none tw-bg-transparent tw-text-left tw-text-iron-300 tw-transition-colors ${
            mobile
              ? "tw-gap-4 tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold active:tw-bg-iron-700 active:tw-text-iron-200"
              : "tw-min-h-11 tw-gap-3 tw-px-3 tw-text-md tw-font-medium hover:tw-bg-iron-700 hover:tw-text-iron-50"
          }`}
        >
          <FontAwesomeIcon
            icon={faUserShield}
            className={mobile ? "tw-size-6 tw-shrink-0" : "tw-w-5 tw-shrink-0"}
          />
          {t(locale, DEVICE_SETUP_TITLE[scope])}
        </button>
      )}
    </>
  );
}
