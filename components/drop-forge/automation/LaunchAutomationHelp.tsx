import { useState } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
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
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <Button
        variant="secondary"
        className={dropForgeIconButtonClassName}
        aria-label={title}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <InformationCircleIcon aria-hidden="true" className="tw-size-5" />
      </Button>
      <Dialog
        open={open}
        onClose={close}
        className="tailwind-scope tw-relative tw-z-[1100]"
      >
        <DialogBackdrop className="tw-fixed tw-inset-0 tw-bg-black/70" />
        <div className="tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center tw-p-4 sm:tw-p-6">
          <DialogPanel className="tw-flex tw-max-h-full tw-w-full tw-max-w-2xl tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-shadow-2xl">
            <header className="tw-flex tw-shrink-0 tw-items-center tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 sm:tw-px-6 sm:tw-py-4">
              <DialogTitle className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50 sm:tw-text-xl">
                {title}
              </DialogTitle>
              <Button variant="secondary" onClick={close} data-autofocus>
                {t(locale, "common.close")}
              </Button>
            </header>
            <dl className="tw-m-0 tw-min-h-0 tw-space-y-4 tw-overflow-y-auto tw-overscroll-contain tw-p-4 tw-text-base tw-leading-6 sm:tw-p-6">
              {topics.map(([label, description]) => (
                <div key={label}>
                  <dt className="tw-font-semibold tw-text-iron-100">
                    {t(locale, label)}
                  </dt>
                  <dd className="tw-m-0 tw-mt-1 tw-text-iron-300">
                    {t(locale, description)}
                  </dd>
                </div>
              ))}
            </dl>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
