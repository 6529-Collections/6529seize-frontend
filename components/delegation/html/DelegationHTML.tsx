"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCachedDelegationArticleHtml,
  getDelegationArticle,
  isDelegationFaqChildArticle,
  loadDelegationArticleHtml,
} from "./delegationContent";
import { getDelegationArticleNavigation } from "../delegation-page-metadata";
import {
  DELEGATION_CARD_CLASS_NAME,
  DELEGATION_PAGE_DESCRIPTION_CLASS_NAME,
  DELEGATION_PAGE_TITLE_CLASS_NAME,
} from "../delegation-ui";

interface Props {
  path?: string | undefined;
  title?: string | undefined;
}

type DelegationArticle = NonNullable<ReturnType<typeof getDelegationArticle>>;
type DelegationArticleNavigation = ReturnType<
  typeof getDelegationArticleNavigation
>;

const SECTION_TITLE_CLASS =
  "tw-mb-2 tw-mt-0 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-iron-50 sm:tw-text-3xl";

const ARTICLE_CONTENT_CLASS = [
  "tw-w-full tw-text-base tw-font-normal tw-leading-7 tw-text-iron-300",
  "[&_a]:tw-break-words [&_a]:tw-font-medium [&_a]:tw-text-primary-300 [&_a]:tw-underline [&_a]:tw-decoration-primary-400/50 [&_a]:tw-underline-offset-4 hover:[&_a]:tw-text-primary-200",
  "[&_b]:tw-font-semibold [&_b]:tw-text-iron-100 [&_strong]:tw-font-semibold [&_strong]:tw-text-iron-100",
  "[&_h1]:tw-mb-4 [&_h1]:tw-mt-10 [&_h1]:tw-text-2xl [&_h1]:tw-font-semibold [&_h1]:tw-leading-8 [&_h1]:tw-text-iron-50",
  "[&_h2]:tw-mb-4 [&_h2]:tw-mt-10 [&_h2]:tw-text-2xl [&_h2]:tw-font-semibold [&_h2]:tw-leading-8 [&_h2]:tw-text-iron-50",
  "[&_h3]:tw-mb-3 [&_h3]:tw-mt-8 [&_h3]:tw-text-xl [&_h3]:tw-font-semibold [&_h3]:tw-leading-7 [&_h3]:tw-text-iron-100",
  "[&_h4]:tw-mb-3 [&_h4]:tw-mt-8 [&_h4]:tw-text-lg [&_h4]:tw-font-semibold [&_h4]:tw-leading-7 [&_h4]:tw-text-iron-100 [&_h4:first-child]:tw-mt-0",
  "[&_h5]:tw-mb-3 [&_h5]:tw-mt-8 [&_h5]:tw-text-base [&_h5]:tw-font-semibold [&_h5]:tw-leading-7 [&_h5]:tw-text-iron-100",
  "[&_img]:tw-mx-auto [&_img]:tw-my-10 [&_img]:tw-block [&_img]:tw-h-auto [&_img]:tw-max-w-[80%] [&_img]:tw-rounded-xl [&_img]:tw-border [&_img]:tw-border-solid [&_img]:tw-border-white/10 [&_img]:tw-bg-black/40 [&_img]:tw-p-2",
  "[&_li]:tw-mb-3 [&_li]:tw-text-base [&_li]:tw-font-normal [&_li]:tw-leading-7 [&_li]:tw-text-iron-300",
  "[&_ol]:tw-my-5 [&_ol]:tw-list-decimal [&_ol]:tw-pl-6",
  "[&_p]:tw-mb-5 [&_p]:tw-text-base [&_p]:tw-font-normal [&_p]:tw-leading-7 [&_p]:tw-text-iron-300",
  "[&_ul]:tw-my-5 [&_ul]:tw-list-disc [&_ul]:tw-pl-6",
].join(" ");

