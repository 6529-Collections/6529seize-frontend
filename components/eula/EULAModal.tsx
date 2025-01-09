import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEULAConsent } from "./EULAConsentContext";
import { useEffect, useRef, useState } from "react";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons";

export default function EULAModal() {
  const { consent } = useEULAConsent();
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      const isAtBottom =
        Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
      if (isAtBottom) {
        setScrolledToBottom(true);
      }
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-z-1000 tw-flex tw-items-center tw-justify-center tw-bg-black/60 tw-backdrop-blur tw-p-2">
      <div className="tw-bg-iron-800 tw-rounded-lg tw-shadow-lg tw-w-full tw-max-h-full tw-overflow-y-auto tw-max-w-lg sm:tw-w-3/4 sm:tw-max-w-4xl tw-relative tw-px-6 sm:tw-px-12 tw-py-8 sm:tw-py-10">
        <div className="tw-text-center tw-mb-10">
          <h3>End User License Agreement</h3>
        </div>
        <div className="tw-mb-10">
          <p>
            To use 6529 Mobile, you must agree to our Terms of Service and EULA:
          </p>
          <div className="tw-relative">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="tw-max-h-[50vh] tw-overflow-y-auto tw-p-4 tw-border tw-border-gray-300 tw-rounded tw-shadow">
              <ol className="tw-list-decimal tw-space-y-2 tw-text-sm tw-pl-6">
                <li>
                  <p>
                    <strong>Abbreviations Make Documents More Readable</strong>
                  </p>
                  <p>These are the abbreviations used in this document.</p>
                  <p>
                    "Terms" or "EULA": End User License Agreement (EULA)
                    <br />
                    "We": 6529 Collection LLC
                    <br />
                    "6529 NFTs": The Memes, 6529 Gradient, Meme Lab, GenMemes,
                    6529 Intern and other NFTs that may be added from time to
                    time.
                    <br />
                    "You": An adult, at least 18 years of age, who is not
                    subject to sanctions by the US government.
                    <br />
                    "Third Parties": Everyone else who is not "We" or "You"
                    <br />
                    "Our App": The 6529Mobile application and any associated
                    services we may offer
                    <br />
                    "Our Platform": Our App, the website located at{" "}
                    <a
                      href="https://6529.io"
                      target="_blank"
                      rel="noopener noreferrer">
                      6529.io
                    </a>
                    , any websites hosted at sub-domains of{" "}
                    <a
                      href="https://6529.io"
                      target="_blank"
                      rel="noopener noreferrer">
                      6529.io
                    </a>
                    , including hosted minting or primary sales pages, any
                    primary mints or sales directly from our smart contracts,
                    any mobile or metaverse applications we may make, and any
                    content (data, descriptions or otherwise) on our website or
                    decentralized file storage platforms like IPFS or Arweave.
                    <br />
                    "Not Our Platform": Everything else that is not included in
                    "Our Platform" including your Ethereum wallet, NFT
                    marketplaces, and publicly accessible secondary functions on
                    our smart contracts, such as token transfers.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>The Underlying Principles Of These Terms</strong>
                  </p>
                  <p>There are two underlying principles of these terms:</p>
                  <p>
                    Our main ongoing activity is primary minting CC0 NFTs (The
                    Memes, Meme Lab, GenMemes are CC0) with a mission-based
                    focus at fairly affordable prices.
                  </p>
                  <p>
                    Once the NFTs have been primary minted:
                    <br />
                    a) You and Third Parties can do whatever you want with the
                    NFT
                    <br />
                    and
                    <br />
                    b) We do not have any further obligations toward you
                  </p>
                  <p>
                    Most of the Clauses in the Terms relate to making (b)
                    absolutely clear.
                  </p>
                  <p>
                    We do not have control of what someone does with The Memes,
                    Meme Lab and GenMemes NFTs after minting, either at the
                    level of the token or the art.
                  </p>
                  <p>
                    "Our Platforms" provide a (hopefully) convenient way to see
                    information about 6529 NFTs and their collectors, but they
                    are not the token nor the art. We do not make any claims on
                    the token post-minting or on the art for the CC0 6529 NFTs,
                    nor do we take any responsibility for either.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Our Platform, Our House Rules I</strong>
                  </p>
                  <p>
                    Agreeing to these terms is the only way you are allowed to
                    use 6529Mobile. If you do not agree with our Terms, that is
                    fine, but you cannot use 6529Mobile.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Our Platform, Our House Rules II</strong>
                  </p>
                  <p>
                    We can terminate or pause your access to Our Platform at any
                    time, for any reason.
                  </p>
                  <p>
                    We strive for a positive community, and that means no
                    abusive behavior or posting objectionable user-generated
                    content. Please report any concerns to us at{" "}
                    <a href="mailto:support@6529.io">support@6529.io</a>. Our
                    policy is to respond to these reports within 24 hours, which
                    includes removing content or blocking users as warranted.
                  </p>
                  <p>
                    Please note: We monitor material posted to the app to filter
                    for objectionable material.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Our Platform, Our House Rules III</strong>
                  </p>
                  <p>
                    <a
                      href="https://twitter.com/punk6529"
                      target="_blank"
                      rel="noopener noreferrer">
                      @punk6529
                    </a>{" "}
                    tweets a lot and has a lot of ideas that may change from
                    time to time.
                  </p>
                  <p>
                    You should have no expectation whatsoever that what he (or
                    other team members) are going to tweet or otherwise
                    communicate is going to match your current or future
                    understanding of the 6529 NFTs.
                  </p>
                  <p>
                    His, or any other person or team member's, retweets, likes,
                    twitter or discord communications, podcasts, essays or other
                    communications are not endorsements nor do they reflect
                    changes in Terms.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>The Only Constant In This World Is Change I</strong>
                  </p>
                  <p>
                    The Terms and any pages or policies incorporated in the
                    Terms by reference may change at any time. The changes are
                    effective immediately.
                  </p>
                  <p>
                    Any material change will be communicated by providing a new
                    version of the EULA for users to agree to, by changing the
                    "Last Updated" date on the application or any other method
                    we choose.
                  </p>
                  <p>
                    If you disagree with the changes, that is fine, but you
                    cannot use Our Platform from that point onward.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>
                      The Only Constant In This World Is Change II
                    </strong>
                  </p>
                  <p>
                    We have the right to change or terminate any or all of our
                    activities at any time for any reason.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>We Are On A Mission</strong>
                  </p>
                  <p>
                    The mission of 6529 NFTs is to effectively make people aware
                    of the importance of decentralization.
                  </p>
                  <p>
                    If at any point in time, at our sole discretion, we think a
                    change will improve the success of the mission, even if it
                    may be disadvantageous to any other perceived goal of the
                    6529 NFTs, we will make that change and not think twice.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Read First, Participate Later</strong>
                  </p>
                  <p>
                    You acknowledge that you have read and accept the
                    information on the webpages and that is incorporated by
                    reference into these Terms.
                  </p>
                  <p>
                    <a
                      href="https://6529.io/about/the-memes"
                      target="_blank"
                      rel="noopener noreferrer">
                      6529.io/about/the-memes
                    </a>
                    <br />
                    <a
                      href="https://6529.io/about/6529-gradient"
                      target="_blank"
                      rel="noopener noreferrer">
                      6529.io/about/6529-gradient
                    </a>
                    <br />
                    <a
                      href="https://6529.io/about/meme-lab"
                      target="_blank"
                      rel="noopener noreferrer">
                      6529.io/about/meme-lab
                    </a>
                    <br />
                    <a
                      href="https://6529.io/about/faq"
                      target="_blank"
                      rel="noopener noreferrer">
                      6529.io/about/faq
                    </a>
                  </p>
                </li>
                <li>
                  <p>
                    <strong>License / IP</strong>
                  </p>
                  <p>Our NFTs do not transfer any IP rights to you.</p>
                  <p>
                    You acknowledge that you have read and accept the
                    information on this webpage that explains this topic in more
                    detail and that is incorporated by reference into these
                    Terms.
                  </p>
                  <p>
                    <a
                      href="https://6529.io/about/license"
                      target="_blank"
                      rel="noopener noreferrer">
                      6529.io/about/license
                    </a>
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Minting NFTs</strong>
                  </p>
                  <p>
                    You have no right to receive (airdrop) or mint (allowlist) a
                    future 6529 NFT based on owning one or more current 6529
                    NFTs.
                  </p>
                  <p>
                    You acknowledge that you have read and accept the
                    information on this webpage that explains this topic in more
                    detail and that is incorporated by reference into these
                    Terms.
                  </p>
                  <p>
                    <a
                      href="https://6529.io/about/minting"
                      target="_blank"
                      rel="noopener noreferrer">
                      6529.io/about/minting
                    </a>
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Privacy and Cookies</strong>
                  </p>
                  <p>
                    Our privacy policy and cookie policy can be found here. We
                    may transfer or process data in the United States or other
                    countries. We store a cookie to track whether a deviceID has
                    already agreed to these Terms.
                  </p>
                  <p>
                    <a
                      href="https://6529.io/about/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer">
                      6529.io/about/privacy-policy
                    </a>
                    <br />
                    <a
                      href="https://6529.io/about/cookie-policy"
                      target="_blank"
                      rel="noopener noreferrer">
                      https://6529.io/about/cookie-policy
                    </a>
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Copyright</strong>
                  </p>
                  <p>
                    Our Copyright policy can be found here
                    <br />
                    <a
                      href="https://6529.io/about/copyright"
                      target="_blank"
                      rel="noopener noreferrer">
                      6529.io/about/copyright
                    </a>
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Not Our Platform</strong>
                  </p>
                  <p>
                    Due to the architecture of NFT contracts, 6529 NFTs can be
                    transferred without our permission or consent. We cannot
                    "freeze" someone's 6529 NFTs or transfer them to a party of
                    our choosing. After the primary sale from us to you, you are
                    in full control of your token.
                  </p>
                  <p>
                    This means that you can transact 6529 NFTs in their Ethereum
                    wallets, in marketplaces, in galleries, in metaverse
                    platforms, in games and in a wide range of services that may
                    emerge. All of these transactions are occurring on Not Our
                    Platform. We have no ability to enforce or control
                    transactions happening on Not Our Platform.
                  </p>
                  <p>
                    We take absolutely no responsibility whatsoever for what you
                    and Third Parties do on Not Our Platform, including but not
                    limited to, suffering economic losses, security risks,
                    theft, hacking, unpleasant consumer experiences, what
                    commitments or representations are made as a part of those
                    transactions, and if those transactions are legal in your
                    jurisdiction.
                  </p>
                  <p>
                    We are not a party to those transactions. We have a
                    relationship with you when you use Our Platform only.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Many Things Can Go Wrong</strong>
                  </p>
                  <p>
                    NFTs are the most volatile and experimental sector of the
                    crypto field which itself is still a new, volatile and
                    experimental field.
                  </p>
                  <p>
                    You are solely responsible for securing your device and any
                    transactions you engage in with 6529Mobile. We take no
                    responsibility for phishing attacks or other unauthorized
                    transactions.
                  </p>
                  <p>
                    Many things can potentially go wrong with NFTs in general or
                    6529-related NFTs in particular, including but not limited
                    to:
                    <br />
                    (a) technical flaws/bugs/hacks/vulnerabilities at the
                    protocol level, <br />
                    (b) changes at the protocol level, <br />
                    (c) changes in which protocols are popular, <br />
                    (d) technical flaws/bugs/hacks/vulnerabilities at the wallet
                    level, <br />
                    (e) changes in the popularity of NFTs in general or any NFTs
                    specifically, <br />
                    (f) technical flaws/bugs/hacks/vulnerabilities of project or
                    marketplace websites, <br />
                    (g) technical flaws/bugs/hacks/vulnerabilities of general or
                    project-related communication channels such as discord or
                    twitter, <br />
                    (h) legal or regulatory changes or actions that impact
                    specific NFTs (including ours) or all NFTs.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Future Value of 6529 NFTs</strong>
                  </p>
                  <p>
                    The future value of art and collectibles is based on demand
                    and social factors, is impossible to forecast, and, in any
                    case, is out of our control.
                  </p>
                  <p>
                    We have no idea what the future value (if any) will be of
                    6529 NFTs.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Royalties</strong>
                  </p>
                  <p>
                    Most 6529 NFTs have secondary sale royalties associated with
                    them that are paid to us, the collaborating artist or both.
                  </p>
                  <p>
                    While we have not done so, we reserve the right with no
                    further notice to treat NFTs that have paid royalties
                    differently than those that have not, in ways to be
                    determined in the future.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>CC0</strong>
                  </p>
                  <p>
                    Most 6529 NFTs are CC0 (Creative Commons 0) licensed which
                    means they are in the public domain.
                  </p>
                  <p>
                    This means anyone in the world can use the image associated
                    with your NFT for any purpose they like. Some uses may be
                    perceived by you as desirable and some uses may be perceived
                    as undesirable or even shocking.
                  </p>
                  <p>
                    This is the nature of CC0 art. There is nothing we or anyone
                    else can do about it. If this bothers you, you should
                    probably not buy a CC0 NFT.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Utility</strong>
                  </p>
                  <p>
                    6529 NFTs do not have any "utility" beyond being works of
                    art.
                  </p>
                  <p>
                    We may, from time to time, test or operate services that
                    interoperate with 6529 NFTs.
                  </p>
                  <p>
                    These should be considered experimental, subject to change,
                    subject to being terminated and, in any case, not changing
                    the general principle that we make no commitments to
                    offering "utility" to owners of 6529 NFTs.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Third Party Perspectives</strong>
                  </p>
                  <p>
                    Many Third Parties have perspectives about 6529 NFTs that
                    they share on social media and otherwise.
                  </p>
                  <p>
                    We take no responsibility for these communications, whether
                    we agree with them or not, as we have no way to monitor or
                    exercise control over them.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Delegation and Consolidation</strong>
                  </p>
                  <p>
                    We may provide from time to time the ability to delegate
                    from one wallet to another, or to consolidate wallet
                    contents. We take no responsibilities for errors, losses or
                    missed opportunities based on delegation or consolidation
                    (or for any other reason).
                  </p>
                  <p>
                    What formula or platform we use for delegation or
                    consolidation (or whether we offer this functionality at
                    all) is in our sole discretion.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Sanctions</strong>
                  </p>
                  <p>
                    The United States makes it illegal to engage in economic
                    transactions with certain people or entities ("Sanctioned
                    Parties").
                  </p>
                  <p>
                    As we prefer not to go to jail, if you are a Sanctioned
                    Party, we cannot engage in any economic activities with you.
                  </p>
                  <p>
                    If you are a Sanctioned Party, please do not: a) mint a 6529
                    NFT, b) apply to be a Meme Card artist, or c) send us any
                    ETH, for royalties or otherwise.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>We Are Not Your Personal Ethereum Concierge</strong>
                  </p>
                  <p>
                    NFTs are held in self-managed Ethereum wallets where the
                    users are responsible for authorizing transactions.
                  </p>
                  <p>
                    Mistakes in how an Ethereum wallet is used can lead to loss
                    of your 6529 NFTs (or other tokens), failed transactions or
                    high gas costs. Such events are your responsibility and out
                    of our control and we cannot offer you compensation or any
                    other recourse for such events.
                  </p>
                  <p>
                    There is a vast array of educational resources available to
                    learn about how to use Ethereum well. We encourage you to
                    study and practice with small amounts before buying
                    economically meaningful NFTs and to follow good safety
                    practices such as using multi-signature or hardware wallets.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Phishing</strong>
                  </p>
                  <p>
                    It is common for Third Parties to create fake 6529 websites
                    in order to convince people to sign malicious transactions
                    or transfer their private keys.
                  </p>
                  <p>
                    We take no responsibility for phishing sites, even if we are
                    made aware of them, and cannot provide any compensation or
                    assistance for phishing, thefts or other related matters.
                  </p>
                  <p>
                    It is your responsibility to understand which transactions
                    you are signing in your Ethereum wallet.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Ethereum NFTs</strong>
                  </p>
                  <p>
                    The 6529 NFTs are currently only available on the Ethereum
                    blockchain.
                  </p>
                  <p>
                    Moving them to another blockchain including an "L2" Ethereum
                    blockchain will lead to their loss.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>We Might Get Hacked</strong>
                  </p>
                  <p>
                    It is possible that Our Platform may be hacked or otherwise
                    maliciously attacked and we disclaim any liability in this
                    case.
                  </p>
                  <p>
                    You remain solely responsible for any actions you take
                    relating to Our Platform, including signing transactions
                    from your Ethereum wallet.
                  </p>
                  <p>
                    Always keep your guard up for suspicious behavior even on
                    trusted sites.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Your Feedback and Ideas</strong>
                  </p>
                  <p>
                    You can feel free to share ideas with us, but we may use
                    them or may already be working on similar ideas.
                  </p>
                  <p>
                    Given this, we will not pay you and you cannot claim
                    compensation for "sharing ideas". If this is not acceptable
                    to you, do not share your ideas with us.
                  </p>
                  <p>
                    We will not sign NDAs or non-competes to hear your ideas.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Third Party Content or Services</strong>
                  </p>
                  <p>
                    We may link to or incorporate Third Party Content or
                    Services. Your relationship with those Third Parties is
                    directly with them.
                  </p>
                  <p>
                    We do not provide any warranties, endorsements or
                    representations relating to Third Party Content or Services
                    and you interact with them at your sole risk.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>
                      You Can't Sue Us, Either Individually Or In Large Groups
                    </strong>
                  </p>
                  <p>
                    You waive your right to sue us or to participate in a class
                    action suit and agree to mandatory arbitration in the event
                    of a dispute.
                  </p>
                  <p>
                    Specifically, you agree to the following as it relates to
                    disputes between you and us:
                  </p>
                  <p>
                    a) That any dispute we might have, it is individual between
                    you and us and you will not bring a class action, class
                    arbitration or any other collective proceeding.
                  </p>
                  <p>
                    b) If you or we have a dispute, we will aim to resolve it
                    amicably first and, if that is not possible, either party
                    will have the right to initiate a JAMS arbitration under
                    standard JAMS terms of reference.
                  </p>
                  <p>
                    You acknowledge that you have read and accept the
                    information on this webpage that includes the applicable
                    JAMS terms and that is incorporated by reference into these
                    Terms.
                  </p>
                  <p>
                    <a
                      href="https://6529.io/dispute-resolution"
                      target="_blank"
                      rel="noopener noreferrer">
                      6529.io/dispute-resolution
                    </a>
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Indemnification</strong>
                  </p>
                  <p>
                    You agree to indemnify us and our subsidiaries, affiliates,
                    managers, members, officers, partners, service providers and
                    employees (together "6529 Parties") from losses,
                    liabilities, claims, demands, damages, expenses or costs
                    ("Claims") arising out of or related to:
                  </p>
                  <p>
                    a. Your access to or use of Our Platform
                    <br />
                    b. Your access to or use of Not Our Platform
                    <br />
                    c. Your use of 6529 NFTs
                    <br />
                    d. Your Violation of Terms
                    <br />
                    e. Your Infringement of intellectual property, privacy,
                    property rights of others
                    <br />
                    f. Your Conduct
                    <br />
                    g. Your Violation of Laws/Regulations
                    <br />
                    h. Your Feedback And Ideas
                  </p>
                  <p>
                    You will cooperate with the 6529 Parties in defending any
                    such third-party Claims and pay all fees, costs and expenses
                    associated with defending such Claims (including, but not
                    limited to, attorneys' fees). 6529 Parties will have control
                    of the defense or settlement, at 6529 Parties' sole option,
                    of any third-party Claims.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Disclaimers</strong>
                  </p>
                  <p>
                    Our Platform, the 6529 NFTs and any services relating to
                    them are provided "As Is" and "As Available" without
                    warranties of any kind, either express or implied, including
                    warranties of merchantability, fitness for a particular
                    purpose, title and non-infringement. We do not warrant that
                    Our Platform, NFTs or communication and content relating to
                    them is accurate, complete or error-free.
                  </p>
                  <p>
                    We further reiterate the disclaimers, without limitation, in
                    Clauses #10, #11, #13 to #28 and #30.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Disclaimer of Damages</strong>
                  </p>
                  <p>
                    To the fullest extent permitted by applicable law, we will
                    not be liable to you under any theory of liability - whether
                    based in contract, tort, negligence, strict liability,
                    warranty or otherwise - for any indirect, consequential,
                    exemplary, incidental, punitive or special damages or lost
                    profits, even if we have been advised of the possibility of
                    such damages.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Limitation of Liability</strong>
                  </p>
                  <p>
                    Our total liability for any claim arising from use of our
                    Platform or 6529 NFTs or these Terms is limited to the
                    greater of $100 or the amount paid by you to us.
                  </p>
                  <p>
                    The limitations in #31 and #32 will not limit or exclude
                    liability for our gross negligence, fraud, or intentional
                    misconduct or for any other matters which cannot be excluded
                    or limited under applicable law. Some jurisdictions do not
                    allow the exclusion or limitation of incidental or
                    consequential damages, so the above limitations or
                    exclusions may not apply to you.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Release</strong>
                  </p>
                  <p>
                    To the fullest extent permitted by applicable law, you
                    release the 6529 Parties from responsibility, liability,
                    claims, demands and/or damages (actual and consequential) of
                    every kind and nature, known and unknown (including, but not
                    limited to, claims of negligence), arising out of or related
                    to disputes between users, acts or omissions of Third
                    Parties or anything for which you have agreed that we will
                    have no responsibility or liability pursuant to these terms.
                  </p>
                  <p>
                    If you are a consumer who resides in California, you hereby
                    waive your rights under California Civil Code § 1542, which
                    provides: "A general release does not extend to claims that
                    the creditor or releasing party does not know or suspect to
                    exist in his or her favor at the time of executing the
                    release and that, if known by him or her, would have
                    materially affected his or her settlement with the debtor or
                    released party."
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Governing Law and Venue</strong>
                  </p>
                  <p>
                    Any dispute arising from these Terms and your use of our
                    Services will be governed by and construed and enforced in
                    accordance with the laws of New York without regard to
                    conflict of law rules or principles. Any dispute that is not
                    subject to Arbitration will be resolved in the federal or
                    state courts located in Wilmington, Delaware.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Failure To Enforce</strong>
                  </p>
                  <p>
                    If we fail to enforce some of our rights under these Terms
                    in the present or against certain parties, that does not
                    mean they terminate or are waived. We reserve the right to
                    enforce them in the future against any or all parties.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Section Titles</strong>
                  </p>
                  <p>
                    Our section titles are for readability and have no legal or
                    contractual effect.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Electronic Communication</strong>
                  </p>
                  <p>
                    You consent to electronic communication and transactions.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Severability</strong>
                  </p>
                  <p>
                    This means that if a certain section of these Terms is
                    determined in some or all jurisdictions to be void, illegal
                    or unenforceable, it will be severed from the rest of these
                    Terms and the remainder of the contract will continue to be
                    valid and binding.
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Transferability</strong>
                  </p>
                  <p>
                    We can transfer, delegate or assign our rights under these
                    Terms without your consent. You must obtain our written
                    consent to transfer, assign or delegate your rights under
                    these Terms.
                  </p>
                </li>
              </ol>
            </div>
            {!scrolledToBottom && (
              <button
                onClick={scrollToBottom}
                className="tw-absolute tw-border-none tw-bottom-2 tw-right-2 tw-bg-white tw-text-gray-800 tw-rounded-full tw-flex tw-items-center tw-justify-center hover:tw-bg-gray-200 tw-transition tw-duration-150 tw-bg-opacity-50 hover:tw-bg-opacity-80 tw-p-2">
                <FontAwesomeIcon icon={faArrowDown} height={16} width={16} />
              </button>
            )}
          </div>
        </div>
        <div className="tw-flex tw-justify-center tw-mt-6">
          <button
            onClick={consent}
            disabled={!scrolledToBottom}
            className={`tw-bg-white tw-text-gray-900 tw-font-medium tw-px-8 tw-py-3 tw-rounded tw-shadow 
              hover:tw-bg-iron-300 
              focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-gray-300 
              tw-transition tw-duration-150 tw-border-none
              ${
                !scrolledToBottom ? "tw-opacity-50 tw-cursor-not-allowed" : ""
              }`}>
            Agree
          </button>
        </div>
      </div>
    </div>
  );
}
