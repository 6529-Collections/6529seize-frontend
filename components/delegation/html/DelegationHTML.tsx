"use client";

import { useEffect, useState } from "react";
import styles from "./DelegationHTML.module.css";
import Image from "next/image";
import Link from "next/link";
import {
  fetchDelegationArticleHtml,
  getDelegationArticle,
  isDelegationFaqChildArticle,
} from "./delegationContent";
import { getDelegationArticleNavigation } from "../delegation-page-metadata";

interface Props {
  path?: string | undefined;
  title?: string | undefined;
}

export default function DelegationHTML(props: Readonly<Props>) {
  const [html, setHtml] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const article = getDelegationArticle(props.path);
  const pageTitle = props.title ?? article?.title;
  const isFaqChildArticle = isDelegationFaqChildArticle(props.path);
  const articleNavigation = getDelegationArticleNavigation(props.path);

  let titleLighter = "";
  let titleDarker = pageTitle;

  if (pageTitle?.includes(" ")) {
    const [firstWord, ...rest] = pageTitle.split(" ");
    titleLighter = firstWord!;
    titleDarker = rest.join(" ");
  }

  useEffect(() => {
    let cancelled = false;

    async function loadArticle() {
      if (!props.path) {
        setHtml("");
        setLoading(false);
        setError(true);
        return;
      }

      setLoading(true);
      setError(false);
      setHtml("");

      try {
        const result = await fetchDelegationArticleHtml(props.path);
        if (!cancelled) {
          setHtml(result.html);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
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
  } else {
    return (
      <div className="tw-mx-auto tw-w-full tw-px-3 tw-pt-2 sm:tw-max-w-[540px] md:tw-max-w-[720px] lg:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
        {isFaqChildArticle && article && (
          <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pb-2">
            <div className="tw-w-full tw-px-3">
              <nav aria-label="Breadcrumb" className={styles["breadcrumbNav"]}>
                <Link href="/delegation/delegation-center">
                  Delegation Center
                </Link>
                <span>/</span>
                <Link href="/delegation/delegation-faq">Delegation FAQ</Link>
                <span>/</span>
                <span aria-current="page">{article.title}</span>
              </nav>
            </div>
          </div>
        )}
        {pageTitle && (
          <div className="-tw-mx-3 tw-flex tw-flex-wrap">
            <div className="tw-w-full tw-px-3">
              <h1>
                {titleLighter && `${titleLighter} `}
                {titleDarker}
              </h1>
            </div>
          </div>
        )}
        {isFaqChildArticle && article && (
          <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-2">
            <div className="tw-w-full tw-px-3">
              <p className={styles["articleSummary"]}>{article.summary}</p>
              <Link
                href="/delegation/delegation-faq"
                className={styles["articleBackLink"]}
              >
                Back to Delegation FAQ
              </Link>
            </div>
          </div>
        )}
        <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-3">
          <div
            className={`${styles["htmlContainer"]} tw-w-full tw-px-3`}
            aria-busy={loading}
          >
            {loading ? (
              <p role="status">Loading article...</p>
            ) : (
              <div
                dangerouslySetInnerHTML={{
                  __html: html,
                }}
              ></div>
            )}
          </div>
        </div>
        {isFaqChildArticle &&
          (articleNavigation.previous || articleNavigation.next) && (
            <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4">
              <div className="tw-w-full tw-px-3">
                <nav
                  aria-label="Delegation FAQ article navigation"
                  className={styles["articlePager"]}
                >
                  {articleNavigation.previous ? (
                    <Link href={articleNavigation.previous.href}>
                      Previous: {articleNavigation.previous.title}
                    </Link>
                  ) : (
                    <span></span>
                  )}
                  {articleNavigation.next ? (
                    <Link href={articleNavigation.next.href}>
                      Next: {articleNavigation.next.title}
                    </Link>
                  ) : (
                    <span></span>
                  )}
                </nav>
              </div>
            </div>
          )}
      </div>
    );
  }
}
