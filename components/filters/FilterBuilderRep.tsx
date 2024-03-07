import CommonInput from "../utils/input/CommonInput";
import FilterBuilderSearchUser from "./utils/search-user/FilterBuilderSearchUser";
import FilterBuilderSearchRep from "./utils/search-rep/FilterBuilderSearchRep";
import { FilterDirection } from "./FilterBuilder";
import FilterBuilderUserDirection from "./utils/user-direction/FilterBuilderUserDirection";

export default function FilterBuilderRep({
  user,
  category,
  minRep,
  maxRep,
  userDirection,
  setUser,
  setCategory,
  setMinRep,
  setMaxRep,
  setUserDirection,
}: {
  readonly user: string | null;
  readonly category: string | null;
  readonly minRep: number | null;
  readonly maxRep: number | null;
  readonly userDirection: FilterDirection;
  readonly setUser: (newV: string | null) => void;
  readonly setCategory: (newV: string | null) => void;
  readonly setMinRep: (newV: number | null) => void;
  readonly setMaxRep: (newV: number | null) => void;
  readonly setUserDirection: (newV: FilterDirection) => void;
}) {
  return (
    <div className="tw-w-full tw-space-y-2">
      <FilterBuilderUserDirection
        userDirection={userDirection}
        setUserDirection={setUserDirection}
      />
      <div className="tw-w-full tw-inline-flex tw-space-x-2">
        <FilterBuilderSearchUser
          user={user}
          setUser={setUser}
          label="Rep Giver Username"
        />
        <FilterBuilderSearchRep category={category} setCategory={setCategory} />
      </div>
      <div className="tw-w-full tw-inline-flex tw-space-x-2">
        <CommonInput
          inputType="number"
          placeholder="Min Rep"
          value={minRep?.toString() ?? ""}
          onChange={(newV) => setMinRep(newV === null ? null : +newV)}
        />
        <CommonInput
          inputType="number"
          placeholder="Max Rep"
          value={maxRep?.toString() ?? ""}
          onChange={(newV) => setMaxRep(newV === null ? null : +newV)}
        />
      </div>
    </div>
  );
}
