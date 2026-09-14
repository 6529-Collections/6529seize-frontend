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
import type { CollectCollection } from "./collect.types";
import styles from "./marketplace-font.module.css";

interface Props {
  readonly collection: CollectCollection;
  readonly locale: SupportedLocale;
  readonly onCollectionChange: (collection: CollectCollection) => void;
}
const COLLECTIONS = ["memes", "gradients", "pebbles"] as const;
export default function CollectCollectionSelector({
  collection,
  locale,
  onCollectionChange,
}: Props) {
  const id = useId();
  return (
    <div className="tw-w-full tw-min-w-0 tw-space-y-2 sm:tw-max-w-72">
      <Listbox value={collection} onChange={onCollectionChange}>
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
          className={`${styles["surface"] ?? ""} tailwind-scope tw-z-50 tw-w-[var(--button-width)] tw-overflow-auto tw-rounded-lg tw-bg-iron-900 tw-p-1 tw-text-sm tw-text-iron-100 tw-shadow-lg tw-ring-1 tw-ring-white/10 [--anchor-gap:0.5rem] focus:tw-outline-none`}
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
  );
}
