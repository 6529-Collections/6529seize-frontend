"use client";

import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";

import { MEMES_CONTRACT } from "@/constants/memes";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { AboutSection } from "@/types/enums";

type ImageStatus = "loading" | "loaded" | "error";

type MemeArtwork = {
  readonly id: number;
  readonly name: string;
  readonly src: string;
  readonly eager?: boolean;
};

type Resource = {
  readonly titleKey: MessageKey;
  readonly href: string;
  readonly destination: string;
  readonly opensNewTab: boolean;
};

const MEMES_IMAGE_ROOT = `https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/${MEMES_CONTRACT}`;

const ARTWORKS: readonly MemeArtwork[] = [
  {
    id: 17,
    name: "Awakening OM",
    src: `${MEMES_IMAGE_ROOT}/17.WEBP`,
    eager: true,
  },
  {
    id: 4,
    name: "Freedom to Transact",
    src: "/the-memes-4.jpeg",
    eager: true,
  },
  {
    id: 9,
    name: "The Institutions Are Coming",
    src: `${MEMES_IMAGE_ROOT}/9.WEBP`,
  },
  {
    id: 514,
    name: "Freedom Craig",
    src: `${MEMES_IMAGE_ROOT}/514.WEBP`,
  },
  {
    id: 512,
    name: "6529 SVNDIAL",
    src: `${MEMES_IMAGE_ROOT}/512.WEBP`,
  },
];

const RESOURCES: readonly Resource[] = [
  {
    titleKey: "about.memes.resources.collection.title",
    href: "/the-memes",
    destination: "6529.io/the-memes",
    opensNewTab: true,
  },
  {
    titleKey: "about.memes.resources.network.title",
    href: "/network",
    destination: "6529.io/network",
    opensNewTab: true,
  },
  {
    titleKey: "about.memes.resources.faq.title",
    href: `/about/${AboutSection.FAQ}`,
    destination: "6529.io/about/faq",
    opensNewTab: true,
  },
  {
    titleKey: "about.memes.resources.chat.title",
    href: "/waves/0849642f-1770-4de2-9cbc-70aae59c17ff",
    destination: "Memes-Chat",
    opensNewTab: false,
  },
  {
    titleKey: "about.memes.resources.minting.title",
    href: `/about/${AboutSection.MINTING}`,
    destination: "6529.io/about/minting",
    opensNewTab: true,
  },
];

function ResilientImage({
  alt,
  className,
  eager = false,
  sizes,
  src,
}: {
  readonly alt: string;
  readonly className?: string;
  readonly eager?: boolean;
  readonly sizes: string;
  readonly src: string;
}) {
  const [status, setStatus] = useState<ImageStatus>("loading");
  const handleImageRef = useCallback((image: HTMLImageElement | null) => {
    if (image?.complete && image.naturalWidth > 0) {
      setStatus("loaded");
    }
  }, []);

  return (
    <div
      aria-busy={status === "loading"}
      className="tw-relative tw-h-full tw-w-full tw-overflow-hidden tw-bg-iron-900"
    >
      {status === "loading" && (
        <div
          aria-hidden="true"
          className="tw-absolute tw-inset-0 tw-bg-iron-800 motion-safe:tw-animate-pulse"
        />
      )}
      {status === "error" ? (
        <div
          aria-label={alt}
          className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-bg-iron-900 tw-p-3 tw-text-center tw-text-iron-400"
          role="img"
        >
          <PhotoIcon aria-hidden="true" className="tw-size-6" />
          <span className="tw-text-xs tw-font-medium tw-leading-4">
            {t(DEFAULT_LOCALE, "about.memes.artwork.unavailable")}
          </span>
        </div>
      ) : (
        <Image
          alt={alt}
          className={clsx(
            "tw-h-full tw-w-full tw-object-cover tw-transition-opacity tw-duration-500 motion-reduce:tw-transition-none",
            status === "loaded" ? "tw-opacity-100" : "tw-opacity-0",
            className
          )}
          decoding="async"
          fill
          loading={eager ? "eager" : "lazy"}
          onError={() => setStatus("error")}
          onLoad={() => setStatus("loaded")}
          ref={handleImageRef}
          sizes={sizes}
          src={src}
        />
      )}
    </div>
  );
}

