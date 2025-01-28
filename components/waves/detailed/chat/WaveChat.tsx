import React, { useEffect, useMemo, useRef, useState } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ApiWaveType } from "../../../../generated/models/ApiWaveType";
import useCapacitor from "../../../../hooks/useCapacitor";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import WaveDropsAll from "../drops/WaveDropsAll";
import { CreateDropWaveWrapper } from "../CreateDropWaveWrapper";
import PrivilegedDropCreator, { DropMode } from "../PrivilegedDropCreator";

export enum ActiveDropAction {
  REPLY = "REPLY",
  QUOTE = "QUOTE",
}

export interface ActiveDropState {
  action: ActiveDropAction;
  drop: ApiDrop;
  partId: number;
}

interface WaveChatProps {
  readonly wave: ApiWave;
}

const calculateHeight = (isCapacitor: boolean, isNotChatWave: boolean) => {
  if (isCapacitor) {
    return "tw-h-[calc(100vh-14.7rem)]";
  }
  return `tw-h-[calc(100vh-8.8rem)] ${
    isNotChatWave
      ? "lg:tw-h-[calc(100vh-9.4rem)]"
      : "lg:tw-h-[calc(100vh-6.5rem)]"
  }`;
};

export const WaveChat: React.FC<WaveChatProps> = ({ wave }) => {
  const contentWrapperRef = useRef<HTMLDivElement | null>(null);
  const isNotChatWave = wave.wave.type !== ApiWaveType.Chat;
  const capacitor = useCapacitor();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const [initialDrop, setInitialDrop] = useState<number | null>(null);
  const [searchParamsDone, setSearchParamsDone] = useState(false);

  useEffect(() => {
    const dropParam = searchParams.get("drop");
    if (dropParam) {
      setInitialDrop(parseInt(dropParam));
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("drop");
      router.replace(newUrl.pathname + newUrl.search);
    }
    setSearchParamsDone(true);
  }, [searchParams, router]);

  const handleReply = ({ drop, partId }: { drop: ApiDrop; partId: number }) => {
    setActiveDrop({
      action: ActiveDropAction.REPLY,
      drop,
      partId,
    });
  };

  const handleQuote = ({ drop, partId }: { drop: ApiDrop; partId: number }) => {
    setActiveDrop({
      action: ActiveDropAction.QUOTE,
      drop,
      partId,
    });
  };

  const onCancelReplyQuote = () => {
    setActiveDrop(null);
  };

  const containerClassName = useMemo(() => {
    return `tw-w-full tw-flex tw-flex-col ${calculateHeight(
      capacitor.isCapacitor,
      isNotChatWave
    )}`;
  }, [capacitor.isCapacitor, isNotChatWave]);

  if (!searchParamsDone) {
    return null;
  }

  return (
    <div
      className={`tw-flex-1 lg:tw-ml-[21.5rem] ${
        isNotChatWave
          ? "xl:tw-mr-[20.5rem] 3xl:tw-mr-[28rem]"
          : ""
      } tw-transition-all tw-duration-300 lg:tw-pl-4`}
    >
      <div
        ref={contentWrapperRef}
        className="tw-overflow-hidden tw-bg-iron-950 tw-ring-1 tw-ring-iron-800 tw-relative"
      >
        <div className="tw-relative tw-h-full">
          <div className="tw-w-full tw-flex tw-items-stretch lg:tw-divide-x-4 lg:tw-divide-iron-600 lg:tw-divide-solid lg:tw-divide-y-0">
            <div className={containerClassName}>
              <WaveDropsAll
                waveId={wave.id}
                onReply={handleReply}
                onQuote={handleQuote}
                activeDrop={activeDrop}
                initialDrop={initialDrop}
                dropId={null}
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
      </div>
    </div>
  );
};
