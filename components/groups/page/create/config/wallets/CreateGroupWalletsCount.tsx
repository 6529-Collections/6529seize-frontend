export default function CreateGroupWalletsCount({
  wallets,
  removeWallets,
}: {
  readonly wallets: string[];
  readonly removeWallets: () => void;
}) {
  return (
    <div>
      <div>
        Wallets: {wallets.length}{" "}
        <button onClick={removeWallets}>Remove</button>
      </div>
    </div>
  );
}
