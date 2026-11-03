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
}: {
  readonly onClose: () => void;
  readonly showStatus?: boolean;
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
          className="tw-flex tw-min-h-11 tw-w-full tw-items-center tw-gap-3 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-3 tw-text-left tw-text-md tw-font-medium tw-text-iron-300 tw-no-underline hover:tw-bg-iron-700 hover:tw-text-iron-50"
        >
          <FontAwesomeIcon icon={faUserShield} className="tw-w-5 tw-shrink-0" />
          {t(locale, DEVICE_SETUP_TITLE[scope])}
        </button>
      )}
    </>
  );
}
