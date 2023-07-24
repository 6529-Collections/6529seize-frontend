import { useEffect, useState } from "react";

export interface ComponentConfigMetaPropsTag {
  readonly id: string;
  readonly name: string;
}

export interface ComponentConfigMetaProps {
  readonly tags: ComponentConfigMetaPropsTag[];
  readonly walletsCount: number | null;
}

export default function ComponentConfigMeta({
  tags,
  walletsCount,
}: ComponentConfigMetaProps) {
  const [haveWalletsCount, setHaveWalletsCount] = useState(false);
  useEffect(() => {
    setHaveWalletsCount(walletsCount !== null);
  }, [walletsCount]);
  return (
    <div className="tw-space-y-1">
      <div className="tw-flex tw-space-x-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="tw-font-normal tw-text-primary-400 tw-text-xs tw-truncate group-hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out"
          >
            {tag.name}
          </span>
        ))}
      </div>

      {haveWalletsCount && (
        <div className="tw-text-xs tw-space-x-2">
          <span className="tw-text-neutral-400 tw-font-light">
            Total wallets:
          </span>
          <span className="tw-font-normal">{walletsCount}</span>
        </div>
      )}
    </div>
  );
}
