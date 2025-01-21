import React, { useState } from "react";
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
import BrainContentInput from "../content/input/BrainContentInput";

interface NotificationsWrapperProps {
  readonly items: TypedNotification[];
  readonly loading: boolean;
  readonly onBottomIntersection: (state: boolean) => void;
}

export default function NotificationsWrapper({
  items,
  loading,
  onBottomIntersection,
}: NotificationsWrapperProps) {
  const router = useRouter();
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const onDropContentClick = (drop: ExtendedDrop) => {
    router.push(
      `/my-stream?wave=${drop.wave.id}&serialNo=${drop.serial_no}/`,
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

  const onCancelReplyQuote = () => {
    setActiveDrop(null);
  };

  return (
    <div>
      <BrainContentInput
        activeDrop={activeDrop}
        onCancelReplyQuote={onCancelReplyQuote}
      />
      <div className="tw-relative">
        <NotificationItems
          items={items}
          onBottomIntersection={onBottomIntersection}
          activeDrop={activeDrop}
          onReply={onReply}
          onQuote={onQuote}
          onDropContentClick={onDropContentClick}
        />
        {loading && (
          <div className="tw-w-full tw-text-center tw-mt-6">
            <CircleLoader size={CircleLoaderSize.XXLARGE} />
          </div>
        )}
      </div>
    </div>
  );
}
