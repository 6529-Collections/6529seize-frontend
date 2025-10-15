"use client";

import { useId } from "react";

import { ProfileActivityFilterTargetType } from "@/enums";

export { ProfileActivityFilterTargetType } from "@/enums";
export {
  ProfileActivityFilterTargetType as FilterTargetType,
} from "@/enums";

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
