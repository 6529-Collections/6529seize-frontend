"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import SignedMessagesEnableStatus from "@/components/device-signing/SignedMessagesEnableStatus";
import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import Button from "@/components/utils/button/Button";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import { shortenAddress } from "@/helpers/address.helpers";
import {
  useDeviceGrants,
  useRevokeDeviceGrant,
} from "@/hooks/device-signing/useDeviceGrants";
import { useEnableSignedMessages } from "@/hooks/device-signing/useEnableSignedMessages";
import { useLocalDeviceKeys } from "@/hooks/device-signing/useLocalDeviceKeys";
import { useMinuteClock } from "@/hooks/device-signing/useMinuteClock";
import { useSignedMessagesAccount } from "@/hooks/device-signing/useSignedMessagesAccount";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import type { MessageKey } from "@/i18n/messages/en-US";
import { t } from "@/i18n/messages";
import { getDeviceGrantStatus } from "@/lib/device-signing/device-key-store";
import { useId, useState } from "react";

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
      date: date(grant.issued_at),
    }),
    ending,
    lastUsed,
  ];
}

function DeviceGrantRow({
  grant,
  isThisDevice,
  nowMs,
  onRevoke,
}: {
  readonly grant: ApiDeviceGrant;
  readonly isThisDevice: boolean;
  readonly nowMs: number;
  readonly onRevoke: (grant: ApiDeviceGrant) => void;
}) {
  const locale = useBrowserLocale();
  const status = getStatus(grant, nowMs);
  const statusKey: MessageKey = `signedMessages.devices.status.${status}`;

  return (
    <li className="tw-flex tw-flex-wrap tw-items-start tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4 last:tw-border-b-0">
      <div className="tw-min-w-0 tw-flex-1 tw-basis-60">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
          <span className="tw-break-words tw-font-semibold tw-text-iron-100">
            {grant.device_label}
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
          {t(locale, "signedMessages.devices.scopes", {
            scopes: formatScopes(locale, grant.scopes),
          })}
        </p>
        <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-400">
          {[
            t(locale, "signedMessages.devices.wallet", {
              address: shortenAddress(grant.wallet),
            }),
            ...getGrantDates(locale, grant, status),
          ].join(" · ")}
        </p>
      </div>
      {status === "active" && (
        <Button
          size="sm"
          variant="destructiveOutline"
          onClick={() => onRevoke(grant)}
          aria-label={t(locale, "signedMessages.devices.revokeLabel", {
            label: grant.device_label,
          })}
        >
          {t(locale, "signedMessages.devices.revoke")}
        </Button>
      )}
    </li>
  );
}

function EnableSignedMessagesButton({
  address,
  hasActiveLocalGrant,
}: {
  readonly address: string | null;
  readonly hasActiveLocalGrant: boolean;
}) {
  const locale = useBrowserLocale();
  const account = useSignedMessagesAccount();
  const { canEnable, enable, isEnabling, reconnect, status } =
    useEnableSignedMessages();

  if (!canEnable || !account || account !== address || hasActiveLocalGrant) {
    return null;
  }
  return (
    <div className="tw-mt-4">
      <Button
        size="sm"
        variant="secondary"
        loading={isEnabling}
        onClick={() => enable("devices")}
      >
        {t(locale, "signedMessages.devices.enable")}
      </Button>
      <SignedMessagesEnableStatus
        status={status}
        onReconnect={reconnect}
        className="tw-mt-2"
      />
    </div>
  );
}

export default function DevicesPreferencesSettings() {
  const locale = useBrowserLocale();
  const titleId = useId();
  const { activeProfileProxy, isAuthenticated } = useAuth();
  const { address } = useSeizeConnectContext();
  const listAddress =
    !activeProfileProxy && isAuthenticated && address
      ? address.toLowerCase()
      : null;
  const query = useDeviceGrants(listAddress);
  const local = useLocalDeviceKeys(listAddress);
  const nowMs = useMinuteClock();
  const { revoke, isRevoking } = useRevokeDeviceGrant();
  const [pendingRevoke, setPendingRevoke] = useState<ApiDeviceGrant | null>(
    null
  );
  const grants = query.data ?? [];
  const ownKeys = new Set(local.publicKeys);
  const localStatus = getDeviceGrantStatus(local.grant, nowMs);

  const confirmRevoke = async () => {
    if (pendingRevoke && (await revoke(pendingRevoke))) {
      setPendingRevoke(null);
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
        <EnableSignedMessagesButton
          address={listAddress}
          hasActiveLocalGrant={
            localStatus === "active" || localStatus === "renewal"
          }
        />
      )}
      {query.isLoading && (
        <output
          aria-label={t(locale, "signedMessages.devices.loading")}
          className="tw-mt-4 tw-flex tw-min-h-24 tw-items-center tw-justify-center"
        >
          <span className="tw-size-6 tw-animate-spin tw-rounded-full tw-border-2 tw-border-iron-600 tw-border-t-primary-400 motion-reduce:tw-animate-none" />
        </output>
      )}
      {query.isError && (
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
            onClick={() => void query.refetch()}
          >
            {t(locale, "signedMessages.devices.retry")}
          </Button>
        </div>
      )}
      {query.isSuccess && grants.length === 0 && (
        <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-iron-400">
          {t(locale, "signedMessages.devices.empty")}
        </p>
      )}
      {grants.length > 0 && (
        <ul
          aria-label={t(locale, "signedMessages.devices.listLabel")}
          className="tw-m-0 tw-mt-2 tw-list-none tw-p-0"
        >
          {grants.map((grant) => (
            <DeviceGrantRow
              key={grant.id}
              grant={grant}
              isThisDevice={ownKeys.has(grant.device_key.toLowerCase())}
              nowMs={nowMs}
              onRevoke={setPendingRevoke}
            />
          ))}
        </ul>
      )}
      <MobileWrapperConfirmationDialog
        isOpen={pendingRevoke !== null}
        onClose={() => !isRevoking && setPendingRevoke(null)}
        onConfirm={() => void confirmRevoke()}
        title={t(locale, "signedMessages.devices.revokeLabel", {
          label: pendingRevoke?.device_label ?? "",
        })}
        message={t(locale, "signedMessages.devices.revokeConfirm")}
        confirmText={t(locale, "signedMessages.devices.revoke")}
        cancelText={t(locale, "signedMessages.devices.cancel")}
        isConfirming={isRevoking}
        confirmVariant="destructive"
      />
    </section>
  );
}
