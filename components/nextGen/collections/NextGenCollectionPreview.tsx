import Image from "next/image";
import Link from "next/link";
import type { NextGenCollection } from "@/entities/INextgen";
import { formatNameForUrl } from "../nextgen_helpers";
import { NextGenMintCounts } from "./collectionParts/NextGenCollectionHeader";

interface Props {
  collection: NextGenCollection;
}

export default function NextGenCollectionPreview(props: Readonly<Props>) {
  return (
    <Link
      href={`/nextgen/collection/${formatNameForUrl(props.collection.name)}`}
      className="tw-group tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-text-iron-100 tw-no-underline tw-shadow-lg tw-transition tw-duration-200 hover:-tw-translate-y-0.5 hover:tw-border-white/20 hover:tw-bg-iron-800 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 motion-reduce:tw-transform-none"
    >
      <div className="tw-flex tw-aspect-square tw-items-center tw-justify-center tw-overflow-hidden tw-bg-black/40 tw-p-3">
        <Image
          unoptimized
          width={900}
          height={900}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="tw-h-full tw-w-full tw-object-contain tw-transition tw-duration-300 group-hover:tw-scale-[1.02] motion-reduce:tw-transform-none"
          src={props.collection.image}
          alt={`NextGen Collection #${props.collection.id} - ${props.collection.name}`}
          onError={(event) => {
            event.currentTarget.src = "/pebbles-loading.jpeg";
          }}
        />
      </div>
      <div className="tw-flex tw-flex-col tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-p-4">
        <h2 className="tw-m-0 tw-text-base tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-lg">
          {props.collection.name}
        </h2>
        <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-300 sm:tw-text-sm">
          by{" "}
          <strong className="tw-font-semibold tw-text-iron-100">
            {props.collection.artist}
          </strong>
        </p>
        <div className="tw-mt-2 tw-text-xs tw-text-iron-400 sm:tw-text-sm">
          <NextGenMintCounts collection={props.collection} />
        </div>
      </div>
    </Link>
  );
}
