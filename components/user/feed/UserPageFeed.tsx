import { IProfileAndConsolidations } from "../../../entities/IProfile";
import FiltersButton from "../../filters/FiltersButton";

export default function UserPageFeed({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  return (
    <div className="tailwind-scope">
      <FiltersButton profile={profile} />
    </div>
  );
}
