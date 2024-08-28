import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Drop } from "../../../generated/models/Drop";
import DropsListItem from "./item/DropsListItem";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";
import { getDropKey } from "../../../helpers/waves/drop.helpers";

export default function DropsList({
  drops,
  showWaveInfo,
  availableCredit,
  onBottomIntersection,
}: {
  readonly drops: Drop[];
  readonly showWaveInfo: boolean;
  readonly availableCredit: number | null;
  readonly onBottomIntersection: (state: boolean) => void;
}) {
  const getIntersectionTargetIndex = () => {
    if (drops.length < 5) {
      return null;
    }
    return drops.length - 5;
  };

  const [intersectionTargetIndex, setIntersectionTargetIndex] = useState<
    number | null
  >(getIntersectionTargetIndex());
  const listRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    setIntersectionTargetIndex(getIntersectionTargetIndex());
  }, [drops]);

  useLayoutEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = scrollPositionRef.current;
    }
  });

  const handleScroll = () => {
    if (listRef.current) {
      scrollPositionRef.current = listRef.current.scrollTop;
    }
  };

  return (
    <div
      className="tw-flex tw-flex-col tw-gap-y-2.5"
      ref={listRef}
      onScroll={handleScroll}
    >
      {drops.map((drop, i) => (
        <div key={getDropKey({ drop, index: i })}>
          <DropsListItem
            drop={drop}
            availableCredit={availableCredit}
            replyToDrop={null}
            showWaveInfo={showWaveInfo}
          />
          {!!intersectionTargetIndex && intersectionTargetIndex === i && (
            <CommonIntersectionElement onIntersection={onBottomIntersection} />
          )}
        </div>
      ))}
    </div>
  );
}
