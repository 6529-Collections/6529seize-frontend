import SingleWaveDropLoading from "./SingleWaveDropLoading";
import type { useSingleWaveDropData } from "./useSingleWaveDropData";

export default function SingleWaveDropDataLoading({
  data,
  onClose,
}: {
  readonly data: Pick<
    ReturnType<typeof useSingleWaveDropData>,
    "isWaveError" | "isWaveFetching" | "refetchWave"
  >;
  readonly onClose: () => void;
}) {
  return (
    <SingleWaveDropLoading
      onClose={onClose}
      isError={data.isWaveError && !data.isWaveFetching}
      onRetry={() => {
        void data.refetchWave();
      }}
    />
  );
}
