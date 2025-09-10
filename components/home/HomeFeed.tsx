"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMyStreamQuery, usePollingQuery } from "../../hooks/useMyStreamQuery";
import { ActiveDropAction, ActiveDropState } from "../../types/dropInteractionTypes";
import { ExtendedDrop } from "../../helpers/waves/drop.helpers";
import { DropInteractionParams } from "../waves/drops/Drop";
import BrainContent from "../brain/content/BrainContent";
import MyStream from "../brain/my-stream/MyStream";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import useDeviceInfo from "../../hooks/useDeviceInfo";

export default function HomeFeed() {
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const { homepageFeedStyle } = useLayout();
  const router = useRouter();
  const { isApp } = useDeviceInfo();

  const onDropContentClick = (drop: ExtendedDrop) => {
    // Navigate to waves for desktop, my-stream for app
    const baseRoute = isApp ? '/my-stream' : '/waves';
    const url = `${baseRoute}?wave=${drop.wave.id}&serialNo=${drop.serial_no}/`;
    router.push(url, { scroll: false });
  };

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

  return (
    <div style={homepageFeedStyle}>
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
    </div>
  );
}