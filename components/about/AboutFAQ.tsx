import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  ABOUT_BODY_TEXT_CLASS_NAME,
  ABOUT_MEDIA_FRAME_CLASS_NAME,
  ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS,
  ABOUT_PAGE_TITLE_CLASS_NAME,
  ABOUT_SECTION_DIVIDER_CLASS_NAME,
  ABOUT_SECTION_HEADING_CLASS_NAME,
} from "./AboutLayout";

const FAQ_EDITORIAL_GRID_CLASS =
  "tw-grid tw-grid-cols-1 tw-items-start tw-gap-4 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)] lg:tw-gap-12";

const FAQ_CONTENT_CLASS = ABOUT_BODY_TEXT_CLASS_NAME;

const FAQ_EDITORIAL_BODY_CLASS = [
  "tw-min-w-0",
  ABOUT_BODY_TEXT_CLASS_NAME,
  "[&_a]:tw-break-words [&_a]:tw-rounded-sm [&_a]:tw-font-medium [&_a]:tw-text-primary-300 [&_a]:tw-underline [&_a]:tw-decoration-primary-400/50 [&_a]:tw-underline-offset-4 [&_a:hover]:tw-text-primary-400 [&_a:focus-visible]:tw-outline-none [&_a:focus-visible]:tw-ring-2 [&_a:focus-visible]:tw-ring-primary-400",
  "[&_dd]:tw-m-0 [&_dl]:tw-mb-0 [&_dl]:tw-mt-5 [&_dt]:tw-mb-2 [&_dt]:tw-mt-5 [&_dt]:tw-font-semibold [&_dt]:tw-text-iron-100",
  "[&_em]:tw-text-iron-200 [&_p]:tw-mb-0 [&_p]:tw-mt-4 [&_strong]:tw-font-semibold [&_strong]:tw-text-iron-100",
  "[&_h3]:tw-mb-0 [&_h3]:tw-mt-8 [&_h3]:tw-text-lg [&_h3]:tw-font-semibold [&_h3]:tw-leading-7 [&_h3]:tw-text-iron-100",
  "[&_ol]:tw-mb-0 [&_ol]:tw-mt-4 [&_ol]:tw-space-y-2 [&_ol]:tw-pl-6 [&_ol>li]:tw-pl-1 [&_ol>li::marker]:tw-font-semibold [&_ol>li::marker]:tw-text-iron-400",
  "[&_ul]:tw-mb-0 [&_ul]:tw-mt-4 [&_ul]:tw-space-y-2 [&_ul]:tw-pl-5 [&_ul>li]:tw-pl-1 [&_ul>li::marker]:tw-text-iron-500",
  "[&>dl:first-child]:tw-mt-0 [&>h3:first-child]:tw-mt-0 [&>ol:first-child]:tw-mt-0 [&>p:first-child]:tw-mt-0 [&>ul:first-child]:tw-mt-0",
].join(" ");

const FAQ_QUESTION_HEADING_CLASS = ABOUT_SECTION_HEADING_CLASS_NAME;

const FAQ_EDITORIAL_SECTION_CLASS = `${FAQ_EDITORIAL_GRID_CLASS} tw-border-0 tw-border-t tw-border-solid ${ABOUT_SECTION_DIVIDER_CLASS_NAME} tw-px-1 tw-py-8 sm:tw-px-2 sm:tw-py-12`;

const FAQ_IMAGE_FRAME_CLASS = `tw-mx-0 tw-mb-0 tw-mt-6 tw-overflow-hidden ${ABOUT_MEDIA_FRAME_CLASS_NAME} tw-p-2 sm:tw-p-3`;

