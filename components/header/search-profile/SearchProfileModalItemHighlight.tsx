import React from "react";

export default function SearchProfileModalItemHighlight({
  text,
  highlight,
}: {
  text: string;
  readonly highlight: string;
}) {
  const parts = text.split(new RegExp(`(${highlight})`, "gi"));
  return parts.map((part, index) => (
    <React.Fragment key={`highlight-fragment-${index}`}>
      {part.toLowerCase() === highlight.toLowerCase() ? (
        <b className="tw-text-blue-200">{part}</b>
      ) : (
        part
      )}
    </React.Fragment>
  ));
}
