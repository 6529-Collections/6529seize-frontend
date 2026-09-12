import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function OfferPlanAcquisitionControl({
  title,
  buying,
  available,
  disabled,
  onChange,
}: {
  readonly title: string;
  readonly buying: boolean;
  readonly available: boolean;
  readonly disabled: boolean;
  readonly onChange: (buying: boolean) => void;
}) {
  const locale = useBrowserLocale();
  const button =
    "tw-min-h-11 tw-rounded-md tw-border-0 tw-px-3 tw-text-xs focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-40";
  return (
    <div className="tw-mt-2">
      <div
        role="group"
        aria-label={t(locale, "collect.blend.acquireFor", { title })}
        className="tw-inline-flex tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-p-0.5"
      >
        <button
          type="button"
          aria-pressed={!buying}
          disabled={disabled}
          onClick={() => onChange(false)}
          className={`${button} ${buying ? "tw-bg-transparent tw-text-iron-400" : "tw-bg-iron-800 tw-text-iron-100"}`}
        >
          {t(locale, "collect.blend.offer")}
        </button>
        <button
          type="button"
          aria-pressed={buying}
          disabled={disabled || !available}
          onClick={() => onChange(true)}
          className={`${button} ${buying ? "tw-bg-iron-800 tw-text-iron-100" : "tw-bg-transparent tw-text-iron-400"}`}
        >
          {t(locale, "collect.strategy.buy")}
        </button>
      </div>
      {!available && !buying && (
        <p className="tw-m-0 tw-mt-1 tw-text-xs tw-text-iron-400">
          {t(locale, "collect.blend.noFullListing")}
        </p>
      )}
    </div>
  );
}
