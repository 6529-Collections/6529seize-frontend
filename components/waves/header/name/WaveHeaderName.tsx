"use client";

import Link from "next/link";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useContext } from "react";
import { AuthContext } from "@/components/auth/Auth";
import WaveHeaderNameEdit from "./WaveHeaderNameEdit";
import { canEditWave, getParentWaveName } from "@/helpers/waves/waves.helpers";
import { getWavePathRoute } from "@/helpers/navigation.helpers";

export default function WaveHeaderName({ wave }: { readonly wave: ApiWave }) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const isDirectMessage = wave.chat.scope.group?.is_direct_message ?? false;
  const parentWave = wave.parent_wave;
  const parentWaveName = getParentWaveName(parentWave);
  const showEdit =
    !isDirectMessage &&
    canEditWave({ connectedProfile, activeProfileProxy, wave });

  return (
    <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-y-1">
      {parentWave && parentWaveName && (
        <nav
          aria-label="Wave hierarchy"
          className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-1.5 tw-text-xs tw-leading-5"
        >
          <span className="tw-shrink-0 tw-font-medium tw-text-iron-400">
            Subwave of
          </span>
          <Link
            href={getWavePathRoute(parentWave.id)}
            className="tw-block tw-min-w-0 tw-max-w-[50%] tw-shrink tw-truncate tw-font-medium tw-text-iron-300 tw-no-underline tw-transition tw-duration-200 tw-ease-out hover:tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
          >
            {parentWaveName}
          </Link>
        </nav>
      )}
      <div className="tw-group tw-flex tw-min-w-0 tw-items-start tw-gap-x-2">
        <Link
          href={getWavePathRoute(wave.id)}
          className="tw-block tw-min-w-0 tw-flex-1 tw-no-underline"
        >
          <h1 className="tw-mb-0 tw-truncate tw-text-lg tw-font-semibold tw-leading-normal tw-tracking-tight tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out desktop-hover:group-hover:tw-text-iron-400">
            {wave.name}
          </h1>
        </Link>
        {showEdit && (
          <div className="tw-mt-[7px] tw-size-4 tw-shrink-0">
            <WaveHeaderNameEdit wave={wave} />
          </div>
        )}
      </div>
    </div>
  );
}
