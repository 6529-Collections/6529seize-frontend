import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faChevronDown,
  faLightbulb,
  faShieldHalved,
  faToolbox,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import type { ReactNode } from "react";

import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

import {
  SUBSCRIPTIONS_PANEL_CLASS,
  SUBSCRIPTIONS_SECTION_HEADING_CLASS,
} from "./aboutSubscriptionsStyles";

type MintingMessageKey = Extract<MessageKey, `about.minting.${string}`>;

const m = (
  locale: SupportedLocale,
  key: MintingMessageKey,
  params: Parameters<typeof t>[2] = {}
) => t(locale, key, params);

const LIST_CLASS =
  "tw-m-0 tw-space-y-2 tw-pl-5 tw-text-base tw-leading-7 tw-text-iron-300 marker:tw-text-iron-600 sm:tw-space-y-3";
const NESTED_LIST_CLASS =
  "tw-mt-2 tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-400 marker:tw-text-iron-600 sm:tw-mt-3 sm:tw-space-y-3";
const BODY_CLASS = "tw-space-y-4 tw-text-base tw-leading-7 tw-text-iron-300";
const TIMELINE_ITEM_CLASS =
  "tw-relative tw-grid tw-grid-cols-[2rem_minmax(0,1fr)] tw-gap-3 sm:tw-grid-cols-[2.5rem_minmax(0,1fr)] sm:tw-gap-5";
const TIMELINE_MARKER_CLASS =
  "tw-relative tw-z-10 tw-flex tw-size-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-bg-black tw-text-sm sm:tw-size-10";

export default function AboutMintingReference({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <>
      <AllowlistBackground locale={locale} />
      <AllowlistCurrentPractices locale={locale} />
      <div className="tw-space-y-4 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-px-1 tw-py-8 sm:tw-space-y-6 sm:tw-px-2 sm:tw-py-12">
        <Provability locale={locale} />
        <Improvements locale={locale} />
        <Tools locale={locale} />
        <TechnicalIssues locale={locale} />
      </div>
    </>
  );
}

