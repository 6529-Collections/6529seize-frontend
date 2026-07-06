"use client";

import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import "highlight.js/styles/vs2015.css";
import { useEffect, useId, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";

interface CodeExampleProps {
  readonly code: string;
}

export default function CodeExample({ code }: CodeExampleProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const reactId = useId();
  const tooltipId = `copy-code-tooltip-${reactId.replace(/:/g, "")}`;

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
        className="tw-mb-4 tw-overflow-auto tw-rounded tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3 tw-pr-20"
      >
        <code ref={codeRef} className="language-javascript">
          {code}
        </code>
      </pre>
      <button
        className="tw-absolute tw-right-2 tw-top-2 tw-rounded tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800/90 tw-px-2 tw-py-1 tw-text-xs tw-font-semibold tw-text-iron-50 tw-shadow-sm hover:tw-bg-iron-700 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400"
        onClick={copyToClipboard}
        data-tooltip-id={tooltipId}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <Tooltip
        id={tooltipId}
        place="top"
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      >
        <span className="tw-text-xs">{copied ? "Copied!" : "Copy code"}</span>
      </Tooltip>
    </div>
  );
}
