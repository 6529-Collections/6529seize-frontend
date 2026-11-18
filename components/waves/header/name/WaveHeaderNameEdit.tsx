"use client";

import { useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import PencilIcon, {
  PencilIconSize,
} from "@/components/utils/icons/PencilIcon";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import IconButton from "@/components/utils/button/IconButton";
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
      <IconButton
        type="button"
        layout="edit-wave-name"
        onClick={() => setIsEditNameOpen(true)}
        aria-label={t(locale, "waves.header.nameEditLabel")}
        aria-expanded={isEditNameOpen}
        aria-haspopup="dialog"
      >
        <PencilIcon size={PencilIconSize.SMALL} />
      </IconButton>
      <WaveHeaderNameEditModal
        isOpen={isEditNameOpen}
        wave={wave}
        onClose={() => setIsEditNameOpen(false)}
      />
    </div>
  );
}
