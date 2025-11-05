"use client";

import Link from "next/link";
import { faCopy } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useCopyToClipboard } from "react-use";

export default function BlockPickerAdvancedItemBlock({
  block,
  blockParts,
}: {
  readonly block: number;
  readonly blockParts: number;
}) {
  const number = block.toString();
  const match = blockParts.toString();
  const regex = new RegExp(match, "g");

  const parts = [];
  let lastIndex = 0;
  let matchIndex;
  while ((matchIndex = regex.exec(number)) !== null) {
    const matchStart = matchIndex.index;
    const matchEnd = matchIndex.index + matchIndex[0].length;
    if (matchStart > lastIndex) {
      parts.push(number.substring(lastIndex, matchStart));
    }
    parts.push(
      <span key={matchStart} className="tw-text-error">
        {number.substring(matchStart, matchEnd)}
      </span>
    );
    lastIndex = matchEnd;
  }
  if (lastIndex < number.length) {
    parts.push(number.substring(lastIndex));
  }

  const [, copyToClipboard] = useCopyToClipboard();
  const [coping, setCoping] = useState(false);

  const copy = () => {
    setCoping(true);
    copyToClipboard(block.toString());
    setTimeout(() => setCoping(false), 1000);
  };

  return (
    <div>
      <FontAwesomeIcon
        onClick={copy}
        className="tw-h-5 tw-w-5 tw-cursor-pointer tw-mr-2.5 tw-text-iron-300 hover:tw-text-white tw-transition tw-duration-300 tw-ease-out"
        icon={faCopy}
      />
      {coping ? (
        "Copied"
      ) : (
        <BlockPickerAdvancedItemBlockLink block={block} blockParts={parts} />
      )}
    </div>
  );
}

export function BlockPickerAdvancedItemBlockLink({
  block,
  blockParts,
}: {
  readonly block: number;
  readonly blockParts: (string | React.JSX.Element)[];
}) {
  return (
    <Link
      className="tw-underline-offset-2 tw-underline tw-transition tw-duration-300 tw-ease-out"
      href={`https://etherscan.io/block/countdown/${block}`}
      target="_blank"
      rel="noopener noreferrer">
      {blockParts}
    </Link>
  );
}
