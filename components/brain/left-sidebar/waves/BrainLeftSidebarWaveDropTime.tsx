"use client";

import React, { useEffect, useState } from "react";
import { getTimeAgoShort } from "@/helpers/Helpers";

interface BrainLeftSidebarWaveDropTimeProps {
  readonly time: number;
}

const BrainLeftSidebarWaveDropTime: React.FC<
  BrainLeftSidebarWaveDropTimeProps
> = ({ time }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 60000); // Update every minute (60000ms)

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const label = getTimeAgoShort(time, now);

  return <span className="tw-text-iron-300">{label}</span>;
};

export default BrainLeftSidebarWaveDropTime;
