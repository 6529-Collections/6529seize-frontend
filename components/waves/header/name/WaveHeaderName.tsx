"use client";

import { useWaveConfiguration } from "@/hooks/waves/useWaveConfiguration";
import Link from "next/link";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useContext, useRef } from "react";
import { AuthContext } from "@/components/auth/Auth";
import WaveHeaderNameEdit from "./WaveHeaderNameEdit";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import { getWavePathRoute } from "@/helpers/navigation.helpers";
import WaveParentNavigation from "../WaveParentNavigation";
import {
  useWaveInformationPanel,
  WAVE_NAME_EDIT_VIEW,
} from "@/components/brain/mobile/WaveInformationPanelContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

const NAME_CLASS_NAME =
  "tw-m-0 tw-truncate tw-text-lg tw-font-semibold tw-leading-normal tw-tracking-tight tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out desktop-hover:group-hover:tw-text-iron-400";

export default function WaveHeaderName({
  wave: source,
}: {
  readonly wave: ApiWave;
}) {
  const wave = useWaveConfiguration(source);
  const locale = useBrowserLocale();
  const nameRef = useRef<HTMLButtonElement>(null);
  const panel = useWaveInformationPanel(
    t(locale, "waves.header.nameEditTitle"),
    WAVE_NAME_EDIT_VIEW
  );
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const isDirectMessage = wave.chat.scope.group?.is_direct_message ?? false;
  const showEdit =
    !isDirectMessage &&
    canEditWave({ connectedProfile, activeProfileProxy, wave });

  return (
    <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col">
      <WaveParentNavigation parentWave={wave.parent_wave} />
      <div className="tw-group tw-flex tw-min-w-0 tw-items-start tw-gap-x-2">
        {showEdit && panel.isInSheet ? (
          <h1 className="tw-m-0 tw-min-w-0 tw-flex-1">
            <button
              ref={nameRef}
              type="button"
              onClick={() => panel.open(nameRef.current)}
              title={t(locale, "waves.header.nameEditLabel")}
              aria-expanded={panel.isOpen}
              aria-controls={panel.contentId}
              className={`${NAME_CLASS_NAME} tw-block tw-w-full tw-cursor-pointer tw-rounded tw-border-0 tw-bg-transparent tw-p-0 tw-text-left focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400`}
            >
              {wave.name}
            </button>
          </h1>
        ) : (
          <Link
            href={getWavePathRoute(wave.id)}
            className="tw-block tw-min-w-0 tw-flex-1 tw-no-underline"
          >
            <h1 className={NAME_CLASS_NAME}>{wave.name}</h1>
          </Link>
        )}
        {showEdit && (
          <div className="tw-mt-[7px] tw-size-4 tw-shrink-0">
            <WaveHeaderNameEdit wave={wave} />
          </div>
        )}
      </div>
    </div>
  );
}
