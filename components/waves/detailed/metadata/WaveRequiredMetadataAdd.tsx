import { useContext, useState } from "react";
import { Wave } from "../../../../generated/models/Wave";
import WaveRequiredMetadataAddButton from "./WaveRequiredMetadataAddButton";
import WaveRequiredMetadataAddInput from "./WaveRequiredMetadataAddInput";
import { CreateWaveDropsRequiredMetadata } from "../../../../types/waves.types";
import { WaveMetadataType } from "../../../../generated/models/WaveMetadataType";
import { useMutation } from "@tanstack/react-query";
import { CreateNewWave } from "../../../../generated/models/CreateNewWave";
import { commonApiPost } from "../../../../services/api/common-api";
import { AuthContext } from "../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../react-query-wrapper/ReactQueryWrapper";
import { convertWaveToCreateNewWave } from "../../../../helpers/waves/waves.helpers";
import CircleLoader from "../../../distribution-plan-tool/common/CircleLoader";

enum Mode {
  IDLE = "IDLE",
  ADD = "ADD",
}

export default function WaveRequiredMetadataAdd({
  wave,
}: {
  readonly wave: Wave;
}) {
  const { setToast, requestAuth } = useContext(AuthContext);
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const [mutating, setMutating] = useState(false);
  const [mode, setMode] = useState<Mode>(Mode.IDLE);
  const [metadata, setMetadata] = useState<CreateWaveDropsRequiredMetadata>({
    key: "",
    type: WaveMetadataType.String,
  });

  const setIdleAndReset = () => {
    setMode(Mode.IDLE);
    setMetadata({
      key: "",
      type: WaveMetadataType.String,
    });
  };

  const addMetadataMutation = useMutation({
    mutationFn: async (body: CreateNewWave) =>
      await commonApiPost<CreateNewWave, Wave>({
        endpoint: `waves/${wave.id}`,
        body,
      }),
    onSuccess: () => {
      onWaveCreated();
      setIdleAndReset();
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

  const onMetadataAdd = async () => {
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
      (md) => md.name.toLowerCase() !== metadata.key.toLowerCase()
    );

    metadatas.push({
      name: metadata.key,
      type: metadata.type,
    });

    const body: CreateNewWave = {
      ...originalBody,
      participation: {
        ...originalBody.participation,
        required_metadata: metadatas,
      },
    };
    await addMetadataMutation.mutateAsync(body);
  };

  return (
    <>
      {mode === Mode.IDLE ? (
        <div>
          <WaveRequiredMetadataAddButton onAdd={() => setMode(Mode.ADD)} />
        </div>
      ) : (
        <>
          <div className="tw-mt-2">
          <WaveRequiredMetadataAddInput
            metadata={metadata}
            setMetadata={setMetadata}
          />
          </div>
          <div className="tw-mt-3 sm:tw-flex sm:tw-flex-row-reverse tw-gap-x-3">
            <button
              onClick={onMetadataAdd}
              disabled={mutating || !metadata.key.length}
              type="button"
              className="tw-w-full sm:tw-w-auto tw-flex tw-items-center tw-gap-x-2 tw-cursor-pointer tw-px-3 tw-py-2 tw-text-sm tw-rounded-lg tw-font-semibold tw-border-0 tw-ring-1 tw-ring-inset tw-bg-primary-500 tw-ring-primary-500 hover:tw-bg-primary-600 hover:tw-ring-primary-600 tw-text-white tw-transition tw-duration-300 tw-ease-out"
            >
              <div className={mutating ? "tw-opacity-0" : ""}>Save</div>
              {mutating && (
                <div className="tw-absolute">
                  <CircleLoader />
                </div>
              )}
            </button>
            <button
              onClick={setIdleAndReset}
              type="button"
              className="tw-mt-3 sm:tw-mt-0 tw-w-full hover:tw-bg-iron-800 sm:tw-w-auto tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </>
  );
}
