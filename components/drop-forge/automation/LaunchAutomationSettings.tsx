"use client";
import Link from "next/link";
import { useId, useState } from "react";
import { ArrowPathIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import { formatEther } from "viem";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useAuth } from "@/components/auth/Auth";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { saveForgeSettings } from "@/services/api/drop-forge-settings";
import type { ApiDropForgeSettingsRequest } from "@/generated/models/ApiDropForgeSettingsRequest";
import { forgeSettingsKey } from "@/hooks/drop-forge-query-keys";
import { useDropForgeSettings } from "@/hooks/useDropForgeSettings";
import { getAddressEtherscanLink } from "@/helpers/Helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import Button from "@/components/utils/button/Button";
import { getButtonClasses } from "@/components/utils/button/buttonStyles";
import WavesIcon from "@/components/common/icons/WavesIcon";
import { useWaveById } from "@/hooks/useWaveById";
import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import {
  dropForgeDisclosureClassName,
  dropForgeIconButtonClassName,
  dropForgeSectionClassName,
} from "../drop-forge-section-styles";
import ArtistPaymentSettings from "./ArtistPaymentSettings";
import CopyWalletAddressButton from "./CopyWalletAddressButton";
import LaunchAutomationHelp from "./LaunchAutomationHelp";
import WalletFunding from "./WalletFunding";

const switches = [
  {
    field: "automation_enabled",
    permission: "can_edit",
  },
  {
    field: "preparation_enabled",
    permission: "can_edit_preparation",
  },
] as const;

const settingLabels = {
  automation_enabled: "dropForge.settings.launch",
  preparation_enabled: "dropForge.settings.preparation",
  pay_artist_enabled: "dropForge.settings.artist",
} as const;

type Setting = keyof typeof settingLabels;

