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
import { formatRelativeTime } from "@/i18n/format";
import { t, tRich } from "@/i18n/messages";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import {
  getDeviceGrantStatus,
  GRANT_RENEWAL_WINDOW_MS,
} from "@/lib/device-signing/device-key-store";
import { isSignedMessagesEnabled } from "@/lib/device-signing/feature";

import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";

type EncryptionState =
  | "expired"
  | "on"
  | "off"
  | "checking"
  | "elsewhere"
  | "attention";
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

function getProofStatus(
  address: string | null,
  loaded: boolean,
  failed: boolean,
  status: ReturnType<typeof getDeviceGrantStatus>
): "unavailable" | "checking" | "unknown" | "on" | "off" | "expired" {
  if (address === null) return "unavailable";
  if (!loaded) return "checking";
  if (failed) return "unknown";
  if (status === "none") return "off";
  return status === "expired" ? "expired" : "on";
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
  const verifiedGrant = matchesLocalKey ? grant : null;
  const grantStatus = getDeviceGrantStatus(verifiedGrant, now);
  const proof = getProofStatus(
    address,
    local.loaded && now > 0 && !remote.isPending,
    remote.isError,
    grantStatus
  );
  const encryptionDevice = encryption.thisDevice;
  const encryptionExpiry =
    encryptionDevice?.revokedAt === null ? encryptionDevice.expiresAt : null;
  const encryptionExpired =
    now > 0 && encryptionExpiry !== null && encryptionExpiry <= now;
  const encrypted = encryptionExpired
    ? "expired"
    : encryptionState(encryption.status);
  const proofRenewal =
    proof === "on" && grantStatus === "renewal" && grant
      ? grant.expires_at - now
      : null;
  const encryptionRemaining =
    encryptionExpiry !== null ? encryptionExpiry - now : null;
  const encryptionRenewal =
    encrypted === "on" &&
    now > 0 &&
    encryptionRemaining !== null &&
    encryptionRemaining <= GRANT_RENEWAL_WINDOW_MS
      ? encryptionRemaining
      : null;
  const canEnableEncryption =
    encryption.status === "idle" || encryption.status === "needs-enrollment";
  return {
    proof,
    encrypted,
    canEnableEncryption,
    proofRenewal,
    encryptionRenewal,
    proofGrant: verifiedGrant,
  };
}

export function DeviceSecurityDetails({
  proof,
  encrypted,
  proofRenewal,
  encryptionRenewal,
}: Readonly<
  Omit<
    ReturnType<typeof useDeviceSecurityState>,
    "canEnableEncryption" | "proofGrant"
  >
>) {
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
  const formatExpiry = (remaining: number | null) =>
    remaining === null
      ? null
      : t(locale, "e2ee.deviceStatus.expiring", {
          time: formatRelativeTime(
            locale,
            Math.ceil(remaining / 86_400_000),
            "day",
            { numeric: "always" }
          ),
        });
  return (
    <>
      <span className="tw-block">
        {tRich(locale, "e2ee.deviceStatus.proofLine", {
          status: formatStatus(proof),
        })}
        {formatExpiry(proofRenewal)}
      </span>
      <span className="tw-block">
        {tRich(locale, "e2ee.deviceStatus.encryptionLine", {
          status: formatStatus(encrypted),
        })}
        {formatExpiry(encryptionRenewal)}
      </span>
    </>
  );
}

type DeviceSecurityStatusProps =
  | { readonly descriptionId: string; readonly menuOpen: boolean }
  | { readonly presentation: "mobile-badge" | "inline" };

function DeviceSecurityStatusContent(props: DeviceSecurityStatusProps) {
  const details = useDeviceSecurityState();
  const { proof, encrypted, proofRenewal, encryptionRenewal } = details;
  const isTouchDevice = useIsTouchDevice();
  const complete = proof === "on" && encrypted === "on";
  const partial = proof === "on" || encrypted === "on";
  const renewalDue = proofRenewal !== null || encryptionRenewal !== null;
  const healthy = complete && !renewalDue;
  const attention = renewalDue || (partial && !complete);
  let statusColor = "tw-text-iron-400";
  if (healthy) statusColor = "tw-text-green";
  if (attention) statusColor = "tw-text-amber-300";
  const Icon = healthy ? ShieldCheckIcon : ShieldExclamationIcon;
  if ("presentation" in props && props.presentation === "inline") {
    return (
      <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-iron-300">
        <Icon
          aria-hidden="true"
          className={`tw-size-4 tw-shrink-0 ${statusColor}`}
        />
        <div className="tw-min-w-0">
          <DeviceSecurityDetails {...details} />
        </div>
      </div>
    );
  }
  const desktop = "descriptionId" in props ? props : null;
  return (
    <span
      className={`tw-absolute -tw-bottom-1 -tw-right-1 tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950 tw-ring-2 tw-ring-iron-950 ${statusColor}`}
    >
      <Icon aria-hidden="true" className="tw-size-4" />
      {desktop && (
        <span id={desktop.descriptionId} className="tw-sr-only">
          <DeviceSecurityDetails {...details} />
        </span>
      )}
      {desktop && !isTouchDevice && !desktop.menuOpen && (
        <BodyPortalTooltip
          id={`${desktop.descriptionId}-tooltip`}
          place="right"
          opacity={1}
          openEvents={{ mouseenter: true, focus: true }}
          closeEvents={{ mouseleave: true, blur: true }}
          globalCloseEvents={{ escape: true }}
          style={TOOLTIP_STYLES}
        >
          <div className="tailwind-scope tw-font-normal">
            <DeviceSecurityDetails {...details} />
          </div>
        </BodyPortalTooltip>
      )}
    </span>
  );
}

export const isDeviceSecurityStatusEnabled = (): boolean =>
  isSignedMessagesEnabled() || isE2eeEnabled();

/** Describes this app/browser, independently of whether its wallet is connected. */
export default function DeviceSecurityStatus(props: DeviceSecurityStatusProps) {
  if (!isDeviceSecurityStatusEnabled()) return null;
  return <DeviceSecurityStatusContent {...props} />;
}
