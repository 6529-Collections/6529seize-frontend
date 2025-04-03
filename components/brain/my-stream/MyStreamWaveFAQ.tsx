import React, { useEffect, useMemo } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faUser,
  faCrown,
  faVoteYea,
  faTools,
  faChartLine,
  faCubes,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { useContentTab } from "../ContentTabContext";
import { MyStreamWaveTab } from "../../../types/waves.types";
import { useLayout } from "./layout/LayoutContext";

interface MyStreamWaveFAQProps {
  readonly wave: ApiWave;
}

const MyStreamWaveFAQ: React.FC<MyStreamWaveFAQProps> = ({ wave }) => {
  const { setActiveContentTab } = useContentTab();
  const { faqViewStyle } = useLayout();

  useEffect(() => {
    setActiveContentTab(MyStreamWaveTab.FAQ);
  }, [setActiveContentTab]);

  const containerClassName = useMemo(() => {
    return "tw-w-full tw-flex tw-flex-col lg:tw-pt-2 lg:tw-pr-2 tw-overflow-y-auto no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-desktop-hover:hover:desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-h-full";
  }, []);

  return (
    <div className={containerClassName} style={faqViewStyle}>
      <div className="tw-space-y-4 md:tw-space-y-6 tw-mb-4 tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
        <section className="tw-bg-iron-900 tw-rounded-lg tw-px-4 tw-py-5 sm:tw-p-6 tw-border tw-border-iron-800 tw-border-solid tw-shadow-sm">
          <p className="tw-text-iron-50 tw-font-semibold tw-text-xl sm:tw-text-2xl tw-mb-0">
            The Memes - Main Stage FAQ
          </p>
          <h3 className="tw-mt-6 sm:tw-mt-8 tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-50 tw-mb-5 tw-flex tw-items-center">
            <div className="tw-flex tw-items-center tw-justify-center tw-bg-iron-800 tw-rounded-md tw-w-8 tw-h-8 tw-mr-3">
              <FontAwesomeIcon
                icon={faBook}
                className="tw-text-primary-400 tw-size-4 tw-flex-shrink-0"
              />
            </div>
            Intro
          </h3>
          <div className="tw-flex tw-flex-col tw-space-y-4 md:tw-space-y-6 tw-mb-0">
            <div className="tw-border-b tw-border-iron-800">
              <div className="tw-text-sm tw-text-iron-400 tw-font-medium">
                What are we doing here?
              </div>
              <div className="tw-text-iron-50 tw-mt-1 tw-text-base">
                Voting for the next The Memes card to be minted
              </div>
            </div>
            <div className="tw-border-b tw-border-iron-800">
              <div className="tw-text-sm tw-text-iron-400 tw-font-medium">
                Who is voting?
              </div>
              <div className="tw-text-iron-50 tw-mt-1 tw-text-base">
                Everyone with TDH
              </div>
            </div>
            <div className="tw-border-b tw-border-iron-800">
              <div className="tw-text-sm tw-text-iron-400 tw-font-medium">
                What are we voting with?
              </div>
              <div className="tw-text-iron-50 tw-mt-1 tw-text-base">TDH</div>
            </div>
            <div className="tw-border-b tw-border-iron-800">
              <div className="tw-text-sm tw-text-iron-400 tw-font-medium">
                How do I learn more?
              </div>
              <div className="tw-text-iron-50 tw-mt-1 tw-text-base">
                Keep reading
              </div>
            </div>
          </div>
        </section>
        <section className="tw-bg-iron-900 tw-rounded-lg tw-px-4 tw-py-5 sm:tw-p-6 tw-border tw-border-iron-800 tw-border-solid tw-shadow-sm">
          <h3 className="tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-50 tw-mb-5 tw-flex">
            <div className="tw-flex tw-items-center tw-justify-center tw-bg-iron-800 tw-rounded-md tw-w-8 tw-h-8 tw-mr-3">
              <FontAwesomeIcon
                icon={faCrown}
                className="tw-text-indigo-500 tw-size-4 tw-flex-shrink-0"
              />
            </div>
            <div className="tw-mt-0.5">What are the goals of the voting?</div>
          </h3>
          <p className="tw-text-iron-300 tw-mb-4 tw-leading-relaxed tw-text-base">
            We are engaging in decentralized, networked curation of an important
            NFT art collection focused on decentralization.
          </p>
          <p className="tw-text-iron-300 tw-mb-4 tw-leading-relaxed tw-text-base">
            The goal is excellence, defined as a collection that will age well
            over decades.
          </p>
          <p className="tw-text-iron-300 tw-mb-3 tw-leading-relaxed tw-text-base">
            Excellence can come in many formats:
          </p>
          <ul className="tw-space-y-2 tw-text-iron-300 tw-mb-5 tw-pl-1 tw-text-base">
            {[
              "Artistic excellence",
              "Memetic excellence",
              "Story-value excellence",
              "Several of the above",
            ].map((item, idx) => (
              <li key={idx} className="tw-flex tw-items-center">
                <div className="tw-h-0.5 tw-w-3 tw-flex-shrink-0 tw-rounded-full tw-bg-primary-400 tw-mr-3"></div>
                {item}
              </li>
            ))}
          </ul>
          <p className="tw-text-iron-300 tw-mb-4 tw-leading-relaxed tw-text-base">
            There is a long artist brief here that both artists and first-time
            voters should read.
          </p>
          <p className="tw-text-iron-300 tw-mb-5 tw-leading-relaxed tw-text-base">
            It is a much more detailed FAQ than this one and if you want to be
            seriously engaged with this effort, you must read it! Otherwise you
            will bother everyone with basic questions that you could have
            answered by reading the presentation and we will quietly think a
            little less of you and nobody wants that.
          </p>
          <a
            href="https://docs.google.com/presentation/d/1Aejko31qFkAIyu-Qc3Ao9tHQGbbaFCIcqrBj_kZzo_M/edit#slide=id.p1"
            target="_blank"
            rel="noopener noreferrer"
            className="tw-group tw-text-base tw-flex tw-items-center tw-text-primary-400 tw-font-medium desktop-hover:hover:tw-text-primary-300 tw-transition-colors"
          >
            Read Artist Brief
            <FontAwesomeIcon
              icon={faArrowRight}
              className="tw-ml-2 tw-size-3 tw-transition-transform desktop-hover:group-hover:tw-translate-x-0.5"
            />
          </a>
          <p className="tw-text-iron-500 tw-mt-4 tw-text-sm">
            These FAQs are a summary of this presentation but not a substitute
            for reading it.
          </p>
        </section>
        <section className="tw-bg-iron-900 tw-rounded-lg tw-px-4 tw-py-5 sm:tw-p-6 tw-border tw-border-iron-800 tw-border-solid tw-shadow-sm">
          <h3 className="tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-50 tw-mb-5 tw-flex">
            <div className="tw-flex tw-items-center tw-justify-center tw-bg-iron-800 tw-rounded-md tw-w-8 tw-h-8 tw-mr-3">
              <FontAwesomeIcon
                icon={faUser}
                className="tw-text-red tw-size-4 tw-flex-shrink-0"
              />
            </div>
            <span className="tw-mt-0.5">
              What Are Not The Goals Of The Voting
            </span>
          </h3>
          <ul className="tw-space-y-3 tw-text-iron-300 tw-pl-0">
            <li className="tw-flex tw-items-start tw-pb-3 tw-text-base">
              <span className="tw-text-red tw-mr-2">✕</span>
              <span>
                We should not vandalize the collection for joke value.
              </span>
            </li>
            <li className="tw-flex tw-items-start tw-pb-3 tw-text-base">
              <span className="tw-text-red tw-mr-2">✕</span>
              <span>
                The Memes are not a sandbox for goofing around among friends –
                they are, arguably, the most important large NFT art collection
                of 2022-2025.
              </span>
            </li>
            <li className="tw-flex tw-items-start tw-pb-3 tw-text-base">
              <span className="tw-text-emerald-500 tw-mr-2">✓</span>
              <span>
                Our decisions should stand the test of time – "{" "}
                <span className="tw-italic">
                  can you imagine someone wanting to own the card 30 years from
                  now?
                </span>{" "}
                " is a pretty good test.
              </span>
            </li>
            <li className="tw-flex tw-items-start  tw-pb-3 tw-text-base">
              <span className="tw-text-emerald-500 tw-mr-2">✓</span>
              <span>
                Should we do weird things in The Memes? Sure, so long as they
                are also excellent.
              </span>
            </li>
            <li className="tw-flex tw-items-start tw-text-base">
              <span className="tw-text-red tw-mr-2">✕</span>
              <span>
                Should we do weird casual things that are not excellent? No.
              </span>
            </li>
          </ul>
        </section>
        <section className="tw-bg-iron-900 tw-rounded-lg tw-px-4 tw-py-5 sm:tw-p-6 tw-border tw-border-iron-800 tw-border-solid tw-shadow-sm">
          <h3 className="tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-50 tw-mb-5 tw-flex">
            <div className="tw-flex tw-items-center tw-justify-center tw-bg-iron-800 tw-rounded-md tw-w-8 tw-h-8 tw-mr-3">
              <FontAwesomeIcon
                icon={faVoteYea}
                className="tw-text-purple-500 tw-size-4 tw-flex-shrink-0"
              />
            </div>
            <span className="tw-mt-0.5">How Does Voting Work?</span>
          </h3>
          <p className="tw-text-iron-300 tw-mb-4 tw-leading-relaxed tw-text-base">
            Voting is a continuous leaderboard – art is submitted and it stays
            on the leaderboard until it is removed by the artist who submitted
            it.
          </p>
          <p className="tw-text-iron-300 tw-mb-4 tw-leading-relaxed tw-text-base">
            Three times a week, the top submission on the leaderboard is
            selected to be the next card minted.
          </p>
          <p className="tw-text-iron-300 tw-mb-4 tw-leading-relaxed tw-text-base">
            The checkpoint times are Monday / Wednesday / Friday at 17:00 GMT.
            The card will be minted at the next The Memes mint (e.g. Wednesday /
            Friday / Monday).
          </p>
          <p className="tw-text-iron-300 tw-mb-4 tw-leading-relaxed tw-text-base">
            The metric that determines the winner is 24-Hour Vote (24HV).
            <br />
            24HV is a weighted average of how much TDH was voted at any point in
            time ("Current Vote") during the last 24 hours before the
            checkpoint.
          </p>
          <p className="tw-text-iron-300 tw-mb-5 tw-leading-relaxed tw-text-base">
            The purpose of using 24HV is to avoid last second gaming of the
            vote. You can sort by 24HV and Current Vote. 24HV converges to
            Current Vote over a 24 hour period (noting that Current Vote is
            constantly changing).
          </p>

          <div className="tw-bg-iron-950 tw-p-4 sm:tw-p-5 tw-rounded-md tw-mb-6">
            <p className="tw-text-iron-50 tw-font-medium tw-mb-4 tw-text-base">
              You can think of the voting in three phases:
            </p>
            <div className="tw-grid tw-grid-cols-1 tw-gap-4">
              <div className="tw-bg-iron-900 tw-p-4 tw-rounded-md tw-border-l-4 tw-border-primary-500 tw-border-solid tw-border-r-0 tw-border-y-0">
                <p className="tw-font-semibold tw-text-iron-50 tw-text-base">
                  Pre-voting
                </p>
                <p className="tw-text-sm tw-text-iron-400 tw-mt-1">
                  &gt;24h before
                </p>
                <p className="tw-text-iron-300 tw-mt-2">
                  You can add and remove TDH (Current Vote) to one or more
                  submissions but it does not impact the final decision.
                </p>
              </div>
              <div className="tw-bg-iron-900 tw-p-4 tw-rounded-md tw-border-l-4 tw-border-purple-600 tw-border-solid tw-border-r-0 tw-border-y-0">
                <p className="tw-font-semibold tw-text-iron-50 tw-text-base">
                  Voting
                </p>
                <p className="tw-text-sm tw-text-iron-400 tw-mt-1">
                  0-24h before
                </p>
                <p className="tw-text-iron-300 tw-mt-2">
                  You can add and remove TDH (Current Vote) to one more
                  submissions, but it does impact the final decision as it
                  starts counting towards the final 24HV. If you vote 100 TDH
                  for the whole 24-hour period, it contributes 100 to the final
                  vote. If you vote 100 TDH for 12 hours of the last 24 hours,
                  it contributes 50 to the final vote.
                </p>
              </div>
              <div className="tw-bg-iron-900 tw-p-4 tw-rounded-md tw-border-l-4 tw-border-emerald-600 tw-border-solid tw-border-r-0 tw-border-y-0">
                <p className="tw-font-semibold tw-text-iron-50 tw-text-base">
                  Selection
                </p>
                <p className="tw-text-sm tw-text-iron-400 tw-mt-1">
                  Checkpoint
                </p>
                <p className="tw-text-iron-300 tw-mt-2">
                  The 24HV value at checkpoint time
                </p>
              </div>
            </div>
          </div>

          <div className="tw-flex tw-flex-col tw-space-y-3">
            {[
              { q: "Can you add and remove TDH at any time?", a: "Yes" },
              { q: "Can you give TDH to more than one card?", a: "Yes" },
              {
                q: "How much of your TDH can you use?",
                a: "All of it - the aggregate of your positive and negative votes can add up to your total TDH",
              },
              { q: "Does your TDH get destroyed by voting?", a: "No" },
              {
                q: "What happens when a card I voted for gets selected?",
                a: "You get your TDH back",
              },
              {
                q: "What happens when I get TDH back from removing it from a card I voted for?",
                a: "You get Current Vote TDH instantly but 24HV TDH decays and accrues over 24 hours",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="tw-border-b tw-border-iron-800 tw-pb-3  "
              >
                <dt className="tw-text-sm tw-font-medium tw-text-primary-400">
                  {item.q}
                </dt>
                <dd className="tw-text-iron-50 tw-mt-1 tw-text-base">
                  {item.a}
                </dd>
              </div>
            ))}
          </div>
        </section>
        <section className="tw-bg-iron-900 tw-rounded-lg tw-px-4 tw-py-5 sm:tw-p-6 tw-border tw-border-iron-800 tw-border-solid tw-shadow-sm">
          <h3 className="tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-50 tw-mb-5 tw-flex">
            <div className="tw-flex tw-items-center tw-justify-center tw-bg-iron-800 tw-rounded-md tw-w-8 tw-h-8 tw-mr-3">
              <FontAwesomeIcon
                icon={faTools}
                className="tw-text-emerald-500-500 tw-size-4"
              />
            </div>
            <span className="tw-mt-0.5">How Does Submission Work?</span>
          </h3>
          <div className="tw-bg-iron-950 tw-p-5 tw-rounded-md tw-mb-5">
            <p className="tw-text-iron-50 tw-font-medium tw-mb-3 tw-text-base">
              There are two ways you can be eligible to submit:
            </p>
            <ul className="tw-space-y-3 tw-text-iron-300 tw-pl-0">
              <li className="tw-flex tw-text-base">
                <span className="tw-text-emerald-500 tw-size-4 tw-flex-shrink-0 tw-mr-2">
                  ✓
                </span>
                You have previously dropped a Meme Card
              </li>
              <li className="tw-flex tw-text-base">
                <span className="tw-text-emerald-500 tw-size-4 tw-flex-shrink-0 tw-mr-2">
                  ✓
                </span>
                You have been nominated in a decentralized way by one or more
                people giving you at least 50,000 "MemesNominee" rep
              </li>
            </ul>
          </div>

          <p className="tw-text-iron-300 tw-mb-2 tw-leading-relaxed tw-text-base">
            What if I do not know how to get nominated?
          </p>
          <p className="tw-text-iron-300 tw-mb-3 tw-leading-relaxed tw-text-base">
            Go to the The Memes - Seeking Nomination wave and share your
            existing work and story and someone may nominate you:
          </p>
          <a
            href="https://6529.io/my-stream?wave=0ecb95d0-d8f2-48e8-8137-bfa71ee8593c"
            target="_blank"
            rel="noopener noreferrer"
            className="tw-group tw-flex tw-text-base tw-items-center tw-text-primary-400 tw-font-medium desktop-hover:hover:tw-text-primary-300 tw-transition-colors tw-mb-4"
          >
            Nomination Wave
            <FontAwesomeIcon
              icon={faArrowRight}
              className="tw-ml-2 tw-size-3 tw-transition-transform desktop-hover:group-hover:tw-translate-x-0.5"
            />
          </a>
          <p className="tw-text-iron-300 tw-mb-4 tw-leading-relaxed tw-text-base">
            Once you are eligible, you can submit up to 3 cards at a time. If
            you remove a submission or one of your submissions is selected to be
            minted, you can submit another card to fill that spot.
          </p>
          <p className="tw-text-iron-300 tw-mb-3 tw-leading-relaxed tw-text-base">
            It is very important to read the artist brief so that you don't
            waste your time:
          </p>
          <ul className="tw-space-y-2 tw-text-iron-300 tw-mb-5 tw-pl-1 tw-text-base">
            <li className="tw-flex">
              <div className="tw-h-0.5 tw-w-3 tw-mt-2.5 tw-rounded-full tw-flex-shrink-0 tw-bg-primary-400 tw-mr-3"></div>
              High quality submissions, in line with the collection mission,
              will do very well
            </li>
            <li className="tw-flex">
              <div className="tw-h-0.5 tw-w-3 tw-mt-2.5 tw-rounded-full tw-flex-shrink-0 tw-bg-primary-400 tw-mr-3"></div>
              Low effort submissions will not get selected
            </li>
          </ul>
          <div className="tw-bg-iron-950 tw-p-5 tw-rounded-md tw-border tw-border-iron-800 tw-mb-5">
            <p className="tw-text-iron-300 tw-mb-2 tw-leading-relaxed tw-text-base">
              How do I get some artistic feedback as in the past?
            </p>
            <p className="tw-text-iron-50 tw-text-base">
              DM @6529er, @teexels and @darrensrs into a group chat
            </p>
          </div>
          <p className="tw-text-iron-300 tw-mb-3 tw-leading-relaxed tw-text-base">
            What if I have general questions? Go to the The Memes - FAQ wave
            (after you have read the artist brief)
          </p>
          <a
            href="https://6529.io/my-stream?wave=e2dae377-d27d-4a69-8b77-38d88fad4d01"
            target="_blank"
            rel="noopener noreferrer"
            className="tw-group tw-flex tw-items-center tw-text-primary-400 tw-font-medium desktop-hover:hover:tw-text-primary-300 tw-transition-colors"
          >
            FAQ Wave
            <FontAwesomeIcon
              icon={faArrowRight}
              className="tw-ml-2 tw-text-base tw-size-3 tw-flex-shrink-0 tw-transition-transform desktop-hover:group-hover:tw-translate-x-0.5"
            />
          </a>
        </section>
        <section className="tw-bg-iron-900 tw-rounded-lg tw-px-4 tw-py-5 sm:tw-p-6 tw-border tw-border-iron-800 tw-border-solid tw-shadow-sm">
          <h3 className="tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-50 tw-mb-5 tw-flex tw-items-center">
            <div className="tw-flex tw-items-center tw-justify-center tw-bg-iron-800 tw-rounded-md tw-w-8 tw-h-8 tw-mr-3">
              <FontAwesomeIcon
                icon={faChartLine}
                className="tw-text-yellow-500 tw-size-4 tw-flex-shrink-0"
              />
            </div>
            What is TDH?
          </h3>
          <p className="tw-text-iron-300 tw-mb-4 tw-leading-relaxed tw-text-base">
            TDH is the central metric of 6529 ecosystem.
          </p>
          <p className="tw-text-iron-300 tw-mb-5 tw-leading-relaxed tw-text-base">
            It is a quantitative metric reflecting how long you have held a 6529
            NFT, how many you have held and how diverse your holdings are. It
            primarily rewards longevity.
          </p>
          <div className="tw-flex tw-gap-4">
            <a
              href="https://x.com/punk6529/status/1906753171751412006"
              target="_blank"
              rel="noopener noreferrer"
              className="tw-group tw-text-base tw-flex tw-items-center tw-text-primary-400 tw-font-medium desktop-hover:hover:tw-text-primary-300 tw-transition-colors"
            >
              Theory
              <FontAwesomeIcon
                icon={faArrowRight}
                className="tw-ml-2 tw-size-3 tw-transition-transform desktop-hover:group-hover:tw-translate-x-0.5"
              />
            </a>
            <a
              href="https://6529.io/network/metrics"
              target="_blank"
              rel="noopener noreferrer"
              className="tw-group tw-text-base tw-flex tw-items-center tw-text-primary-400 tw-font-medium desktop-hover:hover:tw-text-primary-300 tw-transition-colors"
            >
              Formula
              <FontAwesomeIcon
                icon={faArrowRight}
                className="tw-ml-2 tw-size-3 tw-transition-transform desktop-hover:group-hover:tw-translate-x-0.5"
              />
            </a>
          </div>
        </section>
        <section className="tw-bg-iron-900 tw-rounded-lg tw-px-4 tw-py-5 sm:tw-p-6 tw-border tw-border-iron-800 tw-border-solid tw-shadow-sm">
          <h3 className="tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-50 tw-mb-5 tw-flex tw-items-center">
            <div className="tw-flex tw-items-center tw-justify-center tw-bg-iron-800 tw-rounded-md tw-w-8 tw-h-8 tw-mr-3">
              <FontAwesomeIcon
                icon={faCubes}
                className="tw-text-orange-500 tw-size-4 tw-flex-shrink-0"
              />
            </div>
            Minting a Meme Card
          </h3>
          <p className="tw-text-iron-300 tw-mb-4 tw-leading-relaxed tw-text-base">
            Everything about minting a Meme Card stays unchanged.
          </p>

          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-4 tw-mb-5">
            <div className="tw-bg-iron-950 tw-p-4 tw-rounded-md">
              <p className="tw-text-iron-400 tw-text-sm tw-uppercase tw-tracking-wider tw-mb-1">
                Mint price
              </p>
              <p className="tw-text-iron-50 tw-text-base">0.06529 ETH</p>
            </div>
            <div className="tw-bg-iron-950 tw-p-4 tw-rounded-md">
              <p className="tw-text-iron-400 tw-text-sm tw-uppercase tw-tracking-wider tw-mb-1">
                Edition sizes
              </p>
              <p className="tw-text-iron-50 tw-text-base">
                In the 300s right now
              </p>
            </div>
          </div>

          <p className="tw-text-iron-300 tw-mb-4 tw-leading-relaxed tw-text-base">
            You can mint based on the Allowlist Phase you are in based on your
            TDH (P0, P1, P2) or public (if it goes to public).
          </p>
          <p className="tw-text-iron-300 tw-mb-4 tw-leading-relaxed tw-text-base">
            You can get priority within your Phase by subscribing in advance
            from your profile page. Details are here:
          </p>
          <a
            href="https://6529.io/about/subscriptions"
            target="_blank"
            rel="noopener noreferrer"
            className="tw-group tw-flex tw-items-center tw-text-primary-400 tw-font-medium desktop-hover:hover:tw-text-primary-300 tw-transition-colors"
          >
            Subscriptions
            <FontAwesomeIcon
              icon={faArrowRight}
              className="tw-ml-2 tw-text-base tw-size-3 tw-transition-transform desktop-hover:group-hover:tw-translate-x-0.5"
            />
          </a>
        </section>
        <div className="tw-text-center tw-p-5 tw-rounded-lg">
          <p className="tw-text-iron-200 tw-text-base tw-font-medium tw-mb-0">
            Welcome aboard!
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyStreamWaveFAQ;
