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
      <span key={matchStart} className="tw-text-red-500">
        {number.substring(matchStart, matchEnd)}
      </span>
    );
    lastIndex = matchEnd;
  }
  if (lastIndex < number.length) {
    parts.push(number.substring(lastIndex));
  }

  return <div>{parts}</div>;
}
