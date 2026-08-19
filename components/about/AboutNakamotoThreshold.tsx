import { CheckCircleIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ABOUT_BODY_TEXT_CLASS_NAME,
  ABOUT_CARD_CLASS_NAME,
  ABOUT_MEDIA_FRAME_CLASS_NAME,
  ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS,
  ABOUT_PAGE_TITLE_CLASS_NAME,
  ABOUT_SECTION_DIVIDER_CLASS_NAME,
  ABOUT_SECTION_HEADING_CLASS_NAME,
} from "./AboutLayout";

const NAKAMOTO_EDITORIAL_GRID_CLASS =
  "tw-grid tw-grid-cols-1 tw-items-start tw-gap-4 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)] lg:tw-gap-12";

const NAKAMOTO_CONTENT_CLASS = [
  ABOUT_BODY_TEXT_CLASS_NAME,
  "[&_p]:tw-mb-0 [&_p]:tw-mt-4 [&_p:first-child]:tw-mt-0",
  "[&_ol]:tw-mb-0 [&_ol]:tw-mt-4 [&_ol]:tw-space-y-2 [&_ol]:tw-pl-6 [&_ol>li]:tw-pl-1 [&_ol>li::marker]:tw-font-semibold [&_ol>li::marker]:tw-text-iron-400",
].join(" ");

const NAKAMOTO_LIST_CLASS =
  "tw-mb-0 tw-space-y-2 tw-pl-5 [&>li]:tw-pl-1 marker:tw-text-iron-500";

const NAKAMOTO_IMAGE_FRAME_CLASS = `tw-m-0 tw-overflow-hidden ${ABOUT_MEDIA_FRAME_CLASS_NAME} tw-p-2 sm:tw-p-3`;

const NAKAMOTO_CALLOUT_CLASS = `tw-mt-4 ${ABOUT_CARD_CLASS_NAME} tw-p-5 sm:tw-p-6`;

const NAKAMOTO_CHECK_LIST_CLASS =
  "tw-mb-0 tw-mt-4 tw-list-none tw-space-y-2 tw-pl-0";

function NakamotoCheckListItem({ children }: { readonly children: ReactNode }) {
  return (
    <li className="tw-flex tw-items-center tw-gap-3 tw-pl-0">
      <CheckCircleIcon
        aria-hidden="true"
        className="tw-size-5 tw-flex-none tw-text-emerald-400"
      />
      <span className="tw-min-w-0">{children}</span>
    </li>
  );
}

