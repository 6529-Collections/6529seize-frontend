"use client";

import { useState, type ReactNode } from "react";
import {
  recordValue,
  type FieldValue,
} from "@/lib/artwork-documentation/registry";
import { useDocumentationMessages } from "./DocumentationControls";

export default function DocumentationCollectionEntry({
  value,
  number,
  label,
  children,
}: {
  readonly value: FieldValue;
  readonly number: number;
  readonly label?: string | undefined;
  readonly children: ReactNode;
}) {
  const { msg } = useDocumentationMessages();
  const record = recordValue(value);
  const title = record["title"] ?? record["name"] ?? record["label"];
  const unnamedTitle = label
    ? msg("museum.namedEntry", { label, number })
    : msg("entry", { number });
  const [open, setOpen] = useState(() =>
    Object.keys(record).every(
      (key) => key === "id" || typeof record[key] === "boolean"
    )
  );
  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="tw-min-w-0 tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-py-4"
    >
      <summary className="tw-min-h-11 tw-cursor-pointer tw-py-2 tw-font-serif tw-text-2xl tw-leading-8 tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-primary-400">
        {typeof title === "string" && title.trim() ? title : unnamedTitle}
      </summary>
      <div className="tw-min-w-0 tw-space-y-6 tw-py-5">{children}</div>
    </details>
  );
}
