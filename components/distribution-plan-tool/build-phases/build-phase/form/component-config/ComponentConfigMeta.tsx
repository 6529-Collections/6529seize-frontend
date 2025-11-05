"use client";


interface ComponentConfigMetaPropsTag {
  readonly id: string;
  readonly name: string;
}

interface ComponentConfigMetaProps {
  readonly tags: ComponentConfigMetaPropsTag[];
  readonly walletsCount: number | null;
  readonly isLoading: boolean;
}

export default function ComponentConfigMeta({
  tags: _tags,
  walletsCount: _walletsCount,
  isLoading: _isLoading,
}: ComponentConfigMetaProps) {
  return (
    <div className="tw-space-y-1 tw-self-center">
    </div>
  );
}
