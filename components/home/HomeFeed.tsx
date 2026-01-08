"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useMyStreamQuery,
  usePollingQuery,
} from "../../hooks/useMyStreamQuery";
import type {
  ActiveDropState} from "../../types/dropInteractionTypes";
import {
  ActiveDropAction
} from "../../types/dropInteractionTypes";
import type { ExtendedDrop } from "../../helpers/waves/drop.helpers";
import type { DropInteractionParams } from "../waves/drops/Drop";
import BrainContent from "../brain/content/BrainContent";
import MyStream from "../brain/my-stream/MyStream";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import useDeviceInfo from "../../hooks/useDeviceInfo";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { useMyStream } from "@/contexts/wave/MyStreamContext";

export default function HomeFeed() {
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const { homepageFeedStyle, smallScreenFeedStyle } = useLayout();
  const router = useRouter();
  const { isApp, hasTouchScreen } = useDeviceInfo();
  const { directMessages } = useMyStream();

  const onDropContentClick = useCallback(
    (drop: ExtendedDrop) => {
      const isDirectMessage = directMessages.list.some(
        (dm) => dm.id === drop.wave.id
      );

      const url = getWaveRoute({
        waveId: drop.wave.id,
        serialNo: drop.serial_no,
        isDirectMessage,
        isApp,
      });

      router.push(url, { scroll: false });
    },
    [directMessages.list, isApp, router]
  );

  useEffect(() => {
    setActiveDrop(null);
  }, []);

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

  const content = (
    <BrainContent
      activeDrop={activeDrop}
      onCancelReplyQuote={onCancelReplyQuote}
    >
      <MyStream
        key="home-feed"
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
    </BrainContent>
  );

  if (isApp) {
    return content;
  }

  const containerStyle = hasTouchScreen
    ? { ...smallScreenFeedStyle, overflow: "hidden" as const }
    : homepageFeedStyle;

  return <div style={containerStyle}>{content}</div>;
}
