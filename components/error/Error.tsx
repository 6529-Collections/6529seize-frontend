"use client";

import { useTitle } from "@/contexts/TitleContext";
import {
  faChevronDown,
  faChevronUp,
  faCopy,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { useCopyToClipboard } from "react-use";

type ErrorComponentProps = {
  readonly stackTrace?: string | null;
  readonly digest?: string | null;
  readonly onReset?: () => void;
};

export default function ErrorComponent({
  stackTrace,
  digest,
  onReset,
}: ErrorComponentProps = {}) {
  const { setTitle } = useTitle();
  const searchParams = useSearchParams();
  const [isStacktraceExpanded, setIsStacktraceExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const stacktraceContentId = useId();
  const [, copyToClipboard] = useCopyToClipboard();

  useEffect(() => {
    setTitle("6529 Error");
  }, [setTitle]);

  const stackTraceFromQuery = useMemo(() => {
    return searchParams?.get("stack") ?? "";
  }, [searchParams]);

  const resolvedStackTrace = stackTrace ?? stackTraceFromQuery;
  const resolvedStackTraceWithDigest = digest
    ? `${digest}\n\n${resolvedStackTrace}`
    : resolvedStackTrace;
  const hasStackTrace = Boolean(resolvedStackTrace);

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const onCopy = () => {
    copyToClipboard(resolvedStackTraceWithDigest);
    setIsCopied(true);
  };

  return (
    <section className="tw-w-full tw-h-full tw-min-h-screen tw-flex tw-justify-center tw-items-center">
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-2">
        <Image
          unoptimized
          priority
          loading="eager"
          width="0"
          height="0"
          style={{ height: "auto", width: "100px" }}
          src="/SummerGlasses.svg"
          alt="SummerGlasses"
        />
        <div className="tw-flex tw-flex-wrap tw-gap-2 tw-items-center tw-justify-center">
          <h3 className="tw-text-2xl tw-font-semibold">
            Welcome to the 6529 Page of Doom
          </h3>
          <img
            src="/emojis/sgt_grimacing.webp"
            alt="sgt_grimacing"
            className="tw-w-8 tw-h-8"
          />
        </div>
        <p className="tw-text-center tw-font-medium md:tw-text-lg tw-text-gray-200">
          Looks like something went wrong. Try again or reach out to us at{" "}
          <a
            className="tw-text-white tw-underline"
            href="mailto:support@6529.io">
            support@6529.io
          </a>
          .
        </p>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="tw-px-6 tw-py-2 tw-bg-white tw-text-black tw-rounded-lg tw-font-semibold hover:tw-bg-gray-200 tw-transition-colors">
            Try Again
          </button>
        )}

        {(hasStackTrace || digest) && (
          <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-2 tw-items-center tw-justify-center tw-w-full tw-max-w-4xl tw-px-4">
            <div
              className={`tw-flex tw-gap-2 tw-items-center tw-w-full ${
                isStacktraceExpanded
                  ? "tw-justify-between"
                  : "tw-justify-center"
              }`}>
              <button
                type="button"
                onClick={() => setIsStacktraceExpanded((prev) => !prev)}
                className="tw-flex tw-items-center tw-gap-2 tw-justify-between tw-bg-transparent tw-border-none tw-text-left tw-font-semibold"
                aria-expanded={isStacktraceExpanded}
                aria-controls={stacktraceContentId}>
                <span>
                  {isStacktraceExpanded ? "Hide Stacktrace" : "Show Stacktrace"}
                </span>
                {isStacktraceExpanded ? (
                  <FontAwesomeIcon icon={faChevronUp} />
                ) : (
                  <FontAwesomeIcon icon={faChevronDown} />
                )}
              </button>
              {isStacktraceExpanded && (
                <button
                  type="button"
                  onClick={onCopy}
                  disabled={isCopied}
                  className="tw-px-4 tw-py-1 tw-bg-white tw-text-black tw-rounded-lg tw-font-medium hover:tw-bg-gray-200 tw-transition-colors">
                  {isCopied ? "Copied" : "Copy"}{" "}
                  {!isCopied && <FontAwesomeIcon icon={faCopy} />}
                </button>
              )}
            </div>
            <AnimatePresence>
              {isStacktraceExpanded && (
                <motion.div
                  id={stacktraceContentId}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="tw-w-full tw-overflow-hidden">
                  <div className="tw-bg-black tw-rounded-lg tw-p-4 tw-text-xs tw-leading-5 tw-overflow-auto tw-text-gray-200 tw-font-mono tw-whitespace-pre-wrap tw-max-h-[16rem] tw-break-all tw-w-full tw-max-w-full">
                    {digest && <div className="tw-mb-2">Digest: {digest}</div>}
                    {resolvedStackTrace}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