function ArtworkCard({
  artwork,
  isLast,
}: {
  readonly artwork: MemeArtwork;
  readonly isLast: boolean;
}) {
  const cardLabel = t(DEFAULT_LOCALE, "about.memes.artwork.cardAriaLabel", {
    name: artwork.name,
    number: artwork.id,
  });

  return (
    <li
      className={clsx(
        "tw-min-w-0 tw-transform-gpu tw-list-none tw-transition-transform tw-duration-300 tw-ease-out desktop-hover:hover:-tw-translate-y-1 motion-reduce:tw-transform-none motion-reduce:tw-transition-none",
        isLast && "tw-col-span-2 sm:tw-col-span-1"
      )}
    >
      <Link
        aria-label={cardLabel}
        className="tw-group tw-block tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-1.5 tw-text-iron-100 tw-no-underline tw-shadow-[0_18px_45px_rgba(0,0,0,0.55)] tw-transition-colors tw-duration-200 hover:tw-border-white/25 hover:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-[#0D0D0F]"
        href={`/the-memes/${artwork.id}`}
      >
        <div className="tw-aspect-[3/4] tw-overflow-hidden tw-rounded-lg tw-bg-iron-900">
          <ResilientImage
            alt={t(DEFAULT_LOCALE, "about.memes.artwork.imageAlt", {
              name: artwork.name,
              number: artwork.id,
            })}
            eager={artwork.eager === true}
            sizes="(max-width: 639px) 42vw, (max-width: 1023px) 28vw, 180px"
            src={artwork.src}
          />
        </div>
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-px-1.5 tw-pb-1 tw-pt-2">
          <span className="tw-min-w-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.08em] tw-text-iron-300">
            {artwork.name}
          </span>
          <span className="tw-shrink-0 tw-text-[10px] tw-font-semibold tw-text-primary-300">
            #{artwork.id}
          </span>
        </div>
      </Link>
    </li>
  );
}

function ArtworkComposition() {
  return (
    <div className="tw-relative tw-w-full">
      <ul
        aria-label={t(DEFAULT_LOCALE, "about.memes.artwork.galleryLabel")}
        className="tw-relative tw-m-0 tw-grid tw-grid-cols-2 tw-items-start tw-gap-2 tw-p-0 sm:tw-grid-cols-3 sm:tw-gap-3 lg:tw-grid-cols-5 lg:tw-gap-4"
      >
        {ARTWORKS.map((artwork, index) => (
          <ArtworkCard
            artwork={artwork}
            isLast={index === ARTWORKS.length - 1}
            key={artwork.id}
          />
        ))}
      </ul>
    </div>
  );
}

function ResourceCard({ resource }: { readonly resource: Resource }) {
  const Icon = resource.opensNewTab ? ArrowUpRightIcon : ArrowRightIcon;
  const title = t(DEFAULT_LOCALE, resource.titleKey);
  const externalAttributes = resource.opensNewTab
    ? { rel: "noopener noreferrer", target: "_blank" }
    : {};

  return (
    <li className="tw-list-none">
      <Link
        {...externalAttributes}
        aria-label={
          resource.opensNewTab
            ? t(DEFAULT_LOCALE, "about.memes.resources.newTabAriaLabel", {
                title,
              })
            : undefined
        }
        className="tw-group tw-grid tw-min-h-20 tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-5 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-py-5 tw-text-iron-100 tw-no-underline tw-transition-colors tw-duration-200 hover:tw-border-white/25 hover:tw-text-white hover:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-[#0D0D0F] sm:tw-grid-cols-[minmax(12rem,0.8fr)_minmax(0,1fr)_auto]"
        href={resource.href}
      >
        <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
          {title}
        </h3>
        <span className="tw-col-start-1 tw-row-start-2 tw-min-w-0 tw-truncate tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-500 sm:tw-col-start-2 sm:tw-row-start-1 sm:tw-text-sm sm:tw-text-iron-400">
          {resource.destination}
        </span>
        <Icon
          aria-hidden="true"
          className="tw-col-start-2 tw-row-span-2 tw-row-start-1 tw-size-5 tw-shrink-0 tw-text-iron-500 tw-transition group-hover:tw-translate-x-0.5 group-hover:tw-text-primary-300 motion-reduce:tw-transition-none sm:tw-col-start-3 sm:tw-row-span-1"
        />
      </Link>
    </li>
  );
}

