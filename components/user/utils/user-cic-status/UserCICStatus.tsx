import { useEffect, useState } from "react";
import { CICType } from "../../../../entities/IProfile";
import { cicToType } from "../../../../helpers/Helpers";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";

const CIC_META: Record<CICType, { title: string; class: string }> = {
  [CICType.INACCURATE]: {
    title: "Inaccurate",
    class: "tw-text-[#F97066]",
  },
  [CICType.UNKNOWN]: {
    title: "Not Enough Ratings Yet",
    class: "tw-text-[#FEDF89]",
  },
  [CICType.PROBABLY_ACCURATE]: {
    title: "Probably Accurate",
    class: "tw-text-[#AAF0C4]",
  },
  [CICType.ACCURATE]: {
    title: "Accurate",
    class: "tw-text-[#73E2A3]",
  },
  [CICType.HIGHLY_ACCURATE]: {
    title: "Highly Accurate",
    class: "tw-text-[#3CCB7F]",
  },
};

export default function UserCICStatus({ cic }: { cic: number }) {
  const [cicType, setCicType] = useState<CICType>(cicToType(cic));
  useEffect(() => {
    setCicType(cicToType(cic));
  }, [cic]);

  return (
    <span className={CIC_META[cicType].class}>{CIC_META[cicType].title}</span>
  );
}
