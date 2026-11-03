"use client";

import { faShieldHalved } from "@fortawesome/free-solid-svg-icons";
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
}: {
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const { proof, encrypted, canEnableEncryption } = useDeviceSecurityState();
  const canEnableProof = proof === "off";
  const className =
    "tw-flex tw-min-h-11 tw-w-full tw-items-center tw-gap-3 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-3 tw-text-left tw-text-md tw-font-medium tw-text-iron-300 tw-no-underline hover:tw-bg-iron-700 hover:tw-text-iron-50";
  return (
    <>
      <div className="tw-px-3 tw-text-xs tw-text-iron-400 [@media(hover:hover)]:tw-hidden">
        <DeviceSecurityDetails proof={proof} encrypted={encrypted} />
      </div>
      {(canEnableEncryption || canEnableProof) && (
        <Link
          href={
            canEnableEncryption
              ? getEncryptedMessagesRoute()
              : getPreferencesHref({ tab: "devices" })
          }
          onClick={onClose}
          className={className}
        >
          <FontAwesomeIcon
            icon={faShieldHalved}
            className="tw-w-5 tw-shrink-0"
          />
          {t(
            locale,
            canEnableEncryption
              ? canEnableProof
                ? "e2ee.deviceStatus.enableBoth"
                : "e2ee.deviceStatus.enableEncryption"
              : "e2ee.deviceStatus.enableProof"
          )}
        </Link>
      )}
    </>
  );
}
