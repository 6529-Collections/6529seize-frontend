import React, { useMemo, useState } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { useWaveData } from "../../../hooks/useWaveData";
import useCapacitor from "../../../hooks/useCapacitor";
import {
  ActiveDropAction,
  ActiveDropState,
} from "../../waves/detailed/chat/WaveChat";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import WaveDropsAll from "../../waves/detailed/drops/WaveDropsAll";
import { CreateDropWaveWrapper } from "../../waves/detailed/CreateDropWaveWrapper";
import PrivilegedDropCreator, {
  DropMode,
} from "../../waves/detailed/PrivilegedDropCreator";

interface MyStreamWaveChatProps {
  readonly waveId: string;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const calculateHeight = (isCapacitor: boolean) => {
  if (isCapacitor) {
    return "tw-h-[calc(100vh-18.75rem)]";
  }
  return `tw-h-[calc(100vh-13rem)] lg:tw-h-[calc(100vh-10rem)]`;
};

const MyStreamWaveChat: React.FC<MyStreamWaveChatProps> = ({
  waveId,
  onDropClick,
}) => {
  const { data: wave } = useWaveData(waveId);
  const capacitor = useCapacitor();

  const containerClassName = useMemo(() => {
    return `tw-w-full tw-flex tw-flex-col tw-rounded-t-xl tw-overflow-hidden ${calculateHeight(
      capacitor.isCapacitor
    )}`;
  }, [capacitor.isCapacitor]);

  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const onReply = (drop: ApiDrop, partId: number) => {
    setActiveDrop({
      action: ActiveDropAction.REPLY,
      drop,
      partId,
    });
  };

  const onQuote = (drop: ApiDrop, partId: number) => {
    setActiveDrop({
      action: ActiveDropAction.QUOTE,
      drop,
      partId,
    });
  };

  const handleReply = ({ drop, partId }: { drop: ApiDrop; partId: number }) => {
    onReply(drop, partId);
  };

  const handleQuote = ({ drop, partId }: { drop: ApiDrop; partId: number }) => {
    onQuote(drop, partId);
  };

  const onCancelReplyQuote = () => {
    setActiveDrop(null);
  };

  if (!wave) {
    return null;
  }
  return (
    <div className="tw-relative tw-h-full">
      <div className="tw-w-full tw-flex tw-items-stretch lg:tw-divide-x-4 lg:tw-divide-iron-600 lg:tw-divide-solid lg:tw-divide-y-0">
        <div className={containerClassName}>
          <WaveDropsAll
            waveId={waveId}
            onReply={handleReply}
            onQuote={handleQuote}
            activeDrop={activeDrop}
            initialDrop={null}
            dropId={null}
            onDropClick={onDropClick}
          />
          <div className="tw-mt-auto">
            <CreateDropWaveWrapper>
              <PrivilegedDropCreator
                activeDrop={activeDrop}
                onCancelReplyQuote={onCancelReplyQuote}
                onDropAddedToQueue={onCancelReplyQuote}
                wave={wave}
                dropId={null}
                fixedDropMode={DropMode.BOTH}
              />
            </CreateDropWaveWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyStreamWaveChat;
