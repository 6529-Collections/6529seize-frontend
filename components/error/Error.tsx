"use client";

import { useTitle } from "@/contexts/TitleContext";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";

type ErrorComponentProps = {
  readonly stackTrace?: string | null;
};

export default function ErrorComponent({
  stackTrace,
}: ErrorComponentProps = {}) {
  const { setTitle } = useTitle();
  const searchParams = useSearchParams();
  const [isStacktraceExpanded, setIsStacktraceExpanded] = useState(false);
  const stacktraceContentId = useId();

  useEffect(() => {
    setTitle("6529 Error");
  }, [setTitle]);

  const stackTraceFromQuery = useMemo(() => {
    return searchParams?.get("stack") ?? "";
  }, [searchParams]);

  const resolvedStackTrace = stackTrace ?? stackTraceFromQuery;
  const hasStackTrace = Boolean(resolvedStackTrace);

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
        <p className="tw-text-center tw-text-base md:tw-text-lg tw-text-gray-200">
          Looks like something went wrong. Try again or reach out to us at{" "}
          <a
            className="tw-text-white tw-underline"
            href="mailto:support@6529.io">
            support@6529.io
          </a>
          .
        </p>

        {hasStackTrace && (
          <div className="tw-flex tw-flex-col tw-gap-2 tw-items-center tw-justify-center tw-w-full tw-max-w-4xl tw-px-4">
            <button
              type="button"
              onClick={() => setIsStacktraceExpanded((prev) => !prev)}
              className="tw-flex tw-items-center tw-gap-2 tw-justify-between tw-bg-transparent tw-border-none tw-text-left tw-font-semibold"
              aria-expanded={isStacktraceExpanded}
              aria-controls={stacktraceContentId}>
              <span>
                {isStacktraceExpanded ? "Hide stacktrace" : "Show stacktrace"}
              </span>
              {isStacktraceExpanded ? (
                <FontAwesomeIcon icon={faChevronUp} />
              ) : (
                <FontAwesomeIcon icon={faChevronDown} />
              )}
            </button>
            {isStacktraceExpanded ? (
              <div
                id={stacktraceContentId}
                className="tw-w-full tw-mt-4 tw-bg-black tw-rounded-lg tw-p-4 tw-text-xs tw-leading-5 tw-overflow-x-auto tw-text-gray-200 tw-font-mono tw-whitespace-pre-wrap">
                {resolvedStackTrace}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