export default function LaunchAutomationSettings() {
  const locale = useBrowserLocale();
  const [expanded, setExpanded] = useState(false);
  const bodyId = useId();
  const { address } = useSeizeConnectContext();
  const { requestAuth, setToast } = useAuth();
  const client = useQueryClient();
  const key = forgeSettingsKey(address);
  const query = useDropForgeSettings();
  const [savingSetting, setSavingSetting] = useState<Setting | null>(null);
  const saving = savingSetting !== null;
  const settings = query.data;
  const opsWaveId = settings?.operations_wave_id ?? null;
  const { wave: opsWave } = useWaveById(opsWaveId);
  const opsWaveLabel =
    opsWave?.id === opsWaveId
      ? opsWave.name
      : t(locale, "dropForge.settings.opsWave");
  async function refresh() {
    if ((await requestAuth()).success) await query.refetch();
  }
  async function change(
    field: Setting,
    input: Omit<ApiDropForgeSettingsRequest, "revision">
  ) {
    if (!settings || saving) return false;
    setSavingSetting(field);
    try {
      if (!(await requestAuth()).success) return false;
      const updated = await saveForgeSettings({
        revision: settings.revision,
        ...input,
      });
      client.setQueryData(key, updated);
      const toggleMessage = updated[field]
        ? "dropForge.settings.enabledToast"
        : "dropForge.settings.disabledToast";
      const limitMessage = settings.pay_artist_enabled
        ? "dropForge.settings.limitSavedToast"
        : "dropForge.settings.limitSavedAndEnabledToast";
      setToast({
        type: "success",
        message:
          input.max_artist_payment_eth === undefined
            ? t(locale, toggleMessage, {
                setting: t(locale, settingLabels[field]),
              })
            : t(locale, limitMessage),
      });
      return true;
    } catch (e) {
      setToast({
        type: "error",
        message:
          getToastErrorDetails(e) ?? t(locale, "dropForge.settings.saveError"),
      });
      return false;
    } finally {
      setSavingSetting(null);
    }
  }
  const refreshLabel = t(
    locale,
    settings ? "dropForge.settings.refresh" : "dropForge.settings.signIn"
  );
  return (
    <section
      aria-labelledby="launch-automation-heading"
      className={dropForgeSectionClassName}
    >
      <div className="tw-flex tw-items-center tw-gap-2">
        <h2
          id="launch-automation-heading"
          className="tw-m-0 tw-min-w-0 tw-flex-1 tw-text-xl tw-font-semibold tw-text-iron-50"
        >
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={bodyId}
            className={`${dropForgeDisclosureClassName} tw-w-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-xl tw-font-semibold tw-text-inherit`}
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronRightIcon
              aria-hidden="true"
              className={`tw-size-5 tw-shrink-0 tw-text-iron-400 motion-safe:tw-transition-transform ${expanded ? "tw-rotate-90" : ""}`}
            />
            {t(locale, "dropForge.settings.title")}
          </button>
        </h2>
        {opsWaveId && (
          <CustomTooltip content={opsWaveLabel}>
            <Link
              href={`/waves/${encodeURIComponent(opsWaveId)}`}
              aria-label={opsWaveLabel}
              className={getButtonClasses({
                variant: "secondary",
                className: `${dropForgeIconButtonClassName} tw-no-underline`,
              })}
            >
              <span aria-hidden="true" className="tw-flex">
                <WavesIcon className="tw-size-5" />
              </span>
            </Link>
          </CustomTooltip>
        )}
        <LaunchAutomationHelp />
        <CustomTooltip content={refreshLabel}>
          <Button
            variant="secondary"
            className={dropForgeIconButtonClassName}
            onClick={() => void refresh()}
            loading={query.isFetching}
            hideChildrenWhenLoading
            aria-label={refreshLabel}
          >
            <ArrowPathIcon aria-hidden="true" className="tw-size-5" />
          </Button>
        </CustomTooltip>
      </div>
      <div id={bodyId} hidden={!expanded}>
        {query.isFetching && !settings && (
          <output className="tw-mt-4 tw-block tw-text-iron-400">
            {t(locale, "dropForge.funding.preparing")}
          </output>
        )}
        {query.isError && (
          <p role="alert" className="tw-mt-4 tw-text-rose-300">
            {t(locale, "dropForge.settings.loadError")}
          </p>
        )}
        {settings && (
          <div className="tw-mt-5 tw-grid tw-gap-4 lg:tw-grid-cols-2">
            <div className="tw-space-y-4">
              {switches.map(({ field, permission }) => {
                const checked = settings[field];
                const savingThis = savingSetting === field;
                const toggleState = checked
                  ? "dropForge.settings.on"
                  : "dropForge.settings.off";
                return (
                  <label
                    key={field}
                    className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-3"
                  >
                    <span className="tw-text-sm tw-font-medium tw-text-iron-100">
                      {t(locale, settingLabels[field])}
                    </span>
                    <span className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-iron-300">
                      <span
                        aria-hidden="true"
                        className="tw-min-w-[4.5rem] tw-whitespace-nowrap tw-text-right"
                      >
                        {t(
                          locale,
                          savingThis ? "dropForge.settings.saving" : toggleState
                        )}
                      </span>
                      <input
                        type="checkbox"
                        role="switch"
                        checked={checked}
                        aria-busy={savingThis}
                        disabled={!settings[permission] || saving}
                        onChange={(event) =>
                          void change(field, { [field]: event.target.checked })
                        }
                        className="tw-size-5 tw-accent-primary-400"
                      />
                    </span>
                  </label>
                );
              })}
              <ArtistPaymentSettings
                key={`${address ?? ""}:${settings.revision}`}
                settings={settings}
                saving={saving}
                savingPayment={savingSetting === "pay_artist_enabled"}
                onChange={(input) => change("pay_artist_enabled", input)}
              />
              {!settings.can_edit && (
                <p className="tw-text-sm tw-text-iron-400">
                  {t(
                    locale,
                    settings.can_edit_preparation
                      ? "dropForge.settings.launchReadOnly"
                      : "dropForge.settings.readOnly"
                  )}
                </p>
              )}
              <p className="tw-min-h-4 tw-break-all tw-text-xs tw-text-iron-500">
                {settings.updated_by &&
                  t(locale, "dropForge.settings.updated", {
                    wallet: settings.updated_by,
                  })}
              </p>
            </div>
            <div className="tw-min-w-0 tw-rounded-lg tw-bg-iron-900 tw-p-4">
              <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
                {t(locale, "dropForge.settings.wallet")}
              </h3>
              <p className="tw-mt-3 tw-text-sm tw-text-iron-400">
                {t(locale, "dropForge.funding.network", {
                  network: settings.chain_id === 1 ? "Ethereum" : "Sepolia",
                })}
              </p>
              {settings.ens_name && (
                <p className="tw-mt-3 tw-break-words tw-text-iron-100">
                  {settings.ens_name}
                </p>
              )}
              <a
                href={getAddressEtherscanLink(
                  settings.chain_id,
                  settings.signer_address
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="tw-mt-3 tw-block tw-break-all tw-text-sm tw-text-primary-300"
              >
                {settings.signer_address}
              </a>
              <CopyWalletAddressButton
                key={settings.signer_address}
                address={settings.signer_address}
              />
              <p className="tw-mt-4 tw-text-sm tw-text-iron-300">
                {t(locale, "dropForge.settings.balance")}:{" "}
                <strong>
                  {settings.balance_wei === null
                    ? t(locale, "dropForge.settings.unavailableBalance")
                    : formatEther(BigInt(settings.balance_wei))}
                </strong>
              </p>
              <WalletFunding
                key={`${address ?? ""}:${settings.chain_id}:${settings.signer_address}`}
                settings={settings}
                onConfirmed={() => {
                  void query.refetch();
                }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
