"use client";

import { useId } from "react";

import { ProfileActivityFilterTargetType } from "@/types/enums";

const TARGETS = [
  { id: ProfileActivityFilterTargetType.ALL, name: "All" },
  { id: ProfileActivityFilterTargetType.OUTGOING, name: "Outgoing" },
  { id: ProfileActivityFilterTargetType.INCOMING, name: "Incoming" },
];

export default function CommonFilterTargetSelect({
  selected,
  onChange,
}: {
  readonly selected: ProfileActivityFilterTargetType;
  readonly onChange: (filter: ProfileActivityFilterTargetType) => void;
}) {
  const baseId = useId().replaceAll(":", "");
  const groupName = `filter-target-${baseId}`;

  return (
    <fieldset className="tw-mt-6 tw-max-w-sm tw-px-4 sm:tw-px-6">
      <legend className="tw-mb-2 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-300 sm:tw-text-md">
        Filter target
      </legend>
      <div className="tw-flex tw-items-center tw-space-x-6 tw-space-y-0">
        {TARGETS.map((target) => {
          const inputId = `${groupName}-${target.id}`;

          return (
            <div key={target.id} className="tw-flex tw-items-center">
              <input
                id={inputId}
                name={groupName}
                type="radio"
                checked={selected === target.id}
                onChange={() => onChange(target.id)}
                className="tw-form-radio tw-h-4 tw-w-4 tw-cursor-pointer tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-700 tw-text-primary-400 tw-ring-offset-iron-800 focus:tw-ring-2 focus:tw-ring-primary-400"
              />
              <label
                htmlFor={inputId}
                className="tw-ml-2 tw-block tw-cursor-pointer tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-300 sm:tw-text-md"
              >
                {target.name}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
