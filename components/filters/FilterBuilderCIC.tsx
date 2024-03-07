import CommonSwitch from "../utils/switch/CommonSwitch";
import CommonInput from "../utils/input/CommonInput";

export default function FilterBuilderCIC({
  user,
  minCIC,
  maxCIC,
  isFromUser,
  setUser,
  setMinCIC,
  setMaxCIC,
  setIsFromUser,
}: {
  readonly user: string | null;
  readonly minCIC: number | null;
  readonly maxCIC: number | null;
  readonly isFromUser: boolean;
  readonly setUser: (newV: string | null) => void;
  readonly setMinCIC: (newV: number | null) => void;
  readonly setMaxCIC: (newV: number | null) => void;
  readonly setIsFromUser: (newV: boolean) => void;
}) {
  return (
    <div>
      {user && (
        <CommonSwitch
          isOn={isFromUser}
          setIsOn={setIsFromUser}
          label="From user"
        />
      )}
      <CommonInput
        inputType="text"
        placeholder="User"
        value={user ?? ""}
        onChange={setUser}
      />
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
  );
}
