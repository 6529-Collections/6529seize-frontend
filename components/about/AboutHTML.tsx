"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import {
  AboutCol as Col,
  AboutContainer as Container,
  ABOUT_PAGE_TITLE_CLASS_NAME,
  ABOUT_PAGE_HORIZONTAL_PADDING_CLASS_NAME,
  AboutRow as Row,
  ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS,
} from "./AboutLayout";
import styles from "./About.module.css";
import { fetchAboutSectionFile } from "./about.helpers";

const ENS_TITLE_CLASS = `${ABOUT_PAGE_TITLE_CLASS_NAME} tw-pt-4 sm:tw-pt-8`;

const ENS_INLINE_LABEL_CLASS = "tw-font-semibold tw-text-iron-100";
const ENS_ACCENTED_TEXT_CLASS = "tw-font-semibold tw-text-primary-300";
const ENS_DOMAINS_LINK_CLASS =
  "tw-text-primary-300 tw-underline tw-decoration-primary-400/50 tw-underline-offset-4 tw-transition-colors hover:tw-text-primary-400 hover:tw-decoration-primary-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-[#0D0D0F] motion-reduce:tw-transition-none";
const ENS_INLINE_LABEL_PATTERN =
  /&apos;My\s+Names&apos;|&apos;Set as\s+primary name&apos;|Open\s+Safe App|Subdomains\s+Tab|New\s+subname|Edit\s+Records|Set as\s+primary name|Add\s+more info|Skip\s+profile|Available|Finish|Records|Apps|My\s+Names|More/g;
