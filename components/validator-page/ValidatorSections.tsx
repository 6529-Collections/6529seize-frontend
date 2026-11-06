import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { ABOUT_INSET_CLASS_NAME } from "@/components/about/AboutLayout";
import { VALIDATOR_UPGRADE } from "@/lib/validator-page/content/guideMarkdown";
import {
  VALIDATOR_FEEDBACK_TEMPLATE,
  VALIDATOR_FEEDBACK_WAVE,
  VALIDATOR_FEEDBACK_WAVE_HREF,
} from "@/lib/validator-page/content/pageText";
import CopyChecksumButton from "./CopyChecksumButton";
import ValidatorMarkdown from "./ValidatorMarkdown";
import { BODY, LINK, SECTION_HEADING } from "./validatorStyles";

/**
 * What a tester who runs the last release does differently, right under the
 * download, where an upgrading tester looks first. Shown only while the
 * signed list offers the release the note is for, so it never describes a
 * release the page doesn't offer.
 */
export function ValidatorUpgrade({
  newest,
}: {
  /** The signed list's newest version, or undefined while it has none. */
  readonly newest: string | undefined;
}) {
  if (newest !== VALIDATOR_UPGRADE.forVersion) {
    return null;
  }
  const headingId = `${VALIDATOR_UPGRADE.id}-title`;
  return (
    <section
      id={VALIDATOR_UPGRADE.id}
      aria-labelledby={headingId}
      className={`${ABOUT_INSET_CLASS_NAME} tw-mb-12 tw-scroll-mt-24 tw-p-5 sm:tw-p-6`}
    >
      <h2
        id={headingId}
        className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-7 tw-text-iron-50"
      >
        {VALIDATOR_UPGRADE.title}
      </h2>
      <div className="tw-mt-3 [&_ul]:tw-mb-0">
        <ValidatorMarkdown markdown={VALIDATOR_UPGRADE.markdown} />
      </div>
    </section>
  );
}

/** What a tester needs, in two lines, and the full hardware guide. */
export function ValidatorNeeds() {
  return (
    <section aria-labelledby="what-you-need" className="tw-mt-14">
      <h2 id="what-you-need" className={SECTION_HEADING}>
        What you need
      </h2>
      <ul
        className={`tw-mb-0 tw-mt-4 tw-list-disc tw-space-y-2 tw-pl-6 ${BODY}`}
      >
        <li>
          A 64-bit computer: a Mac with macOS 11 or newer, a Windows 10 or 11
          PC, or a Linux computer, a Raspberry Pi 4 or 5 among them.
        </li>
        <li>
          One that stays on, at home or in your office. A cloud server works
          too.
        </li>
      </ul>
      <Link
        href="/validator/hardware"
        className={`tw-mt-4 tw-inline-flex tw-items-center tw-gap-1.5 ${LINK}`}
      >
        Hardware guide
        <ArrowRightIcon aria-hidden="true" className="tw-size-4" />
      </Link>
    </section>
  );
}

/** Where testers post their results, with the owner's template. */
export function ValidatorFeedback() {
  return (
    <section aria-labelledby="send-feedback" className="tw-mt-14">
      <h2 id="send-feedback" className={SECTION_HEADING}>
        Send feedback
      </h2>
      <p className={`tw-mb-4 tw-mt-4 ${BODY}`}>
        Post your results in the{" "}
        <a href={VALIDATOR_FEEDBACK_WAVE_HREF} className={LINK}>
          {VALIDATOR_FEEDBACK_WAVE} wave
        </a>
        , using this template:
      </p>
      <div className="tw-flex tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950 tw-p-4">
        <pre className="tw-m-0 tw-min-w-0 tw-flex-1 tw-overflow-x-auto tw-whitespace-pre tw-font-mono tw-text-[13px] tw-leading-6 tw-text-iron-100">
          {VALIDATOR_FEEDBACK_TEMPLATE}
        </pre>
        <CopyChecksumButton
          value={VALIDATOR_FEEDBACK_TEMPLATE}
          label="the template"
        />
      </div>
      <p className={`tw-mb-0 tw-mt-4 ${BODY}`}>
        In the app, Report a problem (in 6529&apos;s logo menu) makes a cleaned
        report with a box for your words, for you to paste there. It leaves out
        your account, addresses and names. Don&apos;t post raw logs or status
        files: they show your keys and your account.
      </p>
      <p className={`tw-mb-0 tw-mt-3 ${BODY}`}>
        6529 never starts a DM with you or asks for a seed phrase.
      </p>
    </section>
  );
}
