import { useEffect, useState } from "react";
import { commonApiFetch } from "../../../services/api/common-api";
import { WalletStateOnMattersVoting } from "../../../services/api/common-api.types";

export default function RepGiven({ wallet }: { wallet: string }) {
  const [rep, setRep] = useState<number | null>(null);

  useEffect(() => {
    const getRep = async (targetWallet: string) => {
      const endpoint = `votes/targets/WALLET/${targetWallet}/matters/REPUTATION`;
      const data = await commonApiFetch<WalletStateOnMattersVoting>(endpoint);
      setRep(
        data?.categories.find((g) => g.category_tag === "PEPE")?.tally ?? null
      );
    };
    getRep(wallet);
  }, [wallet]);
  return <div>{rep}</div>;
}
