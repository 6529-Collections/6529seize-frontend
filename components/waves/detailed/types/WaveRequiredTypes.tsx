import { useContext, useEffect, useState } from "react";
import { Wave } from "../../../../generated/models/Wave";
import { WaveParticipationRequirement } from "../../../../generated/models/WaveParticipationRequirement";
import WaveRequiredType from "./WaveRequiredType";
import { AuthContext } from "../../../auth/Auth";

export default function WaveRequiredTypes({ wave }: { readonly wave: Wave }) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const getIsAuthorAndNotProxy = () =>
    connectedProfile?.profile?.handle === wave.author.handle &&
    !activeProfileProxy;

  const [isAuthorAndNotProxy, setIsAuthorAndNotProxy] = useState(
    getIsAuthorAndNotProxy()
  );

  useEffect(
    () => setIsAuthorAndNotProxy(getIsAuthorAndNotProxy()),
    [connectedProfile, wave]
  );

  const getTypesToShow = () => {
    const values = Object.values(WaveParticipationRequirement);
    if (isAuthorAndNotProxy) {
      return values;
    }
    return values.filter((type) =>
      wave.participation.required_media.includes(type)
    );
  };

  const [types, setTypes] = useState(getTypesToShow());

  useEffect(() => setTypes(getTypesToShow()), [wave, isAuthorAndNotProxy]);

  return (
    <div className="tw-w-full">
      <div>
        <div className="tw-bg-iron-900 tw-relative tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl">
          <div className="tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
            <div className="tw-px-6 tw-pt-4 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
              <p className="tw-mb-0 tw-text-lg tw-text-white tw-font-semibold tw-tracking-tight">
                Required Types
              </p>
            </div>
            <div className="tw-px-6 tw-py-6 tw-flex tw-flex-col tw-gap-y-2">
              {types.map((type) => (
                <WaveRequiredType key={type} wave={wave} type={type} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
