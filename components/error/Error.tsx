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
  readonly stackTrace?: string | null | undefined;
  readonly digest?: string | null | undefined;
  readonly onReset?: (() => void) | undefined;
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
    if (!isCopied) return;

    const timer = setTimeout(() => {
      setIsCopied(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [isCopied]);

  const onCopy = () => {
    copyToClipboard(resolvedStackTraceWithDigest);
    setIsCopied(true);
  };

  return (
    <section className="tw-flex tw-h-full tw-min-h-screen tw-w-full tw-items-center tw-justify-center">
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
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-2">
          <h3 className="tw-text-2xl tw-font-semibold">
            Welcome to the 6529 Page of Doom
          </h3>
          <img
            src="/emojis/sgt_grimacing.webp"
            alt="sgt_grimacing"
            className="tw-h-8 tw-w-8"
          />
        </div>
        <p className="tw-text-center tw-font-medium tw-text-gray-200 md:tw-text-lg">
          Looks like something went wrong. Try again or reach out to us at{" "}
          <a
            className="tw-text-white tw-underline"
            href="mailto:support@6529.io"
          >
            support@6529.io
          </a>
          .
        </p>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="tw-rounded-lg tw-bg-white tw-px-6 tw-py-2 tw-font-semibold tw-text-black tw-transition-colors hover:tw-bg-gray-200"
          >
            Try Again
          </button>
        )}

        {(hasStackTrace || digest) && (
          <div className="tw-mt-4 tw-flex tw-w-full tw-max-w-4xl tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-px-4">
            <div
              className={`tw-flex tw-w-full tw-items-center tw-gap-2 ${
                isStacktraceExpanded
                  ? "tw-justify-between"
                  : "tw-justify-center"
              }`}
            >
              <button
                type="button"
                onClick={() => setIsStacktraceExpanded((prev) => !prev)}
                className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-border-none tw-bg-transparent tw-text-left tw-font-semibold"
                aria-expanded={isStacktraceExpanded}
                aria-controls={stacktraceContentId}
              >
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
                  className="tw-rounded-lg tw-bg-white tw-px-4 tw-py-1 tw-font-medium tw-text-black tw-transition-colors hover:tw-bg-gray-200"
                >
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
                  className="tw-w-full tw-overflow-hidden"
                >
                  <div className="tw-max-h-[16rem] tw-w-full tw-max-w-full tw-overflow-auto tw-whitespace-pre-wrap tw-break-all tw-rounded-lg tw-bg-black tw-p-4 tw-font-mono tw-text-xs tw-leading-5 tw-text-gray-200">
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
