"use client";

import {
  ArrowRightIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  LightBulbIcon,
  PhotoIcon,
  PlusCircleIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  UserCircleIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

import { useSetTitle } from "@/contexts/TitleContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type Join6529MessageKey = Extract<MessageKey, `join6529.${string}`>;
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface LinkCard {
  readonly titleKey: Join6529MessageKey;
  readonly bodyKey: Join6529MessageKey;
  readonly href: string;
  readonly icon: IconComponent;
  readonly ctaKey: Join6529MessageKey;
}

interface FlowStep {
  readonly titleKey: Join6529MessageKey;
  readonly bodyKey: Join6529MessageKey;
  readonly icon: IconComponent;
}

interface FocusSection {
  readonly titleKey: Join6529MessageKey;
  readonly bodyKey: Join6529MessageKey;
  readonly href: string;
  readonly ctaKey: Join6529MessageKey;
  readonly icon: IconComponent;
  readonly points: readonly Join6529MessageKey[];
}

interface FaqItem {
  readonly questionKey: Join6529MessageKey;
  readonly answerKey: Join6529MessageKey;
}

const WAVES_HREF = "/waves";
const CREATE_WAVE_HREF = "/waves?create=wave";
const MEMES_HREF = "/the-memes";
const MEMES_MINT_HREF = "/the-memes/mint";
const SUBSCRIPTIONS_HREF = "/about/subscriptions";

const m = (locale: SupportedLocale, key: Join6529MessageKey) =>
  t(locale, key);

const entryPaths: readonly LinkCard[] = [
  {
    titleKey: "join6529.entry.waves.title",
    bodyKey: "join6529.entry.waves.body",
    href: WAVES_HREF,
    icon: ChatBubbleLeftRightIcon,
    ctaKey: "join6529.action.openWaves",
  },
  {
    titleKey: "join6529.entry.nfts.title",
    bodyKey: "join6529.entry.nfts.body",
    href: MEMES_HREF,
    icon: PhotoIcon,
    ctaKey: "join6529.action.browseMemes",
  },
  {
    titleKey: "join6529.entry.subscriptions.title",
    bodyKey: "join6529.entry.subscriptions.body",
    href: SUBSCRIPTIONS_HREF,
    icon: BookOpenIcon,
    ctaKey: "join6529.action.learnSubscriptions",
  },
  {
    titleKey: "join6529.entry.create.title",
    bodyKey: "join6529.entry.create.body",
    href: CREATE_WAVE_HREF,
    icon: PlusCircleIcon,
    ctaKey: "join6529.action.createWave",
  },
];

const flowSteps: readonly FlowStep[] = [
  {
    titleKey: "join6529.flow.browse.title",
    bodyKey: "join6529.flow.browse.body",
    icon: SparklesIcon,
  },
  {
    titleKey: "join6529.flow.wallet.title",
    bodyKey: "join6529.flow.wallet.body",
    icon: WalletIcon,
  },
  {
    titleKey: "join6529.flow.profile.title",
    bodyKey: "join6529.flow.profile.body",
    icon: UserCircleIcon,
  },
  {
    titleKey: "join6529.flow.participate.title",
    bodyKey: "join6529.flow.participate.body",
    icon: CheckCircleIcon,
  },
];

const focusSections: readonly FocusSection[] = [
  {
    titleKey: "join6529.focus.waves.title",
    bodyKey: "join6529.focus.waves.body",
    href: WAVES_HREF,
    ctaKey: "join6529.action.openWaves",
    icon: ChatBubbleLeftRightIcon,
    points: [
      "join6529.focus.waves.point.read",
      "join6529.focus.waves.point.profile",
      "join6529.focus.waves.point.create",
    ],
  },
  {
    titleKey: "join6529.focus.nfts.title",
    bodyKey: "join6529.focus.nfts.body",
    href: MEMES_MINT_HREF,
    ctaKey: "join6529.action.openMint",
    icon: PhotoIcon,
    points: [
      "join6529.focus.nfts.point.browse",
      "join6529.focus.nfts.point.mint",
      "join6529.focus.nfts.point.careful",
    ],
  },
  {
    titleKey: "join6529.focus.subscriptions.title",
    bodyKey: "join6529.focus.subscriptions.body",
    href: SUBSCRIPTIONS_HREF,
    ctaKey: "join6529.action.learnSubscriptions",
    icon: BookOpenIcon,
    points: [
      "join6529.focus.subscriptions.point.optional",
      "join6529.focus.subscriptions.point.profile",
      "join6529.focus.subscriptions.point.eth",
    ],
  },
];

const faqItems: readonly FaqItem[] = [
  {
    questionKey: "join6529.faq.wallet.question",
    answerKey: "join6529.faq.wallet.answer",
  },
  {
    questionKey: "join6529.faq.eth.question",
    answerKey: "join6529.faq.eth.answer",
  },
  {
    questionKey: "join6529.faq.profile.question",
    answerKey: "join6529.faq.profile.answer",
  },
  {
    questionKey: "join6529.faq.browse.question",
    answerKey: "join6529.faq.browse.answer",
  },
];

export default function Join6529PageClient() {
  const locale = useBrowserLocale();
  useSetTitle(m(locale, "join6529.metadata.title"));

  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-black tw-text-iron-50">
      <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-[1180px] tw-flex-col tw-gap-9 tw-px-4 tw-py-6 sm:tw-px-6 lg:tw-px-8 lg:tw-py-10">
        <JoinHero locale={locale} />
        <EntryPathsSection locale={locale} />
        <HowJoiningWorksSection locale={locale} />
        <FocusSections locale={locale} />
        <FaqSection locale={locale} />
      </div>
    </main>
  );
}

