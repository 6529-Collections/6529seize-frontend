import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Label,
  Description,
  Field,
} from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { useState } from "react";
import CollectGoalDefinitionMobilePicker from "./CollectGoalDefinitionMobilePicker";
import type { CollectGoalOption } from "./collect.types";

export default function CollectGoalDefinitionPicker({
  label,
  placeholder,
  locale,
  value,
  definitions,
  disabled,
  invalid,
  errorId,
  mobileSheet = false,
  searchableSheet = false,
  onChange,
}: {
  readonly label: string;
  readonly placeholder: string;
  readonly locale: SupportedLocale;
  readonly value: string;
  readonly definitions: readonly CollectGoalOption[];
  readonly disabled: boolean;
  readonly invalid: boolean;
  readonly errorId?: string;
  readonly mobileSheet?: boolean;
  readonly searchableSheet?: boolean;
  readonly onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const isMobileLayoutViewport = useIsMobileLayoutViewport();
  if (mobileSheet && isMobileLayoutViewport) {
    return (
      <CollectGoalDefinitionMobilePicker
        label={label}
        placeholder={placeholder}
        locale={locale}
        value={value}
        definitions={definitions}
        disabled={disabled}
        invalid={invalid}
        errorId={errorId}
        searchable={searchableSheet}
        onChange={onChange}
      />
    );
  }
  const selected =
    definitions.find((definition) => definition.id === value) ?? null;
  const searchText = (text: string) =>
    text.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase(locale);
  const normalizedQuery = searchText(query.trim());
  const filtered = definitions.filter((definition) =>
    searchText(definition.label).includes(normalizedQuery)
  );
  const emptyMessage = t(
    locale,
    definitions.length === 0
      ? "collect.goal.noDefinitions"
      : "collect.goal.noMatches"
  );
  return (
    <Field className="tw-min-w-0 tw-space-y-2">
      <Combobox
        value={selected}
        by="id"
        onChange={(option) => onChange(option?.id ?? "")}
        onClose={() => setQuery("")}
        disabled={disabled}
        invalid={invalid}
        immediate
      >
        {({ open }) => (
          <>
            <Label className="tw-block tw-text-xs tw-font-semibold tw-text-iron-300">
              {label}
            </Label>
            {invalid && (
              <Description className="tw-sr-only">
                {t(locale, "collect.goal.requiredDefinition")}
              </Description>
            )}
            <div className="tw-relative">
              <ComboboxInput
                displayValue={(option: CollectGoalOption | null) =>
                  option?.label ?? ""
                }
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder}
                aria-errormessage={errorId}
                aria-invalid={invalid}
                autoComplete="off"
                className="tw-block tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-py-2 tw-pl-3 tw-pr-12 tw-text-sm tw-text-iron-100 placeholder:tw-text-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50"
              />
              <ComboboxButton className="tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-w-11 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-r-lg tw-border-0 tw-bg-transparent tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed">
                <ChevronDownIcon aria-hidden="true" className="tw-size-4" />
              </ComboboxButton>
            </div>
            <ComboboxOptions
              anchor="bottom start"
              modal={false}
              className="tailwind-scope tw-z-50 tw-max-h-64 tw-w-[var(--input-width)] tw-overflow-auto tw-rounded-lg tw-bg-iron-900 tw-p-1 tw-text-sm tw-text-iron-100 tw-shadow-lg tw-ring-1 tw-ring-white/10 [--anchor-gap:0.5rem] [--anchor-max-height:16rem] focus:tw-outline-none"
            >
              {filtered.length === 0 ? (
                <ComboboxOption
                  value={null}
                  disabled
                  className="tw-px-3 tw-py-3 tw-text-iron-400"
                >
                  <span>
                    {t(
                      locale,
                      definitions.length === 0
                        ? "collect.goal.noDefinitions"
                        : "collect.goal.noMatches"
                    )}
                  </span>
                </ComboboxOption>
              ) : (
                filtered.map((definition) => (
                  <ComboboxOption
                    key={definition.id}
                    value={definition}
                    className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 tw-rounded-md tw-px-3 tw-py-2 data-[focus]:tw-bg-iron-800"
                  >
                    {({ selected: isSelected }) => (
                      <>
                        <span className="tw-min-w-0 tw-break-words">
                          {definition.label}
                        </span>
                        {isSelected && (
                          <CheckIcon
                            aria-hidden="true"
                            className="tw-size-4 tw-shrink-0 tw-text-iron-300"
                          />
                        )}
                      </>
                    )}
                  </ComboboxOption>
                ))
              )}
            </ComboboxOptions>
            <span role="status" className="tw-sr-only">
              {open && filtered.length === 0 ? emptyMessage : ""}
            </span>
          </>
        )}
      </Combobox>
    </Field>
  );
}