export default function AboutFAQ() {
  const locale = DEFAULT_LOCALE;

  return (
    <article
      className={`tw-w-full tw-pb-12 tw-text-iron-100 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
    >
      <header
        className={`tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid ${ABOUT_SECTION_DIVIDER_CLASS_NAME} tw-px-1 tw-pb-10 tw-pt-4 sm:tw-px-2 sm:tw-pb-12 sm:tw-pt-8`}
      >
        <div className="tw-max-w-4xl">
          <h1 className={ABOUT_PAGE_TITLE_CLASS_NAME}>6529 FAQ</h1>
          <h2
            className={`tw-mt-6 tw-text-pretty ${ABOUT_SECTION_HEADING_CLASS_NAME}`}
          >
            What is 6529?
          </h2>
          <div className={`tw-mt-4 tw-space-y-4 ${ABOUT_BODY_TEXT_CLASS_NAME}`}>
            <p className="tw-m-0">
              6529 is a decentralized Network State open to anyone with an
              internet connection.
            </p>
            <p className="tw-m-0">
              It is a place where people choose what to build, fund it, and make
              it happen.
            </p>
            <p className="tw-m-0">
              The Memes are public-good NFTs at the core of the network. They
              align participants with shared values, fund public goods,
              distribute influence, and anchor identity and reputation.
            </p>
            <p className="tw-m-0">
              Identity and reputation live on-chain. Decision-making power is
              decentralized. What people decide gets built.
            </p>
            <p className="tw-m-0">
              Bitcoin decentralized money. Ethereum decentralized code. 6529
              decentralizes coordination.
            </p>
          </div>
        </div>
      </header>

      <div className={FAQ_CONTENT_CLASS}>
        <section>
          <ul className="tw-m-0 tw-list-none tw-p-0">
            <FAQQuestion title="How do I get started?">
              <p>Getting started is simple:</p>
              <ol>
                <li>
                  Go to <a href="https://6529.io">6529.io.</a>
                </li>
                <li>
                  Connect your wallet.{" "}
                  <a href="#what-is-a-wallet">(What is a wallet?)</a>
                </li>
                <li>Create your profile.</li>
                <li>Start exploring.</li>
              </ol>
              <p>
                From there, you can chat in Waves, vote, build reputation, and
                participate in the network.
              </p>
            </FAQQuestion>

            <FAQQuestion title="What are Waves?">
              <p>
                Waves are the communication and decision-making channels inside
                the 6529 coordination layer. They are functionally similar to
                Channels on Discord.
              </p>
              <p>
                Each Wave is a space for a specific topic, group, or initiative.
                In Waves, you can chat with others and vote on decisions related
                to that topic.
              </p>
              <p>
                Some Waves, like &quot;Maybe&apos;s Dive Bar&quot;, are casual
                conversations. Others, like &quot;The Memes - Main Stage&quot;,
                directly influence what gets built or funded.
              </p>
              <figure className={FAQ_IMAGE_FRAME_CLASS}>
                <Image
                  alt={t(locale, "about.faq.images.wavesAlt")}
                  className="tw-h-auto tw-w-full tw-rounded-lg"
                  height={1284}
                  sizes="(max-width: 767px) calc(100vw - 2rem), 56rem"
                  src="/faq-waves-view.jpg"
                  width={2626}
                />
              </figure>
            </FAQQuestion>

            <FAQQuestion title="What is my profile?">
              <p>
                Your profile is your identity in the network: it shows your user
                name and your profile picture. Here you can explore the activity
                of a user and see the reputation and participation in the
                community.
              </p>
              <figure className={FAQ_IMAGE_FRAME_CLASS}>
                <Image
                  alt="6529 profile view"
                  className="tw-h-auto tw-w-full tw-rounded-lg"
                  height={846}
                  sizes="(max-width: 767px) calc(100vw - 2rem), 56rem"
                  src="/faq-profile.jpg"
                  width={2076}
                />
              </figure>
              <p>Key components:</p>
              <dl>
                <dt>Total Days Held (TDH)</dt>
                <dd>
                  <ul>
                    <li>
                      Measures how long and how many Meme Cards you have held.
                    </li>
                    <li>Longer holding increases influence.</li>
                    <li>TDH allows each user to assign REP and NIC credits.</li>
                  </ul>
                </dd>

                <dt>Reputation (REP)</dt>
                <dd>
                  <ul>
                    <li>
                      Reflects your skills, contributions, and participation.
                    </li>
                    <li>Used to signal trust in the network.</li>
                  </ul>
                </dd>

                <dt>Network Identity Credits (NIC)</dt>
                <dd>
                  <ul>
                    <li>
                      Represents your identity within and outside of 6529.
                    </li>
                    <li>Helps the network understand you.</li>
                  </ul>
                </dd>
              </dl>
            </FAQQuestion>

            <FAQQuestion title="How does the system work overall?">
              <p>6529 runs on a simple flywheel:</p>
              <p>
                <strong>
                  Memes &rarr; TDH &rarr; Reputation &rarr; Coordination
                </strong>
              </p>
              <ul>
                <li>
                  The Memes create culture, fund public goods, and attract
                  aligned participants.
                </li>
                <li>Holding The Memes NFTs (meme cards) builds TDH.</li>
                <li>TDH provides credibility to reputation and identity.</li>
                <li>
                  Credible identity and reputation on-chain enables better
                  coordination and effective decision-making.
                </li>
              </ul>
              <p>As this loop grows, the network becomes more powerful.</p>
            </FAQQuestion>

            <FAQQuestion title="Why do Memes matter?">
              <p>
                New systems need new cultures. The Memes exist to spread ideas
                like:
              </p>
              <ul>
                <li>Economic freedom.</li>
                <li>Open systems.</li>
                <li>Digital rights.</li>
              </ul>
              <p>
                The goal is not just funding public goods. The goal is cultural
                impact at scale.
              </p>
            </FAQQuestion>

            <FAQQuestion title="What are The Memes?">
              <p>
                The Memes are a community curated NFT collection focused on
                decentralization, digital rights, and open systems.
              </p>
              <p>
                They are the starting point of the network. They serve three
                roles:
              </p>
              <ul>
                <li>Cultural expression.</li>
                <li>Coordination mechanism.</li>
                <li>Public goods funding.</li>
              </ul>
              <p>
                New Meme Cards are released three times per week, forever, and
                selected through community TDH voting in &quot;The Memes - Main
                Stage&quot; wave.
              </p>
            </FAQQuestion>

            <FAQQuestion title="Why would I collect Meme Cards?">
              <p>Collecting The Memes lets you:</p>
              <ul>
                <li>Earn TDH over time and build influence in the network.</li>
                <li>Support public goods.</li>
                <li>Own culturally meaningful art.</li>
              </ul>
              <p>
                Holding longer increases your influence and alignment with the
                network.
              </p>
            </FAQQuestion>

            <FAQQuestion title="How do Meme drops work?">
              <ul>
                <li>Drops occur Monday, Wednesday, and Friday.</li>
                <li>
                  The community votes on which artwork is selected using TDH.
                </li>
                <li>Mint price is 0.06529 ETH per edition.</li>
                <li>
                  You can mint during the drop or buy on secondary markets.
                </li>
              </ul>
            </FAQQuestion>

            <FAQQuestion title="Do Meme Cards have utility?">
              <p>
                All the Meme Cards generate TDH which is central in the process
                of curating and deciding which artworks we select to mint among
                other governance tasks.
              </p>
              <p>
                When you mint a Meme Card, you get the final product: an
                art-edited NFT. All The Memes are CC0 (public domain) and anyone
                can use the art freely but only those who hold the NFT generate
                TDH.
              </p>
            </FAQQuestion>

            <FAQQuestion title="How do I participate beyond collecting?">
              <p>You don&apos;t need to buy anything to participate.</p>
              <p>You can:</p>
              <ul>
                <li>Join conversations in Waves.</li>
                <li>Contribute ideas.</li>
                <li>Help curate content.</li>
                <li>Build tools or projects.</li>
                <li>Coordinate with others on non-TDH votes.</li>
              </ul>
              <p>Over time, participation builds reputation and influence.</p>
            </FAQQuestion>

            <FAQQuestion title="What is the long-term vision?">
              <p>
                6529 aims for nation-scale impact. The goal is to build a
                global, decentralized economy the size of South Korea or NYC,
                where:
              </p>
              <ul>
                <li>Humans and AI coordinate global work together.</li>
                <li>Capital and talent are allocated through reputation.</li>
                <li>Public goods are funded at scale.</li>
              </ul>
              <p>
                This is a new model for organizing society and economic activity
                globally.
              </p>
            </FAQQuestion>

            <FAQQuestion title="How does everything fit together?">
              <ul>
                <li>Memes create culture and fund the system.</li>
                <li>TDH measures alignment.</li>
                <li>REP and NIC build identity and trust.</li>
                <li>Waves enable coordination and decisions.</li>
                <li>Decisions trigger real-world and on-chain outcomes.</li>
              </ul>
              <p>
                6529 is a new global coordination layer for the modern economy.
              </p>
            </FAQQuestion>

            <FAQQuestion title="What are Gradients?">
              <p>
                6529 Gradients is an NFT collection of 101 grayscale variations
                of the 6529 logo, released in October 2021. No additional NFTs
                will ever be added.
              </p>
              <p>
                The collection has no direct relationship to The Memes. It
                predates The Memes and was created as a purely conceptual
                project.
              </p>
              <p>
                Gradient holders receive a 2% TDH boost. They are also included
                in The Memes allowlists as early supporters of the
                decentralization mission, and we value having them participate
                in the network.
              </p>
              <p>
                Secondary market for the collection can be found here:{" "}
                <a
                  href="https://opensea.io/collection/6529-gradient"
                  target="_blank"
                  rel="noreferrer"
                >
                  Gradients.
                </a>
              </p>
            </FAQQuestion>

            <FAQQuestion title="What is NextGen?">
              <p>
                NextGen is an on-chain generative art NFT platform on Ethereum.
                It supports 6529&apos;s goals around art experimentation and
                decentralized social coordination.
              </p>
              <p>
                NextGen uses a core smart contract (with supporting contracts)
                to host multiple artist collections. The generative script and
                seed are stored fully on-chain, and traits are randomized at
                mint.
              </p>
              <p>
                There is no fixed drop schedule for new collections. Drops
                happen only when the work meets a high bar for quality and
                originality.
              </p>
            </FAQQuestion>

            <FAQQuestion title="What are ReMemes?">
              <p>
                ReMemes are community-created derivatives of The Memes. Anyone
                can make a ReMeme. No approval is needed.
              </p>
              <p>
                Submit and explore them on the{" "}
                <Link href="/rememes">ReMemes platform.</Link>
              </p>
            </FAQQuestion>

            <FAQQuestion title="What is the Meme Lab?">
              <p>
                The Meme Lab is an experimental CC0 contract for artists who
                have already minted a Meme Card. It lets them create and mint
                NFTs in any way they choose.
              </p>
              <p>
                There is no fixed drop schedule for new collections. Drops
                happen when ready and are announced on the{" "}
                <a
                  href="https://x.com/6529collections"
                  target="_blank"
                  rel="noreferrer"
                >
                  6529collections X account.
                </a>
              </p>
              <p>The economics of each drop are determined by the artist.</p>
            </FAQQuestion>
          </ul>
        </section>

        <FAQEditorialSection
          headingId="faq-bonus-track-heading"
          title="Bonus track"
        >
          <p>
            If you want to go deeper into 6529 in book form, your path is{" "}
            <em>Memes Outside: The Book (2nd Edition).</em> It is a living
            extension of everything you have read so far. The book is an
            interactive experience that connects the digital world of 6529 with
            physical space. It invites you to take art outside, play with it,
            interact with it, and become a co-creator. Through essays, images,
            and guided explorations, it shows how the concept of network art can
            be experienced beyond the screen. Each copy is, in a sense, a unique
            piece completed through your own actions.
          </p>
          <p>
            The book is CC0 and you can download it here:{" "}
            <a
              href="https://media.6529.io/arweave/HRGsv6tXpKx-yUPD8j7zi8Vz8-ILZr378oNDYemST0E"
              target="_blank"
              rel="noreferrer"
            >
              Memes Outside: The Book (2nd Edition).
            </a>
          </p>
        </FAQEditorialSection>

        <FAQEditorialSection
          headingId="what-is-a-wallet-heading"
          id="what-is-a-wallet"
          title="What is a Wallet?"
        >
          <h3>What is a crypto wallet?</h3>
          <p>
            A crypto wallet is a tool that allows you to store, send, and
            receive cryptocurrency. Think of it like a digital version of your
            physical wallet, except instead of holding cash and cards, it holds
            your digital assets.
          </p>

          <h3>How does it work?</h3>
          <p>
            Your wallet doesn&apos;t actually store your crypto; the crypto
            lives on the blockchain. What your wallet stores are your private
            keys, which are secret codes that prove you own your assets and
            allow you to authorize transactions. Your wallet also has a public
            address (like an email address) that others can use to send you
            crypto.
          </p>

          <h3>Types of wallets</h3>
          <p>
            There are two main categories of crypto wallets: hot wallets and
            cold wallets. The key difference is whether the wallet is connected
            to the internet.
          </p>

          <h3>Hot Wallets (Connected to the Internet)</h3>
          <p>
            Hot wallets are software-based wallets that are always connected to
            the internet. They are convenient, easy to use, and free, making
            them ideal for everyday transactions. The tradeoff is that because
            they are online, they are more vulnerable to hacking or phishing
            attacks.
          </p>
          <p>Popular Hot Wallets:</p>
          <ul>
            <li>
              <strong>MetaMask:</strong> The most popular browser extension
              wallet for Ethereum and NFTs. Available at{" "}
              <a href="https://metamask.io" target="_blank" rel="noreferrer">
                metamask.io.
              </a>
            </li>
            <li>
              <strong>Rabby Wallet:</strong> A browser extension wallet built
              for DeFi and NFT users, with built-in transaction previews and
              multi-chain support. Available at{" "}
              <a href="https://rabby.io" target="_blank" rel="noreferrer">
                rabby.io.
              </a>
            </li>
            <li>
              <strong>Coinbase Wallet:</strong> A user-friendly mobile and
              browser wallet from Coinbase. Available at{" "}
              <a
                href="https://wallet.coinbase.com"
                target="_blank"
                rel="noreferrer"
              >
                wallet.coinbase.com.
              </a>
            </li>
            <li>
              <strong>Rainbow Wallet:</strong> A mobile-first Ethereum wallet,
              great for NFT collectors. Available at{" "}
              <a href="https://rainbow.me" target="_blank" rel="noreferrer">
                rainbow.me.
              </a>
            </li>
            <li>
              <strong>Trust Wallet:</strong> A multi-chain mobile wallet
              supporting hundreds of cryptocurrencies. Available at{" "}
              <a
                href="https://trustwallet.com"
                target="_blank"
                rel="noreferrer"
              >
                trustwallet.com.
              </a>
            </li>
          </ul>

          <h3>Cold Wallets (Offline Storage)</h3>
          <p>
            Cold wallets are hardware or paper-based wallets that store your
            private keys completely offline. Because they are never connected to
            the internet, they are far more secure against hacking. They are
            best suited for storing large amounts of digital assets long-term.
            The tradeoff is that they cost money to purchase and are less
            convenient for everyday use.
          </p>
          <p>Popular Cold Wallets:</p>
          <ul>
            <li>
              <strong>Ledger:</strong> The most widely used hardware wallet
              brand, supporting thousands of cryptocurrencies. Available at{" "}
              <a href="https://ledger.com" target="_blank" rel="noreferrer">
                ledger.com. (~$79-$249)
              </a>
            </li>
            <li>
              <strong>Trezor:</strong> An open-source hardware wallet known for
              its strong security model. Available at{" "}
              <a href="https://trezor.io" target="_blank" rel="noreferrer">
                trezor.io. (~$69-$219)
              </a>
            </li>
          </ul>

          <h3>Important Security Tips</h3>
          <ul>
            <li>
              Never share your seed phrase or private key with anyone, not even
              support staff or developers.
            </li>
            <li>
              Never enter your seed phrase on any website. Legitimate services
              will never ask for it.
            </li>
            <li>Always download wallets from official websites only.</li>
            <li>Always double-check URLs before connecting your wallet.</li>
            <li>
              Consider using a separate &quot;burner&quot; wallet for new or
              untrusted platforms, keeping your main holdings in a separate
              wallet.
            </li>
          </ul>
        </FAQEditorialSection>
      </div>
    </article>
  );
}

function FAQQuestion({
  children,
  title,
}: {
  readonly children: ReactNode;
  readonly title: string;
}) {
  return (
    <li className={`${FAQ_EDITORIAL_SECTION_CLASS} first:tw-border-t-0`}>
      <div className="lg:tw-sticky lg:tw-top-28">
        <h2 className={FAQ_QUESTION_HEADING_CLASS}>{title}</h2>
      </div>
      <div className={FAQ_EDITORIAL_BODY_CLASS}>{children}</div>
    </li>
  );
}

function FAQEditorialSection({
  children,
  headingId,
  id,
  title,
}: {
  readonly children: ReactNode;
  readonly headingId: string;
  readonly id?: string;
  readonly title: string;
}) {
  return (
    <section
      aria-labelledby={headingId}
      className={`${FAQ_EDITORIAL_SECTION_CLASS} ${id ? "tw-scroll-mt-24 focus:tw-outline-none" : ""}`}
      id={id}
      tabIndex={id ? -1 : undefined}
    >
      <div className="lg:tw-sticky lg:tw-top-28">
        <h2 className={FAQ_QUESTION_HEADING_CLASS} id={headingId}>
          {title}
        </h2>
      </div>
      <div className={FAQ_EDITORIAL_BODY_CLASS}>{children}</div>
    </section>
  );
}
