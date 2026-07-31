import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import { GROUP_MENTION_TEXT } from "@/helpers/waves/drop-group-mentions";

export default function DropListItemContentGroupMention({
  group,
  text,
}: {
  readonly group: ApiDropGroupMention;
  readonly text?: string;
}) {
  return (
    <span className="tw-font-medium tw-text-primary-400">
      {text ?? GROUP_MENTION_TEXT[group]}
    </span>
  );
}
