import { useContext, useEffect, useState } from "react";
import { Wave } from "../../../../generated/models/Wave";
import { WaveParticipationRequirement } from "../../../../generated/models/WaveParticipationRequirement";
import { AuthContext } from "../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import { CreateNewWave } from "../../../../generated/models/CreateNewWave";
import { commonApiPost } from "../../../../services/api/common-api";
import { convertWaveToCreateNewWave } from "../../../../helpers/waves/waves.helpers";
import CircleLoader from "../../../distribution-plan-tool/common/CircleLoader";

export default function WaveRequiredType({
  wave,
  type,
}: {
  readonly wave: Wave;
  readonly type: WaveParticipationRequirement;
}) {
  const { setToast, requestAuth, connectedProfile, activeProfileProxy } =
    useContext(AuthContext);

  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const LABELS: Record<WaveParticipationRequirement, string> = {
    [WaveParticipationRequirement.Image]: "Image",
    [WaveParticipationRequirement.Audio]: "Audio",
    [WaveParticipationRequirement.Video]: "Video",
  };

  const getShowEdit = () => {
    if (!connectedProfile?.profile?.handle) {
      return false;
    }
    if (!!activeProfileProxy) {
      return false;
    }
    if (wave.author.handle === connectedProfile.profile.handle) {
      return true;
    }
    if (!!wave.wave.authenticated_user_eligible_for_admin) {
      return true;
    }
    return false;
  };

  const [showEdit, setShowEdit] = useState(getShowEdit());

  useEffect(() => setShowEdit(getShowEdit()), [connectedProfile, wave]);

  const isRequired = wave.participation.required_media.includes(type);
  const requiredLabel = isRequired ? "Required" : "Optional";

  const [mutating, setMutating] = useState(false);

  const changeRequiredTypeMutation = useMutation({
    mutationFn: async (body: CreateNewWave) =>
      await commonApiPost<CreateNewWave, Wave>({
        endpoint: `waves/${wave.id}`,
        body,
      }),
    onSuccess: () => {
      onWaveCreated();
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const onChangeRequiresType = async () => {
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setToast({
        type: "error",
        message: "Failed to authenticate",
      });
      setMutating(false);
      return;
    }
    const originalBody = convertWaveToCreateNewWave(wave);
    const types = isRequired
      ? wave.participation.required_media.filter((t) => t !== type)
      : [...wave.participation.required_media, type];

    const body: CreateNewWave = {
      ...originalBody,
      participation: {
        ...originalBody.participation,
        required_media: types,
      },
    };
    await changeRequiredTypeMutation.mutateAsync(body);
  };

  return (
    <div className="tw-group tw-text-sm tw-flex tw-flex-col">
      <div className="tw-inline-flex tw-items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          className="tw-mr-2 tw-flex-shrink-0 tw-size-5 tw-text-iron-300"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>

        <span className="tw-font-medium tw-text-iron-400">{LABELS[type]}</span>
      </div>
      <div className="tw-flex tw-w-full tw-justify-between">
        <span className="tw-font-medium tw-text-white tw-text-md">
          {requiredLabel}
        </span>
        {showEdit && (
          <div className="tw-flex tw-h-6 tw-items-center">
            {mutating ? (
              <CircleLoader />
            ) : (
              <input
                type="checkbox"
                checked={isRequired}
                disabled={mutating}
                onChange={onChangeRequiresType}
                className="tw-form-checkbox tw-w-4 tw-h-4 sm:tw-w-5 sm:tw-h-5 tw-rounded tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
