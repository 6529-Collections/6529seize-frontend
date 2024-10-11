import { useContext, useEffect, useState } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ApiWaveParticipationRequirement } from "../../../../generated/models/ApiWaveParticipationRequirement";
import { AuthContext } from "../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../services/api/common-api";
import {
  canEditWave,
  convertWaveToUpdateWave,
} from "../../../../helpers/waves/waves.helpers";
import CircleLoader from "../../../distribution-plan-tool/common/CircleLoader";
import { ApiUpdateWaveRequest } from "../../../../generated/models/ApiUpdateWaveRequest";

export default function WaveRequiredType({
  wave,
  type,
}: {
  readonly wave: ApiWave;
  readonly type: ApiWaveParticipationRequirement;
}) {
  const { setToast, requestAuth, connectedProfile, activeProfileProxy } =
    useContext(AuthContext);

  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const LABELS: Record<ApiWaveParticipationRequirement, string> = {
    [ApiWaveParticipationRequirement.Image]: "Image",
    [ApiWaveParticipationRequirement.Audio]: "Audio",
    [ApiWaveParticipationRequirement.Video]: "Video",
  };

  const getShowEdit = () =>
    canEditWave({ connectedProfile, activeProfileProxy, wave });

  const [showEdit, setShowEdit] = useState(getShowEdit());

  useEffect(() => setShowEdit(getShowEdit()), [connectedProfile, wave]);

  const isRequired = wave.participation.required_media.includes(type);
  const requiredLabel = isRequired ? "required" : "optional";

  const [mutating, setMutating] = useState(false);

  const changeRequiredTypeMutation = useMutation({
    mutationFn: async (body: ApiUpdateWaveRequest) =>
      await commonApiPost<ApiUpdateWaveRequest, ApiWave>({
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
    const originalBody = convertWaveToUpdateWave(wave);
    const types = isRequired
      ? wave.participation.required_media.filter((t) => t !== type)
      : [...wave.participation.required_media, type];

    const body: ApiUpdateWaveRequest = {
      ...originalBody,
      participation: {
        ...originalBody.participation,
        required_media: types,
      },
    };
    await changeRequiredTypeMutation.mutateAsync(body);
  };

  return (
    <div className="tw-group tw-text-sm">
      <div className="tw-flex tw-w-full tw-justify-between">
        <div className="tw-inline-flex tw-items-center">
          {type === ApiWaveParticipationRequirement.Image && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
              className="tw-mr-2 tw-flex-shrink-0 tw-size-5 tw-text-iron-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
          )}
          {type === ApiWaveParticipationRequirement.Audio && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
              className="tw-mr-2 tw-flex-shrink-0 tw-size-5 tw-text-iron-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z"
              />
            </svg>
          )}
          {type === ApiWaveParticipationRequirement.Video && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="tw-mr-2 tw-flex-shrink-0 tw-size-5 tw-text-iron-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0 1 18 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 0 1 6 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5"
              />
            </svg>
          )}

          <span
            className={`tw-font-medium tw-text-iron-400 ${
              isRequired ? "tw-text-yellow-400" : ""
            }`}
          >
            {LABELS[type]}:
          </span>
          <span className="tw-pl-1 tw-font-medium tw-text-white">
            {requiredLabel}
          </span>
        </div>
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
