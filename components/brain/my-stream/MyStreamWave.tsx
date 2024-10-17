import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import { useWaveDrops } from "../../../hooks/useWaveDrops";
import FeedWrapper from "../feed/FeedWrapper";
import { useAvailableDropRateQuery } from "../../../hooks/useMyStreamQuery";
import { TypedFeedItem } from "../../../types/feed.types";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ApiFeedItemType } from "../../../generated/models/ApiFeedItemType";

interface MyStreamWaveProps {
  readonly waveId: string;
}

const MyStreamWave: React.FC<MyStreamWaveProps> = ({ waveId }) => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const {
    drops,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    haveNewDrops,
  } = useWaveDrops(waveId, connectedProfile?.profile?.handle, false);

  const { availableCredit } = useAvailableDropRateQuery(
    connectedProfile,
    activeProfileProxy
  );

  const onBottomIntersection = (state: boolean) => {
    if (state && !isFetching && !isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  };

  const convertDropToFeedItem = (drop: ExtendedDrop): TypedFeedItem => {
    if (drop.reply_to?.drop) {
      return {
        type: ApiFeedItemType.DropReplied,
        serial_no:  Math.floor(Math.random() * (1000000 - 100000) + 100000),
        item: {
          drop: drop,
          reply: {
            ...drop.reply_to.drop,
            wave: drop.wave,
          },
        },
      };
    }
    return {
      type: ApiFeedItemType.DropCreated,
      serial_no:  Math.floor(Math.random() * (1000000 - 100000) + 100000),
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
        availableCredit={availableCredit}
        onBottomIntersection={onBottomIntersection}
      />
    </div>
  );
};

export default MyStreamWave;
