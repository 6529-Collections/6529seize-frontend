export default function GroupCreateWalletsCountText({
  loading,
  walletsCount,
  haveWallets,
}: {
  readonly loading: boolean;
  readonly walletsCount: number | null;
  readonly haveWallets: boolean;
}) {
  return (
    <span className="tw-inline-flex tw-gap-x-1.5">
      <span className="tw-text-iron-400 tw-font-medium">Wallets:</span>
      {loading ? (
        <span className="tw-text-iron-50 tw-font-semibold">Loading...</span>
      ) : haveWallets ? (
        <span className="tw-text-iron-50 tw-font-semibold">{walletsCount}</span>
      ) : (
        <span className="tw-text-iron-400 tw-font-medium">Not added</span>
      )}
    </span>
  );
}