const ARTICLE_SURFACE_CLASS = `${DELEGATION_CARD_CLASS_NAME} tw-p-4 sm:tw-p-7`;

const WALLET_ARCHITECTURE_CLASS = [
  "tw-max-w-5xl tw-pb-12",
  "[&>div]:tw-w-full [&>div>div]:tw-w-full",
  "[&>div>div>h4]:tw-mb-5 [&>div>div>h4]:tw-mt-0 [&>div>div>h4]:tw-text-xl [&>div>div>h4]:tw-font-semibold [&>div>div>h4]:tw-leading-7 [&>div>div>h4]:tw-text-iron-100",
  "[&>div>div>h4>br]:tw-hidden",
  "[&>div>div>h4:not(:first-child)]:tw-mt-12 [&>div>div>h4:not(:first-child)]:tw-border-0 [&>div>div>h4:not(:first-child)]:tw-border-t [&>div>div>h4:not(:first-child)]:tw-border-solid [&>div>div>h4:not(:first-child)]:tw-border-white/[0.05] [&>div>div>h4:not(:first-child)]:tw-pt-10",
  "[&>div>div>ul]:tw-my-8 [&>div>div>ul]:tw-grid [&>div>div>ul]:tw-list-none [&>div>div>ul]:tw-gap-5 [&>div>div>ul]:tw-border-0 [&>div>div>ul]:tw-border-l-2 [&>div>div>ul]:tw-border-solid [&>div>div>ul]:tw-border-l-[#00f0ff]/40 [&>div>div>ul]:tw-pl-5 sm:[&>div>div>ul]:tw-pl-6",
  "[&>div>div>ul>li]:tw-mb-0 [&>div>div>ul>li]:tw-border-0 [&>div>div>ul>li]:tw-bg-transparent [&>div>div>ul>li]:tw-p-0 [&>div>div>ul>li]:tw-text-iron-400",
  "[&>div>div>ol]:tw-my-6 [&>div>div>ol]:tw-grid [&>div>div>ol]:tw-list-decimal [&>div>div>ol]:tw-gap-5 [&>div>div>ol]:tw-pl-6",
  "[&>div>div>ol>br]:tw-hidden [&>div>div>ol>li>ol>br]:tw-hidden",
  "[&>div>div>ol>li]:tw-mb-0 [&>div>div>ol>li]:tw-border-0 [&>div>div>ol>li]:tw-bg-transparent [&>div>div>ol>li]:tw-p-0 [&>div>div>ol>li]:tw-pl-1",
  "[&>div>div>ol>li::marker]:tw-font-semibold [&>div>div>ol>li::marker]:tw-text-[#00f0ff]",
  "[&>div>div>ol>li>ol]:tw-mb-0 [&>div>div>ol>li>ol]:tw-mt-4 [&>div>div>ol>li>ol]:tw-grid [&>div>div>ol>li>ol]:tw-list-[lower-alpha] [&>div>div>ol>li>ol]:tw-gap-3 [&>div>div>ol>li>ol]:tw-pl-6",
  "[&>div>div>ol>li>ol>li]:tw-mb-0 [&>div>div>ol>li>ol>li]:tw-border-0 [&>div>div>ol>li>ol>li]:tw-bg-transparent [&>div>div>ol>li>ol>li]:tw-p-0 [&>div>div>ol>li>ol>li]:tw-text-iron-400",
  "[&>div>div>ol>li>ol>li::marker]:tw-font-medium [&>div>div>ol>li>ol>li::marker]:tw-text-iron-600",
].join(" ");

