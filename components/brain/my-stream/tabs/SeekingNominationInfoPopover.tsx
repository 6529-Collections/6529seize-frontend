"use client";

import {
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  LightBulbIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import HoverCard from "@/components/utils/tooltip/HoverCard";
import { MEMES_FAQ_WAVE_URL } from "./memesNomination.constants";

const INFO_BUTTON_CLASS =
  "hover:tw-text-primary-200 tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-primary-500/60 tw-bg-primary-500/10 tw-text-primary-300 tw-shadow-sm tw-transition tw-duration-300 tw-ease-out hover:tw-border-primary-400 hover:tw-bg-primary-500/15 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500";

const NOMINATION_STEPS = [
  {
    title: "Share your work",
    description:
      "Post finished work, sketches, or portfolio links in this wave.",
    Icon: ChatBubbleLeftIcon,
  },
  {
    title: "Earn community rep",
    description: "Members can give you MemesNominee REP for great work.",
    Icon: UserGroupIcon,
  },
  {
    title: "Reach 50k REP",
    description:
      "Once you hit 50,000, you're eligible for Main Stage submissions.",
    Icon: BoltIcon,
  },
] as const;

function SeekingNominationInfoContent() {
  return (
    <div className="tw-w-[min(88vw,21rem)]">
      <div className="tw-mb-5 tw-flex tw-items-center tw-gap-3">
        <span className="tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-primary-500/50 tw-bg-primary-500/15 tw-text-primary-200">
          <LightBulbIcon className="tw-size-4.5" />
        </span>
        <p className="tw-mb-0 tw-text-base tw-font-semibold tw-leading-tight tw-text-iron-50">
          How nomination works
        </p>
      </div>

      <ol className="tw-mb-5 tw-list-none tw-space-y-4 tw-p-0">
        {NOMINATION_STEPS.map((step, index) => (
          <li
            key={step.title}
            className="tw-grid tw-grid-cols-[2.25rem_1fr] tw-gap-3"
          >
            <div className="tw-flex tw-justify-center">
              <span className="tw-flex tw-size-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-primary-500/60 tw-bg-primary-500/15 tw-text-sm tw-font-semibold tw-text-primary-300">
                {index + 1}
              </span>
            </div>
            <div className="tw-min-w-0">
              <div className="tw-mb-1.5 tw-flex tw-items-center tw-gap-2">
                <step.Icon className="tw-size-4 tw-flex-shrink-0 tw-text-primary-300" />
                <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-50">
                  {step.title}
                </p>
              </div>
              <p className="tw-mb-0 tw-text-[12.5px] tw-font-medium tw-leading-5 tw-text-iron-400">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-3">
        <a
          href={MEMES_FAQ_WAVE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-inline-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-px-3 tw-py-2 tw-text-[12.5px] tw-font-semibold tw-text-iron-300 tw-no-underline tw-transition-colors desktop-hover:hover:tw-bg-white/[0.03] desktop-hover:hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500"
        >
          <DocumentTextIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
          Read the full FAQ
          <ArrowTopRightOnSquareIcon className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-text-iron-500" />
        </a>
      </div>
    </div>
  );
}

export default function SeekingNominationInfoPopover() {
  return (
    <HoverCard
      content={<SeekingNominationInfoContent />}
      ariaLabel="How nomination works"
      placement="bottom"
      delayShow={150}
      delayHide={0}
      offset={12}
    >
      <button
        type="button"
        aria-label="How nomination works"
        className={INFO_BUTTON_CLASS}
      >
        <InformationCircleIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
      </button>
    </HoverCard>
  );
}
