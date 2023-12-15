import { useEffect, useState } from "react";
import { CICType, CIC_TO_TEXT } from "../../../../entities/IProfile";
import { cicToType } from "../../../../helpers/Helpers";

interface Props {
  readonly cic: number;
}

export const CIC_META: Record<CICType, { title: string; class: string }> = {
  [CICType.INACCURATE]: {
    title: CIC_TO_TEXT[CICType.INACCURATE],
    class: "tw-text-[#F97066]",
  },
  [CICType.UNKNOWN]: {
    title: CIC_TO_TEXT[CICType.UNKNOWN],
    class: "tw-text-[#FEDF89]",
  },
  [CICType.PROBABLY_ACCURATE]: {
    title: CIC_TO_TEXT[CICType.PROBABLY_ACCURATE],
    class: "tw-text-[#AAF0C4]",
  },
  [CICType.ACCURATE]: {
    title: CIC_TO_TEXT[CICType.ACCURATE],
    class: "tw-text-[#73E2A3]",
  },
  [CICType.HIGHLY_ACCURATE]: {
    title: CIC_TO_TEXT[CICType.HIGHLY_ACCURATE],
    class: "tw-text-[#3CCB7F]",
  },
};

export default function UserCICStatus(props: Props) {
  const [cicType, setCicType] = useState<CICType>(cicToType(props.cic));
  useEffect(() => {
    setCicType(cicToType(props.cic));
  }, [props.cic]);

  return (
    <span className={CIC_META[cicType].class}>{CIC_META[cicType].title}</span>
  );
}
