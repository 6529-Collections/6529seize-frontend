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
      <RadioGroup.Label className="tw-float-none tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
        Select a target
      </RadioGroup.Label>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-y-6 sm:tw-grid-cols-3 sm:tw-gap-x-4">
        {targetTypes.map((target) => (
          <RadioGroup.Option
            key={target.value}
            value={target.value}
            className={({ checked }) =>
              `${
                checked
                  ? "tw-ring-primary-400"
                  : "tw-ring-iron-700 hover:tw-ring-iron-600"
              } tw-relative tw-flex tw-cursor-pointer tw-rounded-lg tw-border tw-bg-[#232329] tw-p-4 tw-shadow-sm focus:tw-outline-none tw-ring-1 tw-ring-inset tw-transition tw-duration300 tw-ease-out`
            }
          >
            {({ checked, active }) => (
              <>
                <span className="tw-flex tw-flex-1">
                  <span className="tw-flex tw-flex-col">
                    <RadioGroup.Label
                      as="span"
                      className="tw-block tw-text-base tw-font-medium tw-text-iron-50"
                    >
                      {target.label}
                    </RadioGroup.Label>
                    <RadioGroup.Description
                      as="span"
                      className="tw-mt-1 tw-flex tw-items-center tw-text-md tw-text-iron-500"
                    >
                      Description
                    </RadioGroup.Description>
                  </span>
                </span>
                <div
                  className={`${
                    checked
                      ? "tw-h-5 tw-w-5 tw-text-primary-400"
                      : "tw-invisible"
                  }`}
                >
                  <svg
                    className="tw-h-5 tw-w-5"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
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