const FAQ_INDEX_CLASS = [
  "[&>div>div>br]:tw-hidden",
  "[&_h4]:tw-mb-4 [&_h4]:tw-mt-10 [&_h4]:tw-border-0 [&_h4]:tw-border-l-2 [&_h4]:tw-border-solid [&_h4]:tw-border-l-[#00f0ff]/40 [&_h4]:tw-pb-0 [&_h4]:tw-pl-3 [&_h4]:tw-text-lg [&_h4]:tw-font-semibold [&_h4]:tw-leading-7 [&_h4]:tw-text-iron-100 [&_h4:first-child]:tw-mt-0",
  "[&_ol]:tw-mb-10 [&_ol]:tw-grid [&_ol]:tw-grid-cols-1 [&_ol]:tw-gap-2.5 [&_ol]:tw-list-none [&_ol]:tw-pl-0",
  "[&_ol>br]:tw-hidden",
  "[&_ol>li]:tw-mb-0 [&_ol>li]:tw-min-w-0",
  "[&_ol>li>a]:tw-relative [&_ol>li>a]:tw-flex [&_ol>li>a]:tw-h-full [&_ol>li>a]:tw-min-h-14 [&_ol>li>a]:tw-items-center [&_ol>li>a]:tw-overflow-hidden [&_ol>li>a]:tw-rounded-xl [&_ol>li>a]:tw-border [&_ol>li>a]:tw-border-solid [&_ol>li>a]:tw-border-white/[0.04] [&_ol>li>a]:tw-bg-iron-900/70 [&_ol>li>a]:tw-py-3.5 [&_ol>li>a]:tw-pl-5 [&_ol>li>a]:tw-pr-12 [&_ol>li>a]:tw-text-sm [&_ol>li>a]:tw-font-normal [&_ol>li>a]:tw-leading-6 [&_ol>li>a]:tw-text-iron-300 [&_ol>li>a]:tw-no-underline [&_ol>li>a]:tw-shadow-none [&_ol>li>a]:tw-transition-all [&_ol>li>a]:tw-duration-300 [&_ol>li>a]:tw-ease-out hover:[&_ol>li>a]:-tw-translate-y-0.5 hover:[&_ol>li>a]:tw-border-white/10 hover:[&_ol>li>a]:tw-bg-iron-900 hover:[&_ol>li>a]:tw-text-iron-100 hover:[&_ol>li>a]:tw-shadow-lg hover:[&_ol>li>a]:tw-shadow-black/20 hover:[&_ol>li>a]:tw-no-underline focus-visible:[&_ol>li>a]:tw-outline-none focus-visible:[&_ol>li>a]:tw-ring-2 focus-visible:[&_ol>li>a]:tw-ring-primary-400 motion-reduce:[&_ol>li>a]:tw-transform-none motion-reduce:[&_ol>li>a]:tw-transition-none",
  "[&_ol>li>a::after]:tw-absolute [&_ol>li>a::after]:tw-right-5 [&_ol>li>a::after]:tw-top-1/2 [&_ol>li>a::after]:-tw-translate-y-1/2 [&_ol>li>a::after]:tw-text-base [&_ol>li>a::after]:tw-font-normal [&_ol>li>a::after]:tw-text-iron-600 [&_ol>li>a::after]:tw-content-['→'] [&_ol>li>a::after]:tw-transition-all [&_ol>li>a::after]:tw-duration-300 [&_ol>li>a::after]:tw-ease-out [&_ol>li>a:hover::after]:tw-translate-x-1 [&_ol>li>a:hover::after]:tw-text-primary-300 motion-reduce:[&_ol>li>a::after]:tw-transform-none motion-reduce:[&_ol>li>a::after]:tw-transition-none",
].join(" ");

