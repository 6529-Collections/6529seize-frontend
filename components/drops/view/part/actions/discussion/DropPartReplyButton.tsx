export default function DropPartReplyButton({
  onReplyButtonClick,
}: {
  readonly onReplyButtonClick: () => void;
}) {
  return <button onClick={onReplyButtonClick}>reply</button>;
}
