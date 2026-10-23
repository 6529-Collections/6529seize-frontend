"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatEther } from "viem";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useAuth } from "@/components/auth/Auth";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  getForgeSettings,
  saveForgeSettings,
} from "@/services/api/drop-forge-settings";
import { getAddressEtherscanLink } from "@/helpers/Helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import Button from "@/components/utils/button/Button";
import WalletFunding from "./WalletFunding";

export default function LaunchAutomationSettings() {
  const locale = useBrowserLocale();
  const { address } = useSeizeConnectContext();
  const { requestAuth } = useAuth();
  const client = useQueryClient();
  const key = ["drop-forge-settings", address?.toLowerCase()];
  const query = useQuery({
    queryKey: key,
    queryFn: getForgeSettings,
    retry: false,
    enabled: !!address,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const settings = query.data;
  async function copyAddress() {
    if (!settings) return;
    try {
      await navigator.clipboard.writeText(settings.signer_address);
    } catch {
      setError(t(locale, "dropForge.settings.copyError"));
    }
  }
  async function refresh() {
    if ((await requestAuth()).success) await query.refetch();
  }
  async function change(artist: boolean, checked: boolean) {
    if (!settings?.can_edit || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (!(await requestAuth()).success) return;
      const updated = await saveForgeSettings({
        revision: settings.revision,
        automation_enabled: artist ? settings.automation_enabled : checked,
        pay_artist_enabled: artist ? checked : settings.pay_artist_enabled,
      });
      client.setQueryData(key, updated);
    } catch (e) {
      setError(
        getToastErrorDetails(e) ?? t(locale, "dropForge.settings.saveError")
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section
      aria-labelledby="launch-automation-heading"
      className="tw-mt-6 tw-rounded-xl tw-bg-iron-950 tw-p-4 tw-ring-1 tw-ring-inset tw-ring-iron-800 sm:tw-p-6"
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <h2
          id="launch-automation-heading"
          className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-50"
        >
          {t(locale, "dropForge.settings.title")}
        </h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void refresh()}
          loading={query.isFetching}
          aria-label={t(locale, "dropForge.settings.refresh")}
        >
          {t(
            locale,
            settings
              ? "dropForge.settings.refreshButton"
              : "dropForge.settings.signIn"
          )}
        </Button>
      </div>
      {query.isPending && (
        <output className="tw-mt-4 tw-block tw-text-iron-400">
          {t(locale, "dropForge.funding.preparing")}
        </output>
      )}
      {query.isError && (
        <p role="alert" className="tw-mt-4 tw-text-rose-300">
          {t(locale, "dropForge.settings.loadError")}
        </p>
      )}
      {error && (
        <p role="alert" className="tw-mt-4 tw-text-rose-300">
          {error}
        </p>
      )}
      {settings && (
        <>
          <div className="tw-mt-5 tw-grid tw-gap-4 lg:tw-grid-cols-2">
            <div className="tw-space-y-4">
              {[false, true].map((artist) => {
                const checked = artist
                  ? settings.pay_artist_enabled
                  : settings.automation_enabled;
                const unavailable = artist
                  ? !settings.artist_payment_available
                  : !settings.execution_available;
                return (
                  <label
                    key={String(artist)}
                    className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-rounded-lg tw-bg-iron-900 tw-p-4"
                  >
                    <span className="tw-text-sm tw-font-medium tw-text-iron-100">
                      {t(
                        locale,
                        artist
                          ? "dropForge.settings.artist"
                          : "dropForge.settings.launch"
                      )}
                    </span>
                    <span className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-iron-300">
                      {t(
                        locale,
                        checked
                          ? "dropForge.settings.on"
                          : "dropForge.settings.off"
                      )}
                      <input
                        type="checkbox"
                        role="switch"
                        checked={checked}
                        disabled={
                          !settings.can_edit ||
                          saving ||
                          (unavailable && !checked)
                        }
                        onChange={(event) =>
                          void change(artist, event.target.checked)
                        }
                        className="tw-size-5 tw-accent-primary-400"
                      />
                    </span>
                  </label>
                );
              })}
              {!settings.can_edit && (
                <p className="tw-text-sm tw-text-iron-400">
                  {t(locale, "dropForge.settings.readOnly")}
                </p>
              )}
              {!settings.execution_available && (
                <p className="tw-text-sm tw-text-amber-300">
                  {t(locale, "dropForge.settings.unavailable")}
                </p>
              )}
              {!settings.artist_payment_available && (
                <p className="tw-text-sm tw-text-iron-400">
                  {t(locale, "dropForge.settings.paymentUnavailable")}
                </p>
              )}
              <p className="tw-text-sm tw-text-iron-400">
                {t(locale, "dropForge.settings.paused")}
              </p>
              <p className="tw-text-sm tw-text-iron-400">
                {t(locale, "dropForge.settings.postMint")}
              </p>
              {settings.updated_by && (
                <p className="tw-break-all tw-text-xs tw-text-iron-500">
                  {t(locale, "dropForge.settings.updated", {
                    wallet: settings.updated_by,
                  })}
                </p>
              )}
              {saving && (
                <output>{t(locale, "dropForge.settings.saving")}</output>
              )}
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
              <Button
                variant="secondary"
                size="sm"
                className="tw-mt-3"
                onClick={() => void copyAddress()}
              >
                {t(locale, "dropForge.settings.copy")}
              </Button>
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
        </>
      )}
    </section>
  );
}
