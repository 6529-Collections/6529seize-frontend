import ButtonLink from "@/components/utils/button/ButtonLink";
import type { NextGenCollection } from "@/entities/INextgen";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { NextgenView } from "@/types/enums";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { Status } from "../nextgen_entities";
import { formatNameForUrl, getStatusFromDates } from "../nextgen_helpers";
import NextGenCollectionArtist from "./collectionParts/NextGenCollectionArtist";
import {
  NextGenCountdown,
  NextGenMintCounts,
  NextGenPhases,
} from "./collectionParts/NextGenCollectionHeader";
import NextGenCollectionSlideshow from "./collectionParts/NextGenCollectionSlideshow";

interface Props {
  collection: NextGenCollection;
  setView: (view: NextgenView) => void;
}

export default function NextGen(props: Readonly<Props>) {
  const locale = useBrowserLocale();
  const available = props.collection.total_supply - props.collection.mint_count;
  const collectionHref = `/nextgen/collection/${formatNameForUrl(
    props.collection.name
  )}`;

  return (
    <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 md:tw-px-6 lg:tw-px-8">
      <section className="tw-relative tw-isolate -tw-mx-4 tw-min-h-[320px] tw-overflow-hidden tw-bg-iron-900 tw-shadow-2xl sm:tw-min-h-[360px] md:-tw-mx-6 lg:-tw-mx-8">
        {props.collection.banner && (
          <Image
            unoptimized
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1400px"
            src={props.collection.banner}
            alt=""
            className="-tw-z-20 tw-object-cover"
          />
        )}
        <div className="tw-absolute tw-inset-0 -tw-z-10 tw-bg-black/55" />

        <div className="tw-flex tw-min-h-[320px] tw-items-center tw-px-5 tw-py-8 sm:tw-min-h-[360px] sm:tw-px-8 md:tw-px-10 lg:tw-px-12">
          <div className="tw-w-full tw-max-w-3xl">
            <NextGenPhases
              collection={props.collection}
              available={available}
            />
            <h1 className="tw-m-0 tw-mt-2 tw-text-4xl tw-font-semibold tw-leading-none tw-tracking-tight tw-text-white sm:tw-text-5xl md:tw-text-6xl">
              <Link
                href={collectionHref}
                className="tw-text-white tw-no-underline hover:tw-text-iron-200 focus:tw-outline-none focus-visible:tw-rounded-md focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                {props.collection.name}
              </Link>
            </h1>
            <p className="tw-mb-0 tw-mt-2 tw-text-2xl tw-font-light tw-leading-tight tw-text-iron-100 sm:tw-text-3xl md:tw-text-4xl">
              <Link
                href={`/${props.collection.artist_address}`}
                className="tw-text-inherit tw-no-underline hover:tw-text-white hover:tw-underline focus:tw-outline-none focus-visible:tw-rounded-md focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                {t(locale, "nextgen.home.byArtist", {
                  artist: props.collection.artist,
                })}
              </Link>
            </p>
            <div className="tw-mt-5 tw-text-base tw-font-medium tw-text-iron-100 sm:tw-text-lg">
              <NextGenMintCounts collection={props.collection} />
            </div>
            <div className="tw-mt-5">
              <ButtonLink
                href={collectionHref}
                variant="primary"
                size="lg"
              >
                {t(locale, "nextgen.home.exploreCollection")}
              </ButtonLink>
            </div>
            <div className="tw-mt-5 tw-max-w-xl">
              <NextGenCountdown collection={props.collection} />
            </div>
          </div>
        </div>
      </section>

      <section className="tw-pb-5 tw-pt-7 sm:tw-pb-6 sm:tw-pt-8">
        <p className="tw-mx-auto tw-my-0 tw-max-w-5xl tw-text-center tw-text-base tw-leading-7 tw-text-iron-200 sm:tw-text-lg">
          {t(locale, "nextgen.home.summary")}
        </p>
        <div className="tw-mt-4 tw-text-center">
          <ButtonLink
            href="/nextgen/about"
            variant="primary"
            size="lg"
            scroll={false}
            onClick={(event) => {
              if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              ) {
                return;
              }

              event.preventDefault();
              props.setView(NextgenView.ABOUT);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            {t(locale, "nextgen.home.learnMore")}
          </ButtonLink>
        </div>
      </section>

      <section>
        <h2 className="tw-mb-5 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl">
          {t(locale, "nextgen.home.exploreNamedCollection", {
            collectionName: props.collection.name,
          })}
        </h2>
        <NextGenCollectionSlideshow collection={props.collection} />
      </section>

      <section className="tw-pt-10 sm:tw-pt-12">
        <h2 className="tw-mb-5 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl">
          {t(locale, "nextgen.home.featuredArtist")}
        </h2>
        <NextGenCollectionArtist
          collection={props.collection}
          headingLevel={3}
        />
      </section>
    </div>
  );
}

export function DistributionLink(
  props: Readonly<{
    collection: NextGenCollection;
    class?: string | undefined;
    emphasized?: boolean | undefined;
  }>
) {
  const locale = useBrowserLocale();
  const alStatus = getStatusFromDates(
    props.collection.allowlist_start,
    props.collection.allowlist_end
  );
  const publicStatus = getStatusFromDates(
    props.collection.public_start,
    props.collection.public_end
  );

  if (
    alStatus === Status.UPCOMING ||
    alStatus === Status.LIVE ||
    publicStatus !== Status.COMPLETE
  ) {
    return (
      <div className={`tw-pt-1 ${props.class ?? ""}`}>
        <ButtonLink
          href={`/nextgen/collection/${formatNameForUrl(
            props.collection.name
          )}/distribution-plan`}
          variant="tertiary"
          size={props.emphasized ? "lg" : "md"}
          className="tw-group"
        >
          <span>{t(locale, "nextgen.home.distributionPlan")}</span>
          {props.emphasized && (
            <ArrowUpRightIcon
              aria-hidden="true"
              className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-300 tw-transition-colors group-hover:tw-text-white"
            />
          )}
        </ButtonLink>
      </div>
    );
  }

  return null;
}
