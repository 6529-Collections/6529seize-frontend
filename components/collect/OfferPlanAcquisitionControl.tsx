import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  CONNECTED_TAB_INTERACTION_CLASSES,
  CONNECTED_TAB_SURFACE_CLASSES,
  getConnectedTabStateClasses,
} from "@/components/utils/select/tabs/connectedTabStyles";

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
  const button = `tw-min-h-11 tw-rounded-md tw-border-0 tw-px-3 tw-text-xs ${CONNECTED_TAB_INTERACTION_CLASSES}`;
  return (
    <div className="tw-mt-2">
      <div
        role="group"
        aria-label={t(locale, "collect.blend.acquireFor", { title })}
        className={`${CONNECTED_TAB_SURFACE_CLASSES} tw-inline-flex tw-border tw-border-solid tw-p-0.5`}
      >
        <button
          type="button"
          aria-pressed={!buying}
          disabled={disabled}
          onClick={() => onChange(false)}
          className={`${button} ${getConnectedTabStateClasses({ isActive: !buying })}`}
        >
          {t(locale, "collect.blend.offer")}
        </button>
        <button
          type="button"
          aria-pressed={buying}
          disabled={disabled || !available}
          onClick={() => onChange(true)}
          className={`${button} ${getConnectedTabStateClasses({ isActive: buying })}`}
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
