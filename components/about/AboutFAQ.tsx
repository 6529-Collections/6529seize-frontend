import Link from "next/link";
import Image from "next/image";
import { Col, Container, Row } from "react-bootstrap";
import styles from "./About.module.scss";

export default function AboutFAQ() {
  return (
    <Container>
      <Row>
        <Col>
          <h1>6529 FAQ</h1>
        </Col>
      </Row>
      <Row>
        <Col className={styles["faqContainer"]}>
          <section>
            <ol className={styles["faqList"]}>
              <li>
                <h3>What is 6529?</h3>
                <p>
                  6529 is a decentralized Network State open to anyone with an
                  internet connection.
                </p>
                <p>
                  It is a place where people choose what to build, fund it, and
                  make it happen.
                </p>
                <p>
                  The Memes are public-good NFTs at the core of the network.
                  They align participants with shared values, fund public goods,
                  distribute influence, and anchor identity and reputation.
                </p>
                <p>
                  Identity and reputation live on-chain. Decision-making power
                  is decentralized. What people decide gets built.
                </p>
                <p>
                  Bitcoin decentralized money. Ethereum decentralized code. 6529
                  decentralizes coordination.
                </p>
              </li>

              <li>
                <h3>How do I get started?</h3>
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
              </li>

              <li>
                <h3>What are Waves?</h3>
                <p>
                  Waves are the communication and decision-making channels
                  inside Brain. They are functionally similar to Channels on
                  Discord.
                </p>
                <p>
                  Each Wave is a space for a specific topic, group, or
                  initiative. In Waves, you can chat with others and vote on
                  decisions related to that topic.
                </p>
                <p>
                  Some Waves, like &quot;Maybe&apos;s Dive Bar&quot;, are casual
                  conversations. Others, like &quot;The Memes - Main
                  Stage&quot;, directly influence what gets built or funded.
                </p>
                <Image
                  unoptimized
                  src="/faq-waves-view.jpg"
                  alt="Waves view in 6529 Brain"
                  width={2626}
                  height={1284}
                  className={styles["faqImage"]}
                />
              </li>

              <li>
                <h3>What is my profile?</h3>
                <p>
                  Your profile is your identity in the network: it shows your
                  user name and your profile picture. Here you can explore the
                  activity of a user and see the reputation and participation in
                  the community.
                </p>
                <Image
                  unoptimized
                  src="/faq-profile.jpg"
                  alt="6529 profile view"
                  width={2086}
                  height={846}
                  className={styles["faqImage"]}
                />
                <p>Key components:</p>
                <dl>
                  <dt>Total Days Held (TDH)</dt>
                  <dd>
                    <ul>
                      <li>
                        Measures how long and how many Meme Cards you have held.
                      </li>
                      <li>Longer holding increases influence.</li>
                      <li>
                        TDH allows each user to assign REP and NIC credits.
                      </li>
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
              </li>

              <li>
                <h3>How does the system work overall?</h3>
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
              </li>

              <li>
                <h3>Why do Memes matter?</h3>
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
                  The goal is not just funding public goods. The goal is
                  cultural impact at scale.
                </p>
              </li>

              <li>
                <h3>What are The Memes?</h3>
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
                  selected through community TDH voting in &quot;The Memes -
                  Main Stage&quot; wave.
                </p>
              </li>

              <li>
                <h3>Why would I collect Meme Cards?</h3>
                <p>Collecting The Memes lets you:</p>
                <ul>
                  <li>
                    Earn TDH over time and build influence in the network.
                  </li>
                  <li>Support public goods.</li>
                  <li>Own culturally meaningful art.</li>
                </ul>
                <p>
                  Holding longer increases your influence and alignment with the
                  network.
                </p>
              </li>

              <li>
                <h3>How do Meme drops work?</h3>
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
              </li>

              <li>
                <h3>Do Meme Cards have utility?</h3>
                <p>
                  All the Meme Cards generate TDH which is central in the
                  process of curating and deciding which artworks we select to
                  mint among other governance tasks.
                </p>
                <p>
                  When you mint a Meme Card, you get the final product: an
                  art-edited NFT. All The Memes are CC0 (public domain) and
                  anyone can use the art freely but only those who hold the NFT
                  generate TDH.
                </p>
              </li>

              <li>
                <h3>How do I participate beyond collecting?</h3>
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
              </li>

              <li>
                <h3>What is the long-term vision?</h3>
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
                  This is a new model for organizing society and economic
                  activity globally.
                </p>
              </li>

              <li>
                <h3>How does everything fit together?</h3>
                <ul>
                  <li>Memes create culture and fund the system.</li>
                  <li>TDH measures alignment.</li>
                  <li>REP and NIC build identity and trust.</li>
                  <li>Brain enables coordination and decisions.</li>
                  <li>Decisions trigger real-world and on-chain outcomes.</li>
                </ul>
                <p>
                  6529 is a new global coordination layer for the modern
                  economy.
                </p>
              </li>

              <li>
                <h3>What are Gradients?</h3>
                <p>
                  6529 Gradients is an NFT collection of 101 grayscale
                  variations of the 6529 logo, released in October 2021. No
                  additional NFTs will ever be added.
                </p>
                <p>
                  The collection has no direct relationship to The Memes. It
                  predates The Memes and was created as a purely conceptual
                  project.
                </p>
                <p>
                  Gradient holders receive a 2% TDH boost. They are also
                  included in The Memes allowlists as early supporters of the
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
              </li>

              <li>
                <h3>What is NextGen?</h3>
                <p>
                  NextGen is an on-chain generative art NFT platform on
                  Ethereum. It supports 6529&apos;s goals around art
                  experimentation and decentralized social coordination.
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
              </li>

              <li>
                <h3>What are ReMemes?</h3>
                <p>
                  ReMemes are community-created derivatives of The Memes. Anyone
                  can make a ReMeme. No approval is needed.
                </p>
                <p>
                  Submit and explore them on the{" "}
                  <Link href="/rememes">ReMemes platform.</Link>
                </p>
              </li>

              <li>
                <h3>What is the Meme Lab?</h3>
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
              </li>
            </ol>
          </section>

          <section className={styles["faqBonus"]}>
            <h2>Bonus track</h2>
            <p>
              If you want to go deeper into 6529 in book form, your path is{" "}
              <em>Memes Outside: The Book (2nd Edition).</em> It is a living
              extension of everything you have read so far. The book is an
              interactive experience that connects the digital world of 6529
              with physical space. It invites you to take art outside, play with
              it, interact with it, and become a co-creator. Through essays,
              images, and guided explorations, it shows how the concept of
              network art can be experienced beyond the screen. Each copy is, in
              a sense, a unique piece completed through your own actions.
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
          </section>

          <section id="what-is-a-wallet" className={styles["walletSection"]}>
            <h2>What is a Wallet?</h2>

            <h3>What is a crypto wallet?</h3>
            <p>
              A crypto wallet is a tool that allows you to store, send, and
              receive cryptocurrency. Think of it like a digital version of your
              physical wallet, except instead of holding cash and cards, it
              holds your digital assets.
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
              cold wallets. The key difference is whether the wallet is
              connected to the internet.
            </p>

            <h3>Hot Wallets (Connected to the Internet)</h3>
            <p>
              Hot wallets are software-based wallets that are always connected
              to the internet. They are convenient, easy to use, and free,
              making them ideal for everyday transactions. The tradeoff is that
              because they are online, they are more vulnerable to hacking or
              phishing attacks.
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
              private keys completely offline. Because they are never connected
              to the internet, they are far more secure against hacking. They
              are best suited for storing large amounts of digital assets
              long-term. The tradeoff is that they cost money to purchase and
              are less convenient for everyday use.
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
                <strong>Trezor:</strong> An open-source hardware wallet known
                for its strong security model. Available at{" "}
                <a href="https://trezor.io" target="_blank" rel="noreferrer">
                  trezor.io. (~$69-$219)
                </a>
              </li>
            </ul>

            <h3>Important Security Tips</h3>
            <ul>
              <li>
                Never share your seed phrase or private key with anyone, not
                even support staff or developers.
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
          </section>
        </Col>
      </Row>
    </Container>
  );
}
