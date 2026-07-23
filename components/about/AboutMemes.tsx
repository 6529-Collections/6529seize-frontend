"use client";

import {
  ArrowRightIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { AboutSection } from "@/types/enums";

type Resource = {
  readonly titleKey: MessageKey;
  readonly href: string;
  readonly destination: string;
  readonly opensNewTab: boolean;
};

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
          <div className="tw-mt-10 tw-text-center sm:tw-mt-14 lg:tw-mt-16">
            <Image
              unoptimized
              loading="eager"
              priority
              width="0"
              height="0"
              style={{
                height: "auto",
                width: "auto",
                maxHeight: "400px",
                maxWidth: "100%",
              }}
              src="/memes-preview.png"
              alt="The Memes"
            />
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
