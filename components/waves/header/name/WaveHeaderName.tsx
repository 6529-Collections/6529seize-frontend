"use client";

import Link from "next/link";
import { useContext, useEffect, useState } from "react";

import { AuthContext } from "@/components/auth/Auth";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getWavePathRoute } from "@/helpers/navigation.helpers";
import { canEditWave } from "@/helpers/waves/waves.helpers";

import WaveHeaderNameEdit from "./WaveHeaderNameEdit";

export default function WaveHeaderName({ wave }: { readonly wave: ApiWave }) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const getShowEdit = () =>
    canEditWave({ connectedProfile, activeProfileProxy, wave });

  const [showEdit, setShowEdit] = useState(getShowEdit());
  useEffect(() => setShowEdit(getShowEdit()), [connectedProfile, wave]);
  return (
    <div className="tw-group tw-flex tw-items-start tw-space-x-2">
      <Link href={getWavePathRoute(wave.id)} className="tw-no-underline">
        <h1 className="tw-mb-0 tw-text-lg tw-font-semibold tw-tracking-tight tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out desktop-hover:group-hover:tw-text-iron-400 sm:tw-text-xl">
          {wave.name}
        </h1>
      </Link>
      {showEdit && (
        <div className="tw-mt-[7px] tw-size-4">
          <WaveHeaderNameEdit wave={wave} />
        </div>
      )}
    </div>
  );
}
