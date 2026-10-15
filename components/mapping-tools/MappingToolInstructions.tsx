"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { sanitizeHtml } from "@/lib/security/sanitizeHtml";
import styles from "@/styles/Home.module.css";
import clsx from "clsx";
import { useEffect, useState } from "react";

const INSTRUCTIONS_COLUMN_CLASS =
  "tw-w-full tw-px-3 sm:tw-ml-[8.333333%] sm:tw-w-10/12 md:tw-ml-[16.666667%] md:tw-w-8/12 lg:tw-ml-[25%] lg:tw-w-6/12";

type InstructionsState =
  | { readonly status: "loading" | "failed" }
  | { readonly status: "ready"; readonly html: string };

async function fetchInstructionsHtml(
  url: string,
  signal: AbortSignal
): Promise<string> {
  const response = await fetch(url, { signal });
  if (response.status !== 200) {
    throw new Error(`Unexpected instructions response: ${response.status}`);
  }
  return sanitizeHtml(await response.text());
}

interface MappingToolInstructionsProps {
  readonly url: string;
}

export default function MappingToolInstructions({
  url,
}: MappingToolInstructionsProps) {
  const locale = useBrowserLocale();
  const [state, setState] = useState<InstructionsState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    fetchInstructionsHtml(url, controller.signal)
      .then((html) => {
        setState({ status: "ready", html });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ status: "failed" });
        }
      });

    return () => {
      controller.abort();
    };
  }, [url]);

  return (
    <div
      id="how-to-use"
      className="tw-mx-auto tw-w-full tw-px-3 tw-pb-5 tw-pt-1 sm:tw-max-w-[540px] md:tw-max-w-[720px] lg:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]"
    >
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        {state.status === "failed" ? (
          <div className={INSTRUCTIONS_COLUMN_CLASS}>
            <p role="alert" className="tw-m-0 tw-text-sm tw-text-error">
              {t(locale, "mappingTools.instructions.loadFailed")}
            </p>
          </div>
        ) : (
          <div
            className={clsx(styles["htmlContainer"], INSTRUCTIONS_COLUMN_CLASS)}
            dangerouslySetInnerHTML={{
              __html: state.status === "ready" ? state.html : "",
            }}
          ></div>
        )}
      </div>
    </div>
  );
}