const CONSOLIDATION_USE_CASES_CLASS = [
  "[&>div]:tw-grid [&>div]:tw-grid-cols-1 [&>div]:tw-gap-5",
  "[&>div>br]:tw-hidden",
  "[&>div>div:first-child]:tw-max-w-5xl [&>div>div:first-child]:tw-border-0 [&>div>div:first-child]:tw-border-b [&>div>div:first-child]:tw-border-solid [&>div>div:first-child]:tw-border-white/[0.05] [&>div>div:first-child]:tw-pb-10 sm:[&>div>div:first-child]:tw-pb-12",
  "[&>div>div:first-child>h2]:tw-mb-5 [&>div>div:first-child>h2]:tw-mt-0 [&>div>div:first-child>h2]:tw-text-xl [&>div>div:first-child>h2]:tw-font-semibold [&>div>div:first-child>h2]:tw-leading-7 [&>div>div:first-child>h2]:tw-text-iron-100",
  "[&>div>div:first-child>p]:tw-mb-5 [&>div>div:first-child>p]:tw-text-base [&>div>div:first-child>p]:tw-font-normal [&>div>div:first-child>p]:tw-leading-7 [&>div>div:first-child>p]:tw-text-iron-300 [&>div>div:first-child>p:last-child]:tw-mb-0",
  "[&>div>div:not(:first-child)]:tw-rounded-xl [&>div>div:not(:first-child)]:tw-border [&>div>div:not(:first-child)]:tw-border-solid [&>div>div:not(:first-child)]:tw-border-white/[0.04] [&>div>div:not(:first-child)]:tw-bg-iron-900/70 [&>div>div:not(:first-child)]:tw-p-5 [&>div>div:not(:first-child)]:tw-transition-all [&>div>div:not(:first-child)]:tw-duration-300 [&>div>div:not(:first-child)]:tw-ease-out hover:[&>div>div:not(:first-child)]:tw-border-white/10 hover:[&>div>div:not(:first-child)]:tw-bg-iron-900 sm:[&>div>div:not(:first-child)]:tw-p-6 md:[&>div>div:not(:first-child)]:tw-grid md:[&>div>div:not(:first-child)]:tw-grid-cols-2 md:[&>div>div:not(:first-child)]:tw-gap-x-8 motion-reduce:[&>div>div:not(:first-child)]:tw-transition-none",
  "[&>div>div:not(:first-child)>h2]:tw-mb-6 [&>div>div:not(:first-child)>h2]:tw-mt-0 [&>div>div:not(:first-child)>h2]:tw-text-xl [&>div>div:not(:first-child)>h2]:tw-font-semibold [&>div>div:not(:first-child)>h2]:tw-leading-7 [&>div>div:not(:first-child)>h2]:tw-text-iron-100 md:[&>div>div:not(:first-child)>h2]:tw-col-span-2",
  "[&>div>div:not(:first-child)>p]:tw-mb-3 [&>div>div:not(:first-child)>p]:tw-mt-6 [&>div>div:not(:first-child)>p]:tw-text-[11px] [&>div>div:not(:first-child)>p]:tw-font-semibold [&>div>div:not(:first-child)>p]:tw-uppercase [&>div>div:not(:first-child)>p]:tw-leading-4 [&>div>div:not(:first-child)>p]:tw-tracking-widest [&>div>div:not(:first-child)>p]:tw-text-[#8f5cff] [&>div>div:not(:first-child)>p:first-of-type]:tw-mt-0 [&>div>div:not(:first-child)>p:first-of-type]:tw-text-[#00f0ff]",
  "[&>div>div:not(:first-child)>ul]:tw-mb-0 [&>div>div:not(:first-child)>ul]:tw-mt-0 [&>div>div:not(:first-child)>ul]:tw-list-none [&>div>div:not(:first-child)>ul]:tw-space-y-4 [&>div>div:not(:first-child)>ul]:tw-pl-0",
  "[&>div>div:not(:first-child)>ul:first-of-type]:tw-list-disc [&>div>div:not(:first-child)>ul:first-of-type]:tw-space-y-2 [&>div>div:not(:first-child)>ul:first-of-type]:tw-pl-5 [&>div>div:not(:first-child)>ul:first-of-type]:marker:tw-text-iron-600",
  "[&>div>div:not(:first-child)>ul>li]:tw-mb-0 [&>div>div:not(:first-child)>ul>li]:tw-text-sm [&>div>div:not(:first-child)>ul>li]:tw-font-normal [&>div>div:not(:first-child)>ul>li]:tw-leading-6 [&>div>div:not(:first-child)>ul>li]:tw-text-iron-400",
  "[&>div>div:not(:first-child)>ul:not(:first-of-type)>li:first-child]:tw-rounded-lg [&>div>div:not(:first-child)>ul:not(:first-of-type)>li:first-child]:tw-border [&>div>div:not(:first-child)>ul:not(:first-of-type)>li:first-child]:tw-border-solid [&>div>div:not(:first-child)>ul:not(:first-of-type)>li:first-child]:tw-border-white/[0.04] [&>div>div:not(:first-child)>ul:not(:first-of-type)>li:first-child]:tw-bg-black/25 [&>div>div:not(:first-child)>ul:not(:first-of-type)>li:first-child]:tw-p-4 [&>div>div:not(:first-child)>ul:not(:first-of-type)>li:first-child]:tw-font-medium [&>div>div:not(:first-child)>ul:not(:first-of-type)>li:first-child]:tw-text-iron-200",
  "[&>div>div:not(:first-child)>ul>li>ul]:tw-mb-0 [&>div>div:not(:first-child)>ul>li>ul]:tw-mt-2 [&>div>div:not(:first-child)>ul>li>ul]:tw-list-none [&>div>div:not(:first-child)>ul>li>ul]:tw-space-y-1 [&>div>div:not(:first-child)>ul>li>ul]:tw-pl-0 [&>div>div:not(:first-child)>ul>li>ul]:tw-font-mono",
  "[&>div>div:not(:first-child)>ul>li>ul>li]:tw-mb-0 [&>div>div:not(:first-child)>ul>li>ul>li]:tw-text-sm [&>div>div:not(:first-child)>ul>li>ul>li]:tw-font-medium [&>div>div:not(:first-child)>ul>li>ul>li]:tw-leading-6 [&>div>div:not(:first-child)>ul>li>ul>li]:tw-text-iron-200",
  "md:[&>div>div:not(:first-child)>p:first-of-type]:tw-col-start-1 md:[&>div>div:not(:first-child)>p:first-of-type]:tw-row-start-2 md:[&>div>div:not(:first-child)>ul:first-of-type]:tw-col-start-1 md:[&>div>div:not(:first-child)>ul:first-of-type]:tw-row-start-3",
  "md:[&>div>div:not(:first-child)>p:nth-of-type(2)]:tw-col-start-2 md:[&>div>div:not(:first-child)>p:nth-of-type(2)]:tw-row-start-2 md:[&>div>div:not(:first-child)>p:nth-of-type(2)]:tw-mt-0 md:[&>div>div:not(:first-child)>ul:nth-of-type(2)]:tw-col-start-2 md:[&>div>div:not(:first-child)>ul:nth-of-type(2)]:tw-row-start-3",
  "md:[&>div>div:not(:first-child)>p:nth-of-type(3)]:tw-col-start-2 md:[&>div>div:not(:first-child)>p:nth-of-type(3)]:tw-row-start-4 md:[&>div>div:not(:first-child)>p:nth-of-type(3)]:tw-mt-6 md:[&>div>div:not(:first-child)>ul:nth-of-type(3)]:tw-col-start-2 md:[&>div>div:not(:first-child)>ul:nth-of-type(3)]:tw-row-start-5",
].join(" ");

