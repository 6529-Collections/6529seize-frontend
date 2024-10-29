import { useMemo, useState, useEffect } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import CreateDrop from "./CreateDrop";
import WaveDrops from "./drops/WaveDrops";
import { useSearchParams, useRouter } from "next/navigation";
import useCapacitor from "../../../hooks/useCapacitor";
import { CreateDropWaveWrapper } from "./CreateDropWaveWrapper";
import { ApiWaveType } from "../../../generated/models/ApiWaveType";

export enum ActiveDropAction {
  REPLY = "REPLY",
  QUOTE = "QUOTE",
}

export interface ActiveDropState {
  action: ActiveDropAction;
  drop: ApiDrop;
  partId: number;
}

interface WaveDetailedContentProps {
  readonly wave: ApiWave;
}

export default function WaveDetailedContent({
  wave,
}: WaveDetailedContentProps) {
  const capacitor = useCapacitor();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const [initialDrop, setInitialDrop] = useState<number | null>(null);
  const canDrop = wave.chat.authenticated_user_eligible;
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

  const containerClassName = useMemo(() => {
    return `tw-w-full tw-flex tw-flex-col ${
      capacitor.isCapacitor
        ? "tw-h-[calc(100vh-14.7rem)]"
        : "tw-h-[calc(100vh-8.8rem)] lg:tw-h-[calc(100vh-7.5rem)]"
    } ${wave.wave.type !== ApiWaveType.Chat ? "tw-pt-10" : ""}`;
  }, [capacitor.isCapacitor]);

  if (!searchParamsDone) {
    return null;
  }

  return (
    <div className="tw-relative tw-h-full">
      <div className="tw-w-full tw-flex tw-items-stretch lg:tw-divide-x-4 lg:tw-divide-iron-600 lg:tw-divide-solid lg:tw-divide-y-0">
        <div className={containerClassName}>
          <WaveDrops
            waveId={wave.id}
            onReply={handleReply}
            onQuote={handleQuote}
            activeDrop={activeDrop}
            initialDrop={initialDrop}
          />
          {canDrop && (
            <div className="tw-mt-auto">
              <CreateDropWaveWrapper>
                <CreateDrop
                  activeDrop={activeDrop}
                  onCancelReplyQuote={onCancelReplyQuote}
                  wave={wave}
                />
              </CreateDropWaveWrapper>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
