"use client";

import { CheckCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";

import { ABOUT_CARD_CLASS_NAME } from "@/components/about/AboutLayout";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatList, formatPercent } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/validator-authorize";
import {
  groupedPublicKey,
  isImplausibleAuthVersion,
  keyCode,
  sharePercents,
  shortAddress,
  unmarkedKeys,
} from "@/lib/validator-page/authorize/display";
import type { Draft } from "@/lib/validator-page/authorize/draftLink";
import {
  grantNetwork,
  type GrantTypedData,
} from "@/lib/validator-page/authorize/typedData";

import ValidatorPageFrame, { ValidatorPageHeader } from "../ValidatorPageFrame";
import { BODY, LINK, PRIMARY_BUTTON, TEXT_BUTTON } from "../validatorStyles";
import { useAuthorizeSession, type Signing } from "./useAuthorizeSession";

const TEXT = `${BODY} tw-m-0`;
const SMALL = "tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400";
const HEADING =
  "tw-m-0 tw-text-xl tw-font-semibold tw-leading-7 tw-text-iron-50";
const CARD = `${ABOUT_CARD_CLASS_NAME} tw-flex tw-flex-col tw-gap-5 tw-p-5 sm:tw-p-6`;
const DISABLED = "disabled:tw-cursor-default disabled:tw-opacity-60";

function Notice({
  children,
  tone = "plain",
}: {
  readonly children: ReactNode;
  readonly tone?: "plain" | "warning" | "error";
}) {
  if (tone === "warning") {
    return (
      <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-amber-300">
        {children}
      </p>
    );
  }
  if (tone === "error") {
    return (
      <p
        role="alert"
        className="tw-m-0 tw-text-base tw-leading-7 tw-text-error"
      >
        {children}
      </p>
    );
  }
  // <output> is a status: screen readers say it when it changes.
  return (
    <output className="tw-m-0 tw-block tw-text-base tw-leading-7 tw-text-iron-100">
      {children}
    </output>
  );
}

/** The draft as the page shows it, from what the wallet will sign. */
type Shown = {
  readonly draft: Draft;
  readonly grant: GrantTypedData;
  /** From the domain salt that is signed, never from the link's label. */
  readonly network: "mainnet" | "test";
  readonly locale: SupportedLocale;
};

function TestNetworkTag({ shown }: { readonly shown: Shown }) {
  if (shown.network === "mainnet") {
    return null;
  }
  return (
    <span className="tw-inline-flex tw-items-center tw-self-start tw-rounded-full tw-border tw-border-solid tw-border-amber-400/40 tw-bg-amber-400/10 tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-semibold tw-text-amber-300">
      {t(shown.locale, "validator.authorize.network.test")}
    </span>
  );
}

