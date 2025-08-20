"use client";

import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import "highlight.js/styles/vs2015.css";
import { useEffect, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";

interface CodeExampleProps {
  readonly code: string;
}

export default function CodeExample({ code }: CodeExampleProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

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
    <div className="position-relative">
      <pre
        className="p-3 rounded"
        style={{
          backgroundColor: "rgb(26, 26, 26)",
          border: "1px solid rgb(44, 44, 44)",
          overflow: "auto",
        }}>
        <code ref={codeRef} className="language-javascript">
          {code}
        </code>
      </pre>
      <button
        className="btn btn-sm position-absolute"
        style={{
          top: "8px",
          right: "8px",
          backgroundColor: "rgba(68, 68, 68, 0.8)",
          border: "1px solid rgb(88, 88, 88)",
          color: "white",
          fontSize: "0.75rem",
        }}
        onClick={copyToClipboard}
        data-tooltip-id="copy-code-tooltip">
        {copied ? "Copied!" : "Copy"}
      </button>
      <Tooltip
        id="copy-code-tooltip"
        place="top"
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}>
        <span className="tw-text-xs">{copied ? "Copied!" : "Copy code"}</span>
      </Tooltip>
    </div>
  );
}
