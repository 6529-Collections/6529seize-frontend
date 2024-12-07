import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import { useWaveDrops } from "../../../hooks/useWaveDrops";
import FeedWrapper from "../feed/FeedWrapper";
import { TypedFeedItem } from "../../../types/feed.types";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ApiFeedItemType } from "../../../generated/models/ApiFeedItemType";
import { ActiveDropState } from "../../waves/detailed/chat/WaveChat";
import { DropInteractionParams } from "../../waves/detailed/drops/Drop";

interface MyStreamWaveProps {
  readonly waveId: string;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const MyStreamWave: React.FC<MyStreamWaveProps> = ({
  waveId,
  activeDrop,
  onReply,
  onQuote,
  onDropClick,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDrops({
      waveId,
      connectedProfileHandle: connectedProfile?.profile?.handle,
      reverse: false,
      dropId: null,
    });

  const onBottomIntersection = (state: boolean) => {
    if (state && !isFetching && !isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  };

  const convertDropToFeedItem = (drop: ExtendedDrop): TypedFeedItem => {
    if (drop.reply_to?.drop) {
      return {
        type: ApiFeedItemType.DropReplied,
        serial_no: Math.floor(Math.random() * (1000000 - 100000) + 100000),
        item: {
          drop: {
            ...drop.reply_to.drop,
            wave: drop.wave,
          },
          reply: {
            ...drop,
          },
        },
      };
    }
    return {
      type: ApiFeedItemType.DropCreated,
      serial_no: Math.floor(Math.random() * (1000000 - 100000) + 100000),
      item: drop,
    };
  };

  const convertDropsToFeedItems = (drops: ExtendedDrop[]): TypedFeedItem[] => {
    return drops.map((drop) => convertDropToFeedItem(drop));
  };

  const [items, setItems] = useState<TypedFeedItem[]>(
    convertDropsToFeedItems(drops)
  );

  useEffect(() => {
    setItems(convertDropsToFeedItems(drops));
  }, [drops]);
  return (
    <div className="tw-flex-shrink-0">
      <FeedWrapper
        items={items}
        loading={isFetching}
        showWaveInfo={false}
        activeDrop={activeDrop}
        onBottomIntersection={onBottomIntersection}
        onReply={onReply}
        onQuote={onQuote}
        onDropClick={onDropClick}
      />
    </div>
  );
};

export default MyStreamWave;
