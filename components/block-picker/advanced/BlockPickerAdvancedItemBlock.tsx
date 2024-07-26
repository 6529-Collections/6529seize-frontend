import { useState } from "react";
import { useCopyToClipboard } from "react-use";

export default function BlockPickerAdvancedItemBlock({
  block,
  blockParts,
}: {
  block: number;
  blockParts: number;
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

  const [copyState, copyToClipboard] = useCopyToClipboard();
  const [coping, setCoping] = useState(false);

  const copy = () => {
    setCoping(true);
    copyToClipboard(block.toString());
    setTimeout(() => setCoping(false), 1000);
  };

  return (
    <div>
      <svg
        onClick={copy}
        className="tw-h-5 tw-cursor-pointer tw-w-5 tw-mr-2.5  tw-text-neutral-300 hover:tw-text-white tw-transition tw-duration-300 tw-ease-out"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 15C4.06812 15 3.60218 15 3.23463 14.8478C2.74458 14.6448 2.35523 14.2554 2.15224 13.7654C2 13.3978 2 12.9319 2 12V5.2C2 4.0799 2 3.51984 2.21799 3.09202C2.40973 2.71569 2.71569 2.40973 3.09202 2.21799C3.51984 2 4.0799 2 5.2 2H12C12.9319 2 13.3978 2 13.7654 2.15224C14.2554 2.35523 14.6448 2.74458 14.8478 3.23463C15 3.60218 15 4.06812 15 5M12.2 22H18.8C19.9201 22 20.4802 22 20.908 21.782C21.2843 21.5903 21.5903 21.2843 21.782 20.908C22 20.4802 22 19.9201 22 18.8V12.2C22 11.0799 22 10.5198 21.782 10.092C21.5903 9.71569 21.2843 9.40973 20.908 9.21799C20.4802 9 19.9201 9 18.8 9H12.2C11.0799 9 10.5198 9 10.092 9.21799C9.71569 9.40973 9.40973 9.71569 9.21799 10.092C9 10.5198 9 11.0799 9 12.2V18.8C9 19.9201 9 20.4802 9.21799 20.908C9.40973 21.2843 9.71569 21.5903 10.092 21.782C10.5198 22 11.0799 22 12.2 22Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {coping ? (
        "Copied"
      ) : (
        <a className="tw-underline-offset-2 tw-underline tw-transition tw-duration-300 tw-ease-out"
          href={`https://etherscan.io/block/countdown/${block}`}
          target="_blank"
          rel="noreferrer"
        >
          {parts}
        </a>
      )}
    </div>
  );
}
