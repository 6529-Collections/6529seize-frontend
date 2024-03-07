import { useState } from "react";
import CommonInput from "../utils/input/CommonInput";
import CommonSwitch from "../utils/switch/CommonSwitch";
import FilterBuilderSearchUser from "./utils/FilterBuilderSearchUser";

export default function FilterBuilderRep({
  user,
  category,
  minRep,
  maxRep,
  isFromUser,
  setUser,
  setCategory,
  setMinRep,
  setMaxRep,
  setIsFromUser,
}: {
  readonly user: string | null;
  readonly category: string | null;
  readonly minRep: number | null;
  readonly maxRep: number | null;
  readonly isFromUser: boolean;
  readonly setUser: (newV: string | null) => void;
  readonly setCategory: (newV: string | null) => void;
  readonly setMinRep: (newV: number | null) => void;
  readonly setMaxRep: (newV: number | null) => void;
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
      <FilterBuilderSearchUser />
      <CommonInput
        inputType="text"
        placeholder="Category"
        value={category ?? ""}
        onChange={setCategory}
      />
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
  );
}
