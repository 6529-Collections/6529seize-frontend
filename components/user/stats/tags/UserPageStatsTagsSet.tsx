import { UserPageStatsTag } from "./UserPageStatsTags";

export default function UserPageStatsTagsSet({
  tags,
}: {
  readonly tags: UserPageStatsTag[];
}) {
  return (
    <div className="tw-w-full tw-inline-flex tw-space-x-2">
      {tags.map((tag) => (
        <div className={tag.classes} key={tag.id}>
          {tag.title}
        </div>
      ))}
    </div>
  );
}
