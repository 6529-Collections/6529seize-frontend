"use client";
import { useId, useState, type FormEvent } from "react";
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
import WalletFunding from "./WalletFunding";

const switches = [
  {
    field: "automation_enabled",
    label: "dropForge.settings.launch",
    permission: "can_edit",
  },
  {
    field: "preparation_enabled",
    label: "dropForge.settings.preparation",
    permission: "can_edit_preparation",
  },
  {
    field: "pay_artist_enabled",
    label: "dropForge.settings.artist",
    permission: "can_edit",
  },
] as const;

export default function LaunchAutomationSettings() {
  const locale = useBrowserLocale();
  const { address } = useSeizeConnectContext();
  const { requestAuth } = useAuth();
  const client = useQueryClient();
  const key = forgeSettingsKey(address);
  const query = useDropForgeSettings();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitDraft, setLimitDraft] = useState<{
    key: string;
    value: string;
  } | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const limitId = useId();
  const settings = query.data;
  const limitKey = `${address ?? ""}:${settings?.revision ?? 0}`;
  const paymentLimit =
    limitDraft?.key === limitKey
      ? limitDraft.value
      : (settings?.max_artist_payment_eth ?? "");
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
  async function change(input: Omit<ApiDropForgeSettingsRequest, "revision">) {
    if (!settings || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (!(await requestAuth()).success) return;
      const updated = await saveForgeSettings({
        revision: settings.revision,
        ...input,
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
  function savePaymentLimit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings?.can_edit || saving) return;
    const cap = paymentLimit.trim() || null;
    if (cap === settings.max_artist_payment_eth) return;
    if (
      cap !== null &&
      (!/^(?:\d{1,59}\.\d{1,18}|\d{1,59})$/.test(cap) || !/[1-9]/.test(cap))
    ) {
      setLimitError(t(locale, "dropForge.settings.invalidPaymentLimit"));
      return;
    }
    if (cap === null && settings.pay_artist_enabled) {
      setLimitError(t(locale, "dropForge.settings.disablePaymentToClear"));
      return;
    }
    setLimitError(null);
    void change({ max_artist_payment_eth: cap });
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
        <div className="tw-mt-5 tw-grid tw-gap-4 lg:tw-grid-cols-2">
          <div className="tw-space-y-4">
            {switches.map(({ field, label, permission }) => {
              const checked = settings[field];
              const needsLimit =
                field === "pay_artist_enabled" &&
                !settings.max_artist_payment_eth &&
                !checked;
              return (
                <label
                  key={field}
                  className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-rounded-lg tw-bg-iron-900 tw-p-4"
                >
                  <span className="tw-text-sm tw-font-medium tw-text-iron-100">
                    {t(locale, label)}
                  </span>
                  <span className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-iron-300">
                    <span aria-hidden="true">
                      {t(
                        locale,
                        checked
                          ? "dropForge.settings.on"
                          : "dropForge.settings.off"
                      )}
                    </span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={checked}
                      disabled={!settings[permission] || saving || needsLimit}
                      aria-describedby={
                        needsLimit ? `${limitId}-hint` : undefined
                      }
                      onChange={(event) =>
                        void change({ [field]: event.target.checked })
                      }
                      className="tw-size-5 tw-accent-primary-400"
                    />
                  </span>
                </label>
              );
            })}
            <form
              onSubmit={savePaymentLimit}
              className="tw-rounded-lg tw-bg-iron-900 tw-p-4"
            >
              <label
                htmlFor={limitId}
                className="tw-text-sm tw-font-medium tw-text-iron-100"
              >
                {t(locale, "dropForge.settings.paymentLimit")}
              </label>
              <div className="tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                <input
                  id={limitId}
                  type="text"
                  inputMode="decimal"
                  value={paymentLimit}
                  onChange={(event) => {
                    setLimitError(null);
                    setLimitDraft({ key: limitKey, value: event.target.value });
                  }}
                  aria-invalid={!!limitError}
                  aria-describedby={limitError ? `${limitId}-error` : undefined}
                  disabled={!settings.can_edit || saving}
                  className="tw-min-w-0 tw-flex-1 tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 disabled:tw-opacity-60"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  disabled={
                    !settings.can_edit ||
                    saving ||
                    paymentLimit.trim() ===
                      (settings.max_artist_payment_eth ?? "")
                  }
                >
                  {t(locale, "dropForge.settings.savePaymentLimit")}
                </Button>
              </div>
              {limitError && (
                <p
                  id={`${limitId}-error`}
                  role="alert"
                  className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-rose-300"
                >
                  {limitError}
                </p>
              )}
              {!settings.max_artist_payment_eth && (
                <p
                  id={`${limitId}-hint`}
                  className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-400"
                >
                  {t(locale, "dropForge.settings.paymentUnavailable")}
                </p>
              )}
            </form>
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
      )}
    </section>
  );
}
