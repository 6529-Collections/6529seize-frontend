import { useMemo, useState, useEffect } from "react";
import { Wave } from "../../../generated/models/Wave";
import { Drop } from "../../../generated/models/Drop";
import CreateDrop from "./CreateDrop";
import WaveDrops from "./drops/WaveDrops";
import { useSearchParams, useRouter } from "next/navigation";
import useCapacitor from "../../../hooks/useCapacitor";

export enum ActiveDropAction {
  REPLY = "REPLY",
  QUOTE = "QUOTE",
}

export interface ActiveDropState {
  action: ActiveDropAction;
  drop: Drop;
  partId: number;
}

interface WaveDetailedContentProps {
  readonly wave: Wave;
}

export default function WaveDetailedContent({
  wave,
}: WaveDetailedContentProps) {
  const capacitor = useCapacitor();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const [initialDrop, setInitialDrop] = useState<number | null>(null);
  const canDrop = wave.participation.authenticated_user_eligible;
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

  const onReply = (drop: Drop, partId: number) => {
    setActiveDrop({
      action: ActiveDropAction.REPLY,
      drop,
      partId,
    });
  };

  const onQuote = (drop: Drop, partId: number) => {
    setActiveDrop({
      action: ActiveDropAction.QUOTE,
      drop,
      partId,
    });
  };

  const handleReply = ({ drop, partId }: { drop: Drop; partId: number }) => {
    onReply(drop, partId);
  };

  const handleQuote = ({ drop, partId }: { drop: Drop; partId: number }) => {
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
    }`;
  }, [capacitor.isCapacitor]);

  if (!searchParamsDone) {
    return null;
  }

  return (
    <div className="tw-relative tw-h-full">
      <div className="tw-w-full tw-flex tw-items-stretch lg:tw-divide-x-4 lg:tw-divide-iron-600 lg:tw-divide-solid lg:tw-divide-y-0">
        <div className={containerClassName}>
          <WaveDrops
            wave={wave}
            onReply={handleReply}
            onQuote={handleQuote}
            activeDrop={activeDrop}
            initialDrop={initialDrop}
          />
          {canDrop && (
            <div className="tw-mt-auto">
              <CreateDrop
                activeDrop={activeDrop}
                onCancelReplyQuote={onCancelReplyQuote}
                wave={wave}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
