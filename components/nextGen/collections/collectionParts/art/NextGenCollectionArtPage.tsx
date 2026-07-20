import NextGenCollectionHeader, {
  NextGenBackToCollectionPageLink,
} from "../NextGenCollectionHeader";
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
      <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-pb-12 md:tw-px-6 lg:tw-px-8">
        <div className="tw-pt-4 sm:tw-pt-6">
          <NextGenBackToCollectionPageLink collection={props.collection} />
        </div>
        <section className="tw-pb-6 tw-pt-2 sm:tw-pb-8 sm:tw-pt-3">
          <NextGenCollectionHeader
            collection={props.collection}
            show_links={true}
            contained={false}
            compact={true}
          />
        </section>
        <NextGenCollectionArt collection={props.collection} />
      </div>
    </>
  );
}
