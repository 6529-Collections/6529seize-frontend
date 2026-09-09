"use client";

/* eslint-disable react/no-unescaped-entities -- Preserve the agreement's exact legal punctuation. */

import { CURRENT_EULA_VERSION } from "@/constants/constants";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEULAConsent } from "./EULAConsentContext";
import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons";
import EULAIntroSections from "./EULAIntroSections";
import EULACommunicationsSection from "./EULACommunicationsSection";
import EULAFooter from "./EULAFooter";
import EULAHeader from "./EULAHeader";
import EULALegalClosingSections from "./EULALegalClosingSections";
import { useEULAScrollGate } from "./useEULAScrollGate";
import { FocusTrap } from "focus-trap-react";
import { createPortal } from "react-dom";

export default function EULAModal() {
  const { consent, isSaving, saveError } = useEULAConsent();
  const locale = useBrowserLocale();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const scrollButtonRef = useRef<HTMLButtonElement>(null);
  const agreeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const {
    agreementContentRef,
    handleScroll,
    hasReachedBottom,
    isNearBottom,
    scrollContainerRef,
    scrollToBottom,
  } = useEULAScrollGate({ mounted, scrollButtonRef, agreeButtonRef });

  useEffect(() => {
    if (!mounted) {
      return;
    }

    scrollButtonRef.current?.focus();

    const ariaHiddenAttribute = "aria-hidden";
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const portalElement = portalRef.current;
    const backgroundElements = Array.from(document.body.children).flatMap(
      (element) => {
        if (
          !(element instanceof HTMLElement) ||
          element === portalElement ||
          portalElement?.contains(element)
        ) {
          return [];
        }
        return [
          {
            element,
            inert: Boolean(element.inert),
            ariaHidden: element.getAttribute(ariaHiddenAttribute),
          },
        ];
      }
    );
    backgroundElements.forEach(({ element }) => {
      element.inert = true;
      element.setAttribute(ariaHiddenAttribute, "true");
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      backgroundElements.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) {
          element.removeAttribute(ariaHiddenAttribute);
        } else {
          element.setAttribute(ariaHiddenAttribute, ariaHidden);
        }
      });
    };
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div ref={portalRef}>
      <FocusTrap
        active
        focusTrapOptions={{
          clickOutsideDeactivates: false,
          escapeDeactivates: false,
          fallbackFocus: () => dialogRef.current ?? document.body,
          initialFocus: () => scrollButtonRef.current ?? dialogRef.current,
          onPostActivate: () => scrollButtonRef.current?.focus(),
          preventScroll: true,
          returnFocusOnDeactivate: false,
          tabbableOptions: { displayCheck: "none" },
        }}
      >
        <div className="tailwind-scope tw-fixed tw-inset-0 tw-z-[10000] tw-bg-iron-950 tw-text-iron-50">
          <dialog
            ref={dialogRef}
            open
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            className="tw-m-0 tw-flex tw-h-full tw-max-h-none tw-w-full tw-max-w-none tw-flex-col tw-overflow-hidden tw-border-0 tw-bg-iron-950 tw-p-0 tw-text-inherit focus:tw-outline-none"
          >
            <EULAHeader
              titleId={titleId}
              title={t(locale, "eula.modal.title")}
              lastUpdated={t(locale, "eula.modal.lastUpdated", {
                version: CURRENT_EULA_VERSION,
              })}
            />
            <div className="tw-relative tw-min-h-0 tw-flex-1">
              <section
                ref={scrollContainerRef}
                onScroll={handleScroll}
                aria-label={t(locale, "eula.modal.agreementLabel")}
                className="tw-h-full tw-overflow-y-auto tw-overscroll-contain tw-px-4 tw-py-5 sm:tw-px-8 sm:tw-py-7"
              >
                <div
                  ref={agreementContentRef}
                  className="tw-mx-auto tw-w-full tw-max-w-4xl"
                >
                  <p
                    id={descriptionId}
                    className="tw-mb-6 tw-mt-0 tw-text-base tw-leading-6 tw-text-iron-200"
                  >
                    {t(locale, "eula.modal.introduction")}
                  </p>
                  <ol className="tw-m-0 tw-list-decimal tw-space-y-3 tw-pl-6 tw-text-base tw-leading-7 tw-text-iron-100 sm:tw-pl-7">
                    <EULAIntroSections />
                    <EULACommunicationsSection />
                    <li>
                      <p>
                        <strong>
                          The Only Constant In This World Is Change I
                        </strong>
                      </p>
                      <p>
                        The Terms and any pages or policies incorporated in the
                        Terms by reference may change at any time. The changes
                        are effective immediately.
                      </p>
                      <p>
                        Any material change will be communicated by providing a
                        new version of the EULA for users to agree to, by
                        changing the "Last Updated" date on the application or
                        any other method we choose.
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
                        We have the right to change or terminate any or all of
                        our activities at any time for any reason.
                      </p>
                    </li>
                    <li>
                      <p>
                        <strong>We Are On A Mission</strong>
                      </p>
                      <p>
                        The mission of 6529 NFTs is to effectively make people
                        aware of the importance of decentralization.
                      </p>
                      <p>
                        If at any point in time, at our sole discretion, we
                        think a change will improve the success of the mission,
                        even if it may be disadvantageous to any other perceived
                        goal of the 6529 NFTs, we will make that change and not
                        think twice.
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
                          rel="noopener noreferrer"
                        >
                          6529.io/about/the-memes
                        </a>
                        <br />
                        <a
                          href="https://6529.io/about/6529-gradient"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          6529.io/about/6529-gradient
                        </a>
                        <br />
                        <a
                          href="https://6529.io/about/meme-lab"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          6529.io/about/meme-lab
                        </a>
                        <br />
                        <a
                          href="https://6529.io/about/faq"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
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
                        information on this webpage that explains this topic in
                        more detail and that is incorporated by reference into
                        these Terms.
                      </p>
                      <p>
                        <a
                          href="https://6529.io/about/license"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          6529.io/about/license
                        </a>
                      </p>
                    </li>
                    <li>
                      <p>
                        <strong>Minting NFTs</strong>
                      </p>
                      <p>
                        You have no right to receive (airdrop) or mint
                        (allowlist) a future 6529 NFT based on owning one or
                        more current 6529 NFTs.
                      </p>
                      <p>
                        You acknowledge that you have read and accept the
                        information on this webpage that explains this topic in
                        more detail and that is incorporated by reference into
                        these Terms.
                      </p>
                      <p>
                        <a
                          href="https://6529.io/about/minting"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          6529.io/about/minting
                        </a>
                      </p>
                    </li>
                    <li>
                      <p>
                        <strong>Privacy and Cookies</strong>
                      </p>
                      <p>
                        Our privacy policy and cookie policy can be found here.
                        We may transfer or process data in the United States or
                        other countries. We store a cookie to track whether a
                        deviceID has already agreed to these Terms.
                      </p>
                      <p>
                        <a
                          href="https://6529.io/about/privacy-policy"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          6529.io/about/privacy-policy
                        </a>
                        <br />
                        <a
                          href="https://6529.io/about/cookie-policy"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
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
                          rel="noopener noreferrer"
                        >
                          6529.io/about/copyright
                        </a>
                      </p>
                    </li>
                    <li>
                      <p>
                        <strong>Not Our Platform</strong>
                      </p>
                      <p>
                        Due to the architecture of NFT contracts, 6529 NFTs can
                        be transferred without our permission or consent. We
                        cannot "freeze" someone's 6529 NFTs or transfer them to
                        a party of our choosing. After the primary sale from us
                        to you, you are in full control of your token.
                      </p>
                      <p>
                        This means that you can transact 6529 NFTs in their
                        Ethereum wallets, in marketplaces, in galleries, in
                        metaverse platforms, in games and in a wide range of
                        services that may emerge. All of these transactions are
                        occurring on Not Our Platform. We have no ability to
                        enforce or control transactions happening on Not Our
                        Platform.
                      </p>
                      <p>
                        We take absolutely no responsibility whatsoever for what
                        you and Third Parties do on Not Our Platform, including
                        but not limited to, suffering economic losses, security
                        risks, theft, hacking, unpleasant consumer experiences,
                        what commitments or representations are made as a part
                        of those transactions, and if those transactions are
                        legal in your jurisdiction.
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
                        NFTs are the most volatile and experimental sector of
                        the crypto field which itself is still a new, volatile
                        and experimental field.
                      </p>
                      <p>
                        You are solely responsible for securing your device and
                        any transactions you engage in with 6529Mobile. We take
                        no responsibility for phishing attacks or other
                        unauthorized transactions.
                      </p>
                      <p>
                        Many things can potentially go wrong with NFTs in
                        general or 6529-related NFTs in particular, including
                        but not limited to:
                        <br />
                        (a) technical flaws/bugs/hacks/vulnerabilities at the
                        protocol level, <br />
                        (b) changes at the protocol level, <br />
                        (c) changes in which protocols are popular, <br />
                        (d) technical flaws/bugs/hacks/vulnerabilities at the
                        wallet level, <br />
                        (e) changes in the popularity of NFTs in general or any
                        NFTs specifically, <br />
                        (f) technical flaws/bugs/hacks/vulnerabilities of
                        project or marketplace websites, <br />
                        (g) technical flaws/bugs/hacks/vulnerabilities of
                        general or project-related communication channels such
                        as discord or twitter, <br />
                        (h) legal or regulatory changes or actions that impact
                        specific NFTs (including ours) or all NFTs.
                      </p>
                    </li>
                    <li>
                      <p>
                        <strong>Future Value of 6529 NFTs</strong>
                      </p>
                      <p>
                        The future value of art and collectibles is based on
                        demand and social factors, is impossible to forecast,
                        and, in any case, is out of our control.
                      </p>
                      <p>
                        We have no idea what the future value (if any) will be
                        of 6529 NFTs.
                      </p>
                    </li>
                    <li>
                      <p>
                        <strong>Royalties</strong>
                      </p>
                      <p>
                        Most 6529 NFTs have secondary sale royalties associated
                        with them that are paid to us, the collaborating artist
                        or both.
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
                        Most 6529 NFTs are CC0 (Creative Commons 0) licensed
                        which means they are in the public domain.
                      </p>
                      <p>
                        This means anyone in the world can use the image
                        associated with your NFT for any purpose they like. Some
                        uses may be perceived by you as desirable and some uses
                        may be perceived as undesirable or even shocking.
                      </p>
                      <p>
                        This is the nature of CC0 art. There is nothing we or
                        anyone else can do about it. If this bothers you, you
                        should probably not buy a CC0 NFT.
                      </p>
                    </li>
                    <li>
                      <p>
                        <strong>Utility</strong>
                      </p>
                      <p>
                        6529 NFTs do not have any "utility" beyond being works
                        of art.
                      </p>
                      <p>
                        We may, from time to time, test or operate services that
                        interoperate with 6529 NFTs.
                      </p>
                      <p>
                        These should be considered experimental, subject to
                        change, subject to being terminated and, in any case,
                        not changing the general principle that we make no
                        commitments to offering "utility" to owners of 6529
                        NFTs.
                      </p>
                    </li>
                    <li>
                      <p>
                        <strong>Third Party Perspectives</strong>
                      </p>
                      <p>
                        Many Third Parties have perspectives about 6529 NFTs
                        that they share on social media and otherwise.
                      </p>
                      <p>
                        We take no responsibility for these communications,
                        whether we agree with them or not, as we have no way to
                        monitor or exercise control over them.
                      </p>
                    </li>
                    <li>
                      <p>
                        <strong>Delegation and Consolidation</strong>
                      </p>
                      <p>
                        We may provide from time to time the ability to delegate
                        from one wallet to another, or to consolidate wallet
                        contents. We take no responsibilities for errors, losses
                        or missed opportunities based on delegation or
                        consolidation (or for any other reason).
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
                        transactions with certain people or entities
                        ("Sanctioned Parties").
                      </p>
                      <p>
                        As we prefer not to go to jail, if you are a Sanctioned
                        Party, we cannot engage in any economic activities with
                        you.
                      </p>
                      <p>
                        If you are a Sanctioned Party, please do not: a) mint a
                        6529 NFT, b) apply to be a Meme Card artist, or c) send
                        us any ETH, for royalties or otherwise.
                      </p>
                    </li>
                    <li>
                      <p>
                        <strong>
                          We Are Not Your Personal Ethereum Concierge
                        </strong>
                      </p>
                      <p>
                        NFTs are held in self-managed Ethereum wallets where the
                        users are responsible for authorizing transactions.
                      </p>
                      <p>
                        Mistakes in how an Ethereum wallet is used can lead to
                        loss of your 6529 NFTs (or other tokens), failed
                        transactions or high gas costs. Such events are your
                        responsibility and out of our control and we cannot
                        offer you compensation or any other recourse for such
                        events.
                      </p>
                      <p>
                        There is a vast array of educational resources available
                        to learn about how to use Ethereum well. We encourage
                        you to study and practice with small amounts before
                        buying economically meaningful NFTs and to follow good
                        safety practices such as using multi-signature or
                        hardware wallets.
                      </p>
                    </li>
                    <li>
                      <p>
                        <strong>Phishing</strong>
                      </p>
                      <p>
                        It is common for Third Parties to create fake 6529
                        websites in order to convince people to sign malicious
                        transactions or transfer their private keys.
                      </p>
                      <p>
                        We take no responsibility for phishing sites, even if we
                        are made aware of them, and cannot provide any
                        compensation or assistance for phishing, thefts or other
                        related matters.
                      </p>
                      <p>
                        It is your responsibility to understand which
                        transactions you are signing in your Ethereum wallet.
                      </p>
                    </li>
                    <li>
                      <p>
                        <strong>Ethereum NFTs</strong>
                      </p>
                      <p>
                        The 6529 NFTs are currently only available on the
                        Ethereum blockchain.
                      </p>
                      <p>
                        Moving them to another blockchain including an "L2"
                        Ethereum blockchain will lead to their loss.
                      </p>
                    </li>
                    <li>
                      <p>
                        <strong>We Might Get Hacked</strong>
                      </p>
                      <p>
                        It is possible that Our Platform may be hacked or
                        otherwise maliciously attacked and we disclaim any
                        liability in this case.
                      </p>
                      <p>
                        You remain solely responsible for any actions you take
                        relating to Our Platform, including signing transactions
                        from your Ethereum wallet.
                      </p>
                      <p>
                        Always keep your guard up for suspicious behavior even
                        on trusted sites.
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
                        compensation for "sharing ideas". If this is not
                        acceptable to you, do not share your ideas with us.
                      </p>
                      <p>
                        We will not sign NDAs or non-competes to hear your
                        ideas.
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
                        representations relating to Third Party Content or
                        Services and you interact with them at your sole risk.
                      </p>
                    </li>
                    <li>
                      <p>
                        <strong>
                          You Can't Sue Us, Either Individually Or In Large
                          Groups
                        </strong>
                      </p>
                      <p>
                        You waive your right to sue us or to participate in a
                        class action suit and agree to mandatory arbitration in
                        the event of a dispute.
                      </p>
                      <p>
                        Specifically, you agree to the following as it relates
                        to disputes between you and us:
                      </p>
                      <p>
                        a) That any dispute we might have, it is individual
                        between you and us and you will not bring a class
                        action, class arbitration or any other collective
                        proceeding.
                      </p>
                      <p>
                        b) If you or we have a dispute, we will aim to resolve
                        it amicably first and, if that is not possible, either
                        party will have the right to initiate a JAMS arbitration
                        under standard JAMS terms of reference.
                      </p>
                      <p>
                        You acknowledge that you have read and accept the
                        information on this webpage that includes the applicable
                        JAMS terms and that is incorporated by reference into
                        these Terms.
                      </p>
                      <p>
                        <a
                          href="https://6529.io/dispute-resolution"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          6529.io/dispute-resolution
                        </a>
                      </p>
                    </li>
                    <EULALegalClosingSections />
                  </ol>
                </div>
              </section>
              {!isNearBottom && (
                <button
                  ref={scrollButtonRef}
                  type="button"
                  onClick={scrollToBottom}
                  aria-label={t(locale, "eula.modal.scrollToEnd")}
                  className="tw-absolute tw-bottom-4 tw-right-4 tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-50 tw-p-2 tw-text-iron-950 tw-shadow-xl tw-transition tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-white motion-reduce:tw-transition-none sm:tw-bottom-5 sm:tw-right-8"
                >
                  <FontAwesomeIcon icon={faArrowDown} height={16} width={16} />
                </button>
              )}
            </div>
            <EULAFooter
              agreeButtonRef={agreeButtonRef}
              hasReachedBottom={hasReachedBottom}
              isSaving={isSaving}
              saveError={saveError}
              agreeLabel={t(locale, "eula.modal.agree")}
              retryLabel={t(locale, "eula.modal.tryAgain")}
              onAgree={() => void consent()}
            />
          </dialog>
        </div>
      </FocusTrap>
    </div>,
    document.body
  );
}
