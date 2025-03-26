import React, { useState } from "react";
import { ApiDrop } from "../../../../generated/models/ApiDrop";

interface DropVoteProgressingProps {
  readonly drop: ApiDrop;
}

export default function DropVoteProgressing({
  drop,
}: DropVoteProgressingProps): React.ReactElement | null {
  const { rating, realtime_rating } = drop;
  const [isProgressing, setIsProgressing] = useState(false);

  
  return null;
}