function JoinHero({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <header className="tw-grid tw-gap-5 lg:tw-grid-cols-[minmax(0,1fr)_22rem] lg:tw-items-stretch">
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-justify-between tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-p-5 sm:tw-p-6">
        <div>
          <p className="tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
            {m(locale, "join6529.hero.eyebrow")}
          </p>
          <h1 className="tw-mb-0 tw-text-4xl tw-font-semibold tw-leading-tight tw-text-white sm:tw-text-5xl">
            {m(locale, "join6529.title")}
          </h1>
          <p className="tw-mb-0 tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300 sm:tw-text-lg">
            {m(locale, "join6529.subtitle")}
          </p>
        </div>
        <div className="tw-mt-6 tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row">
          <PrimaryLink href={WAVES_HREF}>
            {m(locale, "join6529.action.openWaves")}
          </PrimaryLink>
          <SecondaryLink href={MEMES_HREF}>
            {m(locale, "join6529.action.browseMemes")}
          </SecondaryLink>
        </div>
      </div>

      <aside className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-5">
        <div className="tw-flex tw-items-start tw-gap-3">
          <div className="tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.04] tw-text-primary-300">
            <LightBulbIcon aria-hidden="true" className="tw-h-5 tw-w-5" />
          </div>
          <div className="tw-min-w-0">
            <h2 className="tw-mb-0 tw-text-base tw-font-semibold tw-text-white">
              {m(locale, "join6529.hero.note.title")}
            </h2>
            <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
              {m(locale, "join6529.hero.note.body")}
            </p>
          </div>
        </div>
      </aside>
    </header>
  );
}

function EntryPathsSection({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section aria-labelledby="join-6529-entry-paths" className="tw-space-y-4">
      <SectionHeading
        id="join-6529-entry-paths"
        eyebrow={m(locale, "join6529.entry.eyebrow")}
        title={m(locale, "join6529.entry.heading")}
        body={m(locale, "join6529.entry.subheading")}
      />
      <div className="tw-grid tw-gap-3 md:tw-grid-cols-2">
        {entryPaths.map((path) => (
          <LinkCardItem key={path.titleKey} item={path} locale={locale} />
        ))}
      </div>
    </section>
  );
}

function HowJoiningWorksSection({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <section aria-labelledby="join-6529-flow" className="tw-space-y-4">
      <SectionHeading
        id="join-6529-flow"
        eyebrow={m(locale, "join6529.flow.eyebrow")}
        title={m(locale, "join6529.flow.heading")}
        body={m(locale, "join6529.flow.subheading")}
      />
      <ol className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0 lg:tw-grid-cols-4">
        {flowSteps.map((step, index) => (
          <FlowStepCard
            index={index}
            key={step.titleKey}
            locale={locale}
            step={step}
          />
        ))}
      </ol>
    </section>
  );
}

function FlowStepCard({
  index,
  locale,
  step,
}: {
  readonly index: number;
  readonly locale: SupportedLocale;
  readonly step: FlowStep;
}) {
  const Icon = step.icon;
  return (
    <li className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-p-4">
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500/15 tw-text-sm tw-font-semibold tw-text-primary-300">
          {index + 1}
        </span>
        <Icon aria-hidden="true" className="tw-h-5 tw-w-5 tw-text-iron-400" />
      </div>
      <h3 className="tw-mb-0 tw-mt-4 tw-text-base tw-font-semibold tw-text-white">
        {m(locale, step.titleKey)}
      </h3>
      <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
        {m(locale, step.bodyKey)}
      </p>
    </li>
  );
}

function FocusSections({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section aria-labelledby="join-6529-focus" className="tw-space-y-4">
      <SectionHeading
        id="join-6529-focus"
        eyebrow={m(locale, "join6529.focus.eyebrow")}
        title={m(locale, "join6529.focus.heading")}
        body={m(locale, "join6529.focus.subheading")}
      />
      <div className="tw-grid tw-gap-3 lg:tw-grid-cols-3">
        {focusSections.map((section) => (
          <FocusSectionCard
            key={section.titleKey}
            locale={locale}
            section={section}
          />
        ))}
      </div>
    </section>
  );
}

