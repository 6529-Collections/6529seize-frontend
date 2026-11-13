import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { dropForgeIconButtonClassName } from "../drop-forge-section-styles";

const topics = [
  ["dropForge.settings.launch", "dropForge.settings.helpLaunch"],
  ["dropForge.settings.preparation", "dropForge.settings.helpPreparation"],
  ["dropForge.settings.artist", "dropForge.settings.helpPayment"],
  ["dropForge.settings.helpTimingTitle", "dropForge.settings.helpTiming"],
  ["dropForge.settings.helpOpsTitle", "dropForge.settings.helpOps"],
] as const;

export default function LaunchAutomationHelp() {
  const locale = useBrowserLocale();
  const title = t(locale, "dropForge.settings.helpTitle");

  return (
    <Popover>
      <PopoverButton
        as={Button}
        variant="secondary"
        className={dropForgeIconButtonClassName}
        aria-label={title}
      >
        <InformationCircleIcon aria-hidden="true" className="tw-size-5" />
      </PopoverButton>
      <PopoverPanel
        anchor={{ to: "bottom end", gap: 8, padding: 16 }}
        role="region"
        aria-label={title}
        className="tailwind-scope tw-z-[1030] tw-w-96 tw-max-w-[calc(100vw-2rem)] tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4 tw-shadow-xl"
      >
        <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
          {title}
        </h3>
        <dl className="tw-mb-0 tw-mt-3 tw-space-y-3 tw-text-sm tw-leading-5">
          {topics.map(([label, description]) => (
            <div key={label}>
              <dt className="tw-font-medium tw-text-iron-100">
                {t(locale, label)}
              </dt>
              <dd className="tw-m-0 tw-text-iron-300">
                {t(locale, description)}
              </dd>
            </div>
          ))}
        </dl>
      </PopoverPanel>
    </Popover>
  );
}
