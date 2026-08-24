"use client";

import { useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import PencilIcon, {
  PencilIconSize,
} from "@/components/utils/icons/PencilIcon";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import WaveHeaderNameEditModal from "./WaveHeaderNameEditModal";

export default function WaveHeaderNameEdit({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const locale = useBrowserLocale();

  return (
    <div>
      {/* Hidden by opacity rather than `display`, and revealed by hover, focus
          and `touch-only` alike: renaming a wave has no other entry point in
          the app, so this control must stay reachable by every input. */}
      <button
        type="button"
        onClick={() => setIsEditNameOpen(true)}
        aria-label={t(locale, "waves.header.nameEditLabel")}
        aria-expanded={isEditNameOpen}
        aria-haspopup="dialog"
        className="tw-pointer-events-none tw-flex tw-items-center tw-border-none tw-bg-transparent tw-p-0 tw-text-iron-300 tw-opacity-0 tw-transition-all tw-duration-300 tw-ease-out focus:tw-outline-none focus-visible:tw-pointer-events-auto focus-visible:tw-opacity-100 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:group-hover:tw-pointer-events-auto desktop-hover:group-hover:tw-opacity-100 desktop-hover:hover:tw-text-iron-400 touch-only:tw-pointer-events-auto touch-only:tw-opacity-100"
      >
        <PencilIcon size={PencilIconSize.SMALL} />
      </button>
      <WaveHeaderNameEditModal
        isOpen={isEditNameOpen}
        wave={wave}
        onClose={() => setIsEditNameOpen(false)}
      />
    </div>
  );
}