const ARTICLE_PAGER_LINK_CLASS =
  "tw-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/60 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-border-white/20 hover:tw-bg-iron-950 hover:tw-text-iron-100 hover:tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

interface ArticleLoadState {
  readonly slug: string | undefined;
  readonly html: string;
  readonly status: "error" | "loading" | "ready";
}

function getArticleAnchor(target: EventTarget | null, container: HTMLElement) {
  if (!(target instanceof Element)) {
    return undefined;
  }

  const anchor = target.closest("a");
  return anchor instanceof HTMLAnchorElement && container.contains(anchor)
    ? anchor
    : undefined;
}

function getInternalDelegationHref(
  target: EventTarget | null,
  container: HTMLElement
) {
  const anchor = getArticleAnchor(target, container);
  if (
    !anchor ||
    anchor.hasAttribute("download") ||
    (anchor.target && anchor.target.toLowerCase() !== "_self")
  ) {
    return undefined;
  }

  let destination: URL;
  try {
    destination = new URL(anchor.href, window.location.href);
  } catch {
    return undefined;
  }
  if (
    destination.origin !== window.location.origin ||
    !destination.pathname.startsWith("/delegation/")
  ) {
    return undefined;
  }

  if (
    destination.hash &&
    destination.pathname === window.location.pathname &&
    destination.search === window.location.search
  ) {
    return undefined;
  }

  return `${destination.pathname}${destination.search}${destination.hash}`;
}

