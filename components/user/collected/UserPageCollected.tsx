import { useQuery } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { commonApiFetch } from "../../../services/api/common-api";
import { Page } from "../../../helpers/Types";
import { getRandomObjectId } from "../../../helpers/AllowlistToolHelpers";
import UserPageCollectedFilters from "./filters/UserPageCollectedFilters";

export default function UserPageCollected({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  // const { data } = useQuery({
  //   queryKey: ["collected", profile.profile?.handle!],
  //   queryFn: async () => {
  //     const id = getRandomObjectId();
  //     console.time(id);
  //     const result = await commonApiFetch<Page<CollectedCard>>({
  //       endpoint: `profiles/${profile.profile?.handle!}/collected`,
  //       params: {
  //         collection_type: CollectionType.MEMES,
  //         consolidations: "true",
  //         seized: Seized.NOT_SEIZED,
  //         szn: "1",
  //         page: "1",
  //         page_size: "20",
  //         sort_direction: "DESC",
  //         sort: "token_id",
  //       },
  //     });
  //     console.timeEnd(id);
  //     return result;
  //   },
  // });

  return (
    <div className="tailwind-scope">
      <UserPageCollectedFilters profile={profile} />
    </div>
  );
}
