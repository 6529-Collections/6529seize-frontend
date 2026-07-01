import NextGenCollectionHeader from "../NextGenCollectionHeader";
import NextGenCollectionArt from "../NextGenCollectionArt";
import type { NextGenCollection } from "@/entities/INextgen";
import NextGenNavigationHeader from "@/components/nextGen/collections/NextGenNavigationHeader";

interface Props {
  collection: NextGenCollection;
}

export default function NextGenCollectionArtPage(props: Readonly<Props>) {
  return (
    <>
      <NextGenNavigationHeader />
      <div className="pt-4 pb-4 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <NextGenCollectionHeader
              collection={props.collection}
              collection_link={true}
            />
          </div>
        </div>
        <div className="pt-4 -tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <NextGenCollectionArt collection={props.collection} />
          </div>
        </div>
      </div>
    </>
  );
}
