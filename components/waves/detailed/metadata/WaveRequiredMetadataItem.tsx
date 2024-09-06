import { useContext, useEffect, useState } from "react";
import { WaveRequiredMetadata } from "../../../../generated/models/WaveRequiredMetadata";
import { AuthContext } from "../../../auth/Auth";
import { Wave } from "../../../../generated/models/Wave";
import { useMutation } from "@tanstack/react-query";
import { CreateNewWave } from "../../../../generated/models/CreateNewWave";
import { commonApiPost } from "../../../../services/api/common-api";
import { ReactQueryWrapperContext } from "../../../react-query-wrapper/ReactQueryWrapper";
import { convertWaveToCreateNewWave } from "../../../../helpers/waves/waves.helpers";
import { WaveMetadataType } from "../../../../generated/models/WaveMetadataType";
import CircleLoader from "../../../distribution-plan-tool/common/CircleLoader";

export default function WaveRequiredMetadataItem({
  metadata,
  wave,
}: {
  readonly metadata: WaveRequiredMetadata;
  readonly wave: Wave;
}) {
  const TYPES: Record<WaveMetadataType, string> = {
    [WaveMetadataType.String]: "Text",
    [WaveMetadataType.Number]: "Number",
  };

  const { connectedProfile, activeProfileProxy, requestAuth, setToast } =
    useContext(AuthContext);
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const [mutating, setMutating] = useState(false);
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

  const removeMetadataMutation = useMutation({
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

  const onMetdataRemove = async () => {
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

    const metadatas = originalBody.participation.required_metadata.filter(
      (md) => md.name.toLowerCase() !== metadata.name.toLowerCase()
    );

    const body: CreateNewWave = {
      ...originalBody,
      participation: {
        ...originalBody.participation,
        required_metadata: metadatas,
      },
    };
    await removeMetadataMutation.mutateAsync(body);
  };
  return (
    <div className="tw-h-5 tw-mb-2 tw-group tw-text-sm tw-flex tw-w-full tw-justify-between">
      <div className="tw-flex tw-items-center tw-gap-x-2">
        {metadata.type === WaveMetadataType.Number ? (
          <svg
            className="tw-size-4 tw-flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 512"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M160 64c0-11.8-6.5-22.6-16.9-28.2s-23-5-32.8 1.6l-96 64C-.5 111.2-4.4 131 5.4 145.8s29.7 18.7 44.4 8.9L96 123.8V416H32c-17.7 0-32 14.3-32 32s14.3 32 32 32h96 96c17.7 0 32-14.3 32-32s-14.3-32-32-32H160V64z"
            />
          </svg>
        ) : (
          <svg
            className="tw-size-4 tw-flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 7C4 6.06812 4 5.60218 4.15224 5.23463C4.35523 4.74458 4.74458 4.35523 5.23463 4.15224C5.60218 4 6.06812 4 7 4H17C17.9319 4 18.3978 4 18.7654 4.15224C19.2554 4.35523 19.6448 4.74458 19.8478 5.23463C20 5.60218 20 6.06812 20 7M9 20H15M12 4V20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        <span className="tw-font-medium tw-text-iron-400">
          {TYPES[metadata.type]}:
          <span className="tw-pl-1 tw-font-medium tw-text-white">
            {metadata.name}
          </span>
        </span>
      </div>
      {showEdit && (
        <div>
          <button
            onClick={onMetdataRemove}
            disabled={mutating}
            title="Remove"
            className="tw-border-none tw-bg-transparent tw-p-0 tw-items-center group-hover:tw-block tw-hidden tw-text-iron-300 hover:tw-text-error tw-transition tw-duration-300 tw-ease-out"
          >
            {mutating ? (
              <CircleLoader />
            ) : (
              <svg
                className="tw-flex-shrink-0 tw-cursor-pointer tw-h-4 tw-w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
