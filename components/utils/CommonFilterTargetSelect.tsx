"use client";

import { useId } from "react";

export enum FilterTargetType {
  ALL = "ALL",
  INCOMING = "INCOMING",
  OUTGOING = "OUTGOING",
}

const TARGETS = [
  { id: FilterTargetType.ALL, name: "All" },
  { id: FilterTargetType.OUTGOING, name: "Outgoing" },
  { id: FilterTargetType.INCOMING, name: "Incoming" },
];

export default function CommonFilterTargetSelect({
  selected,
  onChange,
}: {
  readonly selected: FilterTargetType;
  readonly onChange: (filter: FilterTargetType) => void;
}) {
  const baseId = useId().replaceAll(":", "");
  const groupName = `filter-target-${baseId}`;

  return (
    <fieldset className="tw-px-4 sm:tw-px-6 tw-mt-6 tw-max-w-sm">
      <legend className="tw-mb-2 tw-text-sm sm:tw-text-md tw-font-medium tw-leading-6 tw-text-iron-300">
        Filter target
      </legend>
      <div className="tw-flex tw-items-center tw-space-x-6 tw-space-y-0">
        {TARGETS.map((target) => {
          const inputId = `${groupName}-${target.id}`;

          return (
            <div
              key={target.id}
              className="tw-flex tw-items-center tw-bg-iron-900">
              <input
                id={inputId}
                name={groupName}
                type="radio"
                checked={selected === target.id}
                onChange={() => onChange(target.id)}
                className="tw-form-radio tw-h-4 tw-w-4 tw-bg-iron-700 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
              />
              <label
                htmlFor={inputId}
                className="tw-ml-2 tw-block tw-text-sm sm:tw-text-md tw-font-medium tw-leading-6 tw-text-iron-300 tw-cursor-pointer">
                {target.name}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
