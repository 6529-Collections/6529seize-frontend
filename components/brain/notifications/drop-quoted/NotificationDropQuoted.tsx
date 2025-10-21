"use client";

import { DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { INotificationDropQuoted } from "@/types/feed.types";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import Drop, {
  DropInteractionParams,
  DropLocation,
} from "@/components/waves/drops/Drop";
import { useRouter } from "next/navigation";
import { ApiDrop } from "@/generated/models/ApiDrop";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { getWaveRoute } from "@/helpers/navigation.helpers";

export default function NotificationDropQuoted({
  notification,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: {
  readonly notification: INotificationDropQuoted;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}) {
  const router = useRouter();
  const { isApp } = useDeviceInfo();

  const navigateToWave = (
    waveId: string,
    serialNo: number,
    isDirectMessage: boolean
  ) => {
    router.push(
      getWaveRoute({ waveId, serialNo, isDirectMessage, isApp })
    );
  };

  const onReplyClick = (serialNo: number) => {
    const baseWave = notification.related_drops[0].wave as any;
    const isDirectMessage =
      baseWave?.chat?.scope?.group?.is_direct_message ?? false;
    navigateToWave(notification.related_drops[0].wave.id, serialNo, isDirectMessage);
  };

  const onQuoteClick = (quote: ApiDrop) => {
    const quoteWave = quote.wave as any;
    const isDirectMessage =
      quoteWave?.chat?.scope?.group?.is_direct_message ?? false;
    navigateToWave(quote.wave.id, quote.serial_no, isDirectMessage);
  };

  return (
    <Drop
      drop={{
        type: DropSize.FULL,
        ...notification.related_drops[0],
        stableKey: "",
        stableHash: "",
      }}
      previousDrop={null}
      nextDrop={null}
      showWaveInfo={true}
      showReplyAndQuote={true}
      activeDrop={activeDrop}
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
