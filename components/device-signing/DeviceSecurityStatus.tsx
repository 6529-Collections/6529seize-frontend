"use client";

import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/solid";
import { useDeviceGrants } from "@/hooks/device-signing/useDeviceGrants";
import { useLocalDeviceKeys } from "@/hooks/device-signing/useLocalDeviceKeys";
import { useMinuteClock } from "@/hooks/device-signing/useMinuteClock";
import { useSignedMessagesAccount } from "@/hooks/device-signing/useSignedMessagesAccount";
import { useE2ee, type E2eeUiStatus } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, tRich } from "@/i18n/messages";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import { getDeviceGrantStatus } from "@/lib/device-signing/device-key-store";
import { isSignedMessagesEnabled } from "@/lib/device-signing/feature";

import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";

type EncryptionState = "on" | "off" | "checking" | "elsewhere" | "attention";
function encryptionState(status: E2eeUiStatus): EncryptionState {
  switch (status) {
    case "ready":
      return "on";
    case "loading":
    case "enrolling":
      return "checking";
    case "elsewhere":
      return "elsewhere";
    case "idle":
    case "needs-enrollment":
    case "disabled":
    case "unavailable":
    case "proxy":
      return "off";
    case "error":
    case "unsupported":
    case "device-limit":
    case "load-failed":
      return "attention";
  }
}

export function useDeviceSecurityState() {
  const address = useSignedMessagesAccount();
  const local = useLocalDeviceKeys(address);
  const remote = useDeviceGrants(address);
  const now = useMinuteClock();
  const encryption = useE2ee();
  const grant =
    remote.data?.find((item) => item.id === local.grant?.id) ?? null;
  const matchesLocalKey =
    grant?.wallet.toLowerCase() === address &&
    local.publicKeys.includes(grant.device_key.toLowerCase());
  const grantStatus = getDeviceGrantStatus(matchesLocalKey ? grant : null, now);
  let proof: "on" | "off" | "checking" | "unknown" | "unavailable" = "off";
  if (address === null) proof = "unavailable";
  else if (!local.loaded || now === 0 || remote.isPending) proof = "checking";
  else if (remote.isError) proof = "unknown";
  else if (grantStatus === "active" || grantStatus === "renewal") proof = "on";
  const encrypted = encryptionState(encryption.status);
  const canEnableEncryption =
    encryption.status === "idle" || encryption.status === "needs-enrollment";
  return { proof, encrypted, canEnableEncryption };
}

export function DeviceSecurityDetails({
  proof,
  encrypted,
}: Pick<ReturnType<typeof useDeviceSecurityState>, "proof" | "encrypted">) {
  const locale = useBrowserLocale();
  const formatStatus = (status: typeof proof | typeof encrypted) => {
    const label = t(locale, `e2ee.deviceStatus.${status}`);
    return status === "on" || status === "off" ? (
      <strong key="status" className="tw-font-bold">
        {label}
      </strong>
    ) : (
      label
    );
  };
  return (
    <>
      <span className="tw-block">
        {tRich(locale, "e2ee.deviceStatus.proofLine", {
          status: formatStatus(proof),
        })}
      </span>
      <span className="tw-block">
        {tRich(locale, "e2ee.deviceStatus.encryptionLine", {
          status: formatStatus(encrypted),
        })}
      </span>
    </>
  );
}

function DeviceSecurityStatusContent({
  descriptionId,
  menuOpen,
}: {
  readonly descriptionId: string;
  readonly menuOpen: boolean;
}) {
  const { proof, encrypted } = useDeviceSecurityState();
  const isTouchDevice = useIsTouchDevice();
  const complete = proof === "on" && encrypted === "on";
  const partial = proof === "on" || encrypted === "on";
  const color = complete ? "tw-text-green-400" : "tw-text-iron-400";
  const statusColor = partial && !complete ? "tw-text-amber-300" : color;
  const Icon = complete ? ShieldCheckIcon : ShieldExclamationIcon;
  return (
    <span
      className={`tw-absolute -tw-bottom-1 -tw-right-1 tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950 tw-ring-2 tw-ring-iron-950 ${statusColor}`}
    >
      <Icon aria-hidden="true" className="tw-size-4" />
      <span id={descriptionId} className="tw-sr-only">
        <DeviceSecurityDetails proof={proof} encrypted={encrypted} />
      </span>
      {!isTouchDevice && !menuOpen && (
        <BodyPortalTooltip
          id={`${descriptionId}-tooltip`}
          place="right"
          opacity={1}
          openEvents={{ mouseenter: true, focus: true }}
          closeEvents={{ mouseleave: true, blur: true }}
          globalCloseEvents={{ escape: true }}
          style={TOOLTIP_STYLES}
        >
          <div className="tailwind-scope tw-font-normal">
            <DeviceSecurityDetails proof={proof} encrypted={encrypted} />
          </div>
        </BodyPortalTooltip>
      )}
    </span>
  );
}

export const isDeviceSecurityStatusEnabled = (): boolean =>
  isSignedMessagesEnabled() || isE2eeEnabled();

/** Describes this app/browser, independently of whether its wallet is connected. */
export default function DeviceSecurityStatus(props: {
  readonly descriptionId: string;
  readonly menuOpen: boolean;
}) {
  if (!isDeviceSecurityStatusEnabled()) return null;
  return <DeviceSecurityStatusContent {...props} />;
}
