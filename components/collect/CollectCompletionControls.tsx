import { CheckIcon } from "@heroicons/react/24/outline";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useId } from "react";
import type { CollectCollection, CollectIntent } from "./collect.types";
export interface CollectCompletionSelection {
  readonly collection: CollectCollection;
  readonly onIntentChange: (intent: CollectIntent) => void;
}
interface Props extends CollectCompletionSelection {
  readonly intent: CollectIntent;
  readonly locale: SupportedLocale;
  readonly disabled: boolean;
}
const MEMES_GOALS = ["full_set", "season", "artist"] as const;
export default function CollectCompletionControls({
  collection,
  intent,
  locale,
  disabled,
  onIntentChange,
}: Props) {
  const id = useId();
  if (collection !== "memes") return null;
  return (
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
            <span className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1 tw-rounded-lg tw-px-2.5 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-400 tw-transition-colors peer-checked:tw-bg-iron-800 peer-checked:tw-text-iron-100 peer-focus-visible:tw-outline peer-focus-visible:tw-outline-2 peer-focus-visible:tw-outline-offset-2 peer-focus-visible:tw-outline-primary-400 peer-disabled:tw-cursor-not-allowed peer-disabled:tw-opacity-50 desktop-hover:hover:tw-text-iron-100">
              {intent === goal && (
                <CheckIcon
                  aria-hidden="true"
                  className="tw-size-3.5 tw-shrink-0"
                />
              )}
              {t(locale, `collect.goal.option.${goal}`)}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
