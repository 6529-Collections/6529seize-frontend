import WaveItem from "./WaveItem";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import CommonIntersectionElement from "@/components/utils/CommonIntersectionElement";
import { useWaves } from "@/hooks/useWaves";

export default function WavesListSearchResults({
  identity,
  waveName,
}: {
  readonly identity: string | null;
  readonly waveName: string | null;
}) {
  const {
    waves,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    status,
  } = useWaves({ identity, waveName });

  const onBottomIntersection = (state: boolean) => {
    if (
      !state ||
      status === "pending" ||
      isFetching ||
      isFetchingNextPage ||
      !hasNextPage
    ) {
      return;
    }
    fetchNextPage();
  };

  return (
    <div>
      <div>
        <span className="tw-tracking-tight tw-text-xl tw-font-medium tw-text-iron-50">
          Search
        </span>
        {waves.length === 0 && !isFetching && (
          <p className="tw-mt-2 tw-block tw-mb-0 tw-text-sm tw-italic tw-text-iron-500">
            No results found. Please try a different keyword or create a new
            wave.
          </p>
        )}
      </div>
      <div className="tw-overflow-hidden">
        <div className="tw-mt-3 tw-grid tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-3 tw-gap-4">
          {waves.map((wave) => (
            <WaveItem key={`waves-${wave.id}`} wave={wave} />
          ))}
        </div>
        {isFetching && (
          <div className="tw-w-full tw-text-center tw-mt-8">
            <CircleLoader size={CircleLoaderSize.XXLARGE} />
          </div>
        )}
        <CommonIntersectionElement onIntersection={onBottomIntersection} />
      </div>
    </div>
  );
}