function KeyCodes({ shown }: { readonly shown: Shown }) {
  const mine = shown.draft.keys.filter((key) => key.mine);
  if (mine.length === 0) {
    return <TestNetworkTag shown={shown} />;
  }
  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
          Validator key
        </span>
        <TestNetworkTag shown={shown} />
      </div>
      <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-1 tw-p-0">
        {mine.map((key) => (
          <li
            key={key.pubkey}
            className="tw-font-mono tw-text-4xl tw-font-semibold tw-leading-tight tw-tracking-wider tw-text-iron-50"
          >
            {keyCode(key.pubkey)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-1 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-3">
      <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
        {label}
      </dt>
      <dd className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-100">
        {children}
      </dd>
    </div>
  );
}

function DraftRows({ shown }: { readonly shown: Shown }) {
  const { draft, grant, locale } = shown;
  const percents = sharePercents(draft.keys.map((key) => key.share));
  return (
    <dl className="tw-m-0 tw-flex tw-flex-col tw-gap-3">
      <Row label="Account">
        <span className="tw-block tw-break-all tw-font-mono tw-text-sm tw-leading-6">
          {draft.account}
        </span>
      </Row>
      {draft.keys.length > 0 && (
        <Row label={draft.keys.length === 1 ? "Key" : "Keys"}>
          <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-1 tw-p-0">
            {draft.keys.map((key, index) => (
              <li
                key={key.pubkey}
                className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3"
              >
                <span className="tw-font-mono tw-text-lg tw-font-semibold tw-text-iron-50">
                  {keyCode(key.pubkey)}
                </span>
                <span>{percents[index]}</span>
                {key.mine && (
                  <span className="tw-text-sm tw-text-primary-300">
                    this validator
                  </span>
                )}
                <span className="tw-basis-full tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-400">
                  {groupedPublicKey(key.pubkey)}
                </span>
              </li>
            ))}
          </ul>
        </Row>
      )}
      <Row label={t(locale, "validator.authorize.version.label")}>
        {t(locale, "validator.authorize.version.value", {
          version: String(grant.message.authVersion),
        })}
      </Row>
      <Row label="Purpose">{grant.message.purpose}</Row>
    </dl>
  );
}

/** What to weigh before signing that the checks can't decide. */
function DraftWarnings({ shown }: { readonly shown: Shown }) {
  const { draft, grant, locale } = shown;
  const others = unmarkedKeys(draft.keys);
  const version = draft.authVersion;
  const percent = formatPercent(locale, others.fraction, 2);
  return (
    <>
      {others.count === 1 && (
        <Notice tone="warning">
          {t(locale, "validator.authorize.keys.unmarked.one", { percent })}
        </Notice>
      )}
      {others.count > 1 && (
        <Notice tone="warning">
          {t(locale, "validator.authorize.keys.unmarked.other", {
            count: others.count,
            percent,
          })}
        </Notice>
      )}
      {isImplausibleAuthVersion(version) && (
        <Notice tone="warning">
          {t(locale, "validator.authorize.version.implausible", {
            version: version.toString(),
          })}
        </Notice>
      )}
    </>
  );
}

/** The heading names the validator's own keys only when the link marks one. */
function introHeading({ draft, locale }: Shown, mine: number): string {
  if (mine > 1) {
    return "Authorize these validator keys";
  }
  if (mine === 1) {
    return "Authorize this validator key";
  }
  return draft.keys.length > 1
    ? t(locale, "validator.authorize.heading.unmarked.other")
    : t(locale, "validator.authorize.heading.unmarked.one");
}

function DraftIntro({ shown }: { readonly shown: Shown }) {
  const { draft } = shown;
  const mine = draft.keys.filter((key) => key.mine).length;
  if (draft.keys.length === 0) {
    return (
      <>
        <TestNetworkTag shown={shown} />
        <h2 className={HEADING}>Stop this account&apos;s keys</h2>
        <p className={TEXT}>
          No key will sign for this account from the day it counts.
        </p>
      </>
    );
  }
  return (
    <>
      <KeyCodes shown={shown} />
      <h2 className={HEADING}>{introHeading(shown, mine)}</h2>
      <p className={TEXT}>
        Your wallet signs one message that lets the 6529 Validator on your
        computer sign for this account. It costs no gas and moves nothing.
      </p>
      <p className={TEXT}>
        Check that your validator&apos;s screen shows the same key code. If it
        doesn&apos;t, or someone sent you this link, stop here.
      </p>
    </>
  );
}

type Session = ReturnType<typeof useAuthorizeSession>;

/** 0x1234…abcd, kept on one line. */
function Address({ address }: { readonly address: string }) {
  return <span className="tw-whitespace-nowrap">{shortAddress(address)}</span>;
}

function AnotherWallet({ session }: { readonly session: Session }) {
  return (
    <button
      type="button"
      onClick={() => void session.connectAnother()}
      className={`${TEXT_BUTTON} -tw-ml-1 tw-self-start`}
    >
      Use another wallet
    </button>
  );
}

const SIGNING_NOTICE: Readonly<
  Partial<
    Record<Signing["status"], { text: ReactNode; tone: "plain" | "error" }>
  >
> = {
  rejected: {
    text: "You cancelled in your wallet. Nothing was signed.",
    tone: "plain",
  },
  failed: { text: "Your wallet didn't sign. Try again.", tone: "error" },
};

function signLabel(waiting: boolean, again: boolean): string {
  if (waiting) {
    return "Waiting for your wallet";
  }
  return again ? "Sign again" : "Sign in your wallet";
}

/** Connect, the wrong wallet, a Safe, or the Sign button. */
function WalletStep({
  session,
  draft,
}: {
  readonly session: Session;
  readonly draft: Draft;
}) {
  const { account, signing } = session;
  if (!account) {
    return (
      <button
        type="button"
        onClick={session.connect}
        className={`${PRIMARY_BUTTON} tw-border-0`}
      >
        Connect wallet
      </button>
    );
  }
  if (session.isSafeWallet) {
    return (
      <>
        <Notice tone="error">
          A vault such as a Safe can&apos;t sign in this version. Connect the
          ordinary wallet you use on 6529.io.
        </Notice>
        <AnotherWallet session={session} />
      </>
    );
  }
  if (account !== draft.account) {
    return (
      <>
        <Notice tone="error">
          Connect <Address address={draft.account} />, the wallet your validator
          asked for. This wallet is <Address address={account} />.
        </Notice>
        <AnotherWallet session={session} />
      </>
    );
  }
  const notice =
    signing.status === "mismatch"
      ? {
          text: (
            <>
              This signature isn&apos;t from <Address address={draft.account} />
              . Your validator won&apos;t take it.
            </>
          ),
          tone: "error" as const,
        }
      : SIGNING_NOTICE[signing.status];
  const again = signing.status === "rejected" || signing.status === "mismatch";
  return (
    <>
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      <button
        type="button"
        onClick={() => void session.sign()}
        disabled={signing.status === "wallet"}
        className={`${PRIMARY_BUTTON} tw-border-0 ${DISABLED}`}
      >
        {signLabel(signing.status === "wallet", again)}
      </button>
      <p className={SMALL}>
        {draft.keys.length > 0
          ? "Your wallet shows the same words. Each key's public key ends in its code. Signing costs no gas."
          : "Your wallet shows the same words. Signing costs no gas."}
      </p>
    </>
  );
}

/** What the signature authorizes, as signed, whoever made the link. */
function signedSummary({ draft, grant, network, locale }: Shown): string {
  const params = {
    account: shortAddress(draft.account),
    version: String(grant.message.authVersion),
    codes: formatList(
      locale,
      draft.keys.map((key) => keyCode(key.pubkey))
    ),
  };
  let summary: string;
  if (draft.keys.length === 0) {
    summary = t(locale, "validator.authorize.signed.stop", params);
  } else if (draft.keys.length === 1) {
    summary = t(locale, "validator.authorize.signed.keys.one", params);
  } else {
    summary = t(locale, "validator.authorize.signed.keys.other", params);
  }
  const sentences = [summary];
  if (network === "test") {
    sentences.push(t(locale, "validator.authorize.signed.network.test"));
  }
  sentences.push(t(locale, "validator.authorize.signed.nothingSent"));
  return sentences.join(" ");
}

function SignatureCard({
  signature,
  shown,
}: {
  readonly signature: string;
  readonly shown: Shown;
}) {
  const box = useRef<HTMLParagraphElement>(null);
  const [copied, setCopied] = useState<"copied" | "select" | null>(null);

  const copy = async () => {
    let done = false;
    try {
      await navigator.clipboard.writeText(signature);
      done = true;
    } catch {
      // No clipboard here: select the text so the holder can copy it.
      try {
        if (box.current) {
          globalThis.getSelection()?.selectAllChildren(box.current);
        }
      } catch {
        // The text stays selectable by hand.
      }
    }
    setCopied(done ? "copied" : "select");
  };

  return (
    <section className={CARD} aria-labelledby="authorize-copy">
      <div className="tw-flex tw-items-start tw-gap-3">
        <CheckCircleIcon
          aria-hidden="true"
          className="tw-size-7 tw-flex-none tw-text-success"
        />
        <h2 id="authorize-copy" className={HEADING}>
          Copy the signature
        </h2>
      </div>
      <p className={TEXT}>
        Paste it into your validator&apos;s Authorize step, in the box for the
        signature.
      </p>
      <p
        ref={box}
        className="tw-m-0 tw-select-all tw-break-all tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-3 tw-font-mono tw-text-sm tw-leading-6 tw-text-iron-100"
      >
        {signature}
      </p>
      <button
        type="button"
        onClick={() => void copy()}
        className={`${PRIMARY_BUTTON} tw-border-0`}
      >
        Copy signature
      </button>
      {copied && (
        <Notice>
          {copied === "copied" ? "Copied." : "Select the text and copy it."}
        </Notice>
      )}
      <p className={SMALL}>{signedSummary(shown)}</p>
    </section>
  );
}

// Opened without a validator's link: what the page is for, how to get
// here from the validator, and the one check before signing.
function NoLink() {
  return (
    <section className={CARD}>
      <h2 className={HEADING}>Sign for your validator on your phone</h2>
      <p className={TEXT}>
        This page lets the wallet on your phone authorize a 6529 Validator that
        runs on your computer. Your wallet signs one message. It costs no gas
        and moves nothing.
      </p>
      <ol className="tw-m-0 tw-flex tw-flex-col tw-gap-2 tw-pl-5 tw-text-base tw-leading-7 tw-text-iron-300">
        <li>
          On your computer, open 6529 Validator and go to Authorize, or to Keys,
          then Add a computer.
        </li>
        <li>Choose your phone as the wallet, and paste its address.</li>
        <li>Scan the code it shows with your phone, or open its link here.</li>
        <li>Sign here, then paste the signature into your validator.</li>
      </ol>
      <p className={TEXT}>
        Sign only if the key code on this page matches the one on your computer.
      </p>
      <p className={SMALL}>
        <Link href="/validator" className={LINK}>
          What is the 6529 Validator?
        </Link>{" "}
        Read about it and download it there.
      </p>
    </section>
  );
}

function AuthorizeBody() {
  const session = useAuthorizeSession();
  const locale = useBrowserLocale();
  const { draft, review, signing } = session;

  if (draft === undefined) {
    return null;
  }
  if (draft === null) {
    return <NoLink />;
  }
  if (draft === "bad" || !review) {
    return (
      <section className={CARD}>
        <Notice tone="error">
          This link is incomplete or damaged. Scan the code again, or copy the
          link again from your validator.
        </Notice>
      </section>
    );
  }
  const shown: Shown = {
    draft,
    grant: review.grant,
    network: grantNetwork(review.grant.domain.salt),
    locale,
  };
  if (signing.status === "signed") {
    return <SignatureCard signature={signing.signature} shown={shown} />;
  }
  return (
    <section className={CARD}>
      <DraftIntro shown={shown} />
      <DraftRows shown={shown} />
      <DraftWarnings shown={shown} />
      {review.problems.length > 0 ? (
        <>
          <Notice tone="error">
            Don&apos;t sign this. It isn&apos;t a 6529 Validator authorization.
          </Notice>
          <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-1 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-400">
            {review.problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </>
      ) : (
        <WalletStep session={session} draft={draft} />
      )}
    </section>
  );
}

/** 6529.io/validator/authorize: a phone signs a validator's authorization. */
export default function ValidatorAuthorizePage() {
  return (
    <ValidatorPageFrame>
      <div className="tw-mx-auto tw-max-w-md tw-pt-2 sm:tw-pt-10">
        <ValidatorPageHeader
          eyebrow="6529 Validator"
          title="Authorize your validator"
        />
        <AuthorizeBody />
      </div>
    </ValidatorPageFrame>
  );
}
