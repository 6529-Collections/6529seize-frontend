import { useId, useState, type FormEvent } from "react";
import Button from "@/components/utils/button/Button";
import { darkInputClassName } from "@/components/utils/input/dark-input-styles";
import type { ApiDropForgeSettings } from "@/generated/models/ApiDropForgeSettings";
import type { ApiDropForgeSettingsRequest } from "@/generated/models/ApiDropForgeSettingsRequest";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

type PaymentUpdate = Pick<
  ApiDropForgeSettingsRequest,
  "pay_artist_enabled" | "max_artist_payment_eth"
>;

function isPaymentLimitDraft(value: string): boolean {
  const [whole = "", fraction = "", extra] = value.split(".");
  return (
    extra === undefined &&
    whole.length <= 59 &&
    fraction.length <= 18 &&
    !/[^0-9.]/.test(value)
  );
}

function normalizePaymentLimit(draft: string): string | null {
  if (!/[1-9]/.test(draft) || draft.endsWith(".")) return null;
  return draft.startsWith(".") ? `0${draft}` : draft;
}

export default function ArtistPaymentSettings({
  settings,
  saving,
  onChange,
}: Readonly<{
  settings: ApiDropForgeSettings;
  saving: boolean;
  onChange: (update: PaymentUpdate) => Promise<boolean>;
}>) {
  const locale = useBrowserLocale();
  const limitId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const enabled = settings.pay_artist_enabled;
  const savedLimit = settings.max_artist_payment_eth;
  const disabled = saving || !settings.can_edit;

  async function saveLimit(limit: string) {
    if (disabled) return;
    const saved = await onChange({
      max_artist_payment_eth: limit,
      pay_artist_enabled: true,
    });
    if (saved) setDraft(null);
  }

  return (
    <section
      aria-labelledby={`${limitId}-heading`}
      className="tw-rounded-xl tw-bg-iron-950 tw-p-4 tw-ring-1 tw-ring-inset tw-ring-iron-800"
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
        <h3
          id={`${limitId}-heading`}
          className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100"
        >
          {t(locale, "dropForge.settings.artist")}
        </h3>
        <output
          className={`tw-rounded-full tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium ${enabled ? "tw-bg-emerald-500/15 tw-text-emerald-300" : "tw-bg-iron-800 tw-text-iron-300"}`}
        >
          {t(
            locale,
            enabled
              ? "dropForge.settings.paymentEnabled"
              : "dropForge.settings.paymentDisabled"
          )}
        </output>
      </div>
      <div className="tw-mt-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-3">
        {draft !== null && settings.can_edit ? (
          <PaymentLimitForm
            id={limitId}
            enabled={enabled}
            saving={saving}
            draft={draft}
            onDraftChange={setDraft}
            onCancel={() => setDraft(null)}
            onSave={saveLimit}
          />
        ) : (
          <PaymentLimitSummary
            enabled={enabled}
            savedLimit={savedLimit}
            disabled={disabled}
            onEdit={() => setDraft(savedLimit ?? "")}
            onToggle={() => void onChange({ pay_artist_enabled: !enabled })}
          />
        )}
      </div>
    </section>
  );
}

function PaymentLimitForm({
  id,
  enabled,
  saving,
  draft,
  onDraftChange,
  onCancel,
  onSave,
}: Readonly<{
  id: string;
  enabled: boolean;
  saving: boolean;
  draft: string;
  onDraftChange: (draft: string) => void;
  onCancel: () => void;
  onSave: (limit: string) => Promise<void>;
}>) {
  const locale = useBrowserLocale();
  const limit = normalizePaymentLimit(draft);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (limit && !saving) void onSave(limit);
  }

  return (
    <form onSubmit={submit}>
      <label
        htmlFor={id}
        className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-iron-200"
      >
        {t(locale, "dropForge.settings.paymentLimit")}
      </label>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
        <div className="tw-relative tw-min-w-28 tw-flex-1">
          <input
            id={id}
            type="text"
            inputMode="decimal"
            value={draft}
            placeholder="0.01"
            disabled={saving}
            className={`${darkInputClassName} !tw-pr-12`}
            onChange={(event) => {
              const value = event.target.value.replace(",", ".");
              if (isPaymentLimitDraft(value)) onDraftChange(value);
            }}
          />
          <span
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-3 tw-flex tw-items-center tw-text-sm tw-text-iron-400"
          >
            ETH
          </span>
        </div>
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          <Button type="submit" disabled={saving || !limit}>
            {t(
              locale,
              enabled
                ? "dropForge.settings.savePaymentLimit"
                : "dropForge.settings.saveAndEnablePayment"
            )}
          </Button>
          <Button variant="secondary" disabled={saving} onClick={onCancel}>
            {t(locale, "dropForge.settings.cancelPaymentEdit")}
          </Button>
        </div>
      </div>
    </form>
  );
}

function PaymentLimitSummary({
  enabled,
  savedLimit,
  disabled,
  onEdit,
  onToggle,
}: Readonly<{
  enabled: boolean;
  savedLimit: ApiDropForgeSettings["max_artist_payment_eth"];
  disabled: boolean;
  onEdit: () => void;
  onToggle: () => void;
}>) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-3">
      <div className="tw-min-w-0">
        <p className="tw-m-0 tw-text-sm tw-text-iron-400">
          {t(
            locale,
            savedLimit && !enabled
              ? "dropForge.settings.savedPaymentLimit"
              : "dropForge.settings.paymentLimit"
          )}
        </p>
        <p className="tw-mb-0 tw-mt-1 tw-break-words tw-text-xl tw-font-semibold tw-text-iron-100">
          {savedLimit ?? "0"} ETH
        </p>
      </div>
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <Button
          variant={!savedLimit && !enabled ? "action" : "secondary"}
          disabled={disabled}
          onClick={onEdit}
        >
          {t(
            locale,
            savedLimit
              ? "dropForge.settings.editPaymentLimit"
              : "dropForge.settings.setPaymentLimit"
          )}
        </Button>
        {(enabled || savedLimit) && (
          <Button
            variant={enabled ? "secondary" : "action"}
            disabled={disabled}
            onClick={onToggle}
          >
            {t(
              locale,
              enabled
                ? "dropForge.settings.disablePayment"
                : "dropForge.settings.reenablePayment"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
