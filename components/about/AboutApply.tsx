import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

import {
  ABOUT_BODY_TEXT_CLASS_NAME,
  ABOUT_CARD_CLASS_NAME,
  ABOUT_COMPACT_HEADING_CLASS_NAME,
  ABOUT_INSET_CLASS_NAME,
  ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS,
  ABOUT_PAGE_TITLE_CLASS_NAME,
  ABOUT_SECTION_DIVIDER_CLASS_NAME,
  ABOUT_SECTION_HEADING_CLASS_NAME,
} from "./AboutLayout";

const APPLY_SECTION_CLASS = `tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid ${ABOUT_SECTION_DIVIDER_CLASS_NAME} tw-px-1 tw-py-10 sm:tw-px-2 sm:tw-py-12`;

const APPLY_SECTION_HEADING_CLASS = ABOUT_SECTION_HEADING_CLASS_NAME;

const APPLY_PANEL_CLASS = `tw-mt-6 ${ABOUT_CARD_CLASS_NAME} tw-p-5 sm:tw-p-6`;

const APPLY_DETAIL_ROW_CLASS = `tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid ${ABOUT_SECTION_DIVIDER_CLASS_NAME} tw-pb-5`;

const APPLY_DETAIL_HEADING_CLASS = ABOUT_COMPACT_HEADING_CLASS_NAME;

const APPLY_DETAIL_BODY_CLASS = `tw-m-0 tw-mt-2 ${ABOUT_BODY_TEXT_CLASS_NAME}`;

const APPLY_LINK_CLASS =
  "tw-rounded-sm tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-400/50 tw-underline-offset-4 hover:tw-text-primary-400 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