export default function AboutNakamotoThreshold() {
  return (
    <article
      className={`tw-w-full tw-pb-12 tw-text-iron-100 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
    >
      <header className="tw-px-1 tw-pb-8 tw-pt-4 sm:tw-px-2 sm:tw-pb-12 sm:tw-pt-8">
        <div className="tw-max-w-4xl">
          <h1 className={ABOUT_PAGE_TITLE_CLASS_NAME}>Nakamoto Threshold</h1>
          <h2 className={`tw-mt-6 ${ABOUT_SECTION_HEADING_CLASS_NAME}`}>
            What is the Nakamoto Threshold?
          </h2>
          <div className="tw-mt-4 tw-min-w-0">
            <p className={`tw-m-0 ${ABOUT_BODY_TEXT_CLASS_NAME}`}>
              This is a bit of Memes inside-baseball but I am{" "}
              <Link
                className="tw-rounded-sm tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-400/50 tw-underline-offset-4 hover:tw-text-primary-400 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                href="https://x.com/punk6529/status/1779105411443949809"
                rel="noopener noreferrer"
                target="_blank"
              >
                tweeting
              </Link>{" "}
              it out so we have it available for reference.
            </p>
            <p className={`tw-m-0 tw-mt-4 ${ABOUT_BODY_TEXT_CLASS_NAME}`}>
              Meme Card #4 is an homage to the first Rare Pepe which had an
              edition count of 300.
            </p>
            <p className={`tw-m-0 tw-mt-4 ${ABOUT_BODY_TEXT_CLASS_NAME}`}>
              So Meme Card #4 had an edition count of 300.
            </p>
            <div className="tw-mt-6 tw-grid tw-max-w-3xl tw-grid-cols-1 tw-items-start tw-gap-4 sm:tw-grid-cols-2 sm:tw-gap-6">
              <figure className={NAKAMOTO_IMAGE_FRAME_CLASS}>
                <Image
                  alt="Meme Card #4"
                  className="tw-h-auto tw-w-full tw-rounded-lg"
                  height={1464}
                  loading="eager"
                  sizes="(max-width: 639px) calc(100vw - 2rem), 23rem"
                  src="/the-memes-4.jpeg"
                  width={1000}
                />
              </figure>
              <figure className={NAKAMOTO_IMAGE_FRAME_CLASS}>
                <Image
                  alt="the first Rare Pepe"
                  className="tw-h-auto tw-w-full tw-rounded-lg"
                  height={560}
                  loading="eager"
                  sizes="(max-width: 639px) calc(100vw - 2rem), 23rem"
                  src="/nakamoto-card-og.png"
                  width={400}
                />
              </figure>
            </div>
          </div>
        </div>
      </header>
      <NakamotoEditorialSection
        id="edition-sizes-matter"
        title="Edition Sizes Matter"
      >
        <p>
          The Memes were deliberately designed to be relatively low unit price
          and relatively high edition count.
        </p>
        <p>
          This is important for the overall mission in a large numbers of ways.
          There is no way the mission works with a small number of rich
          collectors.
        </p>
        <p>
          Interestingly, because people like eye-catching sales, this is one of
          the things that leads people to still underestimate The Memes a bit.
        </p>
        <p>
          The Naka has the highest unit price because it is an awesome card
          (trades around 6ETH now, ATH &gt; 20ETH) but...
        </p>
        <p>
          ...if the mission was &quot;maximize unit price&quot;, we could have
          easily dropped some ed: 50 and ed: 10 and ed: 5 and 3 and 2 and 1 and
          some of those would have traded at higher unit prices.
        </p>
        <p>
          But not only that does not help what we are trying to do here, it
          hurts it.
        </p>
        <p>OK, remind me of the mission?</p>
        <p>
          Not today. But soon. This is a thread about the Nakamoto Threshold.
        </p>
        <p>So early on, I said Card #4 would be the lowest edition card.</p>
        <p>
          Seemed like a nice homage to the OG Naka, an appropriate level of
          respect where respect was due.
        </p>
        <p>
          To be honest, back then it did not even seem like a hard decision.
        </p>
        <p>
          I knew we would lose some marketing value by not having high unit
          price sales from small editions, but ok, whatever.
        </p>
        <p>Edition sizes were 500, 1,000, 2,000.</p>
        <p>Seemed like a safe hurdle.</p>
        <p>The Nakamoto Threshold: all others will exceed 300 </p>
      </NakamotoEditorialSection>
      <NakamotoEditorialSection
        id="testing-the-threshold"
        title="Testing the Threshold"
      >
        <p>Bear market came.</p>
        <p>
          Instead of people yelling me for being &quot;elitist&quot; for only
          have edition sizes of 1K to 2K and not expanding (seriously, this was
          a thing for like 3 months), people started disappearing.
        </p>
        <p>We roughly try to match edition sizes to demand.</p>
        <p>
          It is art, not science. Demand is not so predictable and, of course,
          the actual art and actual artist makes a big difference.
        </p>
        <p>Some artists would sell out any edition size instantly.</p>
        <p>
          So we try to find a happy medium between the well-known artists and
          the less well-known artists and that means the edition sizes started
          grinding down.
        </p>
        <p>
          For a few months, they have been averaging in the low three hundreds.
        </p>
        <p>
          Now, low three hundreds for art editions, three times a week, across
          many artists, in an NFT bear markets isn&apos;t &quot;good&quot;, it
          is &quot;awesome&quot;
        </p>
        <p>
          More individual pieces of art are minted on The Memes each week than
          almost anywhere else in the NFT space.
        </p>
        <p>
          Let&apos;s say, depending on the artist and how the crypto world feels
          that day, a meme card would mint out between 275 to 350 on average
          right now (exceptions exist on both sides).
        </p>
        <p>
          Is this a problem? It is not a problem at all. It is great, awesome!
        </p>
        <p>And, in USD terms, we are not at the bottom.</p>
        <p>ETH is expensive again now, so, in USD terms, the mints are fine.</p>
      </NakamotoEditorialSection>
      <NakamotoEditorialSection
        id="consider-the-options"
        title="Consider the Options"
      >
        <p>
          If 2 years ago I had not said &quot;Card 4 will be the lowest edition
          count&quot;, we would not even be thinking about this at all.
        </p>
        <p>
          But I did say that, I said that Card 4 would be the lowest edition
          count so, a few months ago, we hit Decision Time™
        </p>
        <p>It was clear some cards would not hit 300 mints.</p>
        <p>What should we do?</p>
        <div className={NAKAMOTO_CALLOUT_CLASS}>
          <p>
            There was *a lot* of discussion in Discord and basically it boiled
            down to 5 ideas:
          </p>
          <ul className={`${NAKAMOTO_LIST_CLASS} tw-mt-6 tw-list-disc`}>
            <li>Change the threshold</li>
            <li>Mint fewer times per week</li>
            <li>Airdrop to collectors</li>
            <li>I mint them</li>
            <li>Airdrop somewhere else</li>
          </ul>
        </div>
        <p>The first one was the easiest.</p>
        <blockquote className="tw-mx-0 tw-my-6 tw-border-y-0 tw-border-l-2 tw-border-r-0 tw-border-solid tw-border-iron-700 tw-pl-5 tw-italic tw-text-iron-300 sm:tw-pl-6">
          <p>
            &quot;Sure, I said that, but circumstances change, we have to change
            with circumstances. Empires rise and fall, major companies go
            bankrupt, the only sure thing is the heat death of the universe. It
            can&apos;t be that this is the one immutable&quot;
          </p>
        </blockquote>
        <p>
          I gave this option serious consideration because I do think, in many
          things, people should be flexible and adapt to circumstances.
        </p>
        <p>Ultimately, I decided against it for two reasons</p>
        <p>
          First of all, I like to do what I say I am going to do if there is any
          way possible to do it
        </p>
        <p>
          And I could see a way to do it. It would be costly to me, but I made
          up the rule in the first place, it is OK if I had to pay a price for
          it.
        </p>
        <p>The second is more subtle.</p>
        <p>
          Even in crypto many things change. The BTC of today is not the BTC of
          Satoshi. Same with Ethereum.
        </p>
        <p>But it is important that something stays fixed</p>
        <p>In BTC it is easy, it is 21M BTC.</p>
        <p>
          BTC will live or die based on the 21M issuance schedule never
          changing.
        </p>
        <p>It is the bright line that distinguishes BTC from not-BTC.</p>
        <p>Ethereum faced an important decision of this nature in 2016.</p>
        <p>
          There is a fork (less important now) from the early days (Ethereum vs
          Ethereum Classic) about whether Ethereum should have reorged out The
          DAO attacker.
        </p>
        <p>History lesson below.</p>
        <figure
          className={`${NAKAMOTO_IMAGE_FRAME_CLASS} tw-mt-6 tw-w-full tw-max-w-lg`}
        >
          <Image
            alt="Ethereum faced an important decision of this nature in 2016."
            className="tw-h-auto tw-w-full tw-rounded-lg"
            height={1024}
            sizes="(max-width: 767px) calc(100vw - 2rem), 32rem"
            src="/ethereum-history.png"
            width={573}
          />
        </figure>
        <p>
          So back to The Memes. I asked myself if I had made any absolute
          statements about The Memes.
        </p>
        <p>I concluded that I had made two:</p>
        <ul className={`${NAKAMOTO_LIST_CLASS} tw-mt-4`}>
          <li>that they would be CC0</li>
          <li>that card #4 would be the lowest edition count</li>
        </ul>
        <p>So what should we do?</p>
      </NakamotoEditorialSection>
      <NakamotoEditorialSection
        id="maintaining-the-commitment"
        title="Maintaining the Commitment"
      >
        <p>
          I decided that the correct answer is that those two absolutes never
          change.
        </p>
        <p>
          That literally everything else might change, but that those two do not
          change.
        </p>
        <p>The naive view is this is about my personal credibility.</p>
        <p>I think it is actually much subtler than that.</p>
        <p>
          It is about a group of people (not just me but the artists and
          collectors) agreeing about a hierarchy of decision-making.
        </p>
        <p>No decision is free. Every choice has costs.</p>
        <p>
          Societies coalesce by consensus on which ideals and absolutes they
          will sacrifice for.
        </p>
        <p>
          Isn&apos;t this a totally absurd arbitrary number? Of course it is!
        </p>
        <p>
          So is 21 million BTC. 21M BTC does not mean anything. It is an idea,
          it is a myth, it is a meme. It could be 10M or 100M.
        </p>
        <p>
          What matters is ONLY if team BTC sticks to it, that is the magic about
          it.
        </p>
      </NakamotoEditorialSection>
      <NakamotoEditorialSection
        id="managing-tradeoffs"
        title="Managing Tradeoffs"
      >
        <p>
          BTC sacrifices many many other things to 21M and its other ideal
          (small blocks for decentralization).
        </p>
        <p>
          There are tradeoffs. This is the necessary element for BTC being BTC.
        </p>
        <p>
          Other chains make other tradeoffs which is also correct - we should
          try many things.
        </p>
        <p>
          So BTC has 21M and small blocks. The Memes have the Nakamoto Threshold
          and CC0.
        </p>
        <p>Before people get upset, obviously The Memes are not BTC.</p>
        <p>
          But the social construction process is the same. You have to decide
          what you will sacrifice for.
        </p>
      </NakamotoEditorialSection>
      <NakamotoEditorialSection
        id="implementation-pathways"
        title="Implementation Pathways"
      >
        <p>
          Once this decision was made, we go to step 2: &quot;how do we
          implement staying above 300 edition size&quot;.
        </p>
        <p>
          The first idea &quot;mint fewer times a week&quot; is not a solution
          at all because it just skips the problem altogether.
        </p>
        <p>What if you mint 1x a week and still a card fails to hit 300?</p>
        <p>
          The second idea: &quot;airdrop to collectors&quot; is superficially a
          nice idea but, one thing I have learned, is that small partial
          airdrops are a net negative for collector happiness.
        </p>
        <p>
          What do I mean? if @6529er airdrops a card to 2K top collectors =
          ok-ish.
        </p>
        <p>
          But here the airdrops would be small - maybe 10 one week, maybe 50
          another week, so any airdrop would leave out 99% of The Memes
          collectors.
        </p>
        <p>
          Even if we used the &apos;fairest&apos; possible formula in the world
          for allocating the airdrops (there is no perfectly fair formula).
        </p>
        <p>I am 100% sure that:</p>
        <ul className={NAKAMOTO_CHECK_LIST_CLASS}>
          <NakamotoCheckListItem>
            the happiness of 10-20-30 collectors getting a 0.06529 ETH free
            airdrop of a card they might have not even wanted
          </NakamotoCheckListItem>
          <li className="tw-pl-8">...would be much less than...</li>
          <NakamotoCheckListItem>
            the annoyance of the other 9,500 who did not get it.
          </NakamotoCheckListItem>
        </ul>
        <p>
          And, in practice, what it would mean that several times a week we
          would be having endless cringe discussions of &quot;if the airdrop
          formula was &apos;fair&apos;&quot;.
        </p>
        <p>
          Life is short and I do not intend to spend my life arguing about the
          formula for 0.5 ETH or 1ETH or 2ETH of airdrops.
        </p>
      </NakamotoEditorialSection>
      <NakamotoEditorialSection id="decision-time" title="Decision Time">
        <p>
          So time was running out, I was watching a card that would not mint
          out.
        </p>
        <p>
          I decided to do the only thing 100% under my control and also that did
          not break the absolute rules.
        </p>
        <p>I minted it myself over the 300 Nakamoto Threshold.</p>
        <p>And then it happened again, so I minted again.</p>
        <p>
          And this went on for a while and tied up quite a bit of ETH that I had
          other plans for.
        </p>
        <p>
          But my arbitrary rule, when there is no other solution, no better
          solution, I need to pay the price.
        </p>
      </NakamotoEditorialSection>
      <NakamotoEditorialSection id="count-the-costs" title="Count the Costs">
        <p>
          Now what are the costs (beyond ETH)? Some say it is cringe to mint
          your own drops.
        </p>
        <p>
          OK, they are free to have their opinion. I do not think it is cringe.
          I am doing it openly. I like Meme Cards.
        </p>
        <p>
          But even if some people don&apos;t like it, it goes in the
          &apos;sacrifice&apos; bucket.
        </p>
        <p>
          Another cost is concentration of ownership of a specific Meme Card.
        </p>
        <p>
          This is true but the Meme Cards are the Lebron James of distributed
          ownership. It is only bad relative to other Meme Cards.
        </p>
        <p>Vs everyone else, we are uber-chads here.</p>
        <p>
          Many meme cards have unique ownership in the 80s-90%. The ones that I
          had to mint are generally 60-80%.
        </p>
        <p>
          These are all laughably high numbers. Rare Pepes are worse, as punks,
          ABC, even XCOPY 1/1s. We have tons of room here to spare.
        </p>
        <p>
          The reasons we are so good on distributed ownership is that we are
          obsessed with anti-sybil measures for reasons we will discuss later.
        </p>
        <p>
          So this sacrifice was an easy one to take. Some Meme Cards are A+ on
          unique ownership. Some are B. It is totally fine.
        </p>
      </NakamotoEditorialSection>
      <NakamotoEditorialSection id="bigger-plans" title="Bigger Plans">
        <p>
          Now, along the way, I was still thinking about what the long-term
          solution could be.
        </p>
        <p>
          If you really believe in a long-term view for The Memes, me minting
          them out is a stopgap.
        </p>
        <p>
          What if I run out of ETH? What if I am lost on a Nepalese hiking
          expedition?
        </p>
        <div className={NAKAMOTO_CALLOUT_CLASS}>
          <p>
            What we decided is that in SZN7, at the end of the public phase, any
            cards needed to push edition size to 310 are airdropped to:
            <strong className="tw-mt-1 tw-block tw-font-semibold tw-text-iron-100">
              research.6529.eth
            </strong>
          </p>
          <p>
            This is an account that will work in the context of the tools we are
            building to support expertise on topics we need to study.
          </p>
        </div>
        <p>
          Specifically this account will accrue some weight within the ecosystem
          but will use that weight only by proxy to bring in experts on various
          topics we are trying to solve—technical topics, legal topics, etc.
        </p>
        <p>In other words, exactly what the name says &quot;research&quot;.</p>
      </NakamotoEditorialSection>
      <NakamotoEditorialSection id="research-what" title="Research What?">
        <p>
          &quot;Wait, what research does an art edition collection need?&quot;
          Imagine thinking that is the goal.
        </p>
        <p>Where we are going, we will need our own NSF, NIH, ERC, Horizon.</p>
        <p>
          We don&apos;t need them now, but we will. So we can start planting the
          seeds now, let them grow.
        </p>
      </NakamotoEditorialSection>
      <NakamotoEditorialSection
        id="evaluating-the-outcome"
        title="Evaluating the Outcome"
      >
        <p>I am very happy with this solution.</p>
        <ul className={NAKAMOTO_CHECK_LIST_CLASS}>
          <NakamotoCheckListItem>
            It correctly establishes a hierarchy of priorities, of absolutes.
          </NakamotoCheckListItem>
          <NakamotoCheckListItem>
            It removes dependency on me.
          </NakamotoCheckListItem>
          <NakamotoCheckListItem>
            It plants a seed for the future.
          </NakamotoCheckListItem>
          <NakamotoCheckListItem>No real negatives.</NakamotoCheckListItem>
          <NakamotoCheckListItem>
            It is aesthetically extremely pleasing.
          </NakamotoCheckListItem>
        </ul>
        <p>I am also very happy with the process.</p>
        <ul className={NAKAMOTO_CHECK_LIST_CLASS}>
          <NakamotoCheckListItem>
            it took several months to get here, to figure this out.
          </NakamotoCheckListItem>
          <NakamotoCheckListItem>
            In the interim, I had to decide what to do and I took the decision
            to mint out until we find a good permanent solution.
          </NakamotoCheckListItem>
          <NakamotoCheckListItem>
            Group discussion was very good faith and civilized.
          </NakamotoCheckListItem>
        </ul>
      </NakamotoEditorialSection>
      <NakamotoEditorialSection
        id="good-decision-making-is-hard"
        title="Good Decision Making is Hard"
      >
        <p>
          Someone in Discord told me I &quot;overthink&quot; things and I
          laughed. This is literally my defining characteristic.
        </p>
        <p>
          Excellent decisions are hard, they need, in fact, a lot of thinking,
          ideally with good group discussion, sometimes for months and years.
        </p>
        <p>
          Building a group culture that can make good decisions is the only
          thing that matters in the long-run. We will have endless opportunities
          and challenges.
        </p>
        <p>
          There is no more higher leverage capability than being able to make
          good collective decisions. It is &quot;all the alpha&quot;.
        </p>
      </NakamotoEditorialSection>
      <NakamotoEditorialSection id="stacking-goods" title="Stacking Goods">
        <p>
          Coming back to the aesthetically pleasing part, what is currently
          happening in The Memes is pure utter magic of stacking public goods on
          top of public goods on top of public goods.
        </p>
        <p>
          All completely voluntary, all culturally driven, not contractually
          driven. It goes like this.
        </p>
        <p>This is the cycle:</p>
        <ul className={NAKAMOTO_CHECK_LIST_CLASS}>
          <NakamotoCheckListItem>
            Collectors mint incredible art from great artists, beautifully
            curated.
          </NakamotoCheckListItem>
          <NakamotoCheckListItem>
            Art enters the public domain.
          </NakamotoCheckListItem>
          <NakamotoCheckListItem>
            We (voluntarily) build software also in the public domain.
          </NakamotoCheckListItem>
          <NakamotoCheckListItem>
            Sometimes, the art will support science.
          </NakamotoCheckListItem>
          <NakamotoCheckListItem>
            [Redacted] A 4th public good we will show soon.
          </NakamotoCheckListItem>
        </ul>
        <p>Was lowering the mint cost an option at all?</p>
        <p>
          This is an independent question. You could pick a lower price and
          still not mint out so you still have to resolve the absolute question
          head-on.
        </p>
        <p>
          Mint price is not a system absolute like Nakamoto Threshold. In
          principle, it can change in the future.
        </p>
      </NakamotoEditorialSection>
    </article>
  );
}

function NakamotoEditorialSection({
  children,
  id,
  title,
}: {
  readonly children: ReactNode;
  readonly id: string;
  readonly title: string;
}) {
  const headingId = `nakamoto-${id}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className={`${NAKAMOTO_EDITORIAL_GRID_CLASS} tw-border-0 tw-border-t tw-border-solid ${ABOUT_SECTION_DIVIDER_CLASS_NAME} tw-px-1 tw-py-8 sm:tw-px-2 sm:tw-py-12`}
    >
      <div className="lg:tw-sticky lg:tw-top-28">
        <h2 className={ABOUT_SECTION_HEADING_CLASS_NAME} id={headingId}>
          {title}
        </h2>
      </div>
      <div className={`tw-min-w-0 ${NAKAMOTO_CONTENT_CLASS}`}>{children}</div>
    </section>
  );
}
