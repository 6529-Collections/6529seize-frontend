import { useEffect, useState } from "react";
import { Drop } from "../../../generated/models/Drop";
import DropsListItem from "./item/DropsListItem";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";
import { getDropHash } from "../../../helpers/waves/drop.helpers";

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

  useEffect(() => {
    setIntersectionTargetIndex(getIntersectionTargetIndex());
  }, [drops]);

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-2.5">
      {drops.map((drop, i) => (
        <div key={getDropHash(drop)}>
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
