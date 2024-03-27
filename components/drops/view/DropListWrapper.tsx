import { useEffect, useRef } from "react";
import { DropFull } from "../../../entities/IDrop";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import DropsList from "./DropsList";
import { useIntersection } from "react-use";

export default function DropListWrapper({
  drops,
  loading,
  onBottomIntersection,
}: {
  readonly drops: DropFull[];
  readonly loading: boolean;
  readonly onBottomIntersection: (state: boolean) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const bottomIntersection = useIntersection(bottomRef, {
    root: null,
    rootMargin: "0px",
    threshold: 1,
  });

  useEffect(
    () => onBottomIntersection(bottomIntersection?.isIntersecting ?? false),
    [bottomIntersection]
  );

  return (
    <div>
      <DropsList drops={drops} />
      {loading && (
        <div className="tw-w-full tw-text-center tw-mt-8">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
