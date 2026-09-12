import {
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
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
        <Listbox
          value={collection}
          onChange={onCollectionChange}
          disabled={disabled}
        >
          <Label className="tw-block tw-text-xs tw-font-semibold tw-text-iron-300">
            {t(locale, "collect.goal.collection")}
          </Label>
          <ListboxButton
            aria-describedby={`${id}-collection-value`}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.click();
              }
            }}
            className="tw-flex tw-min-h-11 tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-font-medium tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
          >
            <span id={`${id}-collection-value`}>
              {t(locale, `collect.collection.${collection}`)}
            </span>
            <ChevronDownIcon
              aria-hidden="true"
              className="tw-size-4 tw-shrink-0 tw-text-iron-400"
            />
          </ListboxButton>
          <ListboxOptions
            anchor="bottom start"
            className="tailwind-scope tw-z-50 tw-w-[var(--button-width)] tw-overflow-auto tw-rounded-lg tw-bg-iron-900 tw-p-1 tw-text-sm tw-text-iron-100 tw-shadow-lg tw-ring-1 tw-ring-white/10 [--anchor-gap:0.5rem] focus:tw-outline-none"
          >
            {COLLECTIONS.map((value) => (
              <ListboxOption
                key={value}
                value={value}
                className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 tw-rounded-md tw-px-3 tw-py-2 data-[focus]:tw-bg-iron-800"
              >
                {({ selected }) => (
                  <>
                    <span>{t(locale, `collect.collection.${value}`)}</span>
                    {selected && (
                      <CheckIcon
                        aria-hidden="true"
                        className="tw-size-4 tw-shrink-0 tw-text-iron-300"
                      />
                    )}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Listbox>
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
      )}
    </div>
  );
}
