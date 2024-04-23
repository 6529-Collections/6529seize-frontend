import { RadioGroup } from "@headlessui/react";
import { ProxyTargetType } from "../../../../../../entities/IProxy";

const TARGET_TYPE_LABEL: Record<ProxyTargetType, string> = {
  [ProxyTargetType.PROFILE]: "Profile",
  [ProxyTargetType.WAVE]: "Wave",
};

export default function ProxyCreateTargetSelectType({
  selectedTargetType,
  setSelectedTargetType,
}: {
  readonly selectedTargetType: ProxyTargetType;
  readonly setSelectedTargetType: (targetType: ProxyTargetType) => void;
}) {
  const targetTypes = Object.values(ProxyTargetType).map((t) => ({
    label: TARGET_TYPE_LABEL[t],
    value: t,
  }));

  return (
    <RadioGroup value={selectedTargetType} onChange={setSelectedTargetType}>
      <RadioGroup.Label className="tw-text-base tw-font-semibold tw-leading-6 tw-text-gray-300">
        Select a target
      </RadioGroup.Label>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-y-6 sm:tw-grid-cols-3 sm:tw-gap-x-4">
        {targetTypes.map((target) => (
          <RadioGroup.Option
            key={target.value}
            value={target.value}
            className={({ active }) =>
              `${
                active
                  ? "tw-border-indigo-600 tw-ring-2 tw-ring-indigo-600"
                  : "tw-border-gray-300"
              } tw-relative tw-flex tw-cursor-pointer tw-rounded-lg tw-border tw-bg-white tw-p-4 tw-shadow-sm focus:tw-outline-none`
            }
          >
            {({ checked, active }) => (
              <>
                <span className="tw-flex tw-flex-1">
                  <span className="tw-flex tw-flex-col">
                    <RadioGroup.Label
                      as="span"
                      className="tw-block tw-text-sm tw-font-medium tw-text-gray-900"
                    >
                      {target.label}
                    </RadioGroup.Label>
                    <RadioGroup.Description
                      as="span"
                      className="tw-mt-1 tw-flex tw-items-center tw-text-sm tw-text-gray-500"
                    >
                      Description
                    </RadioGroup.Description>
                  </span>
                </span>
                <div
                  className={`${
                    checked
                      ? "tw-h-5 tw-w-5 tw-text-indigo-600"
                      : "tw-invisible"
                  }`}
                >
                  icon
                </div>
                <span
                  className={`${active ? "tw-border" : "tw-border-2"} ${
                    checked ? "tw-border-indigo-600" : "tw-border-transparent"
                  } tw-pointer-events-none tw-absolute -tw-inset-px tw-rounded-lg`}
                  aria-hidden="true"
                />
              </>
            )}
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  );
}
