import { useContext, useEffect } from "react";
import { AuthContext, TitleType } from "../../auth/Auth";
import FeedWrapper from "../feed/FeedWrapper";
import {
  useAvailableDropRateQuery,
  useMyStreamQuery,
  usePollingQuery,
} from "../../../hooks/useMyStreamQuery";

export default function MyStream() {
  const { connectedProfile, activeProfileProxy, setTitle } =
    useContext(AuthContext);

  const {
    items,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    refetch,
    isInitialQueryDone,
  } = useMyStreamQuery();

  const { haveNewItems } = usePollingQuery(isInitialQueryDone, items);

  const { availableCredit } = useAvailableDropRateQuery(
    connectedProfile,
    activeProfileProxy
  );

  const onBottomIntersection = (state: boolean) => {
    if (
      state &&
      status !== "pending" &&
      !isFetching &&
      !isFetchingNextPage &&
      hasNextPage
    ) {
      fetchNextPage();
    }
  };

  useEffect(() => {
    setTitle({
      title: haveNewItems ? "New Stream Items Available | 6529 SEIZE" : null,
      type: TitleType.MY_STREAM,
    });

    return () => {
      setTitle({
        title: null,
        type: TitleType.MY_STREAM,
      });
    };
  }, [haveNewItems]);

  useEffect(() => {
    const checkAndRefetch = () => {
      if (haveNewItems && document.visibilityState === "visible") {
        refetch();
      }
    };

    checkAndRefetch();
    document.addEventListener("visibilitychange", checkAndRefetch);

    return () => {
      document.removeEventListener("visibilitychange", checkAndRefetch);
    };
  }, [haveNewItems]);

  return (
    <div className="lg:tw-w-[672px] tw-flex-shrink-0">
      <div>
        <FeedWrapper
          items={items}
          loading={isFetching}
          showWaveInfo={true}
          availableCredit={availableCredit}
          onBottomIntersection={onBottomIntersection}
        />
      </div>
    </div>
  );
}
