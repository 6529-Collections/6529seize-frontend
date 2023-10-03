import { useEffect, useState } from "react";
import { commonApiFetch } from "../../../services/api/common-api";
import { WalletsRepState } from "../../../services/api/common-api.types";

export default function RepState({ wallet }: { wallet: string }) {
  const [repLeft, setRepLeft] = useState<number | null>();
  const [loading, isLoading] = useState(false);

  useEffect(() => {
    const getRep = async () => {
      isLoading(true);
      const endpoint = `/api/rep/${wallet}`;
      const data = await commonApiFetch<WalletsRepState>(endpoint);
      if (typeof data?.remainingRep === "number") {
        setRepLeft(data.remainingRep);
      } else {
        setRepLeft(null);
      }
      isLoading(false);
    };
    getRep();
  }, [wallet]);

  return <div>{repLeft}</div>;
}