function getDelegationArticleSlug(href: string) {
  const { pathname } = new URL(href, window.location.origin);
  const slug = pathname.split("/").findLast((segment) => segment.length > 0);
  return getDelegationArticle(slug) ? slug : undefined;
}

function getSplitTitle(pageTitle: string | undefined) {
  if (!pageTitle?.includes(" ")) {
    return { titleLighter: "", titleDarker: pageTitle };
  }

  const [firstWord, ...rest] = pageTitle.split(" ");
  return { titleLighter: firstWord ?? "", titleDarker: rest.join(" ") };
}

function getArticlePresentationClass(
  slug: string | undefined,
  isFaqChildArticle: boolean
) {
  if (isFaqChildArticle) {
    return ARTICLE_SURFACE_CLASS;
  }

  switch (slug) {
    case undefined:
      return ARTICLE_SURFACE_CLASS;
    case "reference-overview-wallet-architecture":
      return WALLET_ARCHITECTURE_CLASS;
    case "delegation-faq":
      return FAQ_INDEX_CLASS;
    case "consolidation-use-cases":
      return CONSOLIDATION_USE_CASES_CLASS;
    default:
      return ARTICLE_SURFACE_CLASS;
  }
}

function DelegationArticleView({
  article,
  articleNavigation,
  articleSlug,
  html,
  isFaqChildArticle,
  loading,
  pageTitle,
  setHtmlContainer,
}: Readonly<{
  article: DelegationArticle | undefined;
  articleNavigation: DelegationArticleNavigation;
  articleSlug: string | undefined;
  html: string;
  isFaqChildArticle: boolean;
  loading: boolean;
  pageTitle: string | undefined;
  setHtmlContainer: (element: HTMLElement | null) => void;
}>) {
  const { titleLighter, titleDarker } = getSplitTitle(pageTitle);
  const articlePresentationClass = getArticlePresentationClass(
    articleSlug,
    isFaqChildArticle
  );
  const isWalletArchitecture =
    articleSlug === "reference-overview-wallet-architecture";
  const isFaqIndex = articleSlug === "delegation-faq";
  const isConsolidationUseCases = articleSlug === "consolidation-use-cases";
  const usesCompactReferenceHeader =
    isWalletArchitecture || isFaqIndex || isConsolidationUseCases;
  const { previous: previousArticle, next: nextArticle } = articleNavigation;

  return (
    <div className="tw-w-full">
      <div className="tw-w-full">
        {isFaqChildArticle ? (
          <header className="tw-mb-8 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07] tw-pb-6">
            <div className="tw-flex tw-flex-col tw-items-start tw-gap-3">
              {article && (
                <Link
                  href="/delegation/delegation-faq"
                  className="tw-inline-flex tw-min-h-10 tw-items-center tw-justify-start tw-gap-2 tw-rounded-lg tw-font-medium tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-text-primary-300 hover:tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                >
                  <ArrowLeftIcon
                    aria-hidden="true"
                    className="tw-h-5 tw-w-5 tw-flex-shrink-0"
                  />
                  All FAQ topics
                </Link>
              )}
              <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-wide tw-text-primary-300">
                Delegation FAQ
              </p>
            </div>
            {pageTitle && (
              <h1 className="tw-mb-3 tw-mt-4 tw-text-2xl tw-font-semibold tw-leading-8 tw-text-iron-50 sm:tw-text-3xl sm:tw-leading-9">
                {titleLighter && `${titleLighter} `}
                {titleDarker}
              </h1>
            )}
            {article && (
              <p className="tw-mb-0 tw-max-w-[780px] tw-text-base tw-font-normal tw-leading-7 tw-text-iron-300">
                {article.summary}
              </p>
            )}
          </header>
        ) : (
          pageTitle && (
            <header
              className={
                usesCompactReferenceHeader
                  ? "tw-mb-12"
                  : "tw-mb-8 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07] tw-pb-6"
              }
            >
              {article?.group && !usesCompactReferenceHeader && (
                <p className="tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-wide tw-text-primary-300">
                  {article.group}
                </p>
              )}
              <h1
                className={
                  usesCompactReferenceHeader
                    ? DELEGATION_PAGE_TITLE_CLASS_NAME
                    : SECTION_TITLE_CLASS
                }
              >
                {titleLighter && `${titleLighter} `}
                {titleDarker}
              </h1>
              {article?.summary && (
                <p
                  className={`${DELEGATION_PAGE_DESCRIPTION_CLASS_NAME} ${
                    usesCompactReferenceHeader ? "tw-mt-2" : "tw-mt-3"
                  }`}
                >
                  {article.summary}
                </p>
              )}
            </header>
          )
        )}
        <article
          ref={setHtmlContainer}
          className={`${ARTICLE_CONTENT_CLASS} ${articlePresentationClass}`}
          aria-busy={loading}
        >
          {loading ? (
            <output className="tw-block tw-min-h-48 tw-py-4">
              <span className="tw-sr-only">Loading article...</span>
              <span
                aria-hidden="true"
                className="tw-block tw-space-y-3 motion-safe:tw-animate-pulse"
              >
                <span className="tw-block tw-h-4 tw-w-4/5 tw-rounded-md tw-bg-iron-800"></span>
                <span className="tw-block tw-h-4 tw-w-full tw-rounded-md tw-bg-iron-800"></span>
                <span className="tw-block tw-h-4 tw-w-2/3 tw-rounded-md tw-bg-iron-800"></span>
              </span>
            </output>
          ) : (
            <div
              dangerouslySetInnerHTML={{
                __html: html,
              }}
            ></div>
          )}
        </article>
        {isFaqChildArticle && (previousArticle ?? nextArticle) && (
          <nav
            aria-label="Delegation FAQ article navigation"
            className="tw-mt-10 tw-grid tw-grid-cols-1 tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-5 sm:tw-grid-cols-2"
          >
            {previousArticle ? (
              <Link
                href={previousArticle.href}
                className={`${ARTICLE_PAGER_LINK_CLASS} tw-w-fit tw-max-w-full tw-justify-self-start`}
              >
                Previous: {previousArticle.title}
              </Link>
            ) : (
              <span></span>
            )}
            {nextArticle ? (
              <Link
                href={nextArticle.href}
                className={`${ARTICLE_PAGER_LINK_CLASS} tw-w-fit tw-max-w-full tw-justify-self-end sm:tw-justify-end sm:tw-text-right`}
              >
                Next: {nextArticle.title}
              </Link>
            ) : (
              <span></span>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}

export default function DelegationHTML(props: Readonly<Props>) {
  const router = useRouter();
  const htmlContainerRef = useRef<HTMLElement>(null);
  const setHtmlContainer = useCallback((element: HTMLElement | null) => {
    htmlContainerRef.current = element;
  }, []);
  const prefetchedRoutesRef = useRef(new Set<string>());
  const [articleState, setArticleState] = useState<ArticleLoadState>(() => ({
    slug: props.path,
    html: "",
    status: props.path ? "loading" : "error",
  }));
  const article = getDelegationArticle(props.path);
  const pageTitle = props.title ?? article?.title;
  const isFaqChildArticle = isDelegationFaqChildArticle(props.path);
  const articleNavigation = getDelegationArticleNavigation(props.path);
  const cachedArticle = props.path
    ? getCachedDelegationArticleHtml(props.path)
    : undefined;
  const stateMatchesPath = articleState.slug === props.path;
  const html = stateMatchesPath
    ? articleState.html
    : (cachedArticle?.html ?? "");
  const loading = stateMatchesPath
    ? articleState.status === "loading"
    : !!props.path && !cachedArticle;
  const error = stateMatchesPath
    ? articleState.status === "error"
    : !props.path;

  useEffect(() => {
    const currentContainer = htmlContainerRef.current;
    if (!currentContainer) {
      return;
    }
    const container = currentContainer;

    function prefetchHref(href: string) {
      if (prefetchedRoutesRef.current.has(href)) {
        return;
      }

      prefetchedRoutesRef.current.add(href);
      router.prefetch(href);

      const slug = getDelegationArticleSlug(href);
      if (slug) {
        void loadDelegationArticleHtml(slug).catch(() => undefined);
      }
    }

    function handleLinkIntent(event: Event) {
      const href = getInternalDelegationHref(event.target, container);
      if (href) {
        prefetchHref(href);
      }
    }

    function handleLinkClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const href = getInternalDelegationHref(event.target, container);
      if (!href) {
        return;
      }

      event.preventDefault();
      prefetchHref(href);
      router.push(href);
    }

    container.addEventListener("click", handleLinkClick);
    container.addEventListener("focusin", handleLinkIntent);
    container.addEventListener("mouseover", handleLinkIntent);
    container.addEventListener("pointerdown", handleLinkIntent);

    return () => {
      container.removeEventListener("click", handleLinkClick);
      container.removeEventListener("focusin", handleLinkIntent);
      container.removeEventListener("mouseover", handleLinkIntent);
      container.removeEventListener("pointerdown", handleLinkIntent);
    };
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function loadArticle() {
      if (!props.path) {
        setArticleState({ slug: undefined, html: "", status: "error" });
        return;
      }

      const cached = getCachedDelegationArticleHtml(props.path);
      if (cached) {
        setArticleState({
          slug: props.path,
          html: cached.html,
          status: "ready",
        });
        return;
      }

      setArticleState({ slug: props.path, html: "", status: "loading" });

      try {
        const result = await loadDelegationArticleHtml(props.path);
        if (!cancelled) {
          setArticleState({
            slug: props.path,
            html: result.html,
            status: "ready",
          });
        }
      } catch {
        if (!cancelled) {
          setArticleState({ slug: props.path, html: "", status: "error" });
        }
      }
    }

    loadArticle();

    return () => {
      cancelled = true;
    };
  }, [props.path]);

  if (error) {
    return (
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-start tw-pt-8">
        <Image
          unoptimized
          width={100}
          height={100}
          className="tw-h-auto tw-w-[100px]"
          src="/SummerGlasses.svg"
          alt=""
        />
        <h2 className="tw-mt-4 tw-text-xl tw-font-semibold tw-text-iron-100">
          404 | PAGE NOT FOUND
        </h2>
      </div>
    );
  }

  return (
    <DelegationArticleView
      article={article}
      articleNavigation={articleNavigation}
      articleSlug={props.path}
      html={html}
      isFaqChildArticle={isFaqChildArticle}
      loading={loading}
      pageTitle={pageTitle}
      setHtmlContainer={setHtmlContainer}
    />
  );
}
