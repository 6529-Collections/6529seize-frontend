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
            className="tw-border-none tw-bg-transparent tw-p-0 tw-items-center group-hover:tw-block tw-hidden"
          >
            {mutating ? (
              <CircleLoader />
            ) : (
              <svg
                className="tw-flex-shrink-0 tw-size-5 tw-text-red tw-transition tw-duration-300 tw-ease-out hover:tw-scale-110"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 9L9 15M9 9L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
