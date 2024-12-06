import React, { useContext, useEffect, useState } from "react";
import MyStream from "./MyStream";
import { useRouter } from "next/router";
import MyStreamWave from "./MyStreamWave";
import BrainContent from "../content/BrainContent";
import { AuthContext, TitleType } from "../../auth/Auth";
import {
  useMyStreamQuery,
  usePollingQuery,
} from "../../../hooks/useMyStreamQuery";
import {
  ActiveDropAction,
  ActiveDropState,
} from "../../waves/detailed/chat/WaveChat";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { DropInteractionParams } from "../../waves/detailed/drops/Drop";

const MyStreamWrapper: React.FC = () => {
  const { setTitle } = useContext(AuthContext);
  const router = useRouter();
  const [serialisedWaveId, setSerialisedWaveId] = useState<string | null>(null);

  useEffect(() => {
    const { wave: waveId } = router.query;
    setSerialisedWaveId(typeof waveId === "string" ? waveId : null);
  }, [router.query]);

  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);

  const onDropClick = (drop: ExtendedDrop) => {
    const currentQuery = { ...router.query };
    currentQuery.drop = drop.id;
    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const getActiveWaveId = () => {
    return activeDrop?.drop.wave.id ?? serialisedWaveId;
  };

  const [activeWaveId, setActiveWaveId] = useState<string | null>(
    getActiveWaveId()
  );

  useEffect(() => {
    setActiveWaveId(getActiveWaveId());
  }, [activeDrop, serialisedWaveId]);

  useEffect(() => {
    setActiveDrop(null);
  }, [serialisedWaveId]);

  const onReply = (param: DropInteractionParams) => {
    setActiveDrop({
      action: ActiveDropAction.REPLY,
      drop: param.drop,
      partId: param.partId,
    });
  };

  const onQuote = (param: DropInteractionParams) => {
    setActiveDrop({
      action: ActiveDropAction.QUOTE,
      drop: param.drop,
      partId: param.partId,
    });
  };

  const onCancelReplyQuote = () => {
    setActiveDrop(null);
  };

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

  const component = serialisedWaveId ? (
    <MyStreamWave
      waveId={serialisedWaveId}
      onReply={onReply}
      onQuote={onQuote}
      activeDrop={activeDrop}
      onDropClick={onDropClick}
    />
  ) : (
    <MyStream
      onReply={onReply}
      onQuote={onQuote}
      onDropClick={onDropClick}
      activeDrop={activeDrop}
      items={items}
      isFetching={isFetching}
      onBottomIntersection={onBottomIntersection}
    />
  );
  return (
    <BrainContent
      waveId={activeWaveId}
      activeDrop={activeDrop}
      onCancelReplyQuote={onCancelReplyQuote}
    >
      {component}
    </BrainContent>
  );
};

export default MyStreamWrapper;
