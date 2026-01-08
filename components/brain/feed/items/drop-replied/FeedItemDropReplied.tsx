"use client";

import { useRouter } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { IFeedItemDropReplied } from "@/types/feed.types";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import type {
  DropInteractionParams} from "@/components/waves/drops/Drop";
import Drop, {
  DropLocation,
} from "@/components/waves/drops/Drop";

export default function FeedItemDropReplied({
  item,
  showWaveInfo,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: {
  readonly item: IFeedItemDropReplied;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
}) {
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  const baseWave = item.item.reply.wave as any;
  const isDirectMessage =
    baseWave?.chat?.scope?.group?.is_direct_message ?? false;

  const onReplyClick = (serialNo: number) => {
    router.push(
      getWaveRoute({
        waveId: item.item.reply.wave.id,
        serialNo,
        isDirectMessage,
        isApp,
      })
    );
  };

  const onQuoteClick = (quote: ApiDrop) => {
    const quoteWave = quote.wave as any;
    const isQuoteDm =
      quoteWave?.chat?.scope?.group?.is_direct_message ?? isDirectMessage;

    router.push(
      getWaveRoute({
        waveId: quote.wave.id,
        serialNo: quote.serial_no,
        isDirectMessage: isQuoteDm,
        isApp,
      })
    );
  };

  return (
    <Drop
      drop={{
        type: DropSize.FULL,
        ...item.item.reply,
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
