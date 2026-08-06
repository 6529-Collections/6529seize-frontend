"use client";

import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import { useEffect, useId, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";

interface CodeExampleProps {
  readonly code: string;
}

const CODE_TOKEN_CLASS_NAME = [
  "tw-block tw-min-w-max !tw-bg-transparent tw-font-mono tw-text-sm tw-leading-6 tw-text-iron-200",
  "[&_.token.comment]:tw-text-iron-500 [&_.hljs-comment]:tw-text-iron-500",
  "[&_.token.keyword]:tw-text-primary-300 [&_.hljs-keyword]:tw-text-primary-300",
  "[&_.token.string]:tw-text-success [&_.token.template-string]:tw-text-success [&_.token.regex]:tw-text-success [&_.hljs-string]:tw-text-success [&_.hljs-regexp]:tw-text-success",
  String.raw`[&_.token.class-name]:tw-text-primary-400 [&_.token.function]:tw-text-primary-400 [&_.hljs-title]:tw-text-primary-400 [&_.hljs-built\_in]:tw-text-primary-400`,
  "[&_.token.boolean]:tw-text-iron-100 [&_.token.constant]:tw-text-iron-100 [&_.token.number]:tw-text-iron-100 [&_.hljs-literal]:tw-text-iron-100 [&_.hljs-number]:tw-text-iron-100",
  "[&_.token.operator]:tw-text-iron-300 [&_.token.parameter]:tw-text-iron-200 [&_.token.property]:tw-text-iron-200 [&_.hljs-attr]:tw-text-iron-200 [&_.hljs-params]:tw-text-iron-200 [&_.hljs-variable]:tw-text-iron-100",
  "[&_.token.interpolation-punctuation]:tw-text-primary-300 [&_.token.punctuation]:tw-text-iron-400",
].join(" ");

export default function CodeExample({ code }: CodeExampleProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const reactId = useId();
  const tooltipId = `copy-code-tooltip-${reactId.replaceAll(":", "")}`;

  useEffect(() => {
    hljs.registerLanguage("javascript", javascript);
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [code]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="tw-relative">
      <pre
        className="tw-mb-4 tw-max-h-[32rem] tw-overflow-auto tw-rounded-xl tw-bg-black tw-p-4 tw-pt-14 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 sm:tw-max-h-[42rem]"
        tabIndex={0}
      >
        <code
          ref={codeRef}
          className={`language-javascript ${CODE_TOKEN_CLASS_NAME}`}
        >
          {code}
        </code>
      </pre>
      <button
        type="button"
        className="tw-absolute tw-right-3 tw-top-3 tw-min-h-11 tw-min-w-11 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800/95 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-50 tw-shadow-sm hover:tw-bg-iron-700 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        onClick={copyToClipboard}
        data-tooltip-id={tooltipId}
        aria-label="Copy code"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <span role="status" aria-atomic="true" className="tw-sr-only">
        {copied ? "Copied!" : ""}
      </span>
      <Tooltip
        id={tooltipId}
        place="top"
        className="!tw-rounded-md !tw-bg-iron-800 !tw-px-2 !tw-py-1 !tw-text-iron-50"
      >
        <span className="tw-text-xs">{copied ? "Copied!" : "Copy code"}</span>
      </Tooltip>
    </div>
  );
}
