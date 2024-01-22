import { useQuery } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { commonApiFetch } from "../../../services/api/common-api";
import { Page } from "../../../helpers/Types";
import { getRandomObjectId } from "../../../helpers/AllowlistToolHelpers";

// collection_type?: string;
export enum CollectionType {
  MEMES = "MEMES",
  GRADIENTS = "GRADIENTS",
  MEMELAB = "MEMELAB",
  NEXTGEN = "NEXTGEN",
}
// consolidations?: string;
// "true" | "false";

//     seized?: string;
export enum Seized {
  SEIZED = "SEIZED",
  NOT_SEIZED = "NOT_SEIZED",
}

//     szn?: string;
// 1-6 (seasons)

//     page?: string;
//     page_size?: string;

//     sort_direction?: string;
// DESC | ASC

//     sort?: string;
// token_id | tdh | rank

// endpoint /handleOrWallet/collected

export interface CollectedCard {
  readonly collection: string;
  readonly token_id: number;
  readonly token_name: string;
  readonly img: string;
  readonly tdh: number | null;
  readonly rank: number | null;
  readonly seized_count: number | null;
  readonly szn: number | null;
}

export default function UserPageCollected({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const { data } = useQuery({
    queryKey: ["collected", profile.profile?.handle!],
    queryFn: async () => {
      const id = getRandomObjectId();
      console.time(id);
      const result = await commonApiFetch<Page<CollectedCard>>({
        endpoint: `profiles/${profile.profile?.handle!}/collected`,
        params: {
          collection_type: CollectionType.MEMES,
          consolidations: "true",
          seized: Seized.NOT_SEIZED,
          szn: "1",
          page: "1",
          page_size: "20",
          sort_direction: "DESC",
          sort: "token_id",
        },
      });
      console.timeEnd(id);
      return result;
    },
  });

  return (
    <div>
      {data?.data.map((card) => (
        <div key={getRandomObjectId()}>{card.token_name}</div>
      ))}
    </div>
  );
}
