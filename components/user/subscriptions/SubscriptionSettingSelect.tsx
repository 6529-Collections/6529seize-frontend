"use client";

import { useId, useState, type ReactNode } from "react";
import {
  Description,
  Field,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

interface SettingOption {
  readonly value: boolean;
  readonly label: string;
  readonly description: string;
}

export default function SubscriptionSettingSelect({
  label,
  layout = "row",
  labelNote,
  detail,
  value,
  valueLabel,
  options,
  disabled,
  busy,
  onChange,
}: Readonly<{
  label: string;
  layout?: "row" | "inline";
  labelNote?: ReactNode;
  detail?: string | undefined;
  value: boolean;
  valueLabel?: string | undefined;
  options: readonly SettingOption[];
  disabled: boolean;
  busy: boolean;
  onChange: (value: boolean) => void;
}>) {
  const id = useId();
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false);
  const selected = options.find((option) => option.value === value);
  const detailContent = detail && (
    <Description
      as="span"
      id={`${id}-detail`}
      aria-hidden="true"
      className={`tw-block tw-text-[13px] tw-font-normal tw-tabular-nums tw-text-iron-400 ${layout === "inline" ? "tw-col-span-2 tw-text-right xl:tw-col-span-1 xl:tw-col-start-2 xl:tw-text-left" : "tw-mt-1"}`}
    >
      {detail}
    </Description>
  );

  return (
    <Field className="tw-min-w-0">
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <ListboxButton
          type="button"
          onPointerDown={(event) => {
            setIsKeyboardNavigation(false);
            // Open on click so keyboard activation still works after mouse use.
            event.preventDefault();
          }}
          onKeyDown={(event) => {
            setIsKeyboardNavigation(true);
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.click();
            }
          }}
          aria-labelledby={`${id}-label ${id}-value`}
          aria-describedby={detail ? `${id}-detail` : undefined}
          aria-busy={busy}
          className={`tw-group tw-border-0 tw-bg-transparent tw-text-left tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed motion-reduce:tw-transition-none ${layout === "inline" ? "tw-grid tw-min-h-11 tw-w-full tw-max-w-full tw-grid-cols-[minmax(0,1fr)_auto] tw-items-baseline tw-gap-x-3 tw-gap-y-2 tw-rounded-lg tw-px-0 tw-py-4 desktop-hover:hover:tw-text-iron-100 xl:tw-w-auto xl:tw-grid-cols-[auto_minmax(0,1fr)] xl:tw-gap-y-1 xl:tw-py-2" : "tw-flex tw-min-h-[60px] tw-w-full tw-items-center tw-justify-between tw-gap-4 tw-px-5 tw-py-3 focus-visible:tw-ring-inset desktop-hover:hover:tw-bg-iron-900/40 disabled:desktop-hover:hover:tw-bg-transparent max-md:tw-px-4 max-sm:tw-flex-wrap max-sm:tw-gap-2"}`}
        >
          <span className="tw-min-w-0">
            <span
              className={`tw-flex tw-gap-x-2 tw-gap-y-1 ${layout === "inline" ? "tw-flex-col tw-items-start xl:tw-flex-row xl:tw-flex-wrap xl:tw-items-center" : "tw-flex-wrap tw-items-center"}`}
            >
              <span
                id={`${id}-label`}
                className={
                  layout === "inline"
                    ? "tw-text-sm tw-font-normal tw-text-iron-400"
                    : "tw-text-[15px] tw-font-medium tw-text-iron-100"
                }
              >
                {label}
              </span>
              {labelNote}
            </span>
          </span>
          <span
            className={`tw-flex tw-min-w-0 tw-items-start tw-gap-2 tw-text-sm tw-font-normal ${detail ? "tw-flex-1" : "tw-shrink-0"} ${layout === "inline" ? "tw-justify-end tw-text-right tw-text-iron-100 xl:tw-justify-start xl:tw-text-left" : "tw-ml-auto tw-text-iron-400"}`}
          >
            <span className="tw-min-w-0">
              <span id={`${id}-value`} className="tw-block">
                {valueLabel ?? selected?.label}
              </span>
              {layout !== "inline" && detailContent}
            </span>
            <ChevronDownIcon
              aria-hidden="true"
              className={`tw-mt-0.5 tw-size-4 tw-shrink-0 tw-transition-transform group-data-[open]:tw-rotate-180 motion-reduce:tw-transition-none ${layout === "inline" ? "max-xl:group-disabled:tw-hidden" : ""}`}
            />
          </span>
          {layout === "inline" && detailContent}
        </ListboxButton>
        <ListboxOptions
          aria-label={label}
          anchor={layout === "inline" ? "bottom start" : "bottom end"}
          modal={false}
          data-keyboard={isKeyboardNavigation ? "" : undefined}
          onKeyDown={() => setIsKeyboardNavigation(true)}
          onPointerMove={() => setIsKeyboardNavigation(false)}
          className="tailwind-scope tw-group/settings-options tw-z-[1020] tw-max-h-80 tw-w-[min(22rem,calc(100vw-2rem))] tw-overflow-auto tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-p-1.5 tw-shadow-2xl [--anchor-gap:0.25rem] [--anchor-padding:0.5rem] focus:tw-outline-none"
        >
          {options.map((option) => (
            <ListboxOption
              key={String(option.value)}
              value={option.value}
              aria-labelledby={`${id}-${option.value}-label`}
              aria-describedby={`${id}-${option.value}-description`}
              className="tw-cursor-pointer tw-rounded-lg tw-p-3 tw-text-sm group-data-[keyboard]/settings-options:data-[focus]:tw-bg-iron-800 group-data-[keyboard]/settings-options:data-[focus]:tw-ring-2 group-data-[keyboard]/settings-options:data-[focus]:tw-ring-inset group-data-[keyboard]/settings-options:data-[focus]:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-800"
            >
              {({ selected: isSelected }) => (
                <>
                  <span className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-font-medium tw-text-iron-100">
                    <span id={`${id}-${option.value}-label`}>
                      {option.label}
                    </span>
                    {isSelected && (
                      <CheckIcon
                        aria-hidden="true"
                        className="tw-size-4 tw-shrink-0"
                      />
                    )}
                  </span>
                  <span
                    id={`${id}-${option.value}-description`}
                    className="tw-mt-1 tw-block tw-font-normal tw-leading-5 tw-text-iron-400"
                  >
                    {option.description}
                  </span>
                </>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    </Field>
  );
}
