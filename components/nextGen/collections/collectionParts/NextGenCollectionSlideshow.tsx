import type { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import SlideshowHeader from "./hooks/SlideshowHeader";
import TokenSlideshow from "./hooks/TokenSlideshow";

interface Props {
  readonly collection: NextGenCollection;
  readonly initialTokens?: NextGenToken[] | undefined;
}

export default function NextGenCollectionSlideshow(props: Readonly<Props>) {
  return (
    <div className="tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-4 tw-pb-3 tw-pt-4 tw-shadow-lg sm:tw-px-5">
      <SlideshowHeader collectionName={props.collection.name} />
      <TokenSlideshow
        collectionId={props.collection.id}
        initialTokens={props.initialTokens}
      />
    </div>
  );
}
