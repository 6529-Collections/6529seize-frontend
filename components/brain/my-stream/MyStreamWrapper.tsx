"use client";

import { DropInteractionParams } from "@/components/waves/drops/Drop";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  useMyStreamQuery,
  usePollingQuery,
} from "@/hooks/useMyStreamQuery";
import {
  ActiveDropAction,
  ActiveDropState,
} from "@/types/dropInteractionTypes";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import BrainContent from "../content/BrainContent";
import MyStream from "./MyStream";
import MyStreamWave from "./MyStreamWave";

const MyStreamWrapper: React.FC = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [serialisedWaveId, setSerialisedWaveId] = useState<string | null>(null);

  useEffect(() => {
    const waveId = searchParams?.get('wave') || null;
    setSerialisedWaveId(waveId);
  }, [searchParams]);

  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);

  const onDropContentClick = (drop: ExtendedDrop) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('wave', drop.wave.id);
    params.set('serialNo', `${drop.serial_no}/`);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
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
