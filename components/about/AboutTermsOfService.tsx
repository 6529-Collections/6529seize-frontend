import styles from "./About.module.scss";
import { Col, Container, Row } from "react-bootstrap";
import { AboutSection } from "../../pages/about/[section]";

export default function AboutTermsOfService() {
  return (
    <Container>
      <Row>
        <Col>
          <h1>
            <span className="font-lightest">Terms</span> Of Service
          </h1>
        </Col>
      </Row>
      <Row>
        <Col className={`${styles.lastUpdateText} text-right pt-3 pb-3`}>
          Last Updated: February 23, 2023
        </Col>
      </Row>
      <Row className="pt-3 pb-3">
        <Col>
          <ol>
            <li>
              <b>Abbreviations Make Documents More Readable</b>
              <br />
              <br />
              These are the abbreviations used in this document.
              <br />
              <br />
              &quot;Terms&quot;: Terms of Service
              <br />
              <br />
              &quot;We&quot;: 6529 Collections LLC
              <br />
              <br />
              &quot;6529 NFTs&quot;: The Memes, 6529 Gradient, Meme Lab,
              GenMemes, 6529 Intern and other NFTs that may be added from time
              to time.
              <br />
              <br />
              &quot;You&quot;: An adult, at least 18 years of age, who is not
              subject to sanctions by the US government.
              <br />
              <br />
              &quot;Third Parties&quot;: Everyone else who is not &quot;We&quot;
              or &quot;You&quot;
              <br />
              <br />
              &quot;Our Platform&quot;: the website located at{" "}
              <a href="https://seize.io" target="_blank" rel="noreferrer">
                seize.io
              </a>{" "}
              , any websites hosted at sub-domains of{" "}
              <a href="https://seize.io" target="_blank" rel="noreferrer">
                seize.io
              </a>{" "}
              , including hosted minting or primary sales pages, any primary
              mints or sales directly from our smart contracts, any mobile or
              metaverse applications we may make, and any content (data,
              descriptions or otherwise) on our website or decentralized file
              storage platforms like IPFS or Arweave.
              <br />
              <br />
              &quot;Not Our Platform&quot;: Everything else that is not included
              in &quot;Our Platform&quot; including your Ethereum wallet, NFT
              marketplaces, and publicly accessible secondary functions on our
              smart contracts, such as token transfers.
            </li>
            <br />
            <br />
            <li>
              <b>The Underlying Principles Of These Terms</b>
              <br />
              <br />
              There are two underlying principles of these terms:
              <br />
              <br />
              <ol>
                <li>
                  Our main ongoing activity is primary minting CC0 NFTs (The
                  Memes, Meme Lab, GenMemes are CC0) with a mission-based focus
                  at fairly affordable prices.
                  <br />
                  <br />
                  Once the NFTs have been primary minted:
                  <br />
                  a&#41; you and Third Parties can do whatever you want with the
                  NFT
                  <br />
                  and
                  <br />
                  b&#41; we do not have any further obligations toward you
                  <br />
                  <br />
                  Most of the Clauses in the Terms relate to making (b)
                  absolutely clear
                </li>
                <br />
                <li>
                  We do not have control of what someone does with The Memes,
                  Meme Lab and GenMemes NFTs after minting, either at the level
                  of the token or the art.
                </li>
              </ol>
              <br />
              &quot;Our Platforms&quot; provide a (hopefully) convenient way to
              see information about 6529 NFTs and their collectors and to
              primary mint NFTs, but they are not the token nor the art. We do
              not make any claims on the token post-minting or on the art for
              the CC0 6529 NFTs, nor do we take any responsibility for either.
            </li>
            <br />
            <li>
              <b>Our Platform, Our House Rules I</b>
              <br />
              <br />
              Agreeing to these terms is the only way you are allowed to use Our
              Platform. If you do not agree with our Terms, that is fine, but
              you cannot use Our Platform.
            </li>
            <br />
            <br />
            <li>
              <b>Our Platform, Our House Rules II</b>
              <br />
              <br />
              We can terminate or pause your access to Our Platform at any time,
              for any reason.
            </li>
            <br />
            <br />
            <li>
              <b>Our Platform, Our House Rules III</b>
              <br />
              <br />
              &#64;
              <a
                href="https://twitter.com/punk6529"
                target="_blank"
                rel="noreferrer">
                punk6529
              </a>{" "}
              tweets a lot and has a lot of ideas that may change from time to
              time.
              <br />
              <br />
              You should have no expectation whatsoever that what he (or other
              team members) are going to tweet or otherwise communicate is going
              to match your current or future understanding of the 6529 NFTs.
              <br />
              <br />
              His, or any other person or team member&apos;s, retweets, likes,
              twitter or discord communications, podcasts, essays or other
              communications are not endorsements nor do they reflect changes in
              Terms.
            </li>
            <br />
            <br />
            <li>
              <b>The Only Constant In This World Is Change I</b>
              <br />
              <br />
              The Terms and any pages or policies incorporated in the Terms by
              reference may change at any time. The changes are effective
              immediately.
              <br />
              <br />
              Any material change will be communicated by changing the
              &quot;Last Updated&quot; date on this webpage or any other method
              we choose.
              <br />
              <br />
              If you disagree with the changes, that is fine, but you cannot use
              Our Platform from that point onward.
            </li>
            <br />
            <br />
            <li>
              <b>The Only Constant In This World Is Change II</b>
              <br />
              <br />
              We have the right to change or terminate any or all of our
              activities at any time for any reason.
            </li>
            <br />
            <br />
            <li>
              <b>We Are On A Mission</b>
              <br />
              <br />
              The mission of 6529 NFTs is to effectively make people aware of
              the importance of decentralization.
              <br />
              <br />
              If at any point in time, at our sole discretion, we think a change
              will improve the success of the mission, even if it may be
              disadvantageous to any other perceived goal of the 6529 NFTs, we
              will make that change and not think twice.
            </li>
            <br />
            <br />
            <li>
              <b>Read First, Participate Later</b>
              <br />
              <br />
              You acknowledge that you have read and accept the information on
              the webpages and that is incorporated by reference into these
              Terms.
              <br />
              <br />
              <a
                href={`/about/${AboutSection.MEMES}`}
                target="_blank"
                rel="noreferrer">
                seize.io/about/{AboutSection.MEMES}
              </a>
              <br />
              <a
                href={`/about/${AboutSection.GRADIENTS}`}
                target="_blank"
                rel="noreferrer">
                seize.io/about/{AboutSection.GRADIENTS}
              </a>
              <br />
              <a
                href={`/about/${AboutSection.MEME_LAB}`}
                target="_blank"
                rel="noreferrer">
                seize.io/about/{AboutSection.MEME_LAB}
              </a>
              <br />
              <a
                href={`/about/${AboutSection.FAQ}`}
                target="_blank"
                rel="noreferrer">
                seize.io/about/{AboutSection.FAQ}
              </a>
            </li>
            <br />
            <br />
            <li>
              <b>License &#47; IP</b>
              <br />
              <br />
              Our NFTs do not transfer any IP rights to you.
              <br />
              <br />
              You acknowledge that you have read and accept the information on
              this webpage that explains this topic in more detail and that is
              incorporated by reference into these Terms.
              <br />
              <br />
              <a
                href={`/about/${AboutSection.LICENSE}`}
                target="_blank"
                rel="noreferrer">
                seize.io/about/{AboutSection.LICENSE}
              </a>
            </li>
            <br />
            <br />
            <li>
              <b>Minting NFTs</b>
              <br />
              <br />
              You have no right to receive (airdrop) or mint (allowlist) a
              future 6529 NFT based on owning one or more current 6529 NFTs.
              <br />
              <br />
              You acknowledge that you have read and accept the information on
              this webpage that explains this topic in more detail and that is
              incorporated by reference into these Terms.
              <br />
              <br />
              <a
                href={`/about/${AboutSection.MINTING}`}
                target="_blank"
                rel="noreferrer">
                seize.io/about/{AboutSection.MINTING}
              </a>
            </li>
            <br />
            <br />
            <li>
              <b>Privacy</b>
              <br />
              <br />
              Our privacy policy can be found here. We may transfer or process
              data in the United States or other countries.
              <br />
              <br />
              <a
                href={`/about/${AboutSection.PRIVACY_POLICY}`}
                target="_blank"
                rel="noreferrer">
                seize.io/about/{AboutSection.PRIVACY_POLICY}
              </a>
            </li>
            <br />
            <br />
            <li>
              <b>Copyright</b>
              <br />
              <br />
              Our Copyright policy can be found here
              <br />
              <br />
              <a
                href={`/about/${AboutSection.COPYRIGHT}`}
                target="_blank"
                rel="noreferrer">
                seize.io/about/{AboutSection.COPYRIGHT}
              </a>
            </li>
            <br />
            <br />
            <li>
              <b>Not Our Platform</b>
              <br />
              <br />
              Due to the architecture of NFT contracts, 6529 NFTs can be
              transferred without our permission or consent. We cannot
              &quot;freeze&quot; someone&apos;s 6529 NFTs or transfer them to a
              party of our choosing. After the primary sale from us to you, you
              are in full control of your token.
              <br />
              <br />
              This means that you can transact 6529 NFTs in their Ethereum
              wallets, in marketplaces, in galleries, in metaverse platforms, in
              games and in a wide range of services that may emerge. All of
              these transactions are occurring on Not Our Platform. We have no
              ability to enforce or control transactions happening on Not Our
              Platform.
              <br />
              <br />
              We take absolutely no responsibility whatsoever for what you and
              Third Parties do on Not Our Platform, including but not limited
              to, suffering economic losses, security risks, theft, hacking,
              unpleasant consumer experiences, what commitments or
              representations are made as a part of those transactions, and if
              those transactions are legal in your jurisdiction.
              <br />
              <br />
              We are not a party to those transactions. We have a relationship
              with you when you use Our Platform only.
            </li>
            <br />
            <br />
            <li>
              <b>Many Things Can Go Wrong</b>
              <br />
              <br />
              NFTs are the most volatile and experimental sector of the crypto
              field which itself is still a new, volatile and experimental field
              <br />
              <br />
              Many things can potentially go wrong with NFTs in general or
              6529-related NFTs in particular, including but not limited to: (a)
              technical flaws/bugs/hacks/vulnerabilities at the protocol level,
              (b) changes at the protocol level, (c) changes in which protocols
              are popular, (d) technical flaws/bugs/hacks/vulnerabilities at the
              wallet level, (e) changes in the popularity of NFTs in general or
              any NFTs specifically, (f) technical
              flaws/bugs/hacks/vulnerabilities of project or marketplace
              websites, (g) technical flaws/bugs/hacks/vulnerabilities of
              general or project-related communication channels such as discord
              or twitter, (h) legal or regulatory changes or actions that impact
              specific NFTs (including ours) or all NFTs.
            </li>
            <br />
            <br />
            <li>
              <b>Future Value of 6529 NFTs</b>
              <br />
              <br />
              The future value of art and collectibles is based on demand and
              social factors, is impossible to forecast, and, in any case, is
              out of our control.
              <br />
              <br />
              We have no idea what the future value (if any) will be of 6529
              NFTs.
            </li>
            <br />
            <br />
            <li>
              <b>Royalties</b>
              <br />
              <br />
              Most 6529 NFTs have secondary sale royalties associated with them
              that are paid to us, the collaborating artist or both.
              <br />
              <br />
              While we have not done so, we reserve the right with no further
              notice to treat NFTs that have paid royalties differently than
              those that have not, in ways to be determined in the future.
            </li>
            <br />
            <br />
            <li>
              <b>CC0</b>
              <br />
              <br />
              Most 6529 NFTs are CC0 (Creative Commons 0) licensed which means
              they are in the public domain.
              <br />
              <br />
              This means anyone in the world can use the image associated with
              your NFT for any purpose they like. Some uses may be perceived by
              you as desirable and some uses may be perceived as undesirable or
              even shocking.
              <br />
              <br />
              This is the nature of CC0 art. There is nothing we or anyone else
              can do about it. If this bothers you, you should probably not buy
              a CC0 NFT.
            </li>
            <br />
            <br />
            <li>
              <b>Utility</b>
              <br />
              <br />
              6529 NFTs do not have any &quot;utility&quot; beyond being works
              of art.
              <br />
              <br />
              We may, from time to time, test or operate services that
              interoperate with 6529 NFTs.
              <br />
              <br />
              These should be considered experimental, subject to change,
              subject to being terminated and, in any case, not changing the
              general principle that we make no commitments to offering
              &quot;utility&quot; to owners of 6529 NFTs.
            </li>
            <br />
            <br />
            <li>
              <b>Third Party Perspectives</b>
              <br />
              <br />
              Many Third Parties have perspectives about 6529 NFTs that they
              share on social media and otherwise.
              <br />
              <br />
              We take no responsibility for these communications, whether we
              agree with them or not, as we have no way to monitor or exercise
              control over them.
              <br />
              <br />
              Our perspectives on the 6529 NFTs can be found on the{" "}
              <a href="https://seize.io" target="_blank" rel="noreferrer">
                seize.io
              </a>{" "}
              website.
            </li>
            <br />
            <br />
            <li>
              <b>Delegation and Consolidation</b>
              <br />
              <br />
              We may provide from time to time the ability to delegate minting
              from one wallet to another, or to consolidate wallet contents for
              minting purposes. We take no responsibilities for errors, losses
              or missed opportunities relating to air drops or allowlist based
              on delegation or consolidation (or for any other reason).
              <br />
              <br />
              What formula or platform we use for delegation or consolidation
              (or whether we offer this functionality at all) is in our sole
              discretion.
            </li>
            <br />
            <br />
            <li>
              <b>Sanctions</b>
              <br />
              <br />
              The United States makes it illegal to engage in economic
              transactions with certain people or entities (&quot;Sanctioned
              Parties&quot;)
              <br />
              <br />
              As we prefer not to go to jail, if you are a Sanctioned Party, we
              cannot engage in any economic activities with you.
              <br />
              <br />
              If you are a Sanctioned Party, please do not: a&#41; mint a 6529
              NFT, b&#41; apply to be a Meme Card artist, or c&#41; send us any
              ETH, for royalties or otherwise.
            </li>
            <br />
            <br />
            <li>
              <b>We Are Not Your Personal Ethereum Concierge</b>
              <br />
              <br />
              NFTs are held in self-managed Ethereum wallets where the users are
              responsible for authorizing transactions.
              <br />
              <br />
              Mistakes in how an Ethereum wallet is used can lead to loss of
              your 6529 NFTs (or other tokens), failed transactions or high gas
              costs. Such events are your responsibility and out of our control
              and we cannot offer you compensation or any other recourse for
              such events.
              <br />
              <br />
              There is a vast array of educational resources available to learn
              about how to use Ethereum well. We encourage you to study and
              practice with small amounts before buying economically meaningful
              NFTs and to follow good safety practices such as using
              multi-signature or hardware wallets.
            </li>
            <br />
            <br />
            <li>
              <b>Phishing</b>
              <br />
              <br />
              It is common for Third Parties to create fake 6529 websites in
              order to convince people to sign malicious transactions or
              transfer their private keys.
              <br />
              <br />
              We take no responsibility for phishing sites, even if we are made
              aware of them, and cannot provide any compensation or assistance
              for phishing, thefts or other related matters.
              <br />
              <br />
              It is your responsibility to understand which transactions you are
              signing in your Ethereum wallet.
            </li>
            <br />
            <br />
            <li>
              <b>Ethereum NFTs</b>
              <br />
              <br />
              The 6529 NFTs are currently only available on the Ethereum
              blockchain.
              <br />
              <br />
              Moving them to another blockchain including an &quot;L2&quot;
              Ethereum blockchain will lead to their loss.
            </li>
            <br />
            <br />
            <li>
              <b>We Might Get Hacked</b>
              <br />
              <br />
              It is possible that Our Platform may be hacked or otherwise
              maliciously attacked and we disclaim any liability in this case.
              <br />
              <br />
              You remain solely responsible for any actions you take relating to
              Our Platform, including signing transactions from your Ethereum
              wallet.
              <br />
              <br />
              Always keep your guard up for suspicious behavior even on trusted
              sites.
            </li>
            <br />
            <br />
            <li>
              <b>Your Feedback and Ideas</b>
              <br />
              <br />
              You can feel free to share ideas with us, but we may use them or
              may already be working on similar ideas.
              <br />
              <br />
              Given this, we will not pay you and you cannot claim compensation
              for &quot;sharing ideas&quot;. If this is not acceptable to you,
              do not share your ideas with us.
              <br />
              <br />
              We will not sign NDAs or non-competes to hear your ideas.
            </li>
            <br />
            <br />
            <li>
              <b>Third Party Content or Services</b>
              <br />
              <br />
              We may link to or incorporate Third Party Content or Services.
              Your relationship with those Third Parties is directly with them.
              <br />
              <br />
              We do not provide any warranties, endorsements or representations
              relating to Third Party Content or Services and you interact with
              them at your sole risk.
            </li>
            <br />
            <br />
            <li>
              <b>
                You Can&apos;t Sue Us, Either Individually Or In Large Groups
              </b>
              <br />
              <br />
              You waive your right to sue us or to participate in a class action
              suit and agree to mandatory arbitration in the event of a dispute.
              <br />
              <br />
              Specifically, you agree to the following as it relates to disputes
              between you and us:
              <br />
              <br />
              a&#41; That any dispute we might have, it is individual between
              you and us and you will not bring a class action, class
              arbitration or any other collective proceeding.
              <br />
              <br />
              b&#41; If you or we have a dispute, we will aim to resolve it
              amicably first and, if that is not possible, either party will
              have the right to initiate a JAMS arbitration under standard JAMS
              terms of reference.
              <br />
              <br />
              You acknowledge that you have read and accept the information on
              this webpage that includes the applicable JAMS terms and that is
              incorporated by reference into these Terms.
              <br />
              <br />
              <a href="/dispute-resolution" target="_blank" rel="noreferrer">
                seize.io/dispute-resolution
              </a>{" "}
            </li>
            <br />
            <br />
            <li>
              <b>Indemnification</b>
              <br />
              <br />
              You agree to indemnify us and our subsidiaries, affiliates,
              managers, members, officers, partners, service providers and
              employees (together &quot;6529 Parties&quot;) from losses,
              liabilities, claims, demands, damages, expenses or costs
              (&quot;Claims&quot;) arising out of or related to:
              <br />
              a. Your access to or use of Our Platform
              <br />
              b. Your access to or use of Not Our Platform
              <br />
              c. Your use of 6529 NFTs
              <br />
              d. Your Violation of Terms
              <br />
              e. Your Infringement of intellectual property, privacy, property
              rights of others
              <br />
              f. Your Conduct
              <br />
              g. Your Violation of Laws/Regulations
              <br />
              h. Your Feedback And Ideas
              <br />
              <br />
              You will cooperate with the 6529 Parties in defending any such
              third-party Claims and pay all fees, costs and expenses associated
              with defending such Claims (including, but not limited to,
              attorneys&apos; fees). 6529 Parties will have control of the
              defense or settlement, at 6529 Parties&apos; sole option, of any
              third-party Claims.
            </li>
            <br />
            <br />
            <li>
              <b>Disclaimers</b>
              <br />
              <br />
              Our Platform, the 6529 NFTs and any services relating to them are
              provided &quot;As Is&quot; and &quot;As Available&quot; without
              warranties of any kind, either express or implied, including
              warranties of merchantability, fitness for a particular purpose,
              title and non-infringement. We do not warrant that Our Platform,
              NFTs or communication and content relating to them is accurate,
              complete or error-free.
              <br />
              <br />
              We further reiterate the disclaimers, without limitation, in
              Clauses #10, #11, #13 to #25 and #27
            </li>
            <br />
            <br />
            <li>
              <b>Disclaimer of Damages</b>
              <br />
              <br />
              To the fullest extent permitted by applicable law, we will not be
              liable to you under any theory of liability - whether based in
              contract, tort, negligence, strict liability, warranty or
              otherwise - for any indirect, consequential, exemplary,
              incidental, punitive or special damages or lost profits, even if
              we have been advised of the possibility of such damages.
            </li>
            <br />
            <br />
            <li>
              <b>Limitation of Liability</b>
              <br />
              <br />
              Our total liability for any claim arising from use of our Platform
              or 6529 NFTs or these Terms is limited to the greater of $100 or
              the amount paid by you to us.
              <br />
              <br />
              The limitations in #31 and #32 will not limit or exclude liability
              for our gross negligence, fraud, or intentional misconduct or for
              any other matters which cannot be excluded or limited under
              applicable law. Some jurisdictions do not allow the exclusion or
              limitation of incidental or consequential damages, so the above
              limitations or exclusions may not apply to you.
            </li>
            <br />
            <br />
            <li>
              <b>Release</b>
              <br />
              <br />
              To the fullest extent permitted by applicable law, you release the
              6529 Parties from responsibility, liability, claims, demands
              and/or damages (actual and consequential) of every kind and
              nature, known and unknown (including, but not limited to, claims
              of negligence), arising out of or related to disputes between
              users, acts or omissions of Third Parties or anything for which
              you have agreed that we will have no responsibility or liability
              pursuant to these terms.
              <br />
              <br />
              If you are a consumer who resides in California, you hereby waive
              your rights under California Civil Code § 1542, which provides:
              &quot;A general release does not extend to claims that the
              creditor or releasing party does not know or suspect to exist in
              his or her favor at the time of executing the release and that, if
              known by him or her, would have materially affected his or her
              settlement with the debtor or released party.&quot;
            </li>
            <br />
            <br />
            <li>
              <b>Governing Law and Venue</b>
              <br />
              <br />
              Any dispute arising from these Terms and your use of our Services
              will be governed by and construed and enforced in accordance with
              the laws of New York without regard to conflict of law rules or
              principles. Any dispute that is not subject to Arbitration will be
              resolved in the federal or state courts located in Wilmington,
              Delaware.
            </li>
            <br />
            <br />
            <li>
              <b>Failure To Enforce</b>
              <br />
              <br />
              If we fail to enforce some of our rights under these Terms in the
              present or against certain parties, that does not mean they
              terminate or are waived. We reserve the right to enforce them in
              the future against any or all parties.
            </li>
            <br />
            <br />
            <li>
              <b>Section Titles</b>
              <br />
              <br />
              Our section titles are for readability and have no legal or
              contractual effect.
            </li>
            <br />
            <br />
            <li>
              <b>Electronic Communication</b>
              <br />
              <br />
              You consent to electronic communication and transactions.
            </li>
            <br />
            <br />
            <li>
              <b>Severability</b>
              <br />
              <br />
              This means that if a certain section of these Terms is determined
              in some or all jurisdictions to be void, illegal or unenforceable,
              it will be severed from the rest of these Terms and the remainder
              of the contract will continue to be valid and binding.
            </li>
            <br />
            <br />
            <li>
              <b>Transferability</b>
              <br />
              <br />
              We can transfer, delegate or assign our rights under this Terms
              without your consent. You must obtain our written consent to
              transfer, assign or delegate your rights under these Terms.
            </li>
          </ol>
        </Col>
      </Row>
    </Container>
  );
}
