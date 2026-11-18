"use client";
import Link from "next/link";
import { useId, useState } from "react";
import { ArrowPathIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useAuth } from "@/components/auth/Auth";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { saveForgeSettings } from "@/services/api/drop-forge-settings";
import type { ApiDropForgeSettingsRequest } from "@/generated/models/ApiDropForgeSettingsRequest";
import { forgeSettingsKey } from "@/hooks/drop-forge-query-keys";
import { useDropForgeSettings } from "@/hooks/useDropForgeSettings";
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
import OperationalWallet from "./OperationalWallet";
import SettingsUpdatedBy from "./SettingsUpdatedBy";
import LaunchAutomationHelp from "./LaunchAutomationHelp";

const settingLabels = {
  automation_enabled: "dropForge.settings.launch",
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
  const savingLaunch = savingSetting === "automation_enabled";
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
  let launchSwitchLabel:
    | "dropForge.settings.on"
    | "dropForge.settings.off"
    | "dropForge.settings.saving" = settings?.automation_enabled
    ? "dropForge.settings.on"
    : "dropForge.settings.off";
  if (savingLaunch) launchSwitchLabel = "dropForge.settings.saving";
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
              <label className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-3">
                <span className="tw-text-sm tw-font-medium tw-text-iron-100">
                  {t(locale, settingLabels.automation_enabled)}
                </span>
                <span className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-iron-300">
                  <span
                    aria-hidden="true"
                    className="tw-min-w-[4.5rem] tw-whitespace-nowrap tw-text-right"
                  >
                    {t(locale, launchSwitchLabel)}
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={settings.automation_enabled}
                    aria-busy={savingLaunch}
                    disabled={!settings.can_edit || saving}
                    onChange={(event) =>
                      void change("automation_enabled", {
                        automation_enabled: event.target.checked,
                      })
                    }
                    className="tw-size-5 tw-accent-primary-400"
                  />
                </span>
              </label>
              <ArtistPaymentSettings
                key={`${address ?? ""}:${settings.revision}`}
                settings={settings}
                saving={saving}
                savingPayment={savingSetting === "pay_artist_enabled"}
                onChange={(input) => change("pay_artist_enabled", input)}
              />
              {!settings.can_edit && (
                <p className="tw-text-sm tw-text-iron-400">
                  {t(locale, "dropForge.settings.readOnly")}
                </p>
              )}
              {settings.updated_by && (
                <SettingsUpdatedBy
                  key={settings.updated_by}
                  address={settings.updated_by}
                />
              )}
            </div>
            <OperationalWallet
              key={`${address ?? ""}:${settings.chain_id}:${settings.signer_address}`}
              settings={settings}
              onConfirmed={() => {
                void query.refetch();
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