export default function AboutMemes() {
  return (
    <article className="tw-overflow-hidden tw-bg-[#0D0D0F] tw-text-iron-100">
      <header className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10">
        <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-pb-14 tw-pt-12 sm:tw-px-6 sm:tw-pb-20 sm:tw-pt-16 lg:tw-px-8 lg:tw-pb-24 lg:tw-pt-20">
          <p className="tw-m-0 tw-mb-5 tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "about.memes.eyebrow")}
          </p>
          <h1
            className="tw-m-0 tw-max-w-[76rem] tw-text-4xl tw-font-semibold tw-leading-[1.03] tw-tracking-[-0.04em] tw-text-iron-50 sm:tw-text-6xl lg:tw-text-7xl xl:tw-text-[5.5rem]"
            id="about-memes-title"
          >
            {t(DEFAULT_LOCALE, "about.memes.title")}
          </h1>
          <div className="tw-mt-10 sm:tw-mt-14 lg:tw-mt-16">
            <ArtworkComposition />
          </div>
        </div>
      </header>

      <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 sm:tw-px-6 lg:tw-px-8">
        <section
          aria-labelledby="about-memes-shared-title"
          className="tw-grid tw-gap-8 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-py-16 sm:tw-py-20 lg:tw-grid-cols-[minmax(14rem,0.72fr)_minmax(0,1.28fr)] lg:tw-gap-20 lg:tw-py-28"
        >
          <header className="lg:tw-sticky lg:tw-top-24 lg:tw-self-start">
            <p className="tw-m-0 tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-[0.16em] tw-text-iron-500">
              {t(DEFAULT_LOCALE, "about.memes.shared.eyebrow")}
            </p>
            <h2
              className="tw-m-0 tw-max-w-lg tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
              id="about-memes-shared-title"
            >
              {t(DEFAULT_LOCALE, "about.memes.shared.title")}
            </h2>
          </header>
          <div className="tw-max-w-3xl">
            <p className="tw-m-0 tw-text-2xl tw-font-light tw-leading-9 tw-text-iron-100 sm:tw-text-3xl sm:tw-leading-[1.4]">
              {t(DEFAULT_LOCALE, "about.memes.intro")}
            </p>
            <p className="tw-m-0 tw-mt-8 tw-text-lg tw-leading-8 tw-text-iron-300">
              {t(DEFAULT_LOCALE, "about.memes.shared.lead")}
            </p>
            <p className="tw-m-0 tw-mt-6 tw-text-lg tw-leading-8 tw-text-iron-300">
              {t(DEFAULT_LOCALE, "about.memes.shared.body")}
            </p>
          </div>
        </section>

        <section
          aria-labelledby="about-memes-collection-title"
          className="tw-grid tw-gap-8 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-py-16 sm:tw-py-20 lg:tw-grid-cols-[minmax(14rem,0.72fr)_minmax(0,1.28fr)] lg:tw-gap-20 lg:tw-py-28"
        >
          <header className="lg:tw-sticky lg:tw-top-24 lg:tw-self-start">
            <p className="tw-m-0 tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-[0.16em] tw-text-iron-500">
              {t(DEFAULT_LOCALE, "about.memes.collection.eyebrow")}
            </p>
            <h2
              className="tw-m-0 tw-max-w-lg tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
              id="about-memes-collection-title"
            >
              {t(DEFAULT_LOCALE, "about.memes.collection.title")}
            </h2>
          </header>
          <div className="tw-max-w-3xl tw-space-y-6">
            <p className="tw-m-0 tw-text-lg tw-leading-8 tw-text-iron-300">
              {t(DEFAULT_LOCALE, "about.memes.collection.bodyOne")}
            </p>
            <p className="tw-m-0 tw-text-lg tw-leading-8 tw-text-iron-300">
              {t(DEFAULT_LOCALE, "about.memes.collection.bodyTwo")}
            </p>
            <p className="tw-m-0 tw-text-lg tw-leading-8 tw-text-iron-300">
              {t(DEFAULT_LOCALE, "about.memes.openMetaverse.body")}
            </p>
          </div>
        </section>

        <section
          aria-labelledby="about-memes-resources-title"
          className="tw-grid tw-gap-8 tw-py-16 sm:tw-py-20 lg:tw-grid-cols-[minmax(14rem,0.72fr)_minmax(0,1.28fr)] lg:tw-gap-20 lg:tw-py-28"
        >
          <header className="lg:tw-sticky lg:tw-top-24 lg:tw-self-start">
            <p className="tw-m-0 tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-[0.16em] tw-text-primary-300">
              {t(DEFAULT_LOCALE, "about.memes.resources.eyebrow")}
            </p>
            <h2
              className="tw-m-0 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
              id="about-memes-resources-title"
            >
              {t(DEFAULT_LOCALE, "about.memes.resources.title")}
            </h2>
          </header>
          <ul className="tw-m-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-p-0">
            {RESOURCES.map((resource) => (
              <ResourceCard key={resource.href} resource={resource} />
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
