"use client";

import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import type { getConnectionProfileIndicator } from "@/components/auth/connection-state-indicator";
import {
  DEVICE_GRANTS_REFRESH_MS,
  useDeviceGrants,
} from "@/hooks/device-signing/useDeviceGrants";
import { useLocalDeviceKeys } from "@/hooks/device-signing/useLocalDeviceKeys";
import { useMinuteClock } from "@/hooks/device-signing/useMinuteClock";
import { useSignedMessagesAccount } from "@/hooks/device-signing/useSignedMessagesAccount";
import { useE2ee, type E2eeUiStatus } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { formatRelativeTime } from "@/i18n/format";
import { t, tRich } from "@/i18n/messages";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import {
  getDeviceGrantStatus,
  GRANT_RENEWAL_WINDOW_MS,
  readDeviceKey,
} from "@/lib/device-signing/device-key-store";
import type { StoredDevice } from "@/lib/e2ee/records";
import { getDefaultE2eeStorage } from "@/lib/e2ee/storage";
import { isSignedMessagesEnabled } from "@/lib/device-signing/feature";

import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";

type EncryptionState =
  | "expired"
  | "on"
  | "off"
  | "checking"
  | "elsewhere"
  | "attention"
  | "unknown";
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
    remote.isError || local.failed,
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
  inline = false,
}: Readonly<
  Omit<
    ReturnType<typeof useDeviceSecurityState>,
    "canEnableEncryption" | "proofGrant"
  > & { readonly inline?: boolean }
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
    <span
      className={
        inline
          ? "tw-flex tw-flex-wrap tw-gap-x-3 tw-gap-y-0.5"
          : "tw-grid tw-gap-0.5"
      }
    >
      <span>
        {tRich(locale, "e2ee.deviceStatus.proofLine", {
          status: formatStatus(proof),
        })}
        {formatExpiry(proofRenewal)}
      </span>
      <span>
        {tRich(locale, "e2ee.deviceStatus.encryptionLine", {
          status: formatStatus(encrypted),
        })}
        {formatExpiry(encryptionRenewal)}
      </span>
    </span>
  );
}

type ConnectionIndicator = Pick<
  ReturnType<typeof getConnectionProfileIndicator>,
  "state" | "title"
>;

type DeviceSecurityStatusProps =
  | {
      readonly descriptionId: string;
      readonly menuOpen: boolean;
      readonly connection: ConnectionIndicator;
    }
  | {
      readonly presentation: "mobile-badge";
      readonly compact?: boolean | undefined;
    }
  | {
      readonly presentation: "inline";
      readonly connection: ConnectionIndicator;
    };

type SecurityDetails = Parameters<typeof DeviceSecurityDetails>[0];

function ConnectionStatusLine({
  connection,
  alignWithShield = false,
}: {
  readonly connection: ConnectionIndicator;
  readonly alignWithShield?: boolean;
}) {
  const dotClass = {
    disconnected: "tw-bg-iron-500",
    authorized_only: "tw-bg-amber-300",
    authorized_connected: "tw-bg-green",
  }[connection.state];
  return (
    <span
      className={
        alignWithShield
          ? "tw-flex tw-items-start tw-gap-1"
          : "tw-flex tw-items-center tw-gap-2"
      }
    >
      <span
        aria-hidden="true"
        className={
          alignWithShield
            ? "tw-flex tw-size-5 tw-shrink-0 tw-items-center tw-justify-center"
            : "tw-contents"
        }
      >
        <span
          className={`tw-size-1.5 tw-shrink-0 tw-rounded-full ${dotClass}`}
        />
      </span>
      {connection.title}
    </span>
  );
}

function ShieldIcon({
  details,
  size = "badge",
}: {
  readonly details: SecurityDetails;
  readonly size?: "inline" | "badge" | "compact";
}) {
  const { proof, encrypted, proofRenewal, encryptionRenewal } = details;
  const complete = proof === "on" && encrypted === "on";
  const partial = proof === "on" || encrypted === "on";
  const renewalDue = proofRenewal !== null || encryptionRenewal !== null;
  const healthy = complete && !renewalDue;
  const attention = renewalDue || (partial && !complete);
  let statusColor = "tw-text-iron-400";
  if (healthy) statusColor = "tw-text-green";
  if (attention) statusColor = "tw-text-amber-300";
  const Icon = healthy ? ShieldCheckIcon : ShieldExclamationIcon;
  const sizeClass = {
    inline: "tw-size-5",
    badge: "tw-size-4",
    compact: "tw-size-3",
  }[size];
  return (
    <Icon
      aria-hidden="true"
      className={`${sizeClass} tw-shrink-0 ${statusColor}`}
    />
  );
}

function DeviceSecurityBadge({
  details,
  compact = false,
}: {
  readonly details: SecurityDetails;
  readonly compact?: boolean | undefined;
}) {
  return (
    <span
      className={`tw-absolute tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950 tw-ring-iron-950 ${compact ? "-tw-bottom-0.5 -tw-right-0.5 tw-size-4 tw-ring-1" : "-tw-bottom-1 -tw-right-1 tw-size-5 tw-ring-2"}`}
    >
      <ShieldIcon details={details} size={compact ? "compact" : "badge"} />
      <span className="tw-sr-only">
        <DeviceSecurityDetails {...details} />
      </span>
    </span>
  );
}

