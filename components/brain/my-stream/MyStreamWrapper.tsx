"use client";

import React, { useEffect, useState } from "react";
import MyStream from "./MyStream";
import { useRouter } from "next/router";
import MyStreamWave from "./MyStreamWave";
import BrainContent from "../content/BrainContent";
import {
  useMyStreamQuery,
  usePollingQuery,
} from "../../../hooks/useMyStreamQuery";
import {
  ActiveDropAction,
  ActiveDropState,
} from "../../../types/dropInteractionTypes";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { DropInteractionParams } from "../../waves/drops/Drop";

const MyStreamWrapper: React.FC = () => {
  const router = useRouter();
  const [serialisedWaveId, setSerialisedWaveId] = useState<string | null>(null);

  useEffect(() => {
    const { wave: waveId } = router.query;
    setSerialisedWaveId(typeof waveId === "string" ? waveId : null);
  }, [router.query]);

  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);

  const onDropContentClick = (drop: ExtendedDrop) => {
    router.push(
      `/my-stream?wave=${drop.wave.id}&serialNo=${drop.serial_no}/`,
      undefined,
      { shallow: true }
    );
  };

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
    isInitialQueryDone,
  } = useMyStreamQuery({ reverse: true });

  const { haveNewItems } = usePollingQuery(isInitialQueryDone, items, true);

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

  const component = serialisedWaveId ? (
    <MyStreamWave key={`wave-${serialisedWaveId}`} waveId={serialisedWaveId} />
  ) : (
    <MyStream
      key="my-stream-feed"
      onReply={onReply}
      onQuote={onQuote}
      onDropContentClick={onDropContentClick}
      activeDrop={activeDrop}
      items={items}
      isFetching={isFetching}
      onBottomIntersection={onBottomIntersection}
      haveNewItems={haveNewItems}
      status={status}
      isInitialQueryDone={isInitialQueryDone}
    />
  );

  return (
    <BrainContent
      activeDrop={activeDrop}
      onCancelReplyQuote={onCancelReplyQuote}>
      {component}
    </BrainContent>
  );
};

export default MyStreamWrapper;
