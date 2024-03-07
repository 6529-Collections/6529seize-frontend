import CommonInput from "../utils/input/CommonInput";
import FilterBuilderSearchUser from "./utils/search-user/FilterBuilderSearchUser";
import FilterBuilderUserDirection from "./utils/user-direction/FilterBuilderUserDirection";
import { FilterDirection } from "./FilterBuilder";

export default function FilterBuilderCIC({
  user,
  minCIC,
  maxCIC,
  userDirection,
  setUser,
  setMinCIC,
  setMaxCIC,
  setUserDirection,
}: {
  readonly user: string | null;
  readonly minCIC: number | null;
  readonly maxCIC: number | null;
  readonly userDirection: FilterDirection;
  readonly setUser: (newV: string | null) => void;
  readonly setMinCIC: (newV: number | null) => void;
  readonly setMaxCIC: (newV: number | null) => void;
  readonly setUserDirection: (newV: FilterDirection) => void;
}) {
  const userPlaceholder =
    userDirection === FilterDirection.SENT ? "CIC Receiver" : "CIC Giver";
  return (
    <div className="tw-w-full tw-space-y-2">
      <FilterBuilderUserDirection
        userDirection={userDirection}
        setUserDirection={setUserDirection}
      />
      <FilterBuilderSearchUser
        user={user}
        setUser={setUser}
        label={userPlaceholder}
      />
      <div className="tw-w-full tw-inline-flex tw-space-x-2">
        <CommonInput
          inputType="number"
          placeholder="Min CIC"
          value={minCIC?.toString() ?? ""}
          onChange={(newV) => setMinCIC(newV === null ? null : +newV)}
        />
        <CommonInput
          inputType="number"
          placeholder="Max CIC"
          value={maxCIC?.toString() ?? ""}
          onChange={(newV) => setMaxCIC(newV === null ? null : +newV)}
        />
      </div>
    </div>
  );
}
