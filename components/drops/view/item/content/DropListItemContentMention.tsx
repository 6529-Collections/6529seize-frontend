export default function DropListItemContentMention({
  mention,
}: {
  mention: string;
}) {
  return <span className="tw-text-red">{mention}</span>;
}
