import Link from "next/link";
import { Wave } from "../../../../../generated/models/Wave";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../../auth/Auth";
import WaveHeaderNameEdit from "./WaveHeaderNameEdit";
import { canEditWave } from "../../../../../helpers/waves/waves.helpers";

export default function WaveHeaderName({ wave }: { readonly wave: Wave }) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const getShowEdit = () =>
    canEditWave({ connectedProfile, activeProfileProxy, wave });

  const [showEdit, setShowEdit] = useState(getShowEdit());
  useEffect(() => setShowEdit(getShowEdit()), [connectedProfile, wave]);
  return (
    <div className="tw-group tw-flex tw-items-center tw-space-x-2">
      <Link href={`/waves/${wave.id}`} className="tw-no-underline">
        <h1 className="tw-truncate tw-text-xl sm:tw-text-2xl tw-font-semibold tw-text-white hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out">
          {wave.name}
        </h1>
      </Link>
      {showEdit && <WaveHeaderNameEdit wave={wave} />}
    </div>
  );
}
