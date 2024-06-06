import { useRef } from "react";
import CreateGroupWalletsUpload from "./CreateGroupWalletsUpload";
import CreateGroupWalletsCount from "./CreateGroupWalletsCount";

export default function GroupCreateWallets({
  wallets,
  setWallets,
}: {
  readonly wallets: string[] | null;
  readonly setWallets: (wallets: string[] | null) => void;
}) {
  if (wallets?.length) {
    return (
      <CreateGroupWalletsCount
        wallets={wallets}
        removeWallets={() => setWallets(null)}
      />
    );
  } else {
    return <CreateGroupWalletsUpload setWallets={setWallets} />;
  }
}
