"use client";

import { faUserShield } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  DeviceSecurityDetails,
  useDeviceSecurityState,
} from "@/components/device-signing/DeviceSecurityStatus";
import { getEncryptedMessagesRoute } from "@/helpers/navigation.helpers";
import { getPreferencesHref } from "@/helpers/preferences-navigation";

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
  const canEnableProof = proof === "off" || proof === "expired";
  const encryptionLabel = canEnableProof
    ? "e2ee.deviceStatus.enableBoth"
    : "e2ee.deviceStatus.enableEncryption";
  const actionLabel = canEnableEncryption
    ? encryptionLabel
    : "e2ee.deviceStatus.enableProof";
  return (
    <>
      {showStatus && (
        <div className="tw-px-3 tw-text-xs tw-text-iron-400 [@media(hover:hover)]:tw-hidden">
          <DeviceSecurityDetails {...details} />
        </div>
      )}
      {(canEnableEncryption || canEnableProof) && (
        <Link
          href={
            canEnableEncryption
              ? getEncryptedMessagesRoute()
              : getPreferencesHref({ tab: "devices" })
          }
          onClick={onClose}
          className="tw-flex tw-min-h-11 tw-w-full tw-items-center tw-gap-3 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-3 tw-text-left tw-text-md tw-font-medium tw-text-iron-300 tw-no-underline hover:tw-bg-iron-700 hover:tw-text-iron-50"
        >
          <FontAwesomeIcon icon={faUserShield} className="tw-w-5 tw-shrink-0" />
          {t(locale, actionLabel)}
        </Link>
      )}
    </>
  );
}
