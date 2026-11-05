"use client";

import { useDeviceSecurityState } from "@/components/device-signing/DeviceSecurityStatus";
import {
  DEVICE_SETUP_TITLE,
  getDeviceSetupScope,
  openDeviceSetup,
} from "@/components/device-signing/deviceSetup";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import Button from "@/components/utils/button/Button";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import { shortenAddress } from "@/helpers/address.helpers";
import {
  useDeviceGrants,
  useRevokeDeviceGrant,
} from "@/hooks/device-signing/useDeviceGrants";
import { useLocalDeviceKeys } from "@/hooks/device-signing/useLocalDeviceKeys";
import { useMinuteClock } from "@/hooks/device-signing/useMinuteClock";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import type { MessageKey } from "@/i18n/messages/en-US";
import { t } from "@/i18n/messages";
import { useId, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import { getEncryptedDevicesRoute } from "@/helpers/navigation.helpers";
import type { ApiE2eeDevice, ApiE2eeMe } from "@/lib/e2ee/api-types";
import { RenameDevice } from "@/components/e2ee/devices/RenameDevice";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";

type GrantStatus = "active" | "expired" | "revoked";

const SCOPE_LABEL_KEYS: Readonly<Record<string, MessageKey>> = {
  post: "signedMessages.devices.scope.post",
  edit: "signedMessages.devices.scope.edit",
  delete: "signedMessages.devices.scope.delete",
  react: "signedMessages.devices.scope.react",
  vote: "signedMessages.devices.scope.vote",
};

const STATUS_STYLES: Readonly<Record<GrantStatus, string>> = {
  active: "tw-bg-success/10 tw-text-success",
  expired: "tw-bg-iron-800 tw-text-iron-300",
  revoked: "tw-bg-red/10 tw-text-red",
};

const getStatus = (grant: ApiDeviceGrant, nowMs: number): GrantStatus => {
  if (grant.revoked_at !== null) {
    return "revoked";
  }
  return grant.expires_at > nowMs ? "active" : "expired";
};

const formatScopes = (
  locale: SupportedLocale,
  scopes: readonly string[]
): string =>
  formatList(
    locale,
    scopes.map((scope) => {
      const key = SCOPE_LABEL_KEYS[scope];
      return key ? t(locale, key) : scope;
    })
  );

function getGrantDates(
  locale: SupportedLocale,
  grant: ApiDeviceGrant,
  status: GrantStatus
): string[] {
  const date = (value: number) => formatDate(locale, value);
  const lastUsed =
    grant.last_used_at === null
      ? t(locale, "signedMessages.devices.neverUsed")
      : t(locale, "signedMessages.devices.lastUsed", {
          date: date(grant.last_used_at),
        });
  const endingKey: MessageKey =
    status === "expired"
      ? "signedMessages.devices.expiredOn"
      : "signedMessages.devices.expires";
  const ending =
    grant.revoked_at === null
      ? t(locale, endingKey, { date: date(grant.expires_at) })
      : t(locale, "signedMessages.devices.revokedOn", {
          date: date(grant.revoked_at),
        });
  return [
    t(locale, "signedMessages.devices.granted", {
      date: formatDate(locale, grant.created_at, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    }),
    ending,
    lastUsed,
  ];
}

function DeviceGrantRow({
  grant,
  linkedDevice,
  canRevoke,
  isThisDevice,
  nowMs,
  onRevoke,
  onRename,
  canRename,
}: {
  readonly grant: ApiDeviceGrant;
  readonly linkedDevice: ApiE2eeDevice | undefined;
  readonly canRevoke: boolean;
  readonly isThisDevice: boolean;
  readonly nowMs: number;
  readonly onRename: (name: string) => Promise<void>;
  readonly canRename: boolean;
  readonly onRevoke: (grant: ApiDeviceGrant) => void;
}) {
  const locale = useBrowserLocale();
  const status = getStatus(grant, nowMs);
  const label = linkedDevice?.label ?? grant.device_label;
  const statusKey: MessageKey = `signedMessages.devices.status.${status}`;

  return (
    <li className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4 last:tw-border-b-0">
      <div className="tw-min-w-0 tw-flex-1 tw-basis-60">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
          <span className="tw-break-words tw-font-semibold tw-text-iron-100">
            {label}
          </span>
          {isThisDevice && (
            <span className="tw-rounded-full tw-bg-primary-500/15 tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold tw-text-primary-300">
              {t(locale, "signedMessages.devices.thisDevice")}
            </span>
          )}
          <span
            className={`tw-rounded-full tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold ${STATUS_STYLES[status]}`}
          >
            {t(locale, statusKey)}
          </span>
        </div>
        <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-300">
          {t(locale, "signedMessages.devices.authorProof")} ·{" "}
          {t(locale, "signedMessages.devices.scopes", {
            scopes: formatScopes(locale, grant.scopes),
          })}
        </p>
        {linkedDevice && (
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-300">
            {t(locale, "e2ee.devices.combinedPermissions")}
          </p>
        )}
        <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-400">
          {[
            t(locale, "signedMessages.devices.wallet", {
              address: shortenAddress(grant.wallet),
            }),
            ...getGrantDates(locale, grant, status),
          ].join(" · ")}
        </p>
      </div>
      {status === "active" && canRevoke && (
        <Button
          size="sm"
          variant="destructiveOutline"
          onClick={() => onRevoke(grant)}
          aria-label={t(locale, "signedMessages.devices.revokeLabel", {
            label,
          })}
        >
          {t(locale, "signedMessages.devices.revoke")}
        </Button>
      )}
      {canRename &&
        grant.revoked_at === null &&
        (linkedDevice?.revoked_at ?? null) === null && (
          <details className="tw-basis-full">
            <summary className="tw-cursor-pointer tw-text-sm tw-text-primary-300">
              {t(locale, "e2ee.devices.rename.action")}
            </summary>
            <RenameDevice label={label} onRename={onRename} />
          </details>
        )}
    </li>
  );
}

function EnableSignedMessagesButton() {
  const locale = useBrowserLocale();
  const { proof, canEnableEncryption } = useDeviceSecurityState();
  const scope = getDeviceSetupScope(proof, canEnableEncryption);
  if (!scope) return null;
  return (
    <div className="tw-mt-4">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => openDeviceSetup(scope)}
      >
        {t(locale, DEVICE_SETUP_TITLE[scope])}
      </Button>
    </div>
  );
}

export default function DevicesPreferencesSettings() {
  const locale = useBrowserLocale();
  const titleId = useId();
  const { activeProfileProxy, isAuthenticated, connectedProfile } = useAuth();
  const { address } = useSeizeConnectContext();
  const listAddress =
    !activeProfileProxy && isAuthenticated && address
      ? address.toLowerCase()
      : null;
  const query = useDeviceGrants(listAddress);
  const profileId = connectedProfile?.id;
  const encryptionEnabled =
    isE2eeEnabled() && Boolean(profileId && listAddress);
  const encryptionDevices = useQuery({
    queryKey: ["device-permissions-encryption", profileId, listAddress],
    enabled: encryptionEnabled,
    queryFn: async ({ signal }) => {
      const data = await commonApiFetch<ApiE2eeMe>({
        endpoint: "e2ee/me",
        signal,
      });
      if (data.profile_id !== profileId)
        throw new Error("Device profile changed");
      return data.devices;
    },
  });
  const renameDevice = async (device: ApiE2eeDevice, name: string) => {
    await commonApiPost<{ label: string }, ApiE2eeDevice>({
      endpoint: `e2ee/devices/${encodeURIComponent(device.device_key)}/label`,
      body: { label: name },
    });
    await encryptionDevices.refetch();
  };
  const renameGrant = async (grant: ApiDeviceGrant, name: string) => {
    const device = linkedDevices.get(grant.id);
    if (device) {
      await renameDevice(device, name);
      return;
    }
    await commonApiPost<{ label: string }, ApiDeviceGrant>({
      endpoint: `device-grants/${encodeURIComponent(grant.id)}/label`,
      body: { label: name },
    });
    await query.refetch();
  };
  const local = useLocalDeviceKeys(listAddress);
  const nowMs = useMinuteClock();
  const { revoke, isRevoking } = useRevokeDeviceGrant();
  const [pendingRevoke, setPendingRevoke] = useState<ApiDeviceGrant | null>(
    null
  );
  const grants = query.data ?? [];
  const encryptedDevices = encryptionEnabled
    ? (encryptionDevices.data ?? [])
    : [];
  const linkedDevices = new Map(
    encryptedDevices
      .filter(
        (device) =>
          device.grant_message !== null && device.grant_message !== undefined
      )
      .map((device) => [device.grant_id, device])
  );
  const separateDevices = encryptedDevices.filter(
    (device) =>
      device.grant_message === null ||
      device.grant_message === undefined ||
      !grants.some((grant) => grant.id === device.grant_id)
  );
  const canVerifyRevocation =
    !encryptionEnabled ||
    (encryptionDevices.isSuccess && !encryptionDevices.isError);
  const pendingLinkedDevice = pendingRevoke
    ? linkedDevices.get(pendingRevoke.id)
    : undefined;
  const ownKeys = new Set(local.publicKeys);

  const confirmRevoke = async () => {
    if (canVerifyRevocation && pendingRevoke && (await revoke(pendingRevoke))) {
      setPendingRevoke(null);
      if (encryptionEnabled) void encryptionDevices.refetch();
    }
  };

  return (
    <section
      aria-labelledby={titleId}
      className="tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-5 tw-py-5 sm:tw-px-6"
    >
      <h2
        id={titleId}
        className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50"
      >
        {t(locale, "signedMessages.devices.title")}
      </h2>
      <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400">
        {t(locale, "signedMessages.devices.description")}
      </p>
      {activeProfileProxy ? (
        <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-iron-300">
          {t(locale, "signedMessages.devices.proxy")}
        </p>
      ) : (
        <EnableSignedMessagesButton />
      )}
      {(query.isLoading ||
        (encryptionEnabled && encryptionDevices.isLoading)) && (
        <output
          aria-label={t(locale, "signedMessages.devices.loading")}
          className="tw-mt-4 tw-flex tw-min-h-24 tw-items-center tw-justify-center"
        >
          <span className="tw-size-6 tw-animate-spin tw-rounded-full tw-border-2 tw-border-iron-600 tw-border-t-primary-400 motion-reduce:tw-animate-none" />
        </output>
      )}
      {(query.isError || (encryptionEnabled && encryptionDevices.isError)) && (
        <div
          role="alert"
          className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-3"
        >
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">
            {t(locale, "signedMessages.devices.error")}
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              void query.refetch();
              if (encryptionEnabled) void encryptionDevices.refetch();
            }}
          >
            {t(locale, "signedMessages.devices.retry")}
          </Button>
        </div>
      )}
      {query.isSuccess &&
        canVerifyRevocation &&
        grants.length === 0 &&
        separateDevices.length === 0 && (
          <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-iron-400">
            {t(locale, "signedMessages.devices.empty")}
          </p>
        )}
      {(grants.length > 0 || separateDevices.length > 0) && (
        <ul
          aria-label={t(locale, "signedMessages.devices.listLabel")}
          className="tw-m-0 tw-mt-2 tw-list-none tw-p-0"
        >
          {grants.map((grant) => (
            <DeviceGrantRow
              key={grant.id}
              grant={grant}
              linkedDevice={linkedDevices.get(grant.id)}
              canRevoke={canVerifyRevocation}
              isThisDevice={ownKeys.has(grant.device_key.toLowerCase())}
              nowMs={nowMs}
              onRevoke={setPendingRevoke}
              canRename={!encryptionEnabled || encryptionDevices.isSuccess}
              onRename={(name) => renameGrant(grant, name)}
            />
          ))}
          {separateDevices.map((device) => (
            <li
              key={device.device_key}
              className="tw-border-b tw-border-iron-800 tw-py-4 last:tw-border-b-0"
            >
              <p className="tw-m-0 tw-font-semibold tw-text-iron-100">
                {device.label}
              </p>
              <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-300">
                {t(
                  locale,
                  device.grant_message === null ||
                    device.grant_message === undefined
                    ? "e2ee.devices.permission"
                    : "e2ee.devices.combinedPermissions"
                )}{" "}
                ·{" "}
                {t(
                  locale,
                  device.revoked_at === null
                    ? "signedMessages.devices.expires"
                    : "signedMessages.devices.revokedOn",
                  {
                    date: formatDate(
                      locale,
                      device.revoked_at ?? device.grant.expires_at * 1000
                    ),
                  }
                )}
              </p>
              {device.revoked_at === null && (
                <details>
                  <summary className="tw-cursor-pointer tw-text-sm tw-text-primary-300">
                    {t(locale, "e2ee.devices.rename.action")}
                  </summary>
                  <RenameDevice
                    label={device.label}
                    onRename={(name) => renameDevice(device, name)}
                  />
                </details>
              )}
              {device.revoked_at === null && (
                <Link
                  href={getEncryptedDevicesRoute()}
                  className="tw-text-sm tw-text-primary-300"
                >
                  {t(locale, "e2ee.devices.managePermission")}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
      <MobileWrapperConfirmationDialog
        isOpen={pendingRevoke !== null && canVerifyRevocation}
        onClose={() => !isRevoking && setPendingRevoke(null)}
        onConfirm={() => void confirmRevoke()}
        title={t(
          locale,
          pendingLinkedDevice
            ? "e2ee.devices.revokeCombinedTitle"
            : "signedMessages.devices.revokeProofTitle",
          {
            label:
              pendingLinkedDevice?.label ?? pendingRevoke?.device_label ?? "",
          }
        )}
        message={t(
          locale,
          pendingLinkedDevice
            ? "e2ee.devices.revokeHistory"
            : "signedMessages.devices.revokeConfirm"
        )}
        confirmText={t(locale, "signedMessages.devices.revoke")}
        cancelText={t(locale, "signedMessages.devices.cancel")}
        isConfirming={isRevoking}
        confirmVariant="destructive"
      />
    </section>
  );
}
