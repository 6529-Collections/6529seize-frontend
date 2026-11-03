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
import { t } from "@/i18n/messages";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import { getDeviceGrantStatus } from "@/lib/device-signing/device-key-store";
import { isSignedMessagesEnabled } from "@/lib/device-signing/feature";

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

function DeviceSecurityStatusContent({
  descriptionId,
}: {
  readonly descriptionId: string;
}) {
  const locale = useBrowserLocale();
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
  const label = t(locale, "e2ee.deviceStatus.summary", {
    proof: t(locale, `e2ee.deviceStatus.${proof}`),
    encryption: t(locale, `e2ee.deviceStatus.${encrypted}`),
  });
  const complete = proof === "on" && encrypted === "on";
  const partial = proof === "on" || encrypted === "on";
  const color = complete ? "tw-text-green-400" : "tw-text-iron-400";
  const statusColor = partial && !complete ? "tw-text-amber-300" : color;
  const Icon = complete ? ShieldCheckIcon : ShieldExclamationIcon;
  return (
    <span
      title={label}
      className={`tw-absolute -tw-bottom-1 -tw-right-1 tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950 tw-ring-2 tw-ring-iron-950 ${statusColor}`}
    >
      <Icon aria-hidden="true" className="tw-size-4" />
      <span id={descriptionId} className="tw-sr-only">
        {label}
      </span>
    </span>
  );
}

/** Describes this app/browser, independently of whether its wallet is connected. */
export default function DeviceSecurityStatus(props: {
  readonly descriptionId: string;
}) {
  if (!isSignedMessagesEnabled() && !isE2eeEnabled())
    return <span id={props.descriptionId} className="tw-sr-only" />;
  return <DeviceSecurityStatusContent {...props} />;
}