function DeviceSecurityStatusContent(props: DeviceSecurityStatusProps) {
  const details = useDeviceSecurityState();
  const isTouchDevice = useIsTouchDevice();
  if ("presentation" in props) {
    if (props.presentation === "mobile-badge")
      return <DeviceSecurityBadge details={details} compact={props.compact} />;
    return (
      <div className="tw-grid tw-min-w-0 tw-gap-0.5 tw-text-xs tw-leading-5 tw-text-iron-300">
        <ConnectionStatusLine connection={props.connection} alignWithShield />
        <div className="tw-flex tw-items-start tw-gap-1">
          <ShieldIcon details={details} size="inline" />
          <DeviceSecurityDetails {...details} inline />
        </div>
      </div>
    );
  }
  return (
    <>
      <DeviceSecurityBadge details={details} />
      <span id={props.descriptionId} className="tw-sr-only">
        <ConnectionStatusLine connection={props.connection} />
        <DeviceSecurityDetails {...details} />
      </span>
      {!isTouchDevice && !props.menuOpen && (
        <BodyPortalTooltip
          id={`${props.descriptionId}-tooltip`}
          place="right-end"
          delayShow={400}
          opacity={1}
          openEvents={{ mouseenter: true, focus: true }}
          closeEvents={{ mouseleave: true, blur: true }}
          globalCloseEvents={{ escape: true }}
          style={{
            ...TOOLTIP_STYLES,
            padding: "8px 12px",
            maxWidth: "min(20rem, 50vw)",
            overflowWrap: "anywhere",
          }}
        >
          <div className="tailwind-scope tw-grid tw-gap-1.5 tw-font-normal">
            <ConnectionStatusLine connection={props.connection} />
            <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/15 tw-pt-1.5">
              <DeviceSecurityDetails {...details} />
            </div>
          </div>
        </BodyPortalTooltip>
      )}
    </>
  );
}

function readProfileEncryptionState(
  device: StoredDevice | null,
  address: string,
  now: number
): EncryptionState {
  if (!device?.registered || !device.provisioned) return "off";
  if (device.wallet.toLowerCase() !== address) return "off";
  return device.grant.expires_at * 1000 <= now ? "expired" : "on";
}

/** Read the wallet's last verification without fetching under another session. */
function InactiveProfileBadge({
  address,
  profileId,
  compact,
}: {
  readonly address: string;
  readonly profileId?: string | null | undefined;
  readonly compact?: boolean | undefined;
}) {
  const wallet = address.toLowerCase();
  const now = useMinuteClock();
  const remote = useDeviceGrants(wallet, "cache-only");
  const query = useQuery({
    queryKey: ["local-profile-device-status", wallet, profileId],
    queryFn: async () => {
      const [signing, encryption] = await Promise.all([
        isSignedMessagesEnabled() ? readDeviceKey(wallet) : null,
        profileId && isE2eeEnabled()
          ? getDefaultE2eeStorage().getDevice(profileId)
          : null,
      ]);
      return { signing, encryption };
    },
    retry: false,
  });
  const signing = query.data?.signing;
  const verifiedRecently =
    remote.isSuccess && now < remote.dataUpdatedAt + DEVICE_GRANTS_REFRESH_MS;
  const grant =
    signing && verifiedRecently
      ? (remote.data.find(
          (item) =>
            item.id === signing.grant?.id &&
            item.wallet.toLowerCase() === wallet &&
            item.device_key.toLowerCase() === signing.publicKeyHex.toLowerCase()
        ) ?? null)
      : null;
  const grantStatus = getDeviceGrantStatus(grant, now);
  const proof = getProofStatus(
    wallet,
    !query.isPending && now > 0,
    query.isError || (Boolean(signing?.grant) && !verifiedRecently),
    grantStatus
  );
  let encrypted: EncryptionState = "checking";
  if (query.isError) encrypted = "unknown";
  else if (query.data && now > 0) {
    encrypted = profileId
      ? readProfileEncryptionState(query.data.encryption, wallet, now)
      : "unknown";
  }
  return (
    <DeviceSecurityBadge
      compact={compact}
      details={{
        proof,
        encrypted,
        proofRenewal:
          grant && grantStatus === "renewal" ? grant.expires_at - now : null,
        encryptionRenewal: null,
      }}
    />
  );
}

interface ConnectedProfileDeviceBadgeProps {
  readonly address: string;
  readonly profileId?: string | null | undefined;
  readonly isActive?: boolean;
  readonly compact?: boolean | undefined;
}

function ConnectedProfileBadgeContent({
  address,
  profileId,
  isActive,
  compact,
}: ConnectedProfileDeviceBadgeProps) {
  const { activeProfileProxy } = useAuth();
  return isActive && !activeProfileProxy ? (
    <DeviceSecurityStatusContent
      presentation="mobile-badge"
      compact={compact}
    />
  ) : (
    <InactiveProfileBadge
      address={address}
      profileId={profileId}
      compact={compact}
    />
  );
}

export function ConnectedProfileDeviceBadge(
  props: ConnectedProfileDeviceBadgeProps
) {
  if (!isDeviceSecurityStatusEnabled()) return null;
  return <ConnectedProfileBadgeContent {...props} />;
}

export const isDeviceSecurityStatusEnabled = (): boolean =>
  isSignedMessagesEnabled() || isE2eeEnabled();

/** Describes this app/browser, independently of whether its wallet is connected. */
export default function DeviceSecurityStatus(props: DeviceSecurityStatusProps) {
  if (!isDeviceSecurityStatusEnabled()) return null;
  return <DeviceSecurityStatusContent {...props} />;
}
