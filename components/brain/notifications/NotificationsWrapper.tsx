import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { TypedNotification } from "../../../types/feed.types";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import {
  ActiveDropAction,
  ActiveDropState,
} from "../../waves/detailed/chat/WaveChat";
import { DropInteractionParams } from "../../waves/detailed/drops/Drop";
import NotificationItems from "./NotificationItems";
import { useRouter } from "next/router";

interface NotificationsWrapperProps {
  readonly items: TypedNotification[];
  readonly loading: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly setActiveDrop: (drop: ActiveDropState | null) => void;
}

export default function NotificationsWrapper({
  items,
  loading,
  activeDrop,
  setActiveDrop,
}: NotificationsWrapperProps) {
  const router = useRouter();

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

  return (
    <div className="tw-relative">
      {loading && (
        <div className="tw-w-full tw-text-center tw-mt-4 tw-mb-4">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      )}
      <NotificationItems
        items={items}
        activeDrop={activeDrop}
        onReply={onReply}
        onQuote={onQuote}
        onDropClick={onDropClick}
      />
    </div>
  );
}
