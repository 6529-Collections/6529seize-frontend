import { useEffect, useState } from "react";
import { CICType, CIC_META } from "../../../../entities/IProfile";
import { cicToType } from "../../../../helpers/Helpers";

interface Props {
  readonly cic: number;
}

export default function UserCICStatus(props: Props) {
  const [cicType, setCicType] = useState<CICType>(cicToType(props.cic));
  useEffect(() => {
    setCicType(cicToType(props.cic));
  }, [props.cic]);

  return (
    <span className={CIC_META[cicType].class}>{CIC_META[cicType].title}</span>
  );
}
