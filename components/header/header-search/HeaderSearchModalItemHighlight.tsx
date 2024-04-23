import React from "react";
import { getRandomObjectId } from "../../../helpers/AllowlistToolHelpers";

export default function HeaderSearchModalItemHighlight({
  text,
  highlight,
}: {
  text: string;
  readonly highlight: string;
}) {
  const parts = text.split(new RegExp(`(${highlight})`, "gi"));
  return parts.map((part) => (
    <React.Fragment key={getRandomObjectId()}>
      {part.toLowerCase() === highlight.toLowerCase() ? (
        <span className="tw-text-blue-200 tw-font-bold">{part}</span>
      ) : (
        part
      )}
    </React.Fragment>
  ));
}