const ENS_PAYMENT_METHOD_NOTES = [
  "When you select the Ethereum payment method it's recommended to enable the Use of the domain name as a primary name.",
  "If you select the Credit or debit card method, then you will need to revisit your profile and set the primary domain name.",
];
const ENS_PAYMENT_METHOD_NOTES_PATTERN =
  /<br\s*\/?>\s*When you select the Ethereum payment method it(?:'|&apos;)s recommended to enable\s+the Use of the domain name as a primary name\.\s*<br\s*\/?>\s*If you select the Credit or debit card method, then you will need to revisit\s+your profile and set the primary domain name\./;
const ENS_REGISTRATION_SUCCESS =
  "Once the 2nd transaction is executed successfully your name will be registered.";
const ENS_REGISTRATION_SUCCESS_PATTERN =
  /Once the 2nd transaction is executed successfully your name will be\s+registered\./;

function formatEnsHtml(html: string) {
  const htmlWithPaymentMethodNotes = html.replace(
    ENS_PAYMENT_METHOD_NOTES_PATTERN,
    `<ul data-ens-payment-notes>${ENS_PAYMENT_METHOD_NOTES.map(
      (note) => `<li>${note}</li>`
    ).join("\n")}</ul>`
  );
  const htmlWithRegistrationSuccess = htmlWithPaymentMethodNotes.replace(
    ENS_REGISTRATION_SUCCESS_PATTERN,
    `<span data-ens-registration-success class="tw-flex tw-items-start tw-gap-2.5 tw-font-medium tw-text-emerald-400"><span aria-hidden="true" class="tw-mt-1.5 tw-flex tw-size-4 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-emerald-400/60 tw-bg-emerald-400/10 tw-text-[10px] tw-font-bold tw-leading-none">✓</span><span>${ENS_REGISTRATION_SUCCESS}</span></span>`
  );
  const htmlWithSafeAppAccent = htmlWithRegistrationSuccess.replace(
    "app.safe.global",
    `<span class="${ENS_ACCENTED_TEXT_CLASS}">app.safe.global</span>`
  );
  const htmlWithEnsDomainsLinkHover = htmlWithSafeAppAccent.replace(
    '<a href="https://ens.domains"',
    `<a class="${ENS_DOMAINS_LINK_CLASS}" href="https://ens.domains"`
  );
  const labelOccurrences = new Map<string, number>();

  return htmlWithEnsDomainsLinkHover.replace(
    ENS_INLINE_LABEL_PATTERN,
    (label) => {
      const normalizedLabel = label.replace(/\s+/g, " ");
      const occurrence = (labelOccurrences.get(normalizedLabel) ?? 0) + 1;
      labelOccurrences.set(normalizedLabel, occurrence);

      const isMockupEmphasis =
        (normalizedLabel !== "&apos;My Names&apos;" || occurrence <= 2) &&
        (normalizedLabel !== "Records" || occurrence === 2) &&
        (normalizedLabel !== "More" || occurrence === 1);

      return isMockupEmphasis
        ? `<span class="${ENS_INLINE_LABEL_CLASS}">${normalizedLabel}</span>`
        : label;
    }
  );
}

const ENS_HTML_CONTENT_CLASS = [
  "tw-mx-auto tw-w-full tw-max-w-3xl tw-pb-12 tw-pt-4 tw-text-[0px] tw-font-normal tw-leading-none tw-text-iron-300 sm:tw-pt-4",
  "[&>p:first-child]:tw-mb-8 [&>p:first-child]:tw-mt-0 [&>p:first-child]:tw-text-left [&>p:first-child]:tw-text-sm [&>p:first-child]:tw-leading-6 [&>p:first-child]:tw-text-iron-400",
  "[&>ul:first-of-type]:tw-mb-16 [&>ul:first-of-type]:tw-mt-0 [&>ul:first-of-type]:tw-flex [&>ul:first-of-type]:tw-list-none [&>ul:first-of-type]:tw-flex-col [&>ul:first-of-type]:tw-gap-0 [&>ul:first-of-type]:tw-rounded-xl [&>ul:first-of-type]:tw-border [&>ul:first-of-type]:tw-border-solid [&>ul:first-of-type]:tw-border-iron-800/50 [&>ul:first-of-type]:tw-bg-iron-900/55 [&>ul:first-of-type]:tw-p-6 [&>ul:first-of-type::before]:tw-static [&>ul:first-of-type::before]:tw-mb-3 [&>ul:first-of-type::before]:tw-block [&>ul:first-of-type::before]:tw-text-xs [&>ul:first-of-type::before]:tw-font-semibold [&>ul:first-of-type::before]:tw-uppercase [&>ul:first-of-type::before]:tw-leading-5 [&>ul:first-of-type::before]:tw-tracking-[0.16em] [&>ul:first-of-type::before]:tw-text-iron-400 [&>ul:first-of-type::before]:tw-content-['Contents:'] sm:[&>ul:first-of-type]:tw-p-8",
  "[&>ul:first-of-type>li]:tw-m-0 [&>ul:first-of-type>li]:tw-min-w-0 [&>ul:first-of-type>li]:tw-list-none",
  "[&>ul:first-of-type>li>a]:tw-flex [&>ul:first-of-type>li>a]:tw-min-h-8 [&>ul:first-of-type>li>a]:tw-items-center [&>ul:first-of-type>li>a]:tw-gap-3 [&>ul:first-of-type>li>a]:tw-rounded-sm [&>ul:first-of-type>li>a]:tw-text-sm [&>ul:first-of-type>li>a]:tw-font-medium [&>ul:first-of-type>li>a]:tw-leading-5 [&>ul:first-of-type>li>a]:tw-text-iron-300 [&>ul:first-of-type>li>a]:tw-no-underline [&>ul:first-of-type>li>a]:tw-transition-colors [&>ul:first-of-type>li>a::before]:tw-static [&>ul:first-of-type>li>a::before]:tw-size-1.5 [&>ul:first-of-type>li>a::before]:tw-shrink-0 [&>ul:first-of-type>li>a::before]:tw-rounded-full [&>ul:first-of-type>li>a::before]:tw-bg-primary-400/70 [&>ul:first-of-type>li>a::before]:tw-transition-colors [&>ul:first-of-type>li>a::before]:tw-content-[''] hover:[&>ul:first-of-type>li>a]:tw-text-primary-300 hover:[&>ul:first-of-type>li>a]:tw-no-underline [&>ul:first-of-type>li>a:hover::before]:tw-bg-primary-300 focus-visible:[&>ul:first-of-type>li>a]:tw-outline-none focus-visible:[&>ul:first-of-type>li>a]:tw-ring-2 focus-visible:[&>ul:first-of-type>li>a]:tw-ring-primary-400 motion-reduce:[&>ul:first-of-type>li>a]:tw-transition-none",
  "[&>h4]:tw-mb-0 [&>h4]:tw-mt-0 [&>h4]:tw-scroll-mt-24 [&>h4]:tw-border-x-0 [&>h4]:tw-border-b [&>h4]:tw-border-t-0 [&>h4]:tw-border-solid [&>h4]:tw-border-white/[0.06] [&>h4]:tw-pb-4 [&>h4]:tw-font-sans [&>h4]:tw-text-xl [&>h4]:tw-font-semibold [&>h4]:tw-leading-7 [&>h4]:tw-tracking-tight [&>h4]:tw-text-iron-50",
  "[&>ol]:tw-mb-20 [&>ol]:tw-mt-10 [&>ol]:tw-space-y-16 [&>ol]:tw-list-none [&>ol]:tw-border-x-0 [&>ol]:tw-border-b-0 [&>ol]:tw-border-l [&>ol]:tw-border-t-0 [&>ol]:tw-border-solid [&>ol]:tw-border-white/10 [&>ol]:tw-pl-8 [&>ol]:[counter-reset:ens-step]",
  "[&>ol>li]:tw-relative [&>ol>li]:tw-m-0 [&>ol>li]:tw-min-w-0 [&>ol>li]:tw-text-base [&>ol>li]:tw-font-normal [&>ol>li]:tw-leading-7 [&>ol>li]:tw-text-iron-300 [&>ol>li]:[counter-increment:ens-step]",
  "[&>ol>li::before]:tw-absolute [&>ol>li::before]:-tw-left-12 [&>ol>li::before]:tw-top-0 [&>ol>li::before]:tw-flex [&>ol>li::before]:tw-size-8 [&>ol>li::before]:tw-items-center [&>ol>li::before]:tw-justify-center [&>ol>li::before]:tw-rounded-full [&>ol>li::before]:tw-border [&>ol>li::before]:tw-border-solid [&>ol>li::before]:tw-border-white/20 [&>ol>li::before]:tw-bg-[#111115] [&>ol>li::before]:tw-font-mono [&>ol>li::before]:tw-text-xs [&>ol>li::before]:tw-font-semibold [&>ol>li::before]:tw-leading-none [&>ol>li::before]:tw-text-iron-200 [&>ol>li::before]:tw-shadow-[0_0_15px_rgba(255,255,255,0.05)] [&>ol>li::before]:tw-content-[counter(ens-step)]",
  "[&_ol>br]:tw-hidden [&>br]:tw-hidden",
  "[&_ol>li>ul:not([data-ens-payment-notes])]:tw-mb-0 [&_ol>li>ul:not([data-ens-payment-notes])]:tw-mt-6 [&_ol>li>ul:not([data-ens-payment-notes])]:tw-space-y-3 [&_ol>li>ul:not([data-ens-payment-notes])]:tw-rounded-xl [&_ol>li>ul:not([data-ens-payment-notes])]:tw-border [&_ol>li>ul:not([data-ens-payment-notes])]:tw-border-solid [&_ol>li>ul:not([data-ens-payment-notes])]:tw-border-iron-800/50 [&_ol>li>ul:not([data-ens-payment-notes])]:tw-bg-iron-900/55 [&_ol>li>ul:not([data-ens-payment-notes])]:tw-p-5 sm:[&_ol>li>ul:not([data-ens-payment-notes])]:tw-p-6",
  "[&_ol>li>ul:not([data-ens-payment-notes])>li]:tw-m-0 [&_ol>li>ul:not([data-ens-payment-notes])>li]:tw-pl-2 [&_ol>li>ul:not([data-ens-payment-notes])>li]:tw-text-base [&_ol>li>ul:not([data-ens-payment-notes])>li]:tw-leading-7 [&_ol>li>ul:not([data-ens-payment-notes])>li]:tw-text-iron-300 [&_ol>li>ul:not([data-ens-payment-notes])>li::marker]:tw-text-primary-400",
  "[&_ol>li>ul[data-ens-payment-notes]]:tw-mb-0 [&_ol>li>ul[data-ens-payment-notes]]:tw-mt-4 [&_ol>li>ul[data-ens-payment-notes]]:tw-list-outside [&_ol>li>ul[data-ens-payment-notes]]:tw-list-disc [&_ol>li>ul[data-ens-payment-notes]]:tw-space-y-2 [&_ol>li>ul[data-ens-payment-notes]]:tw-pl-5",
  "[&_ol>li>ul[data-ens-payment-notes]>li]:tw-m-0 [&_ol>li>ul[data-ens-payment-notes]>li]:tw-pl-1 [&_ol>li>ul[data-ens-payment-notes]>li]:tw-text-base [&_ol>li>ul[data-ens-payment-notes]>li]:tw-font-normal [&_ol>li>ul[data-ens-payment-notes]>li]:tw-leading-7 [&_ol>li>ul[data-ens-payment-notes]>li]:tw-text-iron-300 [&_ol>li>ul[data-ens-payment-notes]>li::marker]:tw-text-primary-400",
  "[&>p:not(:first-child)]:tw-mb-0 [&>p:not(:first-child)]:tw-mt-10 [&>p:not(:first-child)]:tw-text-base [&>p:not(:first-child)]:tw-font-semibold [&>p:not(:first-child)]:tw-leading-6 [&>p:not(:first-child)]:tw-text-primary-300",
  "[&_div]:tw-mx-auto [&_div]:tw-my-6 [&_div]:tw-w-fit [&_div]:tw-max-w-full [&_div]:tw-overflow-hidden [&_div]:tw-rounded-xl [&_div]:tw-border [&_div]:tw-border-solid [&_div]:tw-border-white/[0.08] [&_div]:tw-bg-iron-950 [&_div]:tw-p-2 [&_div]:tw-shadow-[0_20px_42px_rgba(0,0,0,0.32)]",
  "[&_img]:tw-block [&_img]:tw-h-auto [&_img]:tw-max-h-[60vh] [&_img]:tw-w-auto [&_img]:tw-max-w-full [&_img]:tw-rounded-lg [&_img]:tw-border [&_img]:tw-border-solid [&_img]:tw-border-white/[0.03]",
  "[&_a]:tw-break-words [&_a]:tw-rounded-sm [&_a]:tw-font-semibold [&_a]:tw-text-primary-300 [&_a]:tw-underline [&_a]:tw-decoration-primary-400/50 [&_a]:tw-underline-offset-4",
].join(" ");

interface Props {
  path: string;
  title: string;
}

export default function AboutHTML(props: Readonly<Props>) {
  const [html, setHtml] = useState<string>("");
  const isEns = props.path === "ens";
  const renderedHtml = isEns ? formatEnsHtml(html) : html;
  useEffect(() => {
    fetchAboutSectionFile(props.path).then(setHtml);
  }, [props.path]);

  let titleLighter = "";
  let titleDarker = props.title;

  if (props.title?.includes(" ")) {
    const [firstWord, ...rest] = props.title.split(" ");
    titleLighter = firstWord!;
    titleDarker = rest.join(" ");
  }

  return (
    <Container
      className={
        isEns
          ? `tw-pb-12 max-sm:tw-px-0 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`
          : undefined
      }
    >
      {props.title && (
        <Row className={isEns ? "max-sm:tw-mx-0" : undefined}>
          <Col
            className={
              isEns
                ? "tw-mx-auto tw-w-full tw-max-w-3xl max-sm:tw-px-1"
                : undefined
            }
          >
            <h1 className={isEns ? ENS_TITLE_CLASS : undefined}>
              {titleLighter && `${titleLighter} `}
              {titleDarker}
            </h1>
          </Col>
        </Row>
      )}
      <Row className={isEns ? "max-sm:tw-mx-0" : undefined}>
        <Col
          className={clsx(
            styles["htmlContainer"],
            !isEns && ABOUT_PAGE_HORIZONTAL_PADDING_CLASS_NAME,
            isEns && styles["ensContent"],
            isEns && ENS_HTML_CONTENT_CLASS,
            isEns && "max-sm:tw-px-1"
          )}
          dangerouslySetInnerHTML={{
            __html: renderedHtml,
          }}
        ></Col>
      </Row>
    </Container>
  );
}
