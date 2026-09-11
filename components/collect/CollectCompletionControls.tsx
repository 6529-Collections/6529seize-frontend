import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useId } from "react";
import type { CollectCollection, CollectIntent } from "./collect.types";

export interface CollectCompletionSelection {
  readonly collection: CollectCollection;
  readonly onCollectionChange: (collection: CollectCollection) => void;
  readonly onIntentChange: (intent: CollectIntent) => void;
}

interface CollectCompletionControlsProps extends CollectCompletionSelection {
  readonly intent: CollectIntent;
  readonly locale: SupportedLocale;
  readonly disabled: boolean;
}

const COLLECTIONS = ["memes", "gradients", "pebbles"] as const;
const MEMES_GOALS = ["full_set", "season", "artist"] as const;

export default function CollectCompletionControls({
  collection,
  intent,
  locale,
  disabled,
  onCollectionChange,
  onIntentChange,
}: CollectCompletionControlsProps) {
  const id = useId();
  return (
    <div className="tw-mb-5 tw-grid tw-items-start tw-gap-5 sm:tw-grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <div className="tw-min-w-0 tw-space-y-2">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-text-iron-300">
          {t(locale, "collect.goal.collection")}
        </p>
        <CommonDropdown
          items={COLLECTIONS.map((value) => ({
            value,
            key: value,
            label: t(locale, `collect.collection.${value}`),
          }))}
          activeItem={collection}
          filterLabel={t(locale, "collect.goal.collection")}
          setSelected={onCollectionChange}
          disabled={disabled}
          size="md"
        />
      </div>
      {collection === "memes" && (
        <fieldset
          disabled={disabled}
          className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0"
        >
          <legend className="tw-mb-2 tw-p-0 tw-text-xs tw-font-semibold tw-text-iron-300">
            {t(locale, "collect.goal.buildToward")}
          </legend>
          <div className="tw-flex tw-flex-wrap tw-gap-1">
            {MEMES_GOALS.map((goal) => (
              <label key={goal} className="tw-relative tw-cursor-pointer">
                <input
                  type="radio"
                  name={`${id}-goal`}
                  value={goal}
                  checked={intent === goal}
                  onChange={() => onIntentChange(goal)}
                  className="tw-peer tw-sr-only"
                />
                <span className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-400 tw-transition-colors peer-checked:tw-bg-iron-800 peer-checked:tw-text-iron-100 peer-focus-visible:tw-outline peer-focus-visible:tw-outline-2 peer-focus-visible:tw-outline-offset-2 peer-focus-visible:tw-outline-primary-400 peer-disabled:tw-cursor-not-allowed peer-disabled:tw-opacity-50 desktop-hover:hover:tw-text-iron-100">
                  {t(locale, `collect.goal.option.${goal}`)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
