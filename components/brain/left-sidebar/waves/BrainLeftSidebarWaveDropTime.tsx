"use client";

import React, { useState, useEffect } from "react";
import { getTimeAgoShort } from "../../../../helpers/Helpers";

interface BrainLeftSidebarWaveDropTimeProps {
  readonly time: number;
}

const BrainLeftSidebarWaveDropTime: React.FC<
  BrainLeftSidebarWaveDropTimeProps
> = ({ time }) => {
  const [_, setTick] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 60000); // Update every minute (60000ms)

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return <span className="tw-text-iron-400">{getTimeAgoShort(time)}</span>;
};

export default BrainLeftSidebarWaveDropTime;