function FaqSection({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section aria-labelledby="join-6529-faq" className="tw-space-y-4">
      <SectionHeading
        id="join-6529-faq"
        eyebrow={m(locale, "join6529.faq.eyebrow")}
        title={m(locale, "join6529.faq.heading")}
        body={m(locale, "join6529.faq.subheading")}
      />
      <div className="tw-grid tw-gap-3 md:tw-grid-cols-2">
        {faqItems.map((item) => (
          <details
            className="tw-group tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-p-4 open:tw-bg-white/[0.045]"
            key={item.questionKey}
          >
            <summary className="tw-flex tw-cursor-pointer tw-list-none tw-items-start tw-gap-3 tw-text-left marker:tw-hidden">
              <QuestionMarkCircleIcon
                aria-hidden="true"
                className="tw-mt-0.5 tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-primary-300"
              />
              <span className="tw-min-w-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-white">
                {m(locale, item.questionKey)}
              </span>
            </summary>
            <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
              {m(locale, item.answerKey)}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  body,
}: {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
}) {
  return (
    <div className="tw-max-w-3xl">
      <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
        {eyebrow}
      </p>
      <h2
        className="tw-mb-0 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-white"
        id={id}
      >
        {title}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
        {body}
      </p>
    </div>
  );
}

function LinkCardItem({
  item,
  locale,
}: {
  readonly item: LinkCard;
  readonly locale: SupportedLocale;
}) {
  const Icon = item.icon;
  return (
    <Link
      className="tw-group tw-flex tw-min-h-[158px] tw-flex-col tw-justify-between tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-4 tw-text-inherit tw-no-underline tw-transition-colors hover:tw-border-primary-400/45 hover:tw-bg-primary-500/[0.08] hover:tw-text-inherit hover:tw-no-underline focus:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300"
      href={item.href}
    >
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
        <span className="tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.04] tw-text-primary-300">
          <Icon aria-hidden="true" className="tw-h-5 tw-w-5" />
        </span>
        <ArrowRightIcon
          aria-hidden="true"
          className="tw-h-4 tw-w-4 tw-text-iron-500 tw-transition group-hover:tw-translate-x-0.5 group-hover:tw-text-primary-300"
        />
      </div>
      <div className="tw-mt-5">
        <h3 className="tw-mb-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-white">
          {m(locale, item.titleKey)}
        </h3>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
          {m(locale, item.bodyKey)}
        </p>
        <span className="tw-mt-4 tw-inline-flex tw-text-sm tw-font-semibold tw-text-primary-300">
          {m(locale, item.ctaKey)}
        </span>
      </div>
    </Link>
  );
}

function FocusSectionCard({
  locale,
  section,
}: {
  readonly locale: SupportedLocale;
  readonly section: FocusSection;
}) {
  const Icon = section.icon;
  return (
    <article className="tw-flex tw-min-h-[320px] tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-p-5">
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.04] tw-text-primary-300">
          <Icon aria-hidden="true" className="tw-h-5 tw-w-5" />
        </span>
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-white">
          {m(locale, section.titleKey)}
        </h3>
      </div>
      <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
        {m(locale, section.bodyKey)}
      </p>
      <ul className="tw-mb-0 tw-mt-5 tw-flex tw-list-none tw-flex-col tw-gap-3 tw-p-0">
        {section.points.map((point) => (
          <li className="tw-flex tw-gap-3 tw-text-sm tw-leading-6" key={point}>
            <CheckCircleIcon
              aria-hidden="true"
              className="tw-mt-0.5 tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-primary-300"
            />
            <span className="tw-text-iron-300">{m(locale, point)}</span>
          </li>
        ))}
      </ul>
      <div className="tw-mt-auto tw-pt-5">
        <SecondaryLink href={section.href}>
          {m(locale, section.ctaKey)}
        </SecondaryLink>
      </div>
    </article>
  );
}

function PrimaryLink({
  children,
  href,
}: {
  readonly children: string;
  readonly href: string;
}) {
  return (
    <Link
      className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-black tw-no-underline tw-transition-colors hover:tw-bg-iron-200 hover:tw-no-underline focus:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/70"
      href={href}
    >
      <span>{children}</span>
      <ArrowRightIcon aria-hidden="true" className="tw-h-4 tw-w-4" />
    </Link>
  );
}

function SecondaryLink({
  children,
  href,
}: {
  readonly children: string;
  readonly href: string;
}) {
  return (
    <Link
      className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.04] tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-no-underline tw-transition-colors hover:tw-border-primary-400/45 hover:tw-bg-primary-500/[0.08] hover:tw-text-white hover:tw-no-underline focus:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300"
      href={href}
    >
      <span>{children}</span>
      <ArrowRightIcon aria-hidden="true" className="tw-h-4 tw-w-4" />
    </Link>
  );
}
