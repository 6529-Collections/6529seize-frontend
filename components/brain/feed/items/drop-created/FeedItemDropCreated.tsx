"use client";

import { useRouter } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { IFeedItemDropCreated } from "@/types/feed.types";
import Drop, {
  DropInteractionParams,
  DropLocation,
} from "@/components/waves/drops/Drop";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import {
  DropSize,
  ExtendedDrop,
} from "@/helpers/waves/drop.helpers";

export default function FeedItemDropCreated({
  item,
  showWaveInfo,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: {
  readonly item: IFeedItemDropCreated;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}) {
  const router = useRouter();
  const { isApp } = useDeviceInfo();

  const getRoute = (
    waveId: string,
    serialNo: string | number,
    isDirectMessage: boolean
  ) =>
    getWaveRoute({
      waveId,
      serialNo,
      isDirectMessage,
      isApp,
    });

  const onReplyClick = (serialNo: number) => {
    const waveInfo = item.item.wave as any;
    const isDirectMessage =
      waveInfo?.chat?.scope?.group?.is_direct_message ?? false;

    router.push(getRoute(item.item.wave.id, serialNo, isDirectMessage));
  };

  const onQuoteClick = (quote: ApiDrop) => {
    const waveInfo = quote.wave as any;
    const isDirectMessage =
      waveInfo?.chat?.scope?.group?.is_direct_message ?? false;

    router.push(getRoute(quote.wave.id, quote.serial_no, isDirectMessage));
  };
  return (
    <Drop
      drop={{
        type: DropSize.FULL,
        ...item.item,
        stableKey: "",
        stableHash: "",
      }}
      previousDrop={null}
      nextDrop={null}
      showWaveInfo={showWaveInfo}
      activeDrop={activeDrop}
      showReplyAndQuote={true}
      location={DropLocation.MY_STREAM}
      dropViewDropId={null}
      onReply={onReply}
      onQuote={onQuote}
      onReplyClick={onReplyClick}
      onQuoteClick={onQuoteClick}
      onDropContentClick={onDropContentClick}
    />
  );
}
