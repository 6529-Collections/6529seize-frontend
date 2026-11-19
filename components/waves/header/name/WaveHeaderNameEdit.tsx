"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";
import {
  useWaveInformationPanel,
  WAVE_NAME_EDIT_VIEW,
} from "@/components/brain/mobile/WaveInformationPanelContext";
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
  const locale = useBrowserLocale();
  const panel = useWaveInformationPanel(
    t(locale, "waves.header.nameEditTitle"),
    WAVE_NAME_EDIT_VIEW
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const editor = (
    <WaveHeaderNameEditModal
      isOpen={panel.isOpen}
      wave={wave}
      onClose={panel.close}
      embedded={panel.isInSheet}
    />
  );

  return (
    <div>
      {/* Keep the pencil reachable through hover, focus and touch alike. */}
      <IconButton
        ref={triggerRef}
        type="button"
        layout="edit-wave-name"
        onClick={() => panel.open(triggerRef.current)}
        aria-label={t(locale, "waves.header.nameEditLabel")}
        aria-expanded={panel.isOpen}
        aria-controls={panel.isInSheet ? panel.contentId : undefined}
        aria-haspopup={panel.isInSheet ? undefined : "dialog"}
      >
        <PencilIcon size={PencilIconSize.SMALL} />
      </IconButton>
      {panel.isInSheet
        ? panel.isOpen &&
          panel.container &&
          createPortal(editor, panel.container)
        : editor}
    </div>
  );
}
