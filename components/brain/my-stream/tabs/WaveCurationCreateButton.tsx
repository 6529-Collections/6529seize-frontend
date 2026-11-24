"use client";

import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { WAVE_HEADER_MOBILE_TEXT_ACTION_SURFACE_CLASSES } from "@/components/brain/left-sidebar/waves/WaveHeaderActions";
import {
  COMPACT_ACTION_BUTTON_CLASS,
  COMPACT_ACTION_TOUCH_TARGET_CLASS,
} from "@/components/utils/button/compactActionButtonStyles";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import MyStreamWaveCurationCreateDialog from "./MyStreamWaveCurationCreateDialog";

export default function WaveCurationCreateButton({
  wave,
  onCreated,
}: {
  readonly wave: ApiWave;
  readonly onCreated: (curationId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const locale = useBrowserLocale();
  if (wave.wave.authenticated_user_eligible_for_admin !== true) return null;

  return (
    <>
      <button
        type="button"
        className={`${COMPACT_ACTION_BUTTON_CLASS} ${COMPACT_ACTION_TOUCH_TARGET_CLASS} tw-h-8`}
        aria-label={t(locale, "waves.create.actions.newCuration")}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <span className={WAVE_HEADER_MOBILE_TEXT_ACTION_SURFACE_CLASSES}>
          <PlusIcon
            className="-tw-ml-1 tw-size-4 tw-shrink-0"
            aria-hidden="true"
          />
          <span>{t(locale, "waves.create.actions.curation")}</span>
        </span>
      </button>
      {isOpen && (
        <MyStreamWaveCurationCreateDialog
          mobileSheet
          wave={wave}
          isOpen
          onClose={() => setIsOpen(false)}
          onSaved={(curation) => onCreated(curation.id)}
        />
      )}
    </>
  );
}