function AllowlistBackground({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="allowlist-background"
      className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-px-1 tw-py-8 sm:tw-px-2 sm:tw-py-12"
    >
      <div className="tw-max-w-3xl">
        <h2
          className={`${SUBSCRIPTIONS_SECTION_HEADING_CLASS} tw-scroll-mt-24`}
          id="allowlist-background"
        >
          {m(locale, "about.minting.background.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-base tw-font-light tw-leading-7 tw-text-iron-400">
          It might be useful to understand how we imagine the allowlist process.
          The analogy below is imperfect, but still helpful.
        </p>
      </div>

      <div
        className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-mt-4 tw-p-4 sm:tw-mt-6 sm:tw-p-6 lg:tw-p-8`}
      >
        <div className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800/50 tw-bg-black/20 tw-p-4 sm:tw-p-5">
          <ul className={LIST_CLASS}>
            <li>
              Imagine The Memes are a gallery in a big warehouse somewhere in
              New York, that is the gathering point for a group of collectors
              and artists who share a common ideological interest in art and
              decentralization
            </li>
            <li>
              A few times a week, an artist in the collective produces an
              edition of hopefully attractive, definitely ideological, art that
              is put up for sale at a hopefully attractive price
            </li>
            <li>
              The purpose of the allowlist is &quot;
              <i>
                who should we invite that night to have an opportunity to buy
                the editions first?
              </i>
              &quot;
            </li>
            <li>
              The classic answer in the physical world is friends of the
              gallery, friends of the artists, repeat collectors of the gallery
              and maybe some random people to keep it interesting and introduce
              new people to the mix
            </li>
            <li>
              The answer here is broadly similar, but with two differences: the
              scale is sometimes larger and people can pretend to be more than 1
              person by having different Ethereum addresses
            </li>
            <li>
              In technical terms, identity on Ethereum is vulnerable to Sybil
              attacks. As Wikipedia states: &quot;
              <i>
                A Sybil attack is a type of attack on a computer network service
                in which an attacker subverts the service&apos;s reputation by
                creating a large number of pseudonymous identities and uses them
                to gain a disproportionally large influence
              </i>
              &quot;
            </li>
            <li>
              The purpose of Bitcoin mining&apos;s proof of work algorithm is,
              in some ways, to prevent Sybil attacks vs other consensus
              mechanisms that do not protect against them
            </li>
          </ul>
        </div>

        <div className="tw-mt-6 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800/50 tw-pt-6">
          <h3 className="tw-m-0 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
            {m(locale, "about.minting.background.firstAllowlists.title")}
          </h3>
          <ul className={`${LIST_CLASS} tw-mt-4`}>
            <li>
              For the initial The Memes mints, we allowlisted hundreds of people
              by hand
            </li>
            <li>
              We fought the &quot;Sybil attack&quot; by individually going to
              people we knew were real people and allowlisting them for the
              initial mints
            </li>
            <li>
              It was a tedious process, and I am not sure any other meaningful
              collection has started that way
            </li>
            <li>
              What we &quot;earned&quot; in return, however, is a base of
              &quot;real people&quot; and editions that are extraordinarily well
              distributed. On most Memes cards, unique ownership percentages are
              in the 70-80% range or 80% to 90% if you exclude our internal
              holdings
            </li>
          </ul>
        </div>

        <div className="tw-mt-6 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800/50 tw-pt-6">
          <div className={BODY_CLASS}>
            <p className="tw-m-0">
              Once we had manually established a base of real people, we
              allowlisted them for future mints. In the beginning, this was
              straightforward.
            </p>
            <ul className={LIST_CLASS}>
              <li>
                Demand was relatively low and the mints took time to mint out
              </li>
              <li>
                We were even able to sprinkle in a public mint here or there
              </li>
              <li>
                Over time, however, there was more demand for The Memes and the
                allowlists become more challenging to create
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function AllowlistCurrentPractices({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <section
      aria-labelledby="allowlist-current-practices"
      className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-px-1 tw-py-8 sm:tw-px-2 sm:tw-py-12"
    >
      <div className="tw-max-w-3xl">
        <h2
          className={`${SUBSCRIPTIONS_SECTION_HEADING_CLASS} tw-scroll-mt-24`}
          id="allowlist-current-practices"
        >
          {m(locale, "about.minting.current.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-base tw-font-light tw-leading-7 tw-text-iron-400">
          This is the current process for allowlists at The Memes as of February
          2023. It is certain that the process will change in the future, as it
          has in the past, in response to new challenges.
        </p>
      </div>

      <ol className="tw-relative tw-m-0 tw-mt-8 tw-max-w-5xl tw-list-none tw-space-y-8 tw-p-0 before:tw-absolute before:tw-bottom-4 before:tw-left-4 before:tw-top-4 before:tw-w-px before:tw-bg-iron-800 before:tw-content-[''] sm:tw-mt-10 sm:tw-space-y-12 sm:before:tw-left-5">
        <TimelineStep
          markerClassName="tw-border-orange-500/40 tw-text-orange-400"
          number="1"
          title={m(locale, "about.minting.current.automatic.title")}
        >
          <ul className={LIST_CLASS}>
            <li>The 6529 Museum</li>
            <li>
              Various individuals working on the project and the 6529 Fund
            </li>
            <li>The artist or artists who worked on that Meme</li>
            <li>
              These are the parties that are &quot;
              <i>always on the guest list</i>&quot;
            </li>
          </ul>
        </TimelineStep>

        <TimelineStep
          markerClassName="tw-border-[#00f0ff]/40 tw-text-[#00f0ff]"
          number="2"
          title={m(locale, "about.minting.current.partial.title")}
        >
          <ul className={LIST_CLASS}>
            <li>Collectors of Meme Card or Gradients</li>
            <li>Collectors of the artist</li>
            <li>
              The purpose of the partial airdrops is to give a chance to acquire
              a Meme Card to community members who are not always online and
              available to mint.
            </li>
          </ul>
        </TimelineStep>

        <TimelineStep
          markerClassName="tw-border-[#7000ff]/40 tw-text-[#8f5cff]"
          number="3"
          title={m(locale, "about.minting.current.phaseOne.title")}
        >
          <div className={BODY_CLASS}>
            <div className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-p-4 sm:tw-p-6`}>
              <ul className={LIST_CLASS}>
                <li>
                  In Phase I, we try to guess how many people to allowlist
                  relative to the number of available cards for minting
                </li>
                <li>
                  The perfect guess would mean that Phase I mints out, within
                  its 30 minute window, without having a gas war
                </li>
                <li>
                  If we overestimate the number of people to allowlist, there is
                  a gas war
                </li>
                <li>
                  If we underestimate, we go to Phase II which is a continuation
                  of the Phase I logic, but to a broader set of participants.
                  Phase III is the public mint
                </li>
                <li>
                  It is impossible to get this precisely right because
                  likelihood to mint varies by different groups, particularly
                  the artist&apos;s collectors. We are happy if we are 80%
                  correct, 80% of the time
                </li>
              </ul>
            </div>

            <ExpandablePanel title="Our general approach is to allowlist:">
              <ul className={LIST_CLASS}>
                <li>
                  Some of the &quot;larger&quot; Meme Card collectors with a
                  focus on &quot;large&quot; being &quot;number of different
                  cards held&quot;, as opposed to &quot;total cards held&quot;
                  <ul className={NESTED_LIST_CLASS}>
                    <li>
                      The limit case of &quot;number of different cards
                      held&quot; is &quot;full set collectors&quot;
                    </li>
                    <li>
                      We prefer &quot;number of different cards held&quot; to
                      &quot;total cards held&quot; because getting different
                      cards in individual&apos;s wallets where they can be seen
                      by others is more important than getting duplicates of the
                      same card in wallets
                    </li>
                    <li>
                      Total cards held or total days held can be used as a
                      tie-breaker though
                    </li>
                  </ul>
                </li>
                <li>Some or all of the Gradient collectors</li>
                <li>Some or all of the artist&apos;s collectors</li>
                <li>A few people not in the above categories</li>
              </ul>
            </ExpandablePanel>

            <ExpandablePanel title="Why do we allowlist these categories?">
              <ul className={LIST_CLASS}>
                <li>
                  We often allowlist the larger collectors not only because they
                  tend to be bigger supporters of the gallery, but also because,
                  if we did not, they would split their cards into separate
                  wallets and appear to be more numerous smaller collectors
                </li>
                <li>
                  We often allowlist the Gradient collectors because they were
                  early supporters of the vision
                </li>
                <li>
                  We always allowlist the artist&apos;s collectors because, of
                  course, the artist should allowlist their own collectors, and
                  also because this is an important mechanism to introduce new
                  collectors to The Memes
                </li>
                <li>
                  We have allowlisted collectors of over hundreds, possibly
                  thousands, of collections so far. It is hugely important to
                  the project mission and we intend to continue to do this
                </li>
                <li>
                  We allowlist some other random categories so that there is
                  some diversity in the minters
                </li>
              </ul>
            </ExpandablePanel>

            <p className="tw-m-0">
              Having said all that, we also sometimes deviate from this approach
              to improve the diversity of collectors. How often we can deviate
              from that before the large collectors split their wallets is a
              challenging question.
            </p>
          </div>
        </TimelineStep>
      </ol>

      <aside className="tw-mt-8 tw-max-w-5xl tw-rounded-xl tw-border tw-border-solid tw-border-[#00f0ff]/20 tw-bg-[#00f0ff]/[0.06] tw-p-4 sm:tw-mt-10 sm:tw-p-6">
        <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-300">
          It is important to emphasize that you see the allowlist in the same
          light in which we see it, namely, that it is something like a guest
          list for a gallery.
        </p>
        <ul className={`${LIST_CLASS} tw-mt-3 sm:tw-mt-4`}>
          <li>
            If you were a large collector of Andy Warhols from an important New
            York gallery, sure, it is normal to expect that you might be invited
            to their cocktail parties or to get an early look at new work in the
            gallery
          </li>
          <li>
            You would not, however, collect Andy Warhols primarily to receive
            cocktail party invites and you would understand that you did not
            always get an early look at all new pieces in the gallery
          </li>
        </ul>
      </aside>
    </section>
  );
}

function Provability({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <ReferenceSection
      className="tw-border-emerald-500/15 tw-bg-emerald-500/[0.05]"
      icon={faShieldHalved}
      iconClassName="tw-bg-emerald-500/10 tw-text-emerald-400"
      id="minting-provability"
      title={m(locale, "about.minting.provability.title")}
    >
      <div className={BODY_CLASS}>
        <p className="tw-m-0">
          We take a series of measures to prove that the allowlists are created
          the way we say they are created.
        </p>
        <p className="tw-m-0">
          This is a level of diligence and transparency that has no real
          physical world equivalent. A gallery would not open up their records
          to the guests at the event to explain how and who was invited. One of
          the powers of public blockchains is that we can offer this
          transparency, so we do so.
        </p>
        <p className="tw-m-0">In particular, we do the following:</p>
        <ul className={LIST_CLASS}>
          <li>
            We announce in advance on which Ethereum block we will snapshot the
            collectors of The Memes, the Gradients and the artist&apos;s NFTs
          </li>
          <li>We announce a block from which we will draw pseudorandomness</li>
          <li>
            It is important for this to work that the blocks are announced
            publicly before they happen
          </li>
          <li>We post our allowlist formula and calculations on github</li>
          <li>
            Anyone with a bit of technical savvy can replicate how we created
            the allowlist
          </li>
          <li>
            This process does not mean the allowlist is predictable. It just
            confirms that the allowlist is what we say it is.
          </li>
        </ul>
      </div>
    </ReferenceSection>
  );
}

function Improvements({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <ReferenceSection
      className="tw-border-[#7000ff]/20 tw-bg-[#7000ff]/[0.06]"
      icon={faLightbulb}
      iconClassName="tw-bg-[#7000ff]/20 tw-text-[#8f5cff]"
      id="minting-improvements"
      title={m(locale, "about.minting.improvements.title")}
    >
      <ul className={LIST_CLASS}>
        <li>
          We think there are areas that can be improved in the allowlist
          approach to make it richer at capturing different variables.
        </li>
        <li>
          In February, we hope to roll out a metric called &quot;TDH&quot; -
          Total Days Held, a metric that derives from the old Bitcoin metric of
          Total Days Destroyed.
        </li>
        <li>
          It is a metric of how long The Memes have been held by an address and
          it adds another useful data point. There may be times when someone may
          want to differentiate between a collector who has held 10 cards for 1
          year vs a collector who has held 10 cards for 1 day. As with all
          metrics, TDH is not going to be used in a fixed way. It is another
          tool in the toolkit and metrics we are making available.
        </li>
        <li>
          We would like to find a way to capture social factors in the metrics.
          Who is contributing in Discord, who is creating ReMemes, who is
          generally helpful to the mission? In the physical world these factors
          would definitely be taken into account. The challenge here is how to
          do this in a decentralized and transparent way.
        </li>
        <li>
          We would like to find a way to categorize the collectors based on
          their actions. These might be useful factors in future allowlists.
        </li>
        <li>
          For our full analysis of our Network Definitions, go here:{" "}
          <Link
            className="tw-rounded-sm tw-text-iron-200 tw-underline tw-decoration-iron-600 tw-underline-offset-4 hover:tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#00f0ff]/60"
            href="/network/definitions"
            target="_blank"
            rel="noopener noreferrer"
          >
            6529.io/network/definitions
          </Link>
        </li>
      </ul>
    </ReferenceSection>
  );
}

function Tools({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <ReferenceSection
      icon={faToolbox}
      iconClassName="tw-bg-iron-900 tw-text-iron-300"
      id="minting-tools"
      title={m(locale, "about.minting.tools.title")}
    >
      <ul className={LIST_CLASS}>
        <li>
          One of our mental models is that NFTs are publicly readable databases
          of people with common interests.
        </li>
        <li>
          Given this, we hope that the publicly readable database of The Memes
          collectors will be used by many other people to make their own guest
          lists - for Meme Labs, for ReMemes, for all types of things we can and
          can&apos;t imagine.
        </li>
        <li>
          In order to support this, we are going to progressively make our tools
          for allowlists available to everyone (whether Meme Card collectors or
          not).
        </li>
        <li>
          On a daily basis, we publish to Arweave the statistics we use to
          create our own allowlists. You can find them here:{" "}
          <Link
            className="tw-rounded-sm tw-text-iron-200 tw-underline tw-decoration-iron-600 tw-underline-offset-4 hover:tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#00f0ff]/60"
            href="/open-data"
            target="_blank"
            rel="noopener noreferrer"
          >
            6529.io/open-data
          </Link>
        </li>
        <li>
          Over the next few months, we will also make available our tools for
          taking snapshots and randomization
        </li>
      </ul>
    </ReferenceSection>
  );
}

function TechnicalIssues({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <ReferenceSection
      className="tw-border-orange-500/20 tw-bg-orange-500/10"
      icon={faTriangleExclamation}
      iconClassName="tw-bg-orange-500/10 tw-text-orange-400"
      id="minting-technical-issues"
      title={m(locale, "about.minting.technicalIssues.title")}
    >
      <ul className="tw-m-0 tw-space-y-2 tw-pl-5 tw-text-base tw-leading-7 tw-text-orange-300/80 marker:tw-text-orange-400 sm:tw-space-y-3">
        <li>
          Sometimes under heavy load the minting page will fail to load or fail
          to load a transaction. You may have to refresh multiple times to be
          successful in minting.
        </li>
        <li>
          Some users have reported that hard-refreshing or clearing their local
          browser cache between mints may be helpful.
        </li>
        <li>
          In highly competitive mints, you may have to put a higher gas price to
          mint in time. We cannot advise on the correct gas to use as it differs
          every time.
        </li>
        <li>
          In highly competitive mints, you may pay for a transaction that does
          not mint in time and lose your gas fee. We do not refund gas fees for
          failed transactions.
        </li>
      </ul>
    </ReferenceSection>
  );
}

function ExpandablePanel({
  children,
  title,
}: {
  readonly children: ReactNode;
  readonly title: string;
}) {
  return (
    <details
      className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-group tw-overflow-hidden`}
    >
      <summary className="tw-flex tw-min-h-12 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-4 tw-bg-iron-900/45 tw-px-4 tw-py-3 tw-text-iron-100 tw-transition-colors hover:tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-[#00f0ff]/50 sm:tw-px-6 [&::-webkit-details-marker]:tw-hidden">
        <span className="tw-text-base tw-font-medium tw-leading-6 sm:tw-text-lg">
          {title}
        </span>
        <FontAwesomeIcon
          aria-hidden="true"
          className="tw-shrink-0 tw-text-sm tw-text-iron-500 tw-transition-transform tw-duration-300 group-open:-tw-rotate-180 motion-reduce:tw-transition-none"
          icon={faChevronDown}
        />
      </summary>
      <div className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800/50 tw-bg-iron-950/70 tw-p-4 sm:tw-p-6">
        {children}
      </div>
    </details>
  );
}

function ReferenceSection({
  children,
  className,
  icon,
  iconClassName,
  id,
  title,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly icon: IconDefinition;
  readonly iconClassName: string;
  readonly id: string;
  readonly title: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-p-4 sm:tw-p-6 ${className ?? ""}`}
    >
      <div className="tw-flex tw-items-center tw-gap-3 sm:tw-gap-4">
        <span
          className={`tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-text-lg sm:tw-size-12 sm:tw-text-xl ${iconClassName}`}
        >
          <FontAwesomeIcon aria-hidden="true" icon={icon} />
        </span>
        <h2
          className={`${SUBSCRIPTIONS_SECTION_HEADING_CLASS} tw-scroll-mt-24`}
          id={id}
        >
          {title}
        </h2>
      </div>
      <div className="tw-mt-4 sm:tw-mt-5">{children}</div>
    </section>
  );
}

function TimelineStep({
  children,
  markerClassName,
  number,
  title,
}: {
  readonly children: ReactNode;
  readonly markerClassName: string;
  readonly number: string;
  readonly title: string;
}) {
  return (
    <li className={TIMELINE_ITEM_CLASS}>
      <span className={`${TIMELINE_MARKER_CLASS} ${markerClassName}`}>
        {number}
      </span>
      <div className="tw-min-w-0">
        <h3 className="tw-m-0 tw-text-lg tw-font-medium tw-text-iron-100 sm:tw-text-xl">
          {title}
        </h3>
        <div className="tw-mt-4 sm:tw-mt-5">{children}</div>
      </div>
    </li>
  );
}
