"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import styles from "./DelegationHTML.module.css";
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

interface Props {
  path?: string | undefined;
  title?: string | undefined;
}

type DelegationArticle = NonNullable<ReturnType<typeof getDelegationArticle>>;
type DelegationArticleNavigation = ReturnType<
  typeof getDelegationArticleNavigation
>;

const SECTION_TITLE_CLASS =
  "tw-mb-2 tw-mt-0 tw-text-3xl tw-font-bold tw-text-white";

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

function DelegationArticleView(
  props: Readonly<{
    article: DelegationArticle | undefined;
    articleNavigation: DelegationArticleNavigation;
    html: string;
    htmlContainerRef: RefObject<HTMLDivElement | null>;
    isFaqChildArticle: boolean;
    loading: boolean;
    pageTitle: string | undefined;
  }>
) {
  const { titleLighter, titleDarker } = getSplitTitle(props.pageTitle);

  return (
    <div className="tw-w-full">
      <div className="tw-mx-auto tw-w-full sm:tw-max-w-[540px] md:tw-max-w-[720px] lg:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
        {props.isFaqChildArticle ? (
          <header className="tw-mb-6">
            <p className={SECTION_TITLE_CLASS}>Delegation FAQ</p>
          </header>
        ) : (
          props.pageTitle && (
            <header className="tw-mb-6">
              <h1 className={SECTION_TITLE_CLASS}>
                {titleLighter && `${titleLighter} `}
                {titleDarker}
              </h1>
            </header>
          )
        )}
        {props.isFaqChildArticle && props.article && (
          <div className="tw-pb-4">
            <Link
              href="/delegation/delegation-faq"
              className="tw-inline-flex tw-min-h-10 tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-sm tw-font-medium tw-text-white tw-no-underline tw-transition-colors hover:tw-text-white hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-w-auto sm:tw-justify-start"
            >
              <ArrowLeftIcon
                aria-hidden="true"
                className="tw-h-5 tw-w-5 tw-flex-shrink-0"
              />
              All FAQ topics
            </Link>
          </div>
        )}
        {props.isFaqChildArticle && props.pageTitle && (
          <h1>
            {titleLighter && `${titleLighter} `}
            {titleDarker}
          </h1>
        )}
        {props.isFaqChildArticle && props.article && (
          <p className="tw-mb-2 tw-max-w-[780px] tw-pt-2 tw-font-semibold tw-text-white">
            {props.article.summary}
          </p>
        )}
        <div
          ref={props.htmlContainerRef}
          className={`${styles["htmlContainer"] ?? ""} tw-w-full ${
            props.isFaqChildArticle ? "tw-pt-3" : ""
          }`}
          aria-busy={props.loading}
        >
          {props.loading ? (
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
                __html: props.html,
              }}
            ></div>
          )}
        </div>
        {props.isFaqChildArticle &&
          (props.articleNavigation.previous ??
            props.articleNavigation.next) && (
            <nav
              aria-label="Delegation FAQ article navigation"
              className={styles["articlePager"]}
            >
              {props.articleNavigation.previous ? (
                <Link href={props.articleNavigation.previous.href}>
                  Previous: {props.articleNavigation.previous.title}
                </Link>
              ) : (
                <span></span>
              )}
              {props.articleNavigation.next ? (
                <Link href={props.articleNavigation.next.href}>
                  Next: {props.articleNavigation.next.title}
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
  const htmlContainerRef = useRef<HTMLDivElement>(null);
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
    const container: HTMLDivElement = currentContainer;

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
      <div className={`${styles["mainContainer"]} ${styles["pageNotFound"]}`}>
        <Image
          unoptimized
          width="0"
          height="0"
          style={{ height: "auto", width: "100px" }}
          src="/SummerGlasses.svg"
          alt=""
        />
        <h2>404 | PAGE NOT FOUND</h2>
      </div>
    );
  }

  return (
    <DelegationArticleView
      article={article}
      articleNavigation={articleNavigation}
      html={html}
      htmlContainerRef={htmlContainerRef}
      isFaqChildArticle={isFaqChildArticle}
      loading={loading}
      pageTitle={pageTitle}
    />
  );
}
