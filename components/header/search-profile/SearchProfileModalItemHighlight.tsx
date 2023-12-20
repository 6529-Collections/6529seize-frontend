import React from "react";

export default function SearchProfileModalItemHighlight({
  text,
  highlight,
}: {
  text: string;
  readonly highlight: string;
}) {
  // tw-text-iron-200
  const parts = text.split(new RegExp(`(${highlight})`, "gi"));
  return parts.map((part, index) => (
    <React.Fragment key={index}>
      {part.toLowerCase() === highlight.toLowerCase() ? (
        <b className="tw-text-blue-200">{part}</b>
      ) : (
        part
      )}
    </React.Fragment>
  ));
}