export default function AboutApply() {
  return (
    <article
      className={`tw-w-full tw-pb-12 tw-text-iron-100 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
    >
      <div className="tw-mx-auto tw-w-full tw-max-w-3xl">
        <header
          className={`tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid ${ABOUT_SECTION_DIVIDER_CLASS_NAME} tw-px-1 tw-pb-10 tw-pt-4 sm:tw-px-2 sm:tw-pb-12 sm:tw-pt-8`}
        >
          <div>
            <h1 className={ABOUT_PAGE_TITLE_CLASS_NAME}>Apply</h1>
            <p
              className={`tw-mt-6 tw-text-pretty ${ABOUT_SECTION_HEADING_CLASS_NAME}`}
            >
              How Does Submission Work?
            </p>
            <p
              className={`tw-m-0 tw-mt-4 tw-font-semibold ${ABOUT_BODY_TEXT_CLASS_NAME}`}
            >
              There are two ways you can be eligible to submit:
            </p>
            <ul className="tw-m-0 tw-mt-5 tw-grid tw-list-none tw-grid-cols-1 tw-gap-3 tw-p-0 sm:tw-grid-cols-2">
              <li
                className={`tw-flex tw-items-start tw-gap-3 ${ABOUT_CARD_CLASS_NAME} tw-p-4 ${ABOUT_BODY_TEXT_CLASS_NAME}`}
              >
                <ApplyCheckIcon />
                <span>
                  <strong className="tw-font-semibold tw-text-iron-100">
                    Previous Meme Artist:
                  </strong>{" "}
                  You&apos;ve previously dropped a Meme Card.
                </span>
              </li>
              <li
                className={`tw-flex tw-items-start tw-gap-3 ${ABOUT_CARD_CLASS_NAME} tw-p-4 ${ABOUT_BODY_TEXT_CLASS_NAME}`}
              >
                <ApplyCheckIcon />
                <span>
                  <strong className="tw-font-semibold tw-text-iron-100">
                    Community Nomination:
                  </strong>{" "}
                  You&apos;ve been nominated by one or more people giving you at
                  least 50,000 &quot;MemesNominee&quot; rep.
                </span>
              </li>
            </ul>
          </div>
        </header>

        <section
          aria-labelledby="seeking-nomination-heading"
          className={APPLY_SECTION_CLASS}
        >
          <h2
            className={APPLY_SECTION_HEADING_CLASS}
            id="seeking-nomination-heading"
          >
            Seeking a Nomination (New Artists)
          </h2>
          <div className={APPLY_PANEL_CLASS}>
            <p className={`tw-m-0 ${ABOUT_BODY_TEXT_CLASS_NAME}`}>
              Visit the{" "}
              <a
                className={APPLY_LINK_CLASS}
                href="https://6529.io/waves/0ecb95d0-d8f2-48e8-8137-bfa71ee8593c"
                rel="noopener noreferrer"
                target="_blank"
              >
                The Memes - Seeking Nomination
              </a>{" "}
              wave and share your existing work and story. Community members may
              then nominate you.
            </p>

            <div className={`tw-mt-6 ${APPLY_DETAIL_ROW_CLASS}`}>
              <h3 className={APPLY_DETAIL_HEADING_CLASS}>Gather Support</h3>
              <p className={APPLY_DETAIL_BODY_CLASS}>
                Community members nominate you by allocating their MemesNominee
                rep. You&apos;ll need 50,000 rep total to qualify.
              </p>
            </div>
            <div className="tw-pt-5">
              <h3 className={APPLY_DETAIL_HEADING_CLASS}>Qualify</h3>
              <p className={APPLY_DETAIL_BODY_CLASS}>
                Once you reach 50,000 rep, you become eligible to submit Meme
                Cards.
              </p>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="submitting-cards-heading"
          className={APPLY_SECTION_CLASS}
        >
          <h2
            className={APPLY_SECTION_HEADING_CLASS}
            id="submitting-cards-heading"
          >
            Submitting Your Meme Cards (Eligible Artists)
          </h2>
          <div className={APPLY_PANEL_CLASS}>
            <div className={APPLY_DETAIL_ROW_CLASS}>
              <h3 className={APPLY_DETAIL_HEADING_CLASS}>
                Three Active Submissions
              </h3>
              <p className={APPLY_DETAIL_BODY_CLASS}>
                You can have up to 3 Meme Card designs submitted simultaneously.
              </p>
            </div>

            <div className={`tw-pt-5 ${APPLY_DETAIL_ROW_CLASS}`}>
              <h3 className={APPLY_DETAIL_HEADING_CLASS}>
                Replace Submissions
              </h3>
              <p className={APPLY_DETAIL_BODY_CLASS}>
                If you remove a submission or one of your submissions is
                selected to be minted, you can submit another card to fill that
                spot.
              </p>
            </div>

            <div className="tw-pt-5">
              <h3 className={APPLY_DETAIL_HEADING_CLASS}>
                Selection &amp; Scheduling
              </h3>
              <p className={APPLY_DETAIL_BODY_CLASS}>
                Submitted cards appear on a public leaderboard. Cards are ranked
                based on community support over the past 24 hours (24HV),
                encouraging sustained engagement over last-minute spikes.
              </p>
              <div
                className={`tw-mt-5 ${ABOUT_INSET_CLASS_NAME} tw-p-4 sm:tw-p-5`}
              >
                <h4 className="tw-m-0 tw-flex tw-items-center tw-gap-2.5 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100">
                  <CalendarDaysIcon
                    aria-hidden="true"
                    className="tw-size-5 tw-shrink-0 tw-text-iron-500"
                  />
                  Checkpoint Schedule
                </h4>
                <div className="tw-mt-4 tw-space-y-3 tw-text-sm tw-leading-6 sm:tw-text-base sm:tw-leading-7">
                  <ScheduleRow day="Monday" destination="Wednesday" />
                  <ScheduleRow day="Wednesday" destination="Friday" />
                  <ScheduleRow day="Friday" destination="Monday" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="creative-guidelines-heading"
          className="tw-px-1 tw-py-10 sm:tw-px-2 sm:tw-py-12"
        >
          <h2
            className={APPLY_SECTION_HEADING_CLASS}
            id="creative-guidelines-heading"
          >
            Creative Guidelines (Important!)
          </h2>
          <div className={APPLY_PANEL_CLASS}>
            <div className={`tw-space-y-4 ${ABOUT_BODY_TEXT_CLASS_NAME}`}>
              <p className="tw-m-0">
                Carefully read the{" "}
                <a
                  className={APPLY_LINK_CLASS}
                  href="https://docs.google.com/presentation/d/1Aejko31qFkAIyu-Qc3Ao9tHQGbbaFCIcqrBj_kZzo_M/edit#slide=id.p1"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Artist Brief
                </a>{" "}
                before submitting. It outlines the collection&apos;s mission,
                vision, themes, and guidelines. High-quality, mission-aligned
                submissions perform best. Low-effort or off-theme submissions
                are unlikely to be chosen.
              </p>
              <p className="tw-m-0">
                Your Meme Card can be made in any medium — art, photo, video,
                interactive code, or something more experimental.
              </p>
              <p className="tw-m-0">
                You&apos;re the expert on your art — we&apos;re here to help
                with The Memes style and mission. Sharing drafts or
                brainstorming early often leads to better outcomes for everyone.
              </p>
            </div>

            <div
              className={`tw-mt-6 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid ${ABOUT_SECTION_DIVIDER_CLASS_NAME} tw-pt-6`}
            >
              <div className={APPLY_DETAIL_ROW_CLASS}>
                <h3 className={APPLY_DETAIL_HEADING_CLASS}>
                  Need Artistic Feedback?
                </h3>
                <p
                  className={`${APPLY_DETAIL_BODY_CLASS} tw-flex tw-items-start tw-gap-3`}
                >
                  <ApplyCheckIcon />
                  <span>
                    DM <span className="tw-text-iron-100">@6529er</span>
                    {", "}
                    <span className="tw-text-iron-100">@teexels</span>
                    {", and "}
                    <span className="tw-text-iron-100">@darrensrs</span> into a
                    group chat for feedback and creative guidance.
                  </span>
                </p>
              </div>

              <div className="tw-pt-5">
                <h3 className={APPLY_DETAIL_HEADING_CLASS}>
                  General Questions?
                </h3>
                <p className={APPLY_DETAIL_BODY_CLASS}>
                  Visit{" "}
                  <a
                    className={APPLY_LINK_CLASS}
                    href="https://6529.io/waves/e2dae377-d27d-4a69-8b77-38d88fad4d01"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    The Memes - FAQ wave
                  </a>{" "}
                  after reading the{" "}
                  <a
                    className={APPLY_LINK_CLASS}
                    href="https://docs.google.com/presentation/d/1Aejko31qFkAIyu-Qc3Ao9tHQGbbaFCIcqrBj_kZzo_M/edit#slide=id.p1"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Artist Brief
                  </a>
                  {"."}
                </p>
                <p
                  className={`${APPLY_DETAIL_BODY_CLASS} tw-flex tw-items-start tw-gap-3`}
                >
                  <ApplyCheckIcon />
                  <span>
                    For other inquiries, email us at{" "}
                    <a
                      className={APPLY_LINK_CLASS}
                      href="mailto:collections@6529.io"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      collections@6529.io
                    </a>
                    {"."}
                  </span>
                </p>
              </div>
            </div>

            <div
              className={`tw-mt-6 ${ABOUT_INSET_CLASS_NAME} tw-p-4 tw-text-center`}
            >
              <p className="tw-m-0 tw-text-sm tw-italic tw-leading-6 tw-text-iron-400">
                We receive many messages; thank you for your patience if
                responses are delayed.
              </p>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}

function ApplyCheckIcon() {
  return (
    <CheckIcon
      aria-hidden="true"
      className="tw-mt-1 tw-size-5 tw-shrink-0 tw-stroke-[2.25] tw-text-emerald-400"
    />
  );
}

function ScheduleRow({
  day,
  destination,
}: {
  readonly day: string;
  readonly destination: string;
}) {
  return (
    <div className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-1 sm:tw-grid-cols-[minmax(5.75rem,auto)_minmax(0,1fr)] sm:tw-items-center sm:tw-gap-3">
      <span className="tw-font-semibold tw-text-primary-300">{day}</span>
      <span className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2">
        <span className="tw-text-iron-400">17:00 GMT</span>
        <ArrowRightIcon
          aria-hidden="true"
          className="tw-size-4 tw-shrink-0 tw-text-iron-500"
        />
        <span className="tw-font-medium tw-text-iron-200">
          minted {destination}
        </span>
      </span>
    </div>
  );
}
