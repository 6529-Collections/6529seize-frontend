"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { HOME_ACTION_ARROW_CLASSES } from "../homeInteractionStyles";

const TOPICS = [
  { id: "art", href: "/the-memes", trackingAction: "Browse Memes" },
  { id: "waves", href: "/waves", trackingAction: "Browse Waves" },
  {
    id: "voting",
    href: "/waves/b6128077-ea78-4dd9-b381-52c4eadb2077",
    trackingAction: "How voting works",
  },
] as const;

const MEME_THUMBNAILS = [
  { id: 1, className: "-tw-rotate-12" },
  { id: 2, className: "tw-z-10 -tw-ml-2 tw-h-[52px]" },
  { id: 4, className: "-tw-ml-2 tw-rotate-12" },
];
// Fixed public wave avatars; the illustration does not query live activity.
const WAVE_TILES = [
  "memes-main-stage",
  "memes-chat",
  "maybes-dive-bar",
  "tech-feedback",
] as const;

export default function HomeWhatIs6529() {
  const locale = useBrowserLocale();

  return (
    <section
      aria-labelledby="home-what-is-title"
      data-home-section="What is 6529?"
      className="tw-px-4 tw-pb-20 tw-pt-10 md:tw-px-6 md:tw-pb-24 md:tw-pt-16 lg:tw-px-8 lg:tw-pb-32 lg:tw-pt-12"
    >
      <div className="tw-mx-auto tw-max-w-[1200px]">
        <h2
          id="home-what-is-title"
          className="tw-mb-7 tw-mt-0 tw-text-[28px] tw-font-semibold tw-leading-[1.17] tw-tracking-[-0.04em] tw-text-iron-50 md:tw-mb-[38px] md:tw-text-[38px] md:tw-leading-[1.14]"
        >
          {t(locale, "home.whatIs.title")}
        </h2>
        <div className="tw-grid tw-grid-cols-1 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.08] md:tw-grid-cols-3 md:tw-divide-x md:tw-divide-y-0">
          {TOPICS.map(({ id, href, trackingAction }) => (
            <article
              key={id}
              className="tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-py-[26px] first:tw-pt-0 last:tw-pb-0 md:tw-px-6 md:tw-py-0 md:first:tw-pl-0 md:last:tw-pr-0 lg:tw-px-10"
            >
              <div
                aria-hidden="true"
                className="tw-mb-4 tw-flex tw-h-[54px] tw-shrink-0 tw-items-center tw-gap-3 md:tw-mb-5 md:tw-h-[62px]"
              >
                {id === "art" && (
                  <div className="tw-flex tw-items-center tw-pl-1">
                    {MEME_THUMBNAILS.map((meme) => (
                      <span
                        key={meme.id}
                        className={`tw-relative tw-block tw-h-12 tw-w-9 tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-950 ${meme.className}`}
                      >
                        <Image
                          src={`/profile-cms/templates/memes/${meme.id}.webp`}
                          alt=""
                          fill
                          sizes="36px"
                          className="tw-object-contain"
                        />
                      </span>
                    ))}
                  </div>
                )}
                {id === "waves" && (
                  <>
                    <div className="tw-flex -tw-space-x-2">
                      {WAVE_TILES.map((tile) => (
                        <span
                          key={tile}
                          className="tw-relative tw-block tw-size-[34px] tw-overflow-hidden tw-rounded-lg tw-border-2 tw-border-solid tw-border-black tw-bg-iron-800"
                        >
                          <Image
                            src={`/home/waves/${tile}.webp`}
                            alt=""
                            width={96}
                            height={96}
                            unoptimized
                            className="tw-h-full tw-w-full tw-object-cover"
                          />
                        </span>
                      ))}
                    </div>
                    <span className="tw-inline-flex tw-items-center tw-gap-2 tw-whitespace-nowrap tw-text-[11px] tw-text-iron-400">
                      <span className="tw-size-1 tw-rounded-full tw-bg-emerald-400" />
                      <span>{t(locale, "home.whatIs.live")}</span>
                    </span>
                  </>
                )}
                {id === "voting" && (
                  <div className="tw-flex tw-w-[180px] tw-max-w-full tw-flex-col tw-gap-[7px]">
                    <span className="tw-h-[5px] tw-rounded-sm tw-bg-[#e8c66a]" />
                    <span className="tw-h-[5px] tw-w-[89%] tw-rounded-sm tw-bg-iron-500" />
                    <span className="tw-h-[5px] tw-w-[83%] tw-rounded-sm tw-bg-iron-600" />
                  </div>
                )}
              </div>
              <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-[1.35] tw-tracking-[-0.025em] tw-text-iron-100 md:tw-max-w-[270px] md:tw-text-[19px]">
                {t(locale, `home.whatIs.${id}.title`)}
              </h3>
              <p className="tw-mb-3.5 tw-mt-2.5 tw-max-w-[320px] tw-text-sm tw-leading-[1.65] tw-text-iron-400 md:tw-mb-6 md:tw-mt-3 md:tw-max-w-[300px] md:tw-text-[15px]">
                {t(locale, `home.whatIs.${id}.description`)}
              </p>
              <Link
                href={href}
                data-home-action={trackingAction}
                className="tw-group/action tw-mt-auto tw-inline-flex tw-min-h-10 tw-items-center tw-gap-2 tw-rounded-sm tw-text-xs tw-font-medium tw-leading-relaxed tw-text-iron-200 tw-no-underline tw-transition-colors tw-duration-200 focus-visible:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-4 focus-visible:tw-ring-offset-black desktop-hover:hover:tw-text-white motion-reduce:tw-transition-none md:tw-min-h-8 md:tw-text-[13px]"
              >
                <span className="tw-underline tw-decoration-iron-600 tw-decoration-1 tw-underline-offset-[5px]">
                  {t(locale, `home.whatIs.${id}.action`)}
                </span>
                <ArrowRightIcon
                  className={HOME_ACTION_ARROW_CLASSES}
                  aria-hidden
                />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
