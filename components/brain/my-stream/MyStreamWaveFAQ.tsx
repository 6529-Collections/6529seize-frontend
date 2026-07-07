"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { MyStreamWaveTab } from "@/types/waves.types";
import {
  ArrowUpTrayIcon,
  ArrowTopRightOnSquareIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  CheckIcon,
  ChevronDownIcon,
  FlagIcon,
  InformationCircleIcon,
  NoSymbolIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import React, { useEffect, useId, useRef, useState } from "react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { useContentTab } from "../ContentTabContext";
import { useLayout } from "./layout/LayoutContext";

interface MyStreamWaveFAQProps {
  readonly wave: ApiWave;
}

type FaqSectionId =
  | "intro"
  | "goals"
  | "not-goals"
  | "voting"
  | "submission"
  | "tdh"
  | "minting";

interface FaqSection {
  readonly id: FaqSectionId;
  readonly title: string;
  readonly Icon: ComponentType<SVGProps<SVGSVGElement>>;
  readonly Content: ComponentType;
}

interface QaItem {
  readonly question: string;
  readonly answer: ReactNode;
}

interface IconListItem {
  readonly key: string;
  readonly type: "check" | "cross";
  readonly content: ReactNode;
}

interface TimelinePhase {
  readonly label: string;
  readonly time: string;
  readonly timeClassName: string;
  readonly dotClassName: string;
  readonly description: string;
}

const DEFAULT_OPEN_SECTION_ID: FaqSectionId = "intro";

const LINKS = {
  artistBrief:
    "https://docs.google.com/presentation/d/1Aejko31qFkAIyu-Qc3Ao9tHQGbbaFCIcqrBj_kZzo_M/edit#slide=id.p1",
  nominationWave: "https://6529.io/waves/0ecb95d0-d8f2-48e8-8137-bfa71ee8593c",
  faqWave: "https://6529.io/waves/e2dae377-d27d-4a69-8b77-38d88fad4d01",
  tdhTheory: "https://x.com/punk6529/status/1906753171751412006",
  tdhFormula: "https://6529.io/network/tdh",
  subscriptions: "https://6529.io/about/subscriptions",
} as const;

const CONTAINER_CLASS_NAME =
  "tw-w-full tw-flex tw-flex-col tw-pt-4 lg:tw-pr-2 tw-overflow-y-auto tw-no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-h-full";

const FAQ_PANEL_ANIMATION_SECONDS = 0.32;

const FAQ_PANEL_TRANSITION = {
  height: {
    duration: FAQ_PANEL_ANIMATION_SECONDS,
    ease: [0.22, 1, 0.36, 1],
  },
  opacity: { duration: 0.18, ease: "easeOut" },
  y: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
} as const;

const FAQ_SCROLL_ALIGNMENT_DELAY_MS = FAQ_PANEL_ANIMATION_SECONDS * 1000 + 40;

const INTRO_QA: readonly QaItem[] = [
  {
    question: "What are we doing here?",
    answer: "Voting for the next The Memes card to be minted",
  },
  { question: "Who is voting?", answer: "Everyone with TDH" },
  { question: "What are we voting with?", answer: "TDH" },
  { question: "How do I learn more?", answer: "Keep reading" },
];

const EXCELLENCE_TYPES = [
  "Artistic excellence",
  "Memetic excellence",
  "Story-value excellence",
  "Several of the above",
] as const;

const NOT_GOALS: readonly IconListItem[] = [
  {
    key: "vandalize",
    type: "cross",
    content: "We should not vandalize the collection for joke value.",
  },
  {
    key: "sandbox",
    type: "cross",
    content:
      "The Memes are not a sandbox for goofing around among friends – they are, arguably, the most important large NFT art collection of 2022-2025.",
  },
  {
    key: "thirty-years",
    type: "check",
    content: (
      <>
        Our decisions should stand the test of time –{" "}
        <span className="tw-italic">
          &quot;can you imagine someone wanting to own the card 30 years from
          now?&quot;
        </span>{" "}
        is a pretty good test.
      </>
    ),
  },
  {
    key: "weird-excellent",
    type: "check",
    content:
      "Should we do weird things in The Memes? Sure, so long as they are also excellent.",
  },
  {
    key: "weird-casual",
    type: "cross",
    content: "Should we do weird casual things that are not excellent? No.",
  },
];

const VOTING_PHASES: readonly TimelinePhase[] = [
  {
    label: "Pre-voting",
    time: ">24h before",
    timeClassName: "tw-text-iron-500",
    dotClassName: "tw-border-iron-500",
    description:
      "You can add and remove TDH (Current Vote) to one or more submissions but it does not impact the final decision.",
  },
  {
    label: "Voting",
    time: "0-24h before",
    timeClassName: "tw-text-primary-300",
    dotClassName:
      "tw-border-primary-400 tw-shadow-[0_0_10px_rgba(59,130,246,0.35)]",
    description:
      "You can add and remove TDH (Current Vote) to one more submissions, but it does impact the final decision as it starts counting towards the final 24HV. If you vote 100 TDH for the whole 24-hour period, it contributes 100 to the final vote. If you vote 100 TDH for 12 hours of the last 24 hours, it contributes 50 to the final vote.",
  },
  {
    label: "Selection",
    time: "Checkpoint",
    timeClassName: "tw-text-emerald-400",
    dotClassName:
      "tw-border-emerald-400 tw-shadow-[0_0_10px_rgba(16,185,129,0.35)]",
    description: "The 24HV value at checkpoint time",
  },
];

const VOTING_QA: readonly QaItem[] = [
  { question: "Can you add and remove TDH at any time?", answer: "Yes" },
  { question: "Can you give TDH to more than one card?", answer: "Yes" },
  {
    question: "How much of your TDH can you use?",
    answer:
      "All of it - the aggregate of your positive and negative votes can add up to your total TDH",
  },
  { question: "Does your TDH get destroyed by voting?", answer: "No" },
  {
    question: "What happens when a card I voted for gets selected?",
    answer: "You get your TDH back",
  },
  {
    question:
      "What happens when I get TDH back from removing it from a card I voted for?",
    answer:
      "You get Current Vote TDH instantly but 24HV TDH decays and accrues over 24 hours",
  },
];

const ELIGIBILITY_RULES: readonly IconListItem[] = [
  {
    key: "meme-card-artist",
    type: "check",
    content: "You have previously dropped a Meme Card",
  },
  {
    key: "memes-nominee-rep",
    type: "check",
    content:
      'You have been nominated in a decentralized way by one or more people giving you at least 50,000 "MemesNominee" rep',
  },
];

const SUBMISSION_QUALITY_NOTES = [
  "High quality submissions, in line with the collection mission, will do very well",
  "Low effort submissions will not get selected",
] as const;

const MINT_STATS = [
  { label: "Mint price", value: "0.06529 ETH" },
  { label: "Edition sizes", value: "In the 300s right now" },
] as const;

function cx(...classes: ReadonlyArray<string | false | null | undefined>) {
  return classes
    .filter((className): className is string => Boolean(className))
    .join(" ");
}

function FaqLink({
  href,
  children,
  className,
}: Readonly<{
  href: string;
  children: string;
  className?: string;
}>) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${children} (opens in a new tab)`}
      className={cx(
        "tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-sm tw-text-sm tw-font-medium tw-text-primary-300 tw-no-underline tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-primary-400",
        className
      )}
    >
      <span>{children}</span>
      <ArrowTopRightOnSquareIcon
        className="tw-size-3.5 tw-flex-shrink-0 tw-opacity-70"
        aria-hidden="true"
      />
    </Link>
  );
}

function QaPair({
  question,
  children,
}: Readonly<{
  question: string;
  children: ReactNode;
}>) {
  return (
    <div className="tw-space-y-1">
      <h4 className="tw-mb-0 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-50">
        {question}
      </h4>
      <div className="tw-text-sm tw-leading-6 tw-text-iron-400">{children}</div>
    </div>
  );
}

function QaList({
  items,
  className,
}: Readonly<{
  items: readonly QaItem[];
  className?: string;
}>) {
  return (
    <div className={cx("tw-flex tw-flex-col tw-gap-5", className)}>
      {items.map((item) => (
        <QaPair key={item.question} question={item.question}>
          {item.answer}
        </QaPair>
      ))}
    </div>
  );
}

function NeatList({ items }: Readonly<{ items: readonly string[] }>) {
  return (
    <ul className="tw-my-4 tw-flex tw-list-none tw-flex-col tw-gap-3 tw-p-0">
      {items.map((item) => (
        <li
          key={item}
          className="tw-relative tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 before:tw-absolute before:tw-left-0 before:tw-top-[0.7rem] before:tw-size-1 before:tw-rounded-full before:tw-bg-iron-500 before:tw-content-['']"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function AttentionBox({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="tw-my-6 tw-border-y-0 tw-border-l-2 tw-border-r-0 tw-border-solid tw-border-white/10 tw-py-1 tw-pl-4">
      {children}
    </div>
  );
}

function IconList({ items }: Readonly<{ items: readonly IconListItem[] }>) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {items.map((item) => {
        const Icon = item.type === "check" ? CheckIcon : XMarkIcon;
        const iconClassName =
          item.type === "check"
            ? "tw-text-emerald-400"
            : "tw-text-red tw-opacity-80";

        return (
          <div
            key={item.key}
            className="tw-flex tw-items-start tw-gap-3 tw-text-sm tw-leading-6 tw-text-iron-300"
          >
            <Icon
              className={cx(
                "tw-mt-1 tw-size-4 tw-flex-shrink-0",
                iconClassName
              )}
              aria-hidden="true"
            />
            <span>{item.content}</span>
          </div>
        );
      })}
    </div>
  );
}

function VotingTimeline() {
  return (
    <div className="tw-relative tw-my-6 tw-flex tw-flex-col tw-gap-6 tw-pl-5">
      <div className="tw-absolute tw-bottom-1.5 tw-left-1 tw-top-1.5 tw-w-px tw-bg-gradient-to-b tw-from-iron-700 tw-via-primary-500/50 tw-to-emerald-500/70 tw-opacity-40" />
      {VOTING_PHASES.map((phase) => (
        <div key={phase.label} className="tw-relative">
          <div
            className={cx(
              "tw-absolute -tw-left-5 tw-top-1.5 tw-z-10 tw-size-2.5 tw-rounded-full tw-border-2 tw-border-solid tw-bg-iron-950",
              phase.dotClassName
            )}
          />
          <div className="tw-mb-1 tw-flex tw-items-end tw-justify-between tw-gap-3">
            <h4 className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
              {phase.label}
            </h4>
            <span
              className={cx(
                "tw-flex-shrink-0 tw-text-[11px] tw-font-medium tw-uppercase tw-leading-4 tw-tracking-wider",
                phase.timeClassName
              )}
            >
              {phase.time}
            </span>
          </div>
          <p className="tw-mb-0 tw-text-[13px] tw-leading-6 tw-text-iron-300">
            {phase.description}
          </p>
        </div>
      ))}
    </div>
  );
}

function StatsRow({
  items,
}: Readonly<{
  items: ReadonlyArray<{ readonly label: string; readonly value: string }>;
}>) {
  return (
    <div className="tw-my-5 tw-flex tw-flex-col tw-gap-5 tw-border-x-0 tw-border-y tw-border-solid tw-border-white/[0.04] tw-py-4 sm:tw-flex-row sm:tw-gap-8">
      {items.map((item) => (
        <div key={item.label}>
          <p className="tw-mb-1 tw-text-[11px] tw-font-medium tw-uppercase tw-leading-4 tw-tracking-wider tw-text-iron-500">
            {item.label}
          </p>
          <p className="tw-mb-0 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-50">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function IntroContent() {
  return <QaList items={INTRO_QA} />;
}

function GoalsContent() {
  return (
    <>
      <p className="tw-mb-4">
        We are engaging in decentralized, networked curation of an important NFT
        art collection focused on decentralization.
      </p>
      <p className="tw-mb-4">
        The goal is excellence, defined as a collection that will age well over
        decades.
      </p>
      <p className="tw-mb-2 tw-text-iron-200">
        Excellence can come in many formats:
      </p>
      <NeatList items={EXCELLENCE_TYPES} />
      <AttentionBox>
        <p className="tw-mb-3 tw-font-medium tw-text-iron-100">
          There is a long artist brief here that both artists and first-time
          voters should read.
        </p>
        <p className="tw-mb-4 tw-text-[13px] tw-leading-6 tw-text-iron-400">
          It is a much more detailed FAQ than this one and if you want to be
          seriously engaged with this effort, you must read it! Otherwise you
          will bother everyone with basic questions that you could have answered
          by reading the presentation and we will quietly think a little less of
          you and nobody wants that.
        </p>
        <FaqLink href={LINKS.artistBrief}>Read Artist Brief</FaqLink>
      </AttentionBox>
      <p className="tw-mb-0 tw-text-xs tw-leading-5 tw-text-iron-500">
        These FAQs are a summary of this presentation but not a substitute for
        reading it.
      </p>
    </>
  );
}

function NotGoalsContent() {
  return <IconList items={NOT_GOALS} />;
}

function VotingContent() {
  return (
    <>
      <p className="tw-mb-4">
        Voting is a continuous leaderboard – art is submitted and it stays on
        the leaderboard until it is removed by the artist who submitted it.
      </p>
      <p className="tw-mb-4">
        Three times a week, the top submission on the leaderboard is selected to
        be the next card minted.
      </p>
      <p className="tw-mb-4">
        The checkpoint times are{" "}
        <span className="tw-font-medium tw-text-iron-100">
          Monday / Wednesday / Friday at 17:00 GMT
        </span>
        . The card will be minted at the next The Memes mint (e.g. Wednesday /
        Friday / Monday).
      </p>
      <p className="tw-mb-4">
        The metric that determines the winner is{" "}
        <span className="tw-font-medium tw-text-iron-100">
          24-Hour Vote (24HV)
        </span>
        .
      </p>
      <p className="tw-mb-4">
        24HV is a weighted average of how much TDH was voted at any point in
        time (&quot;Current Vote&quot;) during the last 24 hours before the
        checkpoint.
      </p>
      <p className="tw-mb-7 tw-text-iron-400">
        The purpose of using 24HV is to avoid last second gaming of the vote.
        You can sort by 24HV and Current Vote. 24HV converges to Current Vote
        over a 24 hour period (noting that Current Vote is constantly changing).
      </p>

      <h4 className="tw-mb-2 tw-text-sm tw-font-medium tw-text-iron-50">
        You can think of the voting in three phases:
      </h4>
      <VotingTimeline />

      <QaList
        items={VOTING_QA}
        className="tw-mt-8 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.05] tw-pt-6"
      />
    </>
  );
}

function SubmissionContent() {
  return (
    <>
      <p className="tw-mb-4">
        There are two ways you can be eligible to submit:
      </p>
      <div className="tw-mb-8">
        <IconList items={ELIGIBILITY_RULES} />
      </div>

      <div className="tw-flex tw-flex-col tw-gap-6">
        <QaPair question="What if I do not know how to get nominated?">
          <p className="tw-mb-3">
            Go to the The Memes - Seeking Nomination wave and share your
            existing work and story and someone may nominate you:
          </p>
          <FaqLink href={LINKS.nominationWave}>Nomination Wave</FaqLink>
        </QaPair>

        <p className="tw-mb-0">
          Once you are eligible, you can submit up to 3 cards at a time. If you
          remove a submission or one of your submissions is selected to be
          minted, you can submit another card to fill that spot.
        </p>
      </div>

      <AttentionBox>
        <p className="tw-mb-2 tw-font-medium tw-text-iron-100">
          It is very important to read the artist brief so that you don&apos;t
          waste your time:
        </p>
        <NeatList items={SUBMISSION_QUALITY_NOTES} />
      </AttentionBox>

      <div className="tw-flex tw-flex-col tw-gap-6">
        <QaPair question="How do I get some artistic feedback as in the past?">
          DM @6529er, @teexels and @darrensrs into a group chat
        </QaPair>
        <QaPair question="What if I have general questions?">
          <p className="tw-mb-3">
            Go to the The Memes - FAQ wave (after you have read the artist
            brief)
          </p>
          <FaqLink href={LINKS.faqWave}>FAQ Wave</FaqLink>
        </QaPair>
      </div>
    </>
  );
}

function TdhContent() {
  return (
    <>
      <p className="tw-mb-2">TDH is the central metric of 6529 ecosystem.</p>
      <p className="tw-mb-6">
        It is a quantitative metric reflecting how long you have held a 6529
        NFT, how many you have held and how diverse your holdings are. It
        primarily rewards longevity.
      </p>
      <div className="tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-3">
        <FaqLink href={LINKS.tdhTheory}>Theory</FaqLink>
        <FaqLink href={LINKS.tdhFormula}>Formula</FaqLink>
      </div>
    </>
  );
}

function MintingContent() {
  return (
    <>
      <p className="tw-mb-0">
        Everything about minting a Meme Card stays unchanged.
      </p>
      <StatsRow items={MINT_STATS} />
      <p className="tw-mb-4">
        You can mint based on the Allowlist Phase you are in based on your TDH
        (P0, P1, P2) or public (if it goes to public).
      </p>
      <p className="tw-mb-3">
        You can get priority within your Phase by subscribing in advance from
        your profile page. Details are here:
      </p>
      <FaqLink href={LINKS.subscriptions} className="tw-mb-8">
        Subscriptions
      </FaqLink>
      <p className="tw-mb-0 tw-font-medium tw-text-iron-100">Welcome aboard!</p>
    </>
  );
}

const FAQ_SECTIONS: readonly FaqSection[] = [
  {
    id: "intro",
    title: "Intro",
    Icon: InformationCircleIcon,
    Content: IntroContent,
  },
  {
    id: "goals",
    title: "What are the goals of the voting?",
    Icon: FlagIcon,
    Content: GoalsContent,
  },
  {
    id: "not-goals",
    title: "What Are Not The Goals Of The Voting",
    Icon: NoSymbolIcon,
    Content: NotGoalsContent,
  },
  {
    id: "voting",
    title: "How Does Voting Work?",
    Icon: ChartBarIcon,
    Content: VotingContent,
  },
  {
    id: "submission",
    title: "How Does Submission Work?",
    Icon: ArrowUpTrayIcon,
    Content: SubmissionContent,
  },
  {
    id: "tdh",
    title: "What is TDH?",
    Icon: ArrowTrendingUpIcon,
    Content: TdhContent,
  },
  {
    id: "minting",
    title: "Minting a Meme Card",
    Icon: SparklesIcon,
    Content: MintingContent,
  },
];

function FaqAccordionItem({
  section,
  sectionRef,
  isOpen,
  onToggle,
}: Readonly<{
  section: FaqSection;
  sectionRef: (element: HTMLElement | null) => void;
  isOpen: boolean;
  onToggle: () => void;
}>) {
  const panelId = useId();
  const buttonId = `${panelId}-button`;
  const { Content, Icon } = section;

  return (
    <section
      ref={sectionRef}
      className={cx(
        "tw-group tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-backdrop-blur-xl tw-transition-all tw-duration-300 tw-ease-out",
        isOpen
          ? "tw-border-primary-500/50 tw-bg-[#171b24] tw-shadow-[0_12px_30px_-10px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)]"
          : "tw-border-iron-700/70 tw-bg-iron-900/75 tw-shadow-[0_4px_20px_-5px_rgba(0,0,0,0.42)] desktop-hover:hover:-tw-translate-y-0.5 desktop-hover:hover:tw-border-iron-600/80 desktop-hover:hover:tw-bg-iron-800/70 desktop-hover:hover:tw-shadow-[0_8px_25px_-5px_rgba(0,0,0,0.6)]"
      )}
    >
      <h3 className="tw-mb-0">
        <button
          id={buttonId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={isOpen ? panelId : undefined}
          onClick={onToggle}
          className="tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-bg-transparent tw-px-4 tw-py-3 tw-text-left tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400/80 sm:tw-px-5 sm:tw-py-4 md:tw-py-3.5"
        >
          <span className="tw-flex tw-min-w-0 tw-items-center">
            <span
              className={cx(
                "tw-mr-3 tw-hidden tw-size-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-text-iron-400 tw-transition-colors tw-duration-200 sm:tw-flex",
                isOpen
                  ? "tw-text-primary-300"
                  : "desktop-hover:group-hover:tw-text-iron-50"
              )}
            >
              <Icon className="tw-size-4" aria-hidden="true" />
            </span>
            <span className="tw-min-w-0 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-50 md:tw-text-base">
              {section.title}
            </span>
          </span>
          <ChevronDownIcon
            className={cx(
              "tw-size-5 tw-flex-shrink-0 tw-text-iron-600 tw-transition-all tw-duration-300",
              isOpen && "tw-rotate-180 tw-text-iron-50"
            )}
            aria-hidden="true"
          />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0, y: -4 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -2 }}
            transition={FAQ_PANEL_TRANSITION}
            className="tw-overflow-hidden"
          >
            <div className="tw-px-4 tw-pb-5 tw-text-sm tw-leading-6 tw-text-iron-300 sm:tw-px-5 sm:tw-pb-6 md:tw-pl-14">
              <Content />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

const MyStreamWaveFAQ: React.FC<MyStreamWaveFAQProps> = ({ wave: _wave }) => {
  const { setActiveContentTab } = useContentTab();
  const { faqViewStyle } = useLayout();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Partial<Record<FaqSectionId, HTMLElement | null>>>(
    {}
  );
  const [openSectionId, setOpenSectionId] = useState<FaqSectionId | null>(
    DEFAULT_OPEN_SECTION_ID
  );
  const [pendingScrollSectionId, setPendingScrollSectionId] =
    useState<FaqSectionId | null>(null);

  useEffect(() => {
    setActiveContentTab(MyStreamWaveTab.FAQ);
  }, [setActiveContentTab]);

  useEffect(() => {
    if (!pendingScrollSectionId || pendingScrollSectionId !== openSectionId) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      const scrollContainer = scrollContainerRef.current;
      const targetSection = sectionRefs.current[pendingScrollSectionId];

      if (scrollContainer && targetSection) {
        const containerTop = scrollContainer.getBoundingClientRect().top;
        const sectionTop = targetSection.getBoundingClientRect().top;

        scrollContainer.scrollTo({
          top: scrollContainer.scrollTop + sectionTop - containerTop,
          behavior: "smooth",
        });
      }

      setPendingScrollSectionId(null);
    }, FAQ_SCROLL_ALIGNMENT_DELAY_MS);

    return () => globalThis.clearTimeout(timeoutId);
  }, [openSectionId, pendingScrollSectionId]);

  const handleSectionToggle = (sectionId: FaqSectionId) => {
    const nextOpenSectionId = openSectionId === sectionId ? null : sectionId;

    setOpenSectionId(nextOpenSectionId);
    setPendingScrollSectionId(nextOpenSectionId);
  };

  return (
    <div
      ref={scrollContainerRef}
      className={CONTAINER_CLASS_NAME}
      style={faqViewStyle}
    >
      <div className="tw-w-full tw-px-2 tw-pb-4 sm:tw-px-4">
        <div className="tw-flex tw-flex-col tw-gap-3">
          {FAQ_SECTIONS.map((section) => (
            <FaqAccordionItem
              key={section.id}
              section={section}
              sectionRef={(element) => {
                sectionRefs.current[section.id] = element;
              }}
              isOpen={openSectionId === section.id}
              onToggle={() => handleSectionToggle(section.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyStreamWaveFAQ;
